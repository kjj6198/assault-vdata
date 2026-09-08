# Annual data transition audit

Commit audited: `c9b8083`. The user requested year-to-year value transitions in the age chart, extended that request to the other sections, and invoked `$improve-animations`. The requested scope selects the two plans below; implementation can proceed without an additional selection question.

| Order | Plan                                                              | Status | Dependency                         |
| ----- | ----------------------------------------------------------------- | ------ | ---------------------------------- |
| 1     | [Animate chart data changes](001-animate-chart-data-changes.md)   | Done   | Shared preference hook from Plan 2 |
| 2     | [Transition overview and map](002-transition-overview-and-map.md) | Done   | None; distinct source ownership    |

## Recon

React 19 / TanStack Start; Chart.js 4.5.1 canvas charts; Motion 13; Tailwind 4; Radix selects/tabs. Motion lives in StoryMotion, RegionRace, TaiwanMap, DataChart, HeroFacts and the shared CSS/UI primitives. Existing conventions are zero-bounce numeric springs with 0.6s visual duration, short text crossfades, `--ease-out-quart`, `--ease-out-expo`, and app-level MotionConfig reducedMotion="user". This is a calm public data story. Year/filter interactions are occasional comparative exploration; map hover and keyboard navigation are frequent; the race is deliberate user-triggered playback; hero/section entries occur once.

## Vetted findings

| #   | Severity                 | Category                  | Location                                                      | Finding                                                                                                    | Fix                                                           |
| --- | ------------------------ | ------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | High, requested behavior | Interruptibility/cohesion | DataChart.tsx:62–85                                           | `update("none")`, replaced dataset objects and final-only printed labels prevent an old-to-new transition. | Keep identities and animate geometry and labels on one clock. |
| 2   | Medium                   | Cohesion                  | HeroFacts.tsx:103–216; Dashboard.tsx hero totals/gender strip | Counters and graphic proportions switch immediately beside animated numeric details.                       | Reuse numeric animation and animate bounded geometry.         |
| 3   | Medium                   | Cohesion                  | TaiwanMap.tsx:95,124                                          | Base county fills transition but the selected overlay snaps.                                               | Apply matching fill timing to both.                           |

Year-change transitions are an explicitly requested additive opportunity. Preserve final exact tables and raw data. The existing comment prohibiting display interpolation is superseded by that request.

## Coverage across the eight audit categories

| Surface                          | Purpose/frequency        | Easing/duration             | Physicality/origin          | Interruptibility                  | Performance                                          | Reduced motion                | Cohesion               | Missed opportunities   |
| -------------------------------- | ------------------------ | --------------------------- | --------------------------- | --------------------------------- | ---------------------------------------------------- | ----------------------------- | ---------------------- | ---------------------- |
| Shared canvas charts             | Comparative change       | Plan 1                      | Zero baseline preserved     | Plan 1                            | Canvas clock, no React frames                        | Plan 1                        | Plan 1                 | Selected by user       |
| Overview figures/graphics        | Comparative change       | Plan 2                      | Left-origin bars            | Plan 2                            | Transform bounded bars                               | Plan 2                        | Plan 2                 | Selected by user       |
| Existing numeric/text primitives | Appropriate              | House style retained        | Small crossfade             | Springs retarget                  | Motion values                                        | Existing support              | Reused                 | None beyond wiring     |
| County map                       | Hover and annual change  | Plan 2 fill timing          | Deliberate lift retained    | Fill can retarget                 | Small SVG; no observed dropped frames                | Existing lift reduction       | Overlay fix            | Same annual transition |
| County race                      | User-controlled timeline | Intentional existing timing | Origin-left bars            | Existing continuous interpolation | React/frame is a potential cost, no measured failure | Existing stepped reduced mode | Preserve               | None in this scope     |
| Hero/section entry               | One-time orientation     | Intro exemption             | Small offset                | Not retriggered                   | Transform/opacity                                    | Existing alternatives         | Consistent             | None                   |
| Select/menu/button/tabs          | Frequent navigation      | Short existing timings      | Radix origin, pressed state | Normal transitions                | Transform/color                                      | Existing movement alternative | No confirmed blocker   | None                   |
| Anchors, data disclosure, tables | Navigation/exact records | No forced chart animation   | Stable layout               | Native controls                   | Static                                               | Smooth scroll gated           | Exact values preserved | None                   |

No observed frame-rate failure is claimed. Race performance and select exit easing are deliberate existing behavior, outside the selected year-change work. Verification requires recorded intermediate frames and reduced-motion emulation.

## Runtime preference follow-up

The installed `framer-motion/dist/es/utils/reduced-motion/use-reduced-motion.mjs:32` stores `prefersReducedMotion.current` in state without subscribing the component to changes. Its own implementation has a TODO about automatic updates. Plan 2 therefore owns a shared reactive `useReducedMotionPreference` hook built with `useSyncExternalStore` and `matchMedia` change events; Plan 1 uses it as well. This is required to stop an in-flight annual transition when the preference changes while the page is open. It adds a dependency from Plan 1's reduced-motion integration to Plan 2's hook, but not to the rest of Plan 2.

## Intermediate browser evidence

On the live dev server at port 3000, root captured 2025→2024 age-chart frames. The same dataset and category element survived the update. Printed labels moved 3,729 → 3,724 → 3,710 → 3,701 → 3,697 → 3,696; the exact table already contained 3,696. The female gauge concurrently changed from 82.9587% to 82.0368%. A timing mismatch in the old numeric spring prompted the explicit-duration refinement in Plan 2.

## Implementation verification

- After the timing refinement, 2024→2025 totals moved 9,230 → 9,366 → 9,478 → 9,535 → 9,562 → 9,565. The total and gauge were exact at the 650ms capture, including the data request.
- Chart verification covered interrupted reversals, gender and age filters, 32 expanded relationship categories, classification changes around 2018/2019 and 2020/2021, and zero-count categories. Retained categories kept their elements; new categories did not inherit unrelated values.
- The trend selection marker moved through intermediate positions. Relationship overview rows retained category identity while their positions and proportions changed.
- Enabling reduced motion during an active transition stopped chart interpolation, set counters to exact targets and cleared relationship movement. Subsequent reduced-motion changes rendered exact geometry. Short color transitions remain.
- Initial 2008 figures were exact, with no invented previous-year comparison. At 320px, the document remained 320px wide and all chart canvases fit their containers. The primary race and map remained visible. Browser error output was empty.
- All 23 tests and the production build passed. The build reports the existing large-bundle warning. Final checks passed: all 46 files are formatted, with no lint warnings, lint errors or type errors in 35 source files. `git diff --check` passed.
