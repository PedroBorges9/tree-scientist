(function () {
  "use strict";

  var treeRows = document.getElementById("tree-rows");
  var template = document.getElementById("tree-row-template");
  var importStatus = document.getElementById("import-status");
  var currentAssessment = null;

  function numberFrom(id) {
    var value = parseFloat(document.getElementById(id).value);
    return Number.isFinite(value) ? value : 0;
  }

  function currency(value) {
    return "GBP " + Math.round(value).toLocaleString("en-GB");
  }

  function tonnes(value) {
    return (
      value.toLocaleString("en-GB", {
        maximumFractionDigits: value >= 100 ? 0 : 2
      }) + " tCO2e"
    );
  }

  function biomassTonnes(value) {
    return (
      value.toLocaleString("en-GB", {
        maximumFractionDigits: value >= 100 ? 0 : 3
      }) + " t"
    );
  }

  function serviceValue(value, unit) {
    return (
      value.toLocaleString("en-GB", {
        maximumFractionDigits: value >= 100 ? 0 : 2
      }) +
      " " +
      unit
    );
  }

  function getAssumptions() {
    return {
      carbonPrice: numberFrom("carbon-price"),
      assessmentYears: numberFrom("assessment-years"),
      futureSequestrationModel: document.getElementById("future-sequestration-model").value,
      annualRate: numberFrom("annual-sequestration-rate") / 100,
      annualDbhGrowthCm: numberFrom("annual-dbh-growth-cm"),
      annualHeightGrowthM: numberFrom("annual-height-growth-m"),
      yieldClass: numberFrom("yield-class"),
      broadleafFormFactor: numberFrom("broadleaf-form-factor"),
      coniferFormFactor: numberFrom("conifer-form-factor"),
      annualRainfallMm: numberFrom("annual-rainfall-mm"),
      broadleafRainfallInterceptionFactor: numberFrom("broadleaf-rainfall-factor"),
      coniferRainfallInterceptionFactor: numberFrom("conifer-rainfall-factor"),
      unknownRainfallInterceptionFactor: numberFrom("unknown-rainfall-factor"),
      runoffModel: document.getElementById("runoff-model").value,
      imperviousCoverFraction: numberFrom("impervious-cover-fraction"),
      runoffRate: numberFrom("runoff-rate"),
      pollutionRate: numberFrom("pollution-rate")
    };
  }

  function defaultImportValues() {
    return {
      ageClass: document.getElementById("default-age-class").value,
      condition: document.getElementById("default-condition").value,
      location: document.getElementById("default-location").value.trim() || "Site"
    };
  }

  function readRows() {
    return Array.from(treeRows.querySelectorAll("tr"))
      .map(function (tr) {
        var girth = parseFloat(tr.querySelector(".girth").value) || 0;
        var dbhInput = parseFloat(tr.querySelector(".dbh").value);
        var height = parseFloat(tr.querySelector(".height").value) || 0;
        var count = parseInt(tr.querySelector(".count").value, 10) || 0;
        var dbh =
          Number.isFinite(dbhInput) && dbhInput > 0
            ? Math.max(7, dbhInput)
            : girth > 0
              ? Math.max(7, window.CarbonCalculations.girthToDbhCm(girth))
              : 0;

        return {
          observation: tr.querySelector(".observation").value.trim(),
          species: tr.querySelector(".species").value,
          girth: girth,
          dbh: dbh,
          height: height,
          spread: parseFloat(tr.querySelector(".spread").value) || 0,
          ageClass: tr.querySelector(".age-class").value,
          condition: tr.querySelector(".condition").value,
          location: tr.querySelector(".location").value.trim() || "Site",
          count: Math.max(0, count)
        };
      })
      .filter(function (row) {
        return row.dbh > 0 && row.height > 0 && row.count > 0;
      });
  }

  function setImportStatus(message, statusClass) {
    importStatus.textContent = message;
    importStatus.className = "import-status" + (statusClass ? " " + statusClass : "");
  }

  function renderSchedule(schedule) {
    var output = document.getElementById("schedule-output");
    output.innerHTML = "";
    schedule.forEach(function (group) {
      var row = document.createElement("tr");
      row.innerHTML = [
        "<td>" + group.species + "</td>",
        "<td>" + group.count.toLocaleString("en-GB") + "</td>",
        "<td>" + group.meanDbh.toFixed(1) + " cm</td>",
        "<td>" + group.meanHeight.toFixed(1) + " m</td>",
        "<td>" + biomassTonnes(group.biomass) + "</td>",
        "<td>" + group.growthModel + "</td>"
      ].join("");
      output.appendChild(row);
    });
  }

  function renderAssessment(assessment) {
    var totals = assessment.totals;
    document.getElementById("metric-trees").textContent = totals.totalTrees.toLocaleString("en-GB");
    document.getElementById("metric-stored").textContent = tonnes(totals.stored);
    document.getElementById("metric-impact").textContent = tonnes(totals.impact);
    document.getElementById("metric-value").textContent = currency(totals.value);
    document.getElementById("assessment-period-output").textContent =
      assessment.assumptions.assessmentYears.toLocaleString("en-GB") + " years";
    document.getElementById("stored-output").textContent = tonnes(totals.stored);
    document.getElementById("future-output").textContent = tonnes(totals.future);
    document.getElementById("impact-output").textContent = tonnes(totals.impact);
    document.getElementById("price-output").textContent =
      currency(assessment.assumptions.carbonPrice) + "/tCO2e";
    document.getElementById("value-output").textContent = currency(totals.value);
    document.getElementById("rainfall-output").textContent = serviceValue(
      totals.rainfall,
      "m3/year"
    );
    document.getElementById("runoff-output").textContent = serviceValue(totals.runoff, "m3/year");
    document.getElementById("pollution-output").textContent = serviceValue(
      totals.pollution,
      "kg/year"
    );
    renderSchedule(assessment.schedule);
  }

  function calculate() {
    currentAssessment = window.CarbonCalculations.calculateAssessment(readRows(), getAssumptions());
    window.currentCarbonResults = currentAssessment;
    renderAssessment(currentAssessment);
  }

  function populateSpecies(select) {
    window.CarbonData.speciesNames.forEach(function (name) {
      var option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
  }

  function addTree(values, skipCalculate) {
    var fragment = template.content.cloneNode(true);
    var row = fragment.querySelector("tr");
    populateSpecies(row.querySelector(".species"));

    if (values) {
      row.querySelector(".observation").value = values.observation || "";
      row.querySelector(".species").value = values.species || "Oak";
      row.querySelector(".girth").value = values.girth || "";
      row.querySelector(".dbh").value = values.dbh || "";
      row.querySelector(".height").value = values.height || "";
      row.querySelector(".spread").value = values.spread || "";
      row.querySelector(".age-class").value = values.ageClass || "mature";
      row.querySelector(".condition").value = values.condition || "good";
      row.querySelector(".location").value = values.location || "Site";
      row.querySelector(".count").value = values.count || "";
    }

    row.querySelector(".girth").addEventListener("input", function () {
      var girth = parseFloat(row.querySelector(".girth").value);
      if (Number.isFinite(girth) && girth > 0) {
        row.querySelector(".dbh").value = window.CarbonCalculations.girthToDbhCm(girth).toFixed(1);
      }
    });
    row.addEventListener("input", calculate);
    row.addEventListener("change", calculate);
    row.querySelector(".remove-row").addEventListener("click", function () {
      row.remove();
      calculate();
    });

    treeRows.appendChild(fragment);
    if (!skipCalculate) {
      calculate();
    }
  }

  function replaceRows(rows, importMessage) {
    treeRows.innerHTML = "";
    rows.forEach(function (row) {
      addTree(row, true);
    });
    if (importMessage) {
      setImportStatus(importMessage, "is-success");
    }
    calculate();
  }

  function loadExample() {
    replaceRows([
      {
        species: "Oak",
        dbh: 42,
        height: 18,
        spread: 10,
        ageClass: "mature",
        condition: "good",
        location: "Eccles WwTW",
        count: 85
      },
      {
        species: "Ash",
        dbh: 28,
        height: 14,
        spread: 7,
        ageClass: "early-mature",
        condition: "fair",
        location: "Eccles WwTW",
        count: 120
      },
      {
        species: "Birch",
        dbh: 22,
        height: 13,
        spread: 6,
        ageClass: "semi-mature",
        condition: "good",
        location: "Eccles WwTW",
        count: 160
      },
      {
        species: "Sycamore",
        dbh: 34,
        height: 16,
        spread: 8,
        ageClass: "mature",
        condition: "good",
        location: "Eccles WwTW",
        count: 95
      },
      {
        species: "Pine",
        dbh: 31,
        height: 17,
        spread: 7,
        ageClass: "mature",
        condition: "fair",
        location: "Eccles WwTW",
        count: 70
      }
    ]);
  }

  async function handleSurveyFile(event) {
    var file = event.target.files[0];
    if (!file) {
      return;
    }
    setImportStatus("Reading " + file.name + "...", "");
    try {
      var imported = await window.CarbonImporter.parseSurveyFile(file, defaultImportValues());
      if (!imported.rows.length) {
        setImportStatus(
          "No usable tree rows found. Check the workbook or CSV columns.",
          "is-error"
        );
        return;
      }
      replaceRows(
        imported.rows,
        "Imported " +
          imported.rows.length.toLocaleString("en-GB") +
          " rows" +
          (imported.excluded
            ? "; excluded " + imported.excluded + " stump/deceased rows from living-tree biomass."
            : ".")
      );
    } catch (error) {
      setImportStatus(error.message || "Import failed.", "is-error");
    }
  }

  document.getElementById("add-tree").addEventListener("click", function () {
    addTree();
  });
  document.getElementById("load-example").addEventListener("click", loadExample);
  document.getElementById("export-csv").addEventListener("click", function () {
    if (currentAssessment) {
      window.CarbonExporter.downloadCsv(currentAssessment);
    }
  });
  document.getElementById("survey-file").addEventListener("change", handleSurveyFile);
  Array.from(document.querySelectorAll(".assumptions input")).forEach(function (input) {
    input.addEventListener("input", calculate);
  });
  Array.from(document.querySelectorAll(".assumptions select")).forEach(function (select) {
    select.addEventListener("change", calculate);
  });

  calculate();
})();
