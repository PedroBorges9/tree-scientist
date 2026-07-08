# tree-scientist

Static browser-based tree carbon calculator for Tree Survey Summary workbooks.

The calculator estimates tree-loss carbon and related ecosystem-service metrics from survey data. It is designed to run as a static site on GitHub Pages, but it can also be opened locally from `index.html`.

## Features

- Imports Tree Survey Summary `.xlsx` workbooks or CSV exports.
- Converts girth to DBH using `DBH = girth / pi`.
- Calculates current stored carbon lost using WCC-style biomass components.
- Estimates future sequestration foregone by projecting DBH and height growth.
- Uses validated fcbk broadleaf growth tables for mapped species groups:
  - Oak YC80
  - Beech YC100
  - SAB YC120
  - Poplar YC160
- Keeps generic growth fallbacks for species without validated growth-table mappings.
- Estimates rainfall interception, avoided runoff, and air pollutant removal.
- Exports a CSV report with summary sections and detailed per-tree calculations.
- Runs entirely in the browser; no server is needed for the calculator itself.

## How To Use

Open the hosted GitHub Pages site, or open `index.html` locally in a modern browser.

1. Import a Tree Survey Summary workbook using **Import Excel workbook**.
2. Set the default age class, condition, and location before import if needed.
3. Review imported rows in the survey table.
4. Open **Config** only if assumptions need changing.
5. Review **Results** at the top of the page.
6. Use **Export CSV** to download the report.

The calculator starts with no tree rows and zero results. Manually added rows do not contribute to totals until DBH/girth, height, and count are entered.

## Expected Input

The expected Tree Survey Summary columns are:

- `Survey Observation No.`
- `Girth (m)`
- `Spread (m)`
- `Height (m)`
- `Species`

For Excel workbooks matching the provided survey format, the importer reads:

- Column B: observation number
- Column C: girth
- Column D: spread
- Column E: height
- Column F: species

Rows with missing or zero girth/height are ignored. Stumps and deceased trees are excluded from living-tree biomass totals.

## Expected Outputs

The on-page Results view shows:

- Total trees
- Stored carbon lost
- Total carbon impact
- Financial carbon value
- Assessment period
- Tree Loss Schedule
- Carbon Assessment
- Carbon Valuation
- Ecosystem Services Assessment

The CSV export includes:

- Results summary
- Tree Loss Schedule by species
- Carbon stored lost
- Future sequestration foregone
- Total carbon impact
- Carbon valuation
- Rainfall interception
- Avoided runoff
- Air pollutant removal
- Detailed per-tree calculations
- Growth source used for each row
- Projected DBH and height values

## Calculation Notes

Current stored carbon is calculated from estimated biomass:

- Stem biomass uses estimated stem volume multiplied by nominal specific gravity.
- Crown and root biomass use DBH-based WCC equations.
- Carbon is biomass multiplied by `0.5`.
- CO2e is carbon multiplied by `44 / 12`.

Future sequestration foregone is estimated by:

1. Projecting DBH and height over the assessment period.
2. Recalculating biomass/carbon at the projected size.
3. Taking the difference between projected and current stored carbon.

Rainfall interception is estimated as:

```text
canopy area x annual rainfall x species-group interception factor
```

Avoided runoff uses the expanded screening model by default:

```text
rainfall interception x impervious cover fraction
```

A simple per-tree avoided-runoff fallback is also available in Config.

## Species Growth Data

Validated broadleaf growth data is stored in:

- `data/extracted_growth_tables_draft.csv`
- `src/data.js`

Current mapped groups:

- Oak -> Oak YC80
- Beech -> Beech YC100
- Ash, Sycamore, Alder, Birch, Maple, Elm -> SAB YC120
- Poplar, Willow -> Poplar YC160

Species without validated table mappings use generic fallback rates.

## Reference Material

The `reference/` folder is ignored by Git and is intended for local source documents. Current local references are:

- `reference/WCC_CarbonAssessmentProtocol_V2.0_March2018.pdf`
- `reference/Technical Note Quantifying Tree Loss and Associated Carbon and Financial Impacts.docx`
- `reference/Tree Survey Summary Amended v1.0.xlsx`
- `reference/yield.pdf`
- `reference/fcbk016.pdf`
- `reference/fcbk048_1981.pdf`

Because `reference/` is ignored, these documents are not pushed to GitHub. A fresh clone may not include them.

## Project Layout

- `index.html` - app entry point.
- `assets/css/` - styling.
- `src/` - calculator data, calculations, importing, exporting, and UI wiring.
- `data/` - extracted/validated growth table source data.
- `tests/` - Vitest test suite.
- `scripts/` - Node utility scripts.
- `docs/` - deployment notes.
- `dist/` - portable ZIP package, retained for manual sharing.
- `reference/` - local reference documents and survey examples, ignored by Git.

## Local Development

Install Node dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run TypeScript checks:

```bash
npm run typecheck
```

Build the static site into `build/`:

```bash
npm run build
```

The test suite uses Vitest and TypeScript. The CI workflow runs typecheck, tests, and build on pushes and pull requests.

## Deployment

The active deployment target is GitHub Pages:

- Workflow: `.github/workflows/deploy-pages.yml`
- Setup notes: `docs/github-pages-deployment.md`

The AWS S3/CloudFront workflow is kept as an optional manual deployment path:

- Workflow: `.github/workflows/deploy-aws.yml`
- Setup notes: `docs/aws-deployment.md`
