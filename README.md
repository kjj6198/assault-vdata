# 看見數字背後 · 台灣性侵害統計

English | [繁體中文](README-ch.md)

## What it is

An interactive site in Traditional Chinese for exploring Taiwan's public sexual assault statistics from 2008 to 2025. It shows annual trends, age and gender breakdowns, relationships between victims and offenders, and comparisons across all 22 counties and cities. Charts include data tables, and records are available as CSV or JSON.

The site uses Ministry of Health and Welfare statistics and Ministry of the Interior population data. Recorded victims and reports are separate measures; these statistics do not capture unreported cases.

Built with TanStack Start, React, and Vite+. See [DESIGN.md](DESIGN.md) for design decisions, data sources, methodology, API documentation, and deployment instructions.

## Getting Started

Install Node.js 22.12 or later, then run these commands from the project directory:

```sh
npm ci
npm run dev
```

Open the URL printed in the terminal. The default port is 3000; the server selects another free port if it is occupied.

The verified dataset is included in the repository. Running the site requires no external API, credentials, Python installation, or database server.

To build and preview the production application locally:

```sh
npm run build
npm run preview
```

## Contributing

Open an issue to report a bug or propose a change. For code changes, create a branch, make your changes, and run the checks before opening a pull request:

```sh
npm run check
npm test
npm run build
```

Include a description of the change and how you verified it. Add screenshots for visual changes. Keep chart data tables, keyboard navigation, and reduced-motion support working when changing the interface.

For data changes, follow the [data maintenance instructions](DESIGN.md#rebuild-or-refresh-the-data). Rebuild and verify the snapshot, review source and quality-report changes, and include the source of any correction in your pull request.
