(function () {
  "use strict";

  var data = window.CarbonData;

  function girthToDbhCm(girthM) {
    return (girthM / Math.PI) * 100;
  }

  function basalArea(dbhCm) {
    var dbhM = dbhCm / 100;
    return (Math.PI * Math.pow(dbhM, 2)) / 4;
  }

  function canopyArea(spreadM) {
    if (!Number.isFinite(spreadM) || spreadM <= 0) {
      return 0;
    }
    return Math.PI * Math.pow(spreadM / 2, 2);
  }

  function rainfallInterception(row, speciesData, assumptions) {
    var factor = assumptions.broadleafRainfallInterceptionFactor;
    if (speciesData.kind === "conifer") {
      factor = assumptions.coniferRainfallInterceptionFactor;
    } else if (row.species === "Unknown") {
      factor = assumptions.unknownRainfallInterceptionFactor;
    }

    return ((canopyArea(row.spread) * assumptions.annualRainfallMm * factor) / 1000) * row.count;
  }

  function avoidedRunoff(row, rainfallVolume, assumptions) {
    if (assumptions.runoffModel === "simple") {
      return row.count * assumptions.runoffRate;
    }
    return rainfallVolume * assumptions.imperviousCoverFraction;
  }

  function biomassComponents(dbhCm, heightM, speciesData, assumptions) {
    var formFactor =
      speciesData.kind === "conifer"
        ? assumptions.coniferFormFactor
        : assumptions.broadleafFormFactor;
    var volume = basalArea(dbhCm) * heightM * formFactor;
    var stem = volume * speciesData.nsg;
    var crown = crownBiomass(dbhCm, speciesData.crownGroup);
    var root = rootBiomass(dbhCm, speciesData.rootGroup);
    var biomass = stem + crown + root;

    return {
      volume: volume,
      stem: stem,
      crown: crown,
      root: root,
      biomass: biomass,
      co2e: biomass * 0.5 * (44 / 12)
    };
  }

  function nearestValue(values, target) {
    return values.reduce(function (nearest, value) {
      return Math.abs(value - target) < Math.abs(nearest - target) ? value : nearest;
    }, values[0]);
  }

  function broadleafTablePoint(tableRow) {
    return {
      age: tableRow.age,
      heightM: tableRow.topHeightFt * 0.3048,
      dbhCm: (tableRow.meanBhqgIn * 2.54 * 4) / Math.PI
    };
  }

  function broadleafGrowthFromTable(row, speciesData) {
    var table = data.BROADLEAF_YIELD_TABLES[speciesData.broadleafYieldTable];
    if (!table || table.rows.length < 2) {
      return null;
    }

    var points = table.rows.map(broadleafTablePoint);
    var target = Number.isFinite(row.height) && row.height > 1 ? row.height : row.dbh;
    var metric = Number.isFinite(row.height) && row.height > 1 ? "heightM" : "dbhCm";
    var lower = points[0];
    var upper = points[1];

    for (var i = 0; i < points.length - 1; i += 1) {
      if (target >= points[i][metric] && target <= points[i + 1][metric]) {
        lower = points[i];
        upper = points[i + 1];
        break;
      }
      if (target > points[i + 1][metric]) {
        lower = points[i];
        upper = points[i + 1];
      }
    }

    var years = Math.max(1, upper.age - lower.age);
    return {
      dbhCm: Math.max(0, (upper.dbhCm - lower.dbhCm) / years),
      heightM: Math.max(0, (upper.heightM - lower.heightM) / years),
      source: table.label + " (" + table.source + ")"
    };
  }

  function annualHeightGrowthM(row, speciesData, assumptions) {
    var table = data.YIELD_TOP_HEIGHT_INCREMENT_CM[speciesData.yieldTable];
    if (!table) {
      var group = data.GROWTH_GROUPS[speciesData.growthGroup] || data.GROWTH_GROUPS.unknown;
      var base =
        assumptions.annualHeightGrowthM > 0 ? assumptions.annualHeightGrowthM : group.heightM;
      return base * (group.heightM / 0.18);
    }

    var heightKey = nearestValue(
      Object.keys(table.rows).map(Number),
      Math.max(8, Math.min(20, row.height))
    );
    var yieldClass = nearestValue(table.yieldClasses, assumptions.yieldClass);
    var ycIndex = table.yieldClasses.indexOf(yieldClass);
    return table.rows[heightKey][ycIndex] / 100;
  }

  function annualDbhGrowthCm(speciesData, assumptions) {
    var group = data.GROWTH_GROUPS[speciesData.growthGroup] || data.GROWTH_GROUPS.unknown;
    var base = assumptions.annualDbhGrowthCm > 0 ? assumptions.annualDbhGrowthCm : group.dbhCm;
    return base * (group.dbhCm / 0.35);
  }

  function annualGrowth(row, speciesData, assumptions) {
    var broadleafTableGrowth = broadleafGrowthFromTable(row, speciesData);
    if (broadleafTableGrowth) {
      return broadleafTableGrowth;
    }

    return {
      dbhCm: annualDbhGrowthCm(speciesData, assumptions),
      heightM: annualHeightGrowthM(row, speciesData, assumptions),
      source: speciesData.yieldTable
        ? "Forest Yield top-height table plus species-group DBH fallback"
        : "species-group fallback"
    };
  }

  function projectedDimensions(row, speciesData, assumptions) {
    var ageFactor = data.AGE_FACTORS[row.ageClass] || 1;
    var conditionFactor = data.CONDITION_FACTORS[row.condition] || 0;
    var growthFactor = ageFactor * conditionFactor * assumptions.assessmentYears;
    var growth = annualGrowth(row, speciesData, assumptions);

    return {
      dbh: row.dbh + growth.dbhCm * growthFactor,
      height: row.height + growth.heightM * growthFactor,
      growthSource: growth.source,
      annualDbhGrowthCm: growth.dbhCm,
      annualHeightGrowthM: growth.heightM
    };
  }

  function futureSequestrationForegone(row, currentCo2e, speciesData, assumptions) {
    if (assumptions.futureSequestrationModel === "simple-rate") {
      var futureFactor =
        (data.AGE_FACTORS[row.ageClass] || 1) * (data.CONDITION_FACTORS[row.condition] || 0);
      return {
        future: currentCo2e * assumptions.annualRate * assumptions.assessmentYears * futureFactor,
        growthSource: "simple annual percentage fallback"
      };
    }

    var projected = projectedDimensions(row, speciesData, assumptions);
    var projectedCarbon = biomassComponents(
      projected.dbh,
      projected.height,
      speciesData,
      assumptions
    ).co2e;
    return {
      future: Math.max(0, projectedCarbon - currentCo2e),
      growthSource: projected.growthSource,
      projectedDbh: projected.dbh,
      projectedHeight: projected.height,
      annualDbhGrowthCm: projected.annualDbhGrowthCm,
      annualHeightGrowthM: projected.annualHeightGrowthM
    };
  }

  function crownBiomass(dbhCm, group) {
    if (dbhCm <= 50) {
      var small = data.CROWN_7_TO_50[group];
      return small.b * Math.pow(dbhCm, small.p);
    }
    var large = data.CROWN_OVER_50[group];
    return Math.max(0, large.a + large.b * dbhCm);
  }

  function rootBiomass(dbhCm, group) {
    if (dbhCm <= 30) {
      return data.ROOT_TO_30[group] * Math.pow(dbhCm, 2.5);
    }
    var large = data.ROOT_OVER_30[group];
    return Math.max(0, large.a + large.b * dbhCm);
  }

  function calculateTree(row, assumptions) {
    var species = row.species;
    var speciesData = data.SPECIES[species] || data.SPECIES.Unknown;

    if (speciesData.excluded) {
      return {
        species: species,
        dbh: row.dbh,
        height: row.height,
        count: row.count,
        location: row.location,
        volume: 0,
        stem: 0,
        crown: 0,
        root: 0,
        biomass: 0,
        co2e: 0,
        future: 0,
        canopyArea: 0,
        rainfall: 0,
        runoff: 0,
        excluded: true
      };
    }

    var current = biomassComponents(row.dbh, row.height, speciesData, assumptions);
    var future = futureSequestrationForegone(row, current.co2e, speciesData, assumptions);
    var rainfall = rainfallInterception(row, speciesData, assumptions);

    return {
      species: species,
      dbh: row.dbh,
      height: row.height,
      count: row.count,
      location: row.location,
      volume: current.volume * row.count,
      stem: current.stem * row.count,
      crown: current.crown * row.count,
      root: current.root * row.count,
      biomass: current.biomass * row.count,
      co2e: current.co2e * row.count,
      future: future.future * row.count,
      growthSource: future.growthSource,
      projectedDbh: future.projectedDbh || row.dbh,
      projectedHeight: future.projectedHeight || row.height,
      annualDbhGrowthCm: future.annualDbhGrowthCm || 0,
      annualHeightGrowthM: future.annualHeightGrowthM || 0,
      canopyArea: canopyArea(row.spread) * row.count,
      rainfall: rainfall,
      runoff: avoidedRunoff(row, rainfall, assumptions)
    };
  }

  function groupedSchedule(results) {
    var groups = {};
    results.forEach(function (result) {
      if (result.excluded) {
        return;
      }
      if (!groups[result.species]) {
        groups[result.species] = {
          species: result.species,
          count: 0,
          dbhTotal: 0,
          heightTotal: 0,
          biomass: 0
        };
      }
      groups[result.species].count += result.count;
      groups[result.species].dbhTotal += result.dbh * result.count;
      groups[result.species].heightTotal += result.height * result.count;
      groups[result.species].biomass += result.biomass;
    });
    return Object.keys(groups).map(function (key) {
      var group = groups[key];
      group.meanDbh = group.dbhTotal / group.count;
      group.meanHeight = group.heightTotal / group.count;
      return group;
    });
  }

  function calculateTotals(results, assumptions) {
    var totalTrees = results.reduce(function (sum, row) {
      return sum + (row.excluded ? 0 : row.count);
    }, 0);
    var stored = results.reduce(function (sum, row) {
      return sum + row.co2e;
    }, 0);
    var future = results.reduce(function (sum, row) {
      return sum + row.future;
    }, 0);
    var impact = stored + future;

    var rainfall = results.reduce(function (sum, row) {
      return sum + row.rainfall;
    }, 0);
    var runoff = results.reduce(function (sum, row) {
      return sum + row.runoff;
    }, 0);

    return {
      totalTrees: totalTrees,
      stored: stored,
      future: future,
      impact: impact,
      value: impact * assumptions.carbonPrice,
      rainfall: rainfall,
      runoff: runoff,
      pollution: totalTrees * assumptions.pollutionRate
    };
  }

  function calculateAssessment(rows, assumptions) {
    var results = rows.map(function (row) {
      return calculateTree(row, assumptions);
    });
    return {
      rows: rows,
      results: results,
      assumptions: assumptions,
      totals: calculateTotals(results, assumptions),
      schedule: groupedSchedule(results)
    };
  }

  window.CarbonCalculations = {
    girthToDbhCm: girthToDbhCm,
    calculateAssessment: calculateAssessment
  };
})();
