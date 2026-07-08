(function () {
  "use strict";

  var SPECIES = {
    "Alder": { kind: "broadleaf", growthGroup: "mediumBroadleaf", broadleafYieldTable: "sab", nsg: 0.42, crownGroup: "Oak", rootGroup: "red alder" },
    "Ash": { kind: "broadleaf", growthGroup: "mediumBroadleaf", broadleafYieldTable: "sab", nsg: 0.53, crownGroup: "Oak", rootGroup: "red alder" },
    "Beech": { kind: "broadleaf", growthGroup: "slowBroadleaf", broadleafYieldTable: "beech", nsg: 0.55, crownGroup: "Beech", rootGroup: "red alder" },
    "Birch": { kind: "broadleaf", growthGroup: "fastBroadleaf", broadleafYieldTable: "sab", nsg: 0.53, crownGroup: "Oak", rootGroup: "red alder" },
    "Cherry": { kind: "broadleaf", growthGroup: "mediumBroadleaf", nsg: 0.50, crownGroup: "Oak", rootGroup: "red alder" },
    "Elm": { kind: "broadleaf", growthGroup: "mediumBroadleaf", broadleafYieldTable: "sab", nsg: 0.43, crownGroup: "Oak", rootGroup: "red alder" },
    "Willow": { kind: "broadleaf", growthGroup: "fastBroadleaf", broadleafYieldTable: "poplar", nsg: 0.35, crownGroup: "Oak", rootGroup: "red alder" },
    "Unknown": { kind: "broadleaf", growthGroup: "unknown", nsg: 0.56, crownGroup: "Oak", rootGroup: "red alder" },
    "Stump": { kind: "excluded", excluded: true, nsg: 0, crownGroup: "Oak", rootGroup: "red alder" },
    "Deceased Tree": { kind: "excluded", excluded: true, nsg: 0, crownGroup: "Oak", rootGroup: "red alder" },
    "Fir": { kind: "conifer", growthGroup: "douglasFir", yieldTable: "douglasFir", nsg: 0.30, crownGroup: "firs, spruces, cedars and hemlocks", rootGroup: "grand fir, Scots pine, western hemlock" },
    "Hawthorn": { kind: "broadleaf", growthGroup: "slowBroadleaf", nsg: 0.56, crownGroup: "Oak", rootGroup: "red alder" },
    "Laurel": { kind: "broadleaf", growthGroup: "slowBroadleaf", nsg: 0.56, crownGroup: "Oak", rootGroup: "red alder" },
    "Maple": { kind: "broadleaf", growthGroup: "mediumBroadleaf", broadleafYieldTable: "sab", nsg: 0.49, crownGroup: "Beech", rootGroup: "red alder" },
    "Oak": { kind: "broadleaf", growthGroup: "slowBroadleaf", broadleafYieldTable: "oak", nsg: 0.56, crownGroup: "Oak", rootGroup: "red alder" },
    "Pine": { kind: "conifer", growthGroup: "scotsPine", yieldTable: "scotsPine", nsg: 0.42, crownGroup: "Scots pine", rootGroup: "grand fir, Scots pine, western hemlock" },
    "Poplar": { kind: "broadleaf", growthGroup: "fastBroadleaf", broadleafYieldTable: "poplar", nsg: 0.35, crownGroup: "Oak", rootGroup: "red alder" },
    "Privet": { kind: "broadleaf", growthGroup: "slowBroadleaf", nsg: 0.56, crownGroup: "Oak", rootGroup: "red alder" },
    "Rowan": { kind: "broadleaf", growthGroup: "mediumBroadleaf", nsg: 0.56, crownGroup: "Oak", rootGroup: "red alder" },
    "Sycamore": { kind: "broadleaf", growthGroup: "mediumBroadleaf", broadleafYieldTable: "sab", nsg: 0.49, crownGroup: "Beech", rootGroup: "red alder" }
  };

  var CROWN_7_TO_50 = {
    "Larches": { b: 0.0000438717, p: 2.0291 },
    "Corsican pine": { b: 0.0000122645, p: 2.4767 },
    "lodgepole pine": { b: 0.0000176287, p: 2.4767 },
    "Scots pine": { b: 0.0000161411, p: 2.4767 },
    "firs, spruces, cedars and hemlocks": { b: 0.0000144620, p: 2.4767 },
    "Douglas fir": { b: 0.0000168602, p: 2.4767 },
    "Beech": { b: 0.0000188154, p: 2.4767 },
    "Oak": { b: 0.0000168513, p: 2.4767 }
  };

  var CROWN_OVER_50 = {
    "Larches": { a: -0.129046967, b: 0.005039011 },
    "Corsican pine": { a: -0.299529453, b: 0.009948982 },
    "lodgepole pine": { a: -0.430536496, b: 0.014300429 },
    "Scots pine": { a: -0.394205622, b: 0.013093685 },
    "firs, spruces, cedars and hemlocks": { a: -0.353197843, b: 0.011731597 },
    "Douglas fir": { a: -0.411767824, b: 0.013677021 },
    "Beech": { a: -0.459518648, b: 0.015263082 },
    "Oak": { a: -0.411550464, b: 0.013669801 }
  };

  var ROOT_TO_30 = {
    "western red cedar, noble fir, Corsican pine": 0.000010722,
    "Norway spruce": 0.000011883,
    "grand fir, Scots pine, western hemlock": 0.000015404,
    "Douglas fir, Japanese larch, lodgepole pine": 0.000017326,
    "Sitka spruce": 0.000020454,
    "red alder": 0.000022700
  };

  var ROOT_OVER_30 = {
    "western red cedar, noble fir, Corsican pine": { a: -0.082602857, b: 0.004515233 },
    "Norway spruce": { a: -0.091547262, b: 0.005004152 },
    "grand fir, Scots pine, western hemlock": { a: -0.118673233, b: 0.006486910 },
    "Douglas fir, Japanese larch, lodgepole pine": { a: -0.133480423, b: 0.007296300 },
    "Sitka spruce": { a: -0.157578701, b: 0.008613559 },
    "red alder": { a: -0.174882004, b: 0.009559391 }
  };

  var AGE_FACTORS = {
    "young": 1.4,
    "semi-mature": 1.15,
    "early-mature": 1,
    "mature": 0.75,
    "overmature": 0.45
  };

  var CONDITION_FACTORS = {
    "good": 1,
    "fair": 0.75,
    "poor": 0.4,
    "dead": 0
  };

  var DEFAULT_RAINFALL_INTERCEPTION_FACTORS = {
    broadleaf: 0.22,
    conifer: 0.32,
    unknown: 0.20
  };

  var GROWTH_GROUPS = {
    fastBroadleaf: { dbhCm: 0.50, heightM: 0.25 },
    mediumBroadleaf: { dbhCm: 0.35, heightM: 0.18 },
    slowBroadleaf: { dbhCm: 0.25, heightM: 0.12 },
    unknown: { dbhCm: 0.30, heightM: 0.15 },
    scotsPine: { dbhCm: 0.30, heightM: 0.20 },
    douglasFir: { dbhCm: 0.45, heightM: 0.40 }
  };

  var YIELD_TOP_HEIGHT_INCREMENT_CM = {
    scotsPine: {
      yieldClasses: [4, 6, 8, 10, 12, 14],
      rows: {
        8: [27, 32, 37, 44, 51, 59],
        9: [25, 31, 36, 42, 49, 57],
        10: [23, 29, 35, 40, 47, 54],
        11: [22, 28, 34, 39, 45, 51],
        12: [20, 26, 32, 37, 43, 49],
        13: [18, 24, 30, 36, 41, 46],
        14: [16, 23, 29, 34, 39, 44],
        15: [13, 21, 27, 33, 37, 41],
        16: [10, 19, 26, 31, 36, 40],
        17: [0, 17, 24, 29, 34, 38],
        18: [0, 15, 22, 28, 33, 37],
        19: [0, 12, 20, 26, 31, 35],
        20: [0, 0, 18, 24, 30, 34]
      }
    },
    douglasFir: {
      yieldClasses: [8, 10, 12, 14, 16, 18, 20, 22, 24],
      rows: {
        8: [55, 63, 68, 73, 78, 83, 88, 93, 99],
        9: [54, 61, 67, 72, 78, 83, 88, 93, 98],
        10: [51, 59, 66, 72, 77, 82, 87, 92, 98],
        11: [49, 57, 64, 71, 76, 82, 86, 91, 97],
        12: [46, 55, 62, 69, 75, 80, 86, 90, 96],
        13: [43, 52, 60, 67, 73, 79, 85, 90, 94],
        14: [41, 50, 58, 66, 72, 78, 84, 89, 93],
        15: [38, 48, 56, 63, 70, 76, 82, 87, 92],
        16: [36, 46, 53, 61, 68, 75, 81, 86, 90],
        17: [35, 44, 51, 59, 66, 73, 79, 85, 89],
        18: [33, 42, 49, 56, 64, 71, 77, 83, 87],
        19: [31, 39, 46, 54, 61, 68, 75, 81, 85],
        20: [29, 36, 44, 51, 59, 66, 73, 79, 83]
      }
    }
  };

  var BROADLEAF_YIELD_TABLES = {
    oak: {
      label: "Oak YC80",
      source: "fcbk016 p208",
      rows: [
        { age: 20, topHeightFt: 31, meanBhqgIn: 2 },
        { age: 25, topHeightFt: 38, meanBhqgIn: 2.5 },
        { age: 30, topHeightFt: 44.5, meanBhqgIn: 3.5 },
        { age: 35, topHeightFt: 50.5, meanBhqgIn: 4.5 },
        { age: 40, topHeightFt: 56, meanBhqgIn: 5.5 },
        { age: 45, topHeightFt: 61, meanBhqgIn: 6.5 },
        { age: 50, topHeightFt: 65.5, meanBhqgIn: 7.5 },
        { age: 55, topHeightFt: 69.5, meanBhqgIn: 8 },
        { age: 60, topHeightFt: 73, meanBhqgIn: 8.5 },
        { age: 65, topHeightFt: 76, meanBhqgIn: 9.5 },
        { age: 70, topHeightFt: 79, meanBhqgIn: 10.5 },
        { age: 75, topHeightFt: 82, meanBhqgIn: 11.5 },
        { age: 80, topHeightFt: 84.5, meanBhqgIn: 12 },
        { age: 85, topHeightFt: 86.5, meanBhqgIn: 12.5 },
        { age: 90, topHeightFt: 88.5, meanBhqgIn: 13.5 },
        { age: 95, topHeightFt: 90, meanBhqgIn: 14.5 },
        { age: 100, topHeightFt: 91.5, meanBhqgIn: 15 },
        { age: 110, topHeightFt: 94, meanBhqgIn: 16.5 },
        { age: 120, topHeightFt: 96, meanBhqgIn: 17.25 },
        { age: 130, topHeightFt: 98, meanBhqgIn: 18.5 },
        { age: 140, topHeightFt: 99.5, meanBhqgIn: 19.5 },
        { age: 150, topHeightFt: 100.5, meanBhqgIn: 20.25 }
      ]
    },
    beech: {
      label: "Beech YC100",
      source: "fcbk016 p210",
      rows: [
        { age: 20, topHeightFt: 35, meanBhqgIn: 2.5 },
        { age: 25, topHeightFt: 43, meanBhqgIn: 2.5 },
        { age: 30, topHeightFt: 51, meanBhqgIn: 3.5 },
        { age: 35, topHeightFt: 58.5, meanBhqgIn: 4.5 },
        { age: 40, topHeightFt: 64.5, meanBhqgIn: 5.5 },
        { age: 45, topHeightFt: 69.5, meanBhqgIn: 6.5 },
        { age: 50, topHeightFt: 74, meanBhqgIn: 7.5 },
        { age: 55, topHeightFt: 78, meanBhqgIn: 8.5 },
        { age: 60, topHeightFt: 82, meanBhqgIn: 9.5 },
        { age: 65, topHeightFt: 85.5, meanBhqgIn: 10.5 },
        { age: 70, topHeightFt: 88.5, meanBhqgIn: 11.5 },
        { age: 75, topHeightFt: 91.5, meanBhqgIn: 12.5 },
        { age: 80, topHeightFt: 94, meanBhqgIn: 13 },
        { age: 85, topHeightFt: 96, meanBhqgIn: 13.5 },
        { age: 90, topHeightFt: 98, meanBhqgIn: 14.5 },
        { age: 95, topHeightFt: 100, meanBhqgIn: 15.5 },
        { age: 100, topHeightFt: 101.5, meanBhqgIn: 16 },
        { age: 110, topHeightFt: 104.5, meanBhqgIn: 17.5 },
        { age: 120, topHeightFt: 106.5, meanBhqgIn: 19.5 },
        { age: 130, topHeightFt: 108.5, meanBhqgIn: 20.5 },
        { age: 140, topHeightFt: 110, meanBhqgIn: 21.75 },
        { age: 150, topHeightFt: 111, meanBhqgIn: 23 }
      ]
    },
    sab: {
      label: "SAB YC120",
      source: "fcbk016 p214",
      rows: [
        { age: 10, topHeightFt: 28.5, meanBhqgIn: 2 },
        { age: 15, topHeightFt: 38, meanBhqgIn: 3.25 },
        { age: 20, topHeightFt: 46.5, meanBhqgIn: 5 },
        { age: 25, topHeightFt: 54, meanBhqgIn: 7 },
        { age: 30, topHeightFt: 60.5, meanBhqgIn: 8.75 },
        { age: 35, topHeightFt: 65, meanBhqgIn: 10.5 },
        { age: 40, topHeightFt: 69, meanBhqgIn: 12 },
        { age: 45, topHeightFt: 72, meanBhqgIn: 13 },
        { age: 50, topHeightFt: 74.5, meanBhqgIn: 14 },
        { age: 55, topHeightFt: 76.5, meanBhqgIn: 15 },
        { age: 60, topHeightFt: 78, meanBhqgIn: 15.5 },
        { age: 65, topHeightFt: 79.5, meanBhqgIn: 16.5 },
        { age: 70, topHeightFt: 80.5, meanBhqgIn: 17 },
        { age: 75, topHeightFt: 81.5, meanBhqgIn: 17.5 },
        { age: 80, topHeightFt: 82.5, meanBhqgIn: 18 }
      ]
    },
    poplar: {
      label: "Poplar YC160",
      source: "fcbk016 p218",
      rows: [
        { age: 5, topHeightFt: 28.5, meanBhqgIn: 4 },
        { age: 10, topHeightFt: 52.5, meanBhqgIn: 7.5 },
        { age: 15, topHeightFt: 72.5, meanBhqgIn: 10.5 },
        { age: 20, topHeightFt: 89, meanBhqgIn: 12.5 },
        { age: 25, topHeightFt: 102.5, meanBhqgIn: 14.5 },
        { age: 30, topHeightFt: 112.5, meanBhqgIn: 16 },
        { age: 35, topHeightFt: 120, meanBhqgIn: 17.25 },
        { age: 40, topHeightFt: 125.5, meanBhqgIn: 18 },
        { age: 45, topHeightFt: 129.5, meanBhqgIn: 18.5 },
        { age: 50, topHeightFt: 132.5, meanBhqgIn: 19 },
        { age: 55, topHeightFt: 135, meanBhqgIn: 19.5 },
        { age: 60, topHeightFt: 136.5, meanBhqgIn: 19.75 }
      ]
    }
  };

  function normalizeSpecies(value) {
    var cleaned = String(value || "").trim();
    var speciesNames = Object.keys(SPECIES);
    var lower = cleaned.toLowerCase();
    return speciesNames.find(function (name) {
      return name.toLowerCase() === lower;
    }) || "Unknown";
  }

  window.CarbonData = {
    SPECIES: SPECIES,
    CROWN_7_TO_50: CROWN_7_TO_50,
    CROWN_OVER_50: CROWN_OVER_50,
    ROOT_TO_30: ROOT_TO_30,
    ROOT_OVER_30: ROOT_OVER_30,
    AGE_FACTORS: AGE_FACTORS,
    CONDITION_FACTORS: CONDITION_FACTORS,
    DEFAULT_RAINFALL_INTERCEPTION_FACTORS: DEFAULT_RAINFALL_INTERCEPTION_FACTORS,
    GROWTH_GROUPS: GROWTH_GROUPS,
    YIELD_TOP_HEIGHT_INCREMENT_CM: YIELD_TOP_HEIGHT_INCREMENT_CM,
    BROADLEAF_YIELD_TABLES: BROADLEAF_YIELD_TABLES,
    speciesNames: Object.keys(SPECIES),
    normalizeSpecies: normalizeSpecies
  };
})();
