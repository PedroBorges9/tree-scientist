import { beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type AssessmentRow = {
  observation?: string;
  species: string;
  girth?: number;
  dbh: number;
  height: number;
  spread: number;
  ageClass: string;
  condition: string;
  location: string;
  count: number;
};

type Assumptions = {
  carbonPrice: number;
  assessmentYears: number;
  futureSequestrationModel: string;
  annualRate: number;
  annualDbhGrowthCm: number;
  annualHeightGrowthM: number;
  yieldClass: number;
  broadleafFormFactor: number;
  coniferFormFactor: number;
  annualRainfallMm: number;
  broadleafRainfallInterceptionFactor: number;
  coniferRainfallInterceptionFactor: number;
  unknownRainfallInterceptionFactor: number;
  runoffModel: string;
  imperviousCoverFraction: number;
  runoffRate: number;
  pollutionRate: number;
};

declare global {
  interface Window {
    CarbonCalculations: {
      girthToDbhCm: (girthM: number) => number;
      calculateAssessment: (rows: AssessmentRow[], assumptions: Assumptions) => any;
    };
    CarbonExporter: {
      buildCsv: (state: any) => string;
    };
    CarbonData?: unknown;
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadScript(relativePath: string): void {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  Function(source)();
}

const assumptions: Assumptions = {
  carbonPrice: 273,
  assessmentYears: 25,
  futureSequestrationModel: "projected-growth",
  annualRate: 0.0085,
  annualDbhGrowthCm: 0.35,
  annualHeightGrowthM: 0.12,
  yieldClass: 12,
  broadleafFormFactor: 0.45,
  coniferFormFactor: 0.50,
  annualRainfallMm: 800,
  broadleafRainfallInterceptionFactor: 0.22,
  coniferRainfallInterceptionFactor: 0.32,
  unknownRainfallInterceptionFactor: 0.20,
  runoffModel: "expanded",
  imperviousCoverFraction: 0.255,
  runoffRate: 1.37,
  pollutionRate: 0.10
};

function tree(overrides: Partial<AssessmentRow> = {}): AssessmentRow {
  return {
    observation: "T1",
    species: "Oak",
    girth: 1.32,
    dbh: 42,
    height: 18,
    spread: 10,
    ageClass: "mature",
    condition: "good",
    location: "Site",
    count: 1,
    ...overrides
  };
}

function calculate(rows: AssessmentRow[], overrides: Partial<Assumptions> = {}) {
  return window.CarbonCalculations.calculateAssessment(
    rows,
    { ...assumptions, ...overrides }
  );
}

beforeEach(() => {
  globalThis.window = {} as Window & typeof globalThis;
  loadScript("src/data.js");
  loadScript("src/calculations.js");
  loadScript("src/exporter.js");
});

describe("tree carbon calculations", () => {
  it("returns zero totals when there are no tree rows", () => {
    const assessment = calculate([]);

    expect(assessment.totals.totalTrees).toBe(0);
    expect(assessment.totals.stored).toBe(0);
    expect(assessment.totals.future).toBe(0);
    expect(assessment.totals.impact).toBe(0);
    expect(assessment.totals.value).toBe(0);
    expect(assessment.schedule).toHaveLength(0);
  });

  it("converts girth to DBH", () => {
    expect(window.CarbonCalculations.girthToDbhCm(Math.PI)).toBeCloseTo(100, 6);
  });

  it("calculates positive current, future, and total carbon impact", () => {
    const assessment = calculate([tree()]);

    expect(assessment.totals.stored).toBeGreaterThan(0);
    expect(assessment.totals.future).toBeGreaterThan(0);
    expect(assessment.totals.impact).toBeCloseTo(
      assessment.totals.stored + assessment.totals.future,
      6
    );
    expect(assessment.totals.value).toBeCloseTo(
      assessment.totals.impact * assumptions.carbonPrice,
      6
    );
  });

  it("uses validated broadleaf growth tables for mapped species", () => {
    const assessment = calculate([
      tree({ species: "Oak" }),
      tree({ species: "Ash", dbh: 28, height: 14, spread: 7 }),
      tree({ species: "Poplar", dbh: 35, height: 20, spread: 9 })
    ]);

    expect(assessment.results[0].growthSource).toMatch(/Oak YC80/);
    expect(assessment.results[1].growthSource).toMatch(/SAB YC120/);
    expect(assessment.results[2].growthSource).toMatch(/Poplar YC160/);
  });

  it("falls back for broadleaf species without validated table mapping", () => {
    const assessment = calculate([tree({ species: "Cherry", dbh: 25, height: 12, spread: 6 })]);

    expect(assessment.results[0].growthSource).toBe("species-group fallback");
  });

  it("keeps stump and deceased tree rows out of living biomass totals", () => {
    const assessment = calculate([
      tree({ species: "Stump" }),
      tree({ species: "Deceased Tree" })
    ]);

    expect(assessment.totals.totalTrees).toBe(0);
    expect(assessment.totals.stored).toBe(0);
    expect(assessment.totals.future).toBe(0);
    expect(assessment.schedule).toHaveLength(0);
    expect(assessment.results.every((row: any) => row.excluded)).toBe(true);
  });
});

describe("ecosystem service calculations", () => {
  it("uses expanded avoided runoff as rainfall interception times impervious cover", () => {
    const assessment = calculate([tree({ spread: 10 })], {
      runoffModel: "expanded",
      imperviousCoverFraction: 0.25
    });

    expect(assessment.totals.runoff).toBeCloseTo(assessment.totals.rainfall * 0.25, 6);
  });

  it("uses simple avoided runoff fallback when selected", () => {
    const assessment = calculate([tree({ count: 3 })], {
      runoffModel: "simple",
      runoffRate: 1.5
    });

    expect(assessment.totals.runoff).toBeCloseTo(4.5, 6);
  });
});

describe("CSV export", () => {
  it("exports results without legacy 5.x section labels", () => {
    const assessment = calculate([tree()]);
    const csv = window.CarbonExporter.buildCsv(assessment);

    expect(csv).toContain('"Tree Loss Schedule"');
    expect(csv).toContain('"Carbon Assessment"');
    expect(csv).toContain('"growth_source"');
    expect(csv).toContain("Oak YC80");
    expect(csv).not.toContain("5.A");
    expect(csv).not.toContain("5.B");
    expect(csv).not.toContain("5.C");
    expect(csv).not.toContain("5.D");
  });
});
