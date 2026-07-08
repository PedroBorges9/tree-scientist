# GitHub Pages Deployment

This repository deploys the calculator as a static site using GitHub Pages.

## Repository setup

In GitHub, open:

Settings -> Pages

Set:

- Source: `GitHub Actions`

After that, every push to `main` runs `.github/workflows/deploy-pages.yml`.

## Deployment contents

The workflow publishes only the static app files:

- `index.html`
- `assets/`
- `src/`
- `data/`

It does not publish `reference/`, the portable zip, or local source documents.

## Site URL

For this repository, the default Pages URL should be:

`https://pedroborges9.github.io/tree-scientist/`

The first deployment may take a minute or two to become available.
