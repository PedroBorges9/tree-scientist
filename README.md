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
