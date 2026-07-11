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
- Growth model indicator for each Tree Loss Schedule species group
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

## Calculation Methodology

The calculation code is in `src/calculations.js`. Species coefficients, WCC biomass equation coefficients, growth groups, and extracted yield tables are in `src/data.js`.

The CSV export includes the main input values, calculated biomass components, stored carbon, future carbon, projected dimensions, and the growth source used for each tree row. Use this export for row-level auditing. The Tree Loss Schedule also includes a high-level growth model indicator:

- `Table/yield model` means the row uses an extracted broadleaf table or Forest Yield table path.
- `Fallback` means the row uses the generic species-group/simple-rate fallback.
- `Mixed` can appear if rows for the same species are calculated with more than one model type.

### Input Normalisation

Survey girth is converted to DBH:

```text
DBH cm = girth m / pi x 100
```

Basal area is calculated from DBH:

```text
DBH m = DBH cm / 100
basal area m2 = pi x DBH m^2 / 4
```

Canopy area is calculated from spread:

```text
canopy area m2 = pi x (spread m / 2)^2
```

Rows without positive girth/DBH, height, and count do not contribute to totals. Stumps and deceased trees are retained as excluded rows but contribute zero living-tree biomass, carbon, rainfall interception, and runoff.

### Current Stored Carbon Lost

Current stored carbon lost is based on estimated whole-tree biomass. The calculator separates biomass into stem, crown, and root components.

Stem volume is estimated from measured dimensions and an editable form factor:

```text
stem volume m3 = basal area m2 x height m x stem form factor
```

The form factor is selected from Config:

- Broadleaf stem form factor
- Conifer stem form factor

Stem biomass is then:

```text
stem biomass t = stem volume m3 x nominal specific gravity
```

Nominal specific gravity comes from the species mapping in `src/data.js`.

Crown biomass uses WCC DBH equations from the selected crown group:

```text
if DBH <= 50 cm:
  crown biomass t = b x DBH^p

if DBH > 50 cm:
  crown biomass t = max(0, a + b x DBH)
```

Root biomass uses WCC DBH equations from the selected root group:

```text
if DBH <= 30 cm:
  root biomass t = b x DBH^2.5

if DBH > 30 cm:
  root biomass t = max(0, a + b x DBH)
```

Total biomass and CO2e are:

```text
biomass t = stem biomass + crown biomass + root biomass
carbon tC = biomass t x 0.5
stored carbon tCO2e = carbon tC x 44 / 12
```

For grouped rows, biomass and stored carbon are multiplied by `count`.

### Future Sequestration Foregone

The default future model is `Projected WCC biomass growth`.

For each tree row:

1. Estimate annual DBH and height growth.
2. Adjust growth by age class, condition, and assessment period.
3. Project DBH and height.
4. Recalculate biomass and stored carbon at the projected dimensions.
5. Take the positive difference between projected CO2e and current CO2e.

```text
growth factor = age factor x condition factor x assessment years

projected DBH cm = current DBH cm + annual DBH growth cm x growth factor
projected height m = current height m + annual height growth m x growth factor

future sequestration foregone tCO2e =
  max(0, projected stored carbon tCO2e - current stored carbon tCO2e)
```

Age factors and condition factors are defined in `src/data.js`.

If the `Simple stored-carbon rate fallback` model is selected, future sequestration is:

```text
future sequestration foregone tCO2e =
  current stored carbon tCO2e
  x annual simple sequestration rate
  x assessment years
  x age factor
  x condition factor
```

### Growth Source Selection

The calculator records the growth source used for each row in the CSV export.

Mapped broadleaf species use extracted and validated Forestry Commission Booklet 16 growth tables:

- Oak -> Oak YC80
- Beech -> Beech YC100
- Ash, Sycamore, Alder, Birch, Maple, Elm -> SAB YC120
- Poplar, Willow -> Poplar YC160

For these tables:

```text
top height ft is converted to metres:
  top height m = top height ft x 0.3048

mean BHQG inches is converted to DBH cm:
  DBH cm = mean BHQG in x 2.54 x 4 / pi
```

The calculator finds the table interval matching the current height where possible, then derives annual DBH and height increments from the interval:

```text
annual DBH growth cm = (next table DBH cm - current table DBH cm) / years between rows
annual height growth m = (next table height m - current table height m) / years between rows
```

Conifers with Forest Yield top-height tables use those tables for height growth and the species-group fallback for DBH growth.

Species without validated table mappings use the generic species-group fallback rates in Config.

### Total Carbon Impact And Valuation

Total carbon impact is:

```text
total carbon impact tCO2e =
  carbon stored lost tCO2e + future sequestration foregone tCO2e
```

Financial carbon value is:

```text
financial carbon value GBP =
  total carbon impact tCO2e x carbon price GBP/tCO2e
```

The carbon price is editable in Config.

### Rainfall Interception

Rainfall interception is based on canopy area, annual rainfall, and species-group interception factors:

```text
rainfall interception m3/year =
  canopy area m2
  x annual rainfall mm/year
  x rainfall interception factor
  / 1000
  x count
```

The `/ 1000` converts millimetres of rainfall over square metres into cubic metres.

The interception factor is selected from Config according to species type:

- Broadleaf
- Conifer
- Unknown species

### Avoided Runoff

The default avoided-runoff model is the expanded screening model:

```text
avoided runoff m3/year =
  rainfall interception m3/year x impervious cover fraction
```

A simple fallback model can be selected in Config:

```text
avoided runoff m3/year =
  count x simple avoided runoff rate m3/tree/year
```

### Air Pollutant Removal

Air pollutant removal is currently a simple per-tree screening estimate:

```text
air pollutant removal kg/year =
  living tree count x air pollutant removal rate kg/tree/year
```

The rate is editable in Config.

### Important Audit Limits

- Stem volume is estimated from DBH, height, and form factor because the WCC biomass equations require total stem volume as an input.
- Species not explicitly listed in source tables are mapped to nearest calculation groups and should be reviewed before formal reporting.
- Rainfall interception, avoided runoff, and air pollutant removal are screening estimates, not full hydrological or air-quality simulations.
- The model is deterministic: the same input rows and Config assumptions produce the same outputs.

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

Check formatting:

```bash
npm run format:check
```

Build the static site into `build/`:

```bash
npm run build
```

The test suite uses Vitest and TypeScript. The CI workflow runs typecheck, formatting checks, tests, and build on pushes and pull requests.

## Code Conventions

See `docs/code-conventions.md`.

## Deployment

The active deployment target is GitHub Pages:

- Workflow: `.github/workflows/deploy-pages.yml`
- Setup notes: `docs/github-pages-deployment.md`

The AWS S3/CloudFront workflow is kept as an optional manual deployment path:

- Workflow: `.github/workflows/deploy-aws.yml`
- Setup notes: `docs/aws-deployment.md`
