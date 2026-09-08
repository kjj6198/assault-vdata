# 看見數字背後 · 台灣性侵害統計

A complete replacement for the original Svelte/Snowpack site. Built with **TanStack Start, React 19, Vite+, Tailwind CSS 4, shadcn/ui, Motion, and Chart.js**. The Traditional Chinese data story includes annual trends, age and gender filters, age-by-relationship comparisons, 22-city comparisons, accessible chart tables, and CSV/JSON downloads.

## Run locally

Requires Node **22.12+** (tested with Node 24).

```sh
npm ci
npm run dev
```

Open the URL printed by Vite+ (port 3000 by default; another free port is selected if occupied). The website and API run in the same application. No external API, Python installation, credentials, or database server is needed to run the site: the verified dataset is checked in.

```sh
npm run check   # TypeScript and Vite+ lint
npm test        # Data integrity and API handler tests
npm run build   # Client + SSR + Cloudflare Worker bundle
npm run preview # Run the built Worker locally in workerd
```

Vite+ is the actual development, build, test, lint, and format toolchain (`vite-plus`, with its Vite core alias in npm overrides). Nitro packages the production Cloudflare Worker. The server-only data module validates the checked-in snapshot with Zod. TanStack Start server functions load the selected year; HTTP API routes expose the same records. Chart.js loads on the client after hydration; every chart includes an HTML data table that also works without JavaScript. The year is stored in the URL; unsupported numeric years redirect to the latest available year.

## Deploy

The site deploys to Cloudflare Workers. Nitro's `cloudflare_module` preset emits the Worker entry and generates `.output/server/wrangler.json` from the root `wrangler.json`, so Wrangler needs no separate configuration.

```sh
npx wrangler@latest login
npm run build
npm run deploy
```

Static files under `public/` are served by the `ASSETS` binding; everything else runs in the Worker. The dataset is bundled into the Worker, so no filesystem, KV, or database binding is required. Change `name` in `wrangler.json` to pick the workers.dev subdomain.

Tailwind classes are checked by `oxlint-tailwindcss` through the `lint` configuration in `vite.config.ts`, using `src/styles.css` as the design-system entry point. `npm run check` and `npm run lint` check unknown, duplicate, and conflicting classes, canonical spelling, spacing-scale tokens, and class order. `npm run lint:tw:fix` runs Vite+ lint with `--fix-suggestions` on `src`, including conversions such as `min-h-[50px]` to `min-h-12.5`. Scale suggestions use quarter steps to match Tailwind IntelliSense. Plain `--fix` does not apply these suggestions because spacing tokens depend on the root font size and `--spacing`.

The same lint configuration enables Oxlint's native React Compiler rules as errors, including purity, immutability, refs, state updates, and memoization checks. These run in both `npm run check` and `npm run lint`, alongside the existing React Compiler build transform.

## Sources and coverage

The snapshot downloaded on **2026-09-08 (Asia/Tokyo)** contains **5,722 atomic count records for 2008–2025**. All four datasets cover all 18 years. Counts retain zero values and unknown categories.

