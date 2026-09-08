The September 8, 2026 audit reduced the production page's JavaScript, HTML, font requests, and ranking animation work. Measurements use the checked-in 2025 dataset, `npm run build`, and Chromium through agent-browser on this Linux machine.

| Payload                                          |   Before |    After | Reduction |
| ------------------------------------------------ | -------: | -------: | --------: |
| All client JavaScript, including deferred charts | 1,387 KB | 1,051 KB |       24% |
| All client JavaScript, gzip                      |   459 KB |   345 KB |       25% |
| HTML document                                    | 1,141 KB |   445 KB |       61% |
| HTML document, gzip                              |   335 KB |   109 KB |       68% |
| Stylesheets, including external font CSS         |   204 KB |    81 KB |       60% |
| Chart.js chunk                                   |   202 KB |   170 KB |       16% |

KB means 1,000 bytes. Gzip figures come from Node's `gzipSync` over emitted files and do not assume that the deployment server enables compression. Before scrolling, the updated page requests 882 KB of JavaScript and leaves all three canvases uninitialized. Each chart starts loading within 300px of the viewport, with its dimensions and HTML data table already present.

The original Google Fonts stylesheet was 122 KB and caused ten Noto Sans TC subsets totaling 684 KB to load. The page already had local LINE Seed TW fonts. The numeric font now falls back to LINE Seed TW for Chinese text, and the same 22 KB Space Grotesk Latin font is hosted locally under its included SIL Open Font License. This removes approximately 806 KB of font CSS and redundant fallback fonts, as well as the external stylesheet request that blocked rendering.

The map previously repeated detailed display paths in the hero, county map, and JavaScript. The map builder now simplifies shared topology arcs once, with a maximum 0.2px deviation before SVG coordinate rounding at the 600px viewBox size. Adjacent counties share the same simplified borders, and tiny closed island rings remain. Display JSON fell from 396 KiB to 100 KiB. Geographic downloads and source checksums retain the original geometry. Dashboard serialization also omits spreadsheet coordinates available through the download API and limits playback history to its displayed 2019 onward range.

Chart.js registers only bar and line controllers, their elements and scales, tooltips, and line fills, following its [integration guidance](https://www.chartjs.org/docs/latest/getting-started/integration.html). It no longer imports `chart.js/auto`. Tailwind scans `src` explicitly. Chart annotations resolve their font outside the drawing callback, and numeric formatting reuses one `Intl.NumberFormat` instance.

Ranking playback previously updated React state every animation frame. It now updates cached DOM references directly, writes row transforms instead of inherited rank variables, skips text updates for hidden rows, and lets React update the year label at year boundaries. Bar transforms track interpolated values directly during playback, avoiding a CSS transition that constantly chases a moving target. Playback suspends when offscreen or when the tab is hidden. Reduced motion advances in whole-year steps. Chapter reveals use native Web Animations with transform and opacity, and the county lift keeps a static shadow instead of animating its blur.

The fixed playback comparison used separate browser sessions without React DevTools instrumentation, the same 1280 × 577 viewport, default rate mode, and the play button centered in view. Both recordings ran for five seconds from 2019 and reached 2021. Statistics include only the renderer main thread between `audit-race-start` and `audit-race-end` marks.

| Five seconds of playback |   Before |  After | Reduction |
| ------------------------ | -------: | -----: | --------: |
| Main-thread task time    | 2,234 ms | 862 ms |       61% |
| Style recalculation time |   277 ms | 102 ms |       63% |
| Layout time              |   238 ms | 148 ms |       38% |
| Paint time               |   483 ms | 197 ms |       59% |

These rows overlap and must not be added together. Live numeric text still requires layout and paint. Neither recording had a main-thread task above 16.7ms within the marked interval. This is a desktop laboratory comparison, not a guarantee of phone GPU performance or field Web Vitals.

Exploratory warm production reloads recorded FCP/LCP at 108ms before and 84ms after, with zero CLS in both. These were single samples, and the updated load trace also contained a 54ms task. They support further investigation but are insufficient to claim a repeatable loading-time improvement. No real phone or Safari was available for this audit.

Validation passed `npm run check`, `npm test` with 27 tests, and `npm run build`. New tests cover map simplification error, endpoints, tiny rings, and compact dashboard data with preserved counts. Browser checks covered initial chart deferral, chart loading on scroll, year navigation, gender and age filters, regional measures and metrics, county selection, keyboard scrubbing, replay, reduced-motion stepping, and a 390 × 844 mobile viewport without horizontal overflow.

Local traces, screenshots, the five-second browser script, and the trace summarizer are saved in `artifacts/performance/`, which is git-ignored. To repeat the playback measurement, start profiling with `agent-browser profiler start`, center the play button, run `race-window.js` through `agent-browser eval --stdin`, and save with `agent-browser profiler stop`. Run `node artifacts/performance/summarize-trace.cjs <trace.json>` to extract the marked interval. Each comparison must start at 2019 with the same viewport and measure.
