# 001 · Animate chart changes from the displayed data

- Commit: c9b8083
- Severity: HIGH for the explicitly requested year-change behavior
- Category: Interruptibility and cohesion
- Estimated scope: DataChart.tsx and, only if useful, one chart motion helper and focused tests
- Status: Implemented and browser verified in DataChart.tsx.

## Problem and evidence

In `/home/kalan/orca/workspaces/assault-vdata/ribboneel/src/components/DataChart.tsx:62`, the effect assigns `chart.data.datasets = toDatasets(latest.current, type)` and calls `chart.update("none")`. Initial options at line 116 set `animation: false`. Line 84 draws values directly from the final React props. Enabling animation alone would still recreate Chart.js dataset controllers, animate from zero, and print final values beside intermediate bars.

The user explicitly requests transitions instead of instant swaps, including other sections. That supersedes the current comment intentionally forbidding interpolation. Animate the display only; HTML tables, accessible descriptions, tooltips and exports keep exact selected-year observations.

## Target

Use a 600ms `easeOutQuart` Chart.js transition, with no bounce and no loading entrance. This matches the existing numeric spring's 0.6s visual duration in `src/components/StoryMotion.tsx`. Long bars can cross most of a 700px plot; the audit permits longer durations for substantial travel, and this steep curve responds promptly. Changes must retarget from the current frame. Keep rounded 6px bars, printed end labels, selection markers, colors and layout.

Use the shared reactive `useReducedMotionPreference` hook from `src/lib/use-reduced-motion.ts` (owned by Plan 2). The installed Motion hook does not subscribe components to preference changes. Reduced mode must immediately show the exact target and stop any in-flight animation. First render is exact and static. A callback-only rerender must not restart chart movement.

## Implementation steps

1. Keep dataset object/controller identity for updates. Assign new fields to existing dataset objects instead of replacing every object.
2. Preserve category identity. Reordered relationship labels should follow their original category rather than inherit a different category's value. Seed newly introduced categories appropriately; never treat an absent category as a previous recorded zero in data tables.
3. Animate both geometry and printed numeric labels with one Chart.js animation clock. A viable mechanism is the public `Animations` export from the already dynamically imported `chart.js/auto`: animate a typed `{ value: number }` object per series/category with `{ value: { type: "number", duration: 600, easing: "easeOutQuart" } }`; register these before the chart update, and read them in `afterDatasetsDraw`. Keep retained objects so rapid updates retarget. Chart.js drives its own RAF, so do not set React state every frame.
4. Do not compute printed values from pixel lengths using the new axis maximum: scale changes would make them wrong. Round only when formatting for display.
5. The selected-year line-chart marker should move between points if practical without changing the full historic series. Do not remount the canvas or replay an entrance on year navigation.
6. Clean up animations with chart destruction. Handle lazy import cancellation, changed label counts, zeros, and filter changes.

## Boundaries

Own `src/components/DataChart.tsx` only, plus a focused chart helper/test if necessary. Another executor owns summary components, Dashboard, StoryMotion, TaiwanMap and styles. Do not alter raw data, URLs, page layout, chart race, filters, downloads, or exact tables. No new dependency. Do not commit.

## Verification

- Run the repository type-aware lint for owned files and targeted meaningful tests if a pure helper is introduced.
- In the existing development server on port 3000, change 2025→2024 in the age chart; the 12–<18 bar must shrink from 3,729 toward 3,696, and its printed number must pass through intermediate values instead of switching immediately. Verify source values against the table rather than trusting these illustrative numbers if the snapshot differs.
- Sample real canvas drawings or record the browser and inspect the first frame, an intermediate frame, and the settled frame. The first frame must retain the previous value, intermediate values must move monotonically, and the final frame must match the exact table.
- Switch years again mid-animation and verify continuity, including a reversal.
- Exercise gender, relationship age, all-relationships expansion, changed classifications around 2018/2019 and 2020/2021, and a zero-count category.
- Emulate reduced motion and verify immediate exact updates with no remaining RAF interpolation.
- Keep initial SSR and hydration readable. Do not claim a feel check based only on compilation.

## Result

Implemented without new dependencies. Actual canvas frames confirmed old, intermediate and exact final values, retained dataset/category identity, continuous mid-animation reversal, filtered and expanded relationship updates, classification changes, zero bars and a moving trend marker. Live reduced-motion changes stopped an active draw and subsequent changes rendered one exact frame. See the index for combined validation.