| Dataset         | Source                                                                    | Unit    |
| --------------- | ------------------------------------------------------------------------- | ------- |
| `relationships` | [Age × relationship](https://dep.mohw.gov.tw/dops/cp-1303-59308-105.html) | People  |
| `demographics`  | [Age × gender](https://dep.mohw.gov.tw/dops/cp-1303-59309-105.html)       | People  |
| `victims`       | [People by city](https://dep.mohw.gov.tw/dops/cp-1303-59311-105.html)     | People  |
| `reports`       | [Reports by city](https://dep.mohw.gov.tw/dops/cp-1303-59312-105.html)    | Reports |

- `data/raw/`: original XLSX/ODS downloads and source page snapshots. The relationship page currently publishes ODS files; the other three sources provide XLSX.
- `data/sources.json`: source pages, direct attachment URLs, filenames, and SHA-256 hashes for all 11 attachments. The consolidated 2019–2020 relationship release is used instead of counting the overlapping 2019-only attachment again.
- `data/clean.json`: normalized data, source metadata, national totals, and quality notes.
- `data/validation.json`: extraction validation report and known source inconsistencies.

Every atomic record includes `dataset`, Gregorian `year`, nonnegative integer `value`, its dimensions, and `source`, `sheet`, `row`, `column`. Spreadsheet coordinates are **one-based**. Age bands are lower-inclusive and upper-exclusive except the open-ended 65+ band. The files contain aggregated public statistics, not individual case records.

### Interpretation and source discrepancies

Reports and people are distinct measures. The UI calculates shares from exact counts divided by the same-year, same-measure national total (including unknowns), rather than reusing rounded source percentages. These are **shares of recorded cases/people, not population incidence rates**. Reported statistics cannot establish unreported prevalence.

Relationship categories changed in 2019 and 2021. Original leaf labels are preserved; multi-level headers are joined with `／`. Some columns in the 2019–2020 workbook are blank in 2019 and populated in 2020. Those absent observations are omitted, **not converted to zeros**. Gender “其他” is only available from 2019 onward.

The original relationship tables contain **10 inconsistent printed subtotals**:

- 2024: printed age totals for ages 0–<6, 12–<18, and 30–<40 differ from the sums of their cells (269 vs 266; 3,694 vs 3,696; 1,079 vs 1,080).
- 2020: seven printed relationship column totals differ from their constituent cells. Exact categories, published values, calculated values, and source coordinates are recorded in the quality report.

The website aggregates the original atomic cells. It does not alter them to match inconsistent margins. National totals and age totals computed from the atomic data agree across the three people-based sources in all 18 years. Quality notes appear in the page for the selected year and in both API responses. The four requested sources do not include incident-location categories; the old site's unsupported location chart has been replaced by sourced analyses.

## Rebuild or refresh the data

Python 3.10+ and `curl` are needed only for data maintenance.

```sh
python -m venv .venv
.venv/bin/pip install -r scripts/requirements.txt
npm run data:build   # Rebuild offline from the checked-in spreadsheets
npm run data:verify  # Independent cell verification; Python standard library only
```

To fetch current ministry attachments, run `npm run data:fetch`, then rebuild and verify. Review data/source/quality diffs before adopting an updated snapshot. `data:fetch` downloads current attachments again and records new checksums; source layout changes may require updating the extractor. `data:build` rejects invalid counts, duplicate identities, broken national totals, and missing dataset coverage. It writes output only after completing its checks. Source margin discrepancies remain explicit quality notes; inspect any newly introduced notes.

The independent verifier opens XLSX/ODS ZIP archives and reads their XML directly, without using the extraction libraries. It compares every normalized record to its precise original cell and verifies every attachment checksum. Tests also lock representative source values, coverage, unavailable-category handling, and known discrepancy behavior.

## HTTP API

```text
GET /api/v1/meta
GET /api/v1/data
GET /api/v1/data?year=2025&dataset=victims
GET /api/v1/data?year=2025&dataset=reports&city=臺北市
GET /api/v1/data?year=2025&format=csv
```

| Parameter | Values                                                |
| --------- | ----------------------------------------------------- |
| `year`    | Four-digit available year, 2008–2025 in this snapshot |
| `dataset` | `demographics`, `relationships`, `victims`, `reports` |
| `city`    | Exact source city name; valid only for city datasets  |
| `format`  | `json` (default), `csv`                               |

Omitted filters select all records. Invalid values and unknown query parameters return HTTP 400. JSON contains `schemaVersion`, `count`, `records`, `sources`, and `qualityNotes`. Metadata lists coverage, source links, quality notes, and measure definitions. CSV uses UTF-8 with BOM, CRLF, quoted fields, and provenance columns; metadata and quality notes remain available through JSON. Responses use a one-hour public cache. No network calls to the ministry are made at runtime.

## Design

Inspired by the clear hierarchy and visual storytelling of the [Nikkei reference](https://www.nikkei.com/telling/DGXZTS00006390R20C23A8000000/): editorial Chinese typography, an OKLCH slate-blue palette with amber accents, numbered chapters, and evidence beside each graphic. The dot matrix represents the selected year's share of people under 18, rounded to the nearest percentage point. It is not a depiction of individual victims. The summary card also shows each gender’s share and exact count, using all victims as the denominator and preserving other/unknown categories. Nonzero shares below 0.1% display as `<0.1%`.

Button, Select, Tabs, Input, Badge, and Card come from shadcn/ui, with Radix keyboard/focus behavior. `scripts/build_theme.mjs` generates semantic Tailwind tokens and the matching Canvas palette. Run `npm run theme:build` to verify sRGB gamut and WCAG/APCA text contrast; results are recorded in `data/color-validation.json`. The choropleth uses a fixed six-step OKLCH lightness ramp.

Motion for React handles chapter headings entering the viewport once and short annual-number transitions. CSS handles the hero entrance, select popovers, and button press feedback. Movement uses transform/opacity, with opacity-only alternatives under `prefers-reduced-motion`. Chart.js animates changes between annual observations; chart tables retain exact values. Map boundaries stay fixed while fills transition. Server-rendered content remains readable without JavaScript.

Browser verification covers the production server, desktop and 390/320px layouts, year navigation, gender and relationship filters, full data tables, region metric/search/sort controls, empty results, JSON/CSV, and invalid URLs.

## Taiwan county map

The county section includes an SVG choropleth generated from real geographic boundaries. All 22 counties/cities join to both measures for all 18 years. Hover, click, keyboard focus/Enter/Space, and a county selector reveal exact counts, national share, and count ranking. The original searchable numeric list remains below the map.

Geography is the Ministry of the Interior / National Land Surveying and Mapping Center's [county boundaries dataset](https://data.gov.tw/dataset/7442), redistributed by [Taiwan Atlas](https://github.com/dkaoster/taiwan-atlas), pinned to **2021.9.20**. `data/geo/source.json` records direct downloads and SHA-256 hashes. Original TopoJSON and the redistribution's MIT license are included under `data/geo/`. All statistical years use this boundary snapshot; this is not a reconstruction of historical boundaries.

`npm run geo:build` converts the checked-in TopoJSON into downloadable geographic GeoJSON at `/geo/taiwan-counties.geojson` and precomputed display paths. D3 Geo and TopoJSON Client are build-time dependencies only. The display uses the source's `mercatorTw` composite projection: Penghu, Kinmen, Lienchiang, and Wuqiu use inset areas with displaced positions, explicitly labeled on the map. Coordinates in the downloaded geographic GeoJSON remain longitude/latitude.

The sequential green scale uses fixed count thresholds across years and metrics: 0–99, 100–299, 300–599, 600–999, 1,000–1,499, and 1,500+. Darker means a higher count, not a higher population incidence rate. County names normalize 台 to 臺 to match the MOHW statistics. Unavailable data would use a distinct gray fill instead of the zero-count color.

## Population-adjusted comparisons

The county section defaults to reported records per 100,000 residents, using each selected year's **year-end registered population** from the [Ministry of the Interior household registration annual tables](https://www.ris.gov.tw/info-popudata/app/awFastDownload/toMain_panel). This is a crude ratio of recorded victims or reports, not an estimate of unreported incidence or an age-standardized rate. The year-end denominator is an explicit approximation of population exposure during the year.

`data/population/counties-age-sex.ods` preserves the official workbook. `data/population/clean.json` contains 396 county-year observations for 2008–2025, source SHA-256, cell coordinates, original administrative areas, and national totals. The build checks sex subtotals, all 22 counties and national reconciliation in every year. Before the municipal mergers, Taichung, Tainan and Kaohsiung county/city populations are combined; Taipei County and Taoyuan County are renamed to match the statistics. Run `npm run population:fetch` to refresh the workbook and rebuild, or `npm run population:build` to reproduce the snapshot offline.

Formula: `count / yearEndPopulation * 100000`. The rate view uses six fixed OKLCH color bins with boundaries 25, 35, 45, 60 and 80 per 100,000, selected to distinguish the observed 2008–2025 distribution. Zero has a separate white fill. Bar lengths are linear from zero. The upper bound rounds the maximum rate across all 22 counties for the selected year/metric up to the next multiple of 25, with a minimum of 25. The UI labels this range, which is unaffected by search or sort. Color boundaries stay fixed across years. Absent population produces an unavailable rate and gray map fill. Labels, ranking and downloads use the original, untransformed rate. Small populations may produce volatile ratios. The original count view remains available with its linear bars and fixed count bins.

The county race displays the top ten counties from 2019 onward. During playback, counts and populations interpolate between annual observations, using a fixed bar scale across the race period. These intermediate values are animation frames, not recorded observations. Pausing or moving the year slider displays exact annual data. Reduced-motion playback steps through exact yearly observations and responds to preference changes without a reload.

`GET /api/v1/regions?year=2010&dataset=victims&format=json` returns counts, matched populations, unrounded rates and provenance. Supports `year`, `dataset=victims|reports`, `city`, and `format=json|csv`; omitted year returns all years, omitted dataset uses victims. Invalid queries return 400. The county CSV download now includes population and rate fields. Existing `/api/v1/data` remains compatible.
