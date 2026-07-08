Tree Carbon Calculator

How to run
1. Unzip the folder.
2. Open index.html in a modern web browser.
3. Import a Tree Survey Summary .xlsx file or a CSV exported from Excel.

Expected survey columns
- Survey Observation No.
- Girth (m)
- Spread (m)
- Height (m)
- Species

Notes
- Keep index.html, assets/, src/, and data/ together. The calculator code is split across several JavaScript files.
- The portable ZIP is in dist/.
- Local source PDFs, Word documents, and workbook examples can be kept in reference/; that folder is not pushed to GitHub.
- Girth is converted to DBH using DBH = girth / pi.
- Carbon stored lost is calculated from WCC biomass allocation and carbon conversion.
- Future sequestration foregone uses projected DBH/height growth by default, then recalculates WCC biomass/carbon at the projected size.
- Broadleaf DBH and height growth use the validated fcbk016 tables for Oak YC80, Beech YC100, SAB YC120, and Poplar YC160 where the species maps to those groups.
- SAB is used for Ash, Sycamore, Alder, Birch, Maple, and Elm. Poplar is used for Poplar and Willow.
- Conifer height growth uses Forest Yield Appendix 2 top-height increments where the species maps to a table; conifer DBH growth uses the species-group fallback.
- Species without a validated fcbk mapping use species-group fallback DBH and height growth.
- Total carbon impact is carbon stored lost plus future sequestration foregone.
- Rainfall interception is estimated from canopy area, annual rainfall, and species-group interception factors.
- Canopy area is calculated from spread as pi x (spread / 2)^2.
- Expanded avoided runoff is estimated as rainfall interception x impervious cover fraction.
- The simple avoided runoff fallback is living tree count x m3/tree/year.
- Results are calculated in the browser; no internet connection or server is required.
- Export CSV includes the results sections and detailed tree calculations, including the growth source used for each tree.
