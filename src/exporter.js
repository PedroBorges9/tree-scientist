(function () {
  "use strict";

  function csvCell(value) {
    return '"' + String(value).replace(/"/g, '""') + '"';
  }

  function buildCsv(state) {
    var lines = [];
    var addRow = function (values) {
      lines.push(values.map(csvCell).join(","));
    };
    var addBlank = function () {
      lines.push("");
    };

    addRow(["Results"]);
    addBlank();

    addRow(["Tree Loss Schedule"]);
    addRow([
      "Species",
      "Number",
      "Mean DBH cm",
      "Mean height m",
      "Estimated biomass t",
      "Growth model"
    ]);
    state.schedule.forEach(function (group) {
      addRow([
        group.species,
        group.count,
        group.meanDbh.toFixed(1),
        group.meanHeight.toFixed(1),
        group.biomass.toFixed(4),
        group.growthModel
      ]);
    });
    addBlank();

    addRow(["Carbon Assessment"]);
    addRow(["Metric", "Value", "Unit"]);
    addRow(["Carbon stored lost", state.totals.stored.toFixed(4), "tCO2e"]);
    addRow(["Future sequestration foregone", state.totals.future.toFixed(4), "tCO2e"]);
    addRow(["Total carbon impact", state.totals.impact.toFixed(4), "tCO2e"]);
    addRow(["Future sequestration model", state.assumptions.futureSequestrationModel, ""]);
    addRow(["Assessment period", state.assumptions.assessmentYears.toFixed(2), "years"]);
    addRow([
      "Fallback annual DBH growth",
      state.assumptions.annualDbhGrowthCm.toFixed(4),
      "cm/year"
    ]);
    addRow([
      "Fallback annual height growth",
      state.assumptions.annualHeightGrowthM.toFixed(4),
      "m/year"
    ]);
    addRow(["Forest Yield yield class", state.assumptions.yieldClass.toFixed(2), "m3/ha/year"]);
    addRow([
      "Simple annual future sequestration fallback",
      (state.assumptions.annualRate * 100).toFixed(4),
      "% stored CO2e/year"
    ]);
    addBlank();

    addRow(["Carbon Valuation"]);
    addRow(["Metric", "Value", "Unit"]);
    addRow(["Carbon value", state.assumptions.carbonPrice.toFixed(2), "GBP/tCO2e"]);
    addRow(["Financial carbon value", state.totals.value.toFixed(2), "GBP"]);
    addBlank();

    addRow(["Ecosystem Services Assessment"]);
    addRow(["Metric", "Value", "Unit"]);
    addRow(["Rainfall interception", state.totals.rainfall.toFixed(4), "m3/year"]);
    addRow([
      "Annual rainfall assumption",
      state.assumptions.annualRainfallMm.toFixed(2),
      "mm/year"
    ]);
    addRow([
      "Broadleaf interception factor",
      state.assumptions.broadleafRainfallInterceptionFactor.toFixed(4),
      "proportion"
    ]);
    addRow([
      "Conifer interception factor",
      state.assumptions.coniferRainfallInterceptionFactor.toFixed(4),
      "proportion"
    ]);
    addRow([
      "Unknown species interception factor",
      state.assumptions.unknownRainfallInterceptionFactor.toFixed(4),
      "proportion"
    ]);
    addRow(["Avoided runoff", state.totals.runoff.toFixed(4), "m3/year"]);
    addRow(["Avoided runoff model", state.assumptions.runoffModel, ""]);
    addRow([
      "Impervious cover fraction",
      state.assumptions.imperviousCoverFraction.toFixed(4),
      "proportion"
    ]);
    addRow([
      "Simple avoided runoff fallback rate",
      state.assumptions.runoffRate.toFixed(4),
      "m3/tree/year"
    ]);
    addRow(["Air pollutant removal", state.totals.pollution.toFixed(4), "kg/year"]);
    addBlank();

    addRow(["Detailed Tree Calculations"]);
    addRow([
      "observation",
      "species",
      "location",
      "girth_m",
      "dbh_cm",
      "height_m",
      "spread_m",
      "canopy_area_m2",
      "rainfall_interception_m3_year",
      "avoided_runoff_m3_year",
      "count",
      "stem_t",
      "crown_t",
      "root_t",
      "biomass_t",
      "stored_tCO2e",
      "future_tCO2e",
      "growth_source",
      "annual_dbh_growth_cm",
      "annual_height_growth_m",
      "projected_dbh_cm",
      "projected_height_m"
    ]);
    state.results.forEach(function (row, index) {
      var source = state.rows[index] || {};
      addRow([
        source.observation || "",
        row.species,
        row.location,
        source.girth || "",
        row.dbh,
        row.height,
        source.spread || "",
        row.canopyArea.toFixed(4),
        row.rainfall.toFixed(4),
        row.runoff.toFixed(4),
        row.count,
        row.stem.toFixed(4),
        row.crown.toFixed(4),
        row.root.toFixed(4),
        row.biomass.toFixed(4),
        row.co2e.toFixed(4),
        row.future.toFixed(4),
        row.growthSource || "",
        (row.annualDbhGrowthCm || 0).toFixed(4),
        (row.annualHeightGrowthM || 0).toFixed(4),
        (row.projectedDbh || row.dbh).toFixed(4),
        (row.projectedHeight || row.height).toFixed(4)
      ]);
    });

    return lines.join("\n");
  }

  function downloadCsv(state) {
    var blob = new Blob([buildCsv(state)], { type: "text/csv" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "tree-carbon-assessment.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  window.CarbonExporter = {
    buildCsv: buildCsv,
    downloadCsv: downloadCsv
  };
})();
