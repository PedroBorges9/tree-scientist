# tree-scientist
Tree carbon calculator and more

Static browser-based tree carbon calculator for Tree Survey Summary workbooks.

## Project layout

- `index.html` - app entry point.
- `assets/css/` - styling.
- `src/` - calculator data, calculations, importing, exporting, and UI wiring.
- `data/` - extracted/validated growth table source data.
- `dist/` - portable ZIP package.
- `reference/` - local reference documents and survey examples, ignored by Git.

Open `index.html` in a browser to run the calculator.

## Deployment

The active deployment target is GitHub Pages. See `docs/github-pages-deployment.md`.

The AWS S3/CloudFront workflow is kept as an optional manual deployment path in `docs/aws-deployment.md`.

## Tests

Install Node dependencies:

```bash
npm install
```

Run the calculator tests:

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

The test suite uses Vitest and TypeScript. The CI workflow runs typecheck, tests, and build on pushes and pull requests. The GitHub Pages deployment also runs them before publishing.
