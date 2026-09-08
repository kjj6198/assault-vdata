# 002 · Make annual transitions consistent across the story

- Commit: c9b8083
- Severity: MEDIUM
- Category: Cohesion and missed opportunities
- Estimated scope: HeroFacts.tsx, Dashboard.tsx, StoryMotion.tsx if needed, TaiwanMap.tsx and styles.css
- Status: Implemented and browser verified across the overview, numeric primitives, gender breakdown and map.

## Problem and evidence

In `/home/kalan/orca/workspaces/assault-vdata/ribboneel/src/components/HeroFacts.tsx`, annual-change numbers, the top county's name/rate, gender and minor percentages, and relationship values render directly from props. Examples include `formatRate(topCity.rate)` at line 105, `strokeDasharray` at line 137, `fixed1(femaleShare)` at line 152, and an immediate `width` on relationship bars at line 216. The Dashboard's hero totals use `num(...)`, and its gender strips change width instantly. Existing numeric details in `StoryMotion.tsx:68` already animate through a zero-bounce spring with `visualDuration: 0.6` and respect reduced motion.

In `TaiwanMap.tsx:95`, base county fills transition for 400ms. The overlaid selected county at line 124 has no fill transition, so its fill jumps while the rest change. Map numeric details already use AnimatedNumber.

## Target

Use the existing AnimatedNumber/AnimatedValue primitives for changing labels and counts. Numeric values use an explicit 600ms tween with `ease(t) = 1 - (1 - t) ** 4` and no bounce, following the measured timing refinement below. Annual data graphics use 600ms `var(--ease-out-quart)`, the existing `cubic-bezier(0.25, 1, 0.5, 1)` token. This duration matches long chart bars and lets the reader track change. Initial content must remain exact and static; never count up from zero on page load.

Reduced motion: exact numeric/geometry updates, with only a short 120ms color or opacity transition where meaningful. No slides, scaling or gauge drawing under reduce. Match the selected overlay's fill transition to the base map at 600ms without replaying county lift on year changes.

## Steps

1. Use AnimatedNumber for hero victim/report totals, selected trend total, all numeric HeroFacts values and shares. Preserve decimals, plus/minus signs, units and missing-value text. Animate changing category/county labels with existing AnimatedValue, not remounting their whole card.
2. Animate the female-share gauge's stroke dash array or offset from the currently displayed proportion over 600ms. Add reduced-motion handling. Ensure the number and gauge target the same selected year's percentage.
3. Animate the under-18 waffle's changing cells with short color/opacity transitions. Do not make 100 independently bouncing/scaling elements or set React state each frame.
4. Change relationship mini bars to full-width elements with left-origin scaleX transforms, with 600ms transitions and reduced-motion geometry updates. Preserve category identity on reordering. Use layout animation on the small ranking only if needed to move persistent categories; no stagger.
5. Change the Dashboard gender strip to absolutely positioned full-width segments with `translateX(start%) scaleX(share/100)`, left transform origin and 600ms transitions. Use the existing rounded clipped parent, keeping all categories and exact percentages. Do not animate layout width every frame. Preserve existing small values and unknown categories.
6. Give overview timeline selection and mini-map fills a shared color transition. Historic bars do not change counts when selecting a year, so only their selection color changes.
7. Give base/selected map fills matching 600ms transitions. Preserve the current shape, hover lift, pointer and keyboard handlers; do not animate geographic geometry. Already-animated map counts inherit existing AnimatedNumber behavior.

## Boundaries

Another executor owns DataChart.tsx. Preserve the chart race, its prominent always-visible section, and the prominent always-visible map. Do not redesign layout, add loading skeletons, change exact table values, data aggregation, APIs, or downloads. No new dependencies and no commits.

There are fresh user edits to Dashboard.tsx after c9b8083, mostly formatting but potentially more. Read the current file and diff, then make surgical edits without restoring the committed version. Avoid blanket reformatting unrelated code. Do not remove any user edits.

## Verification

- Typecheck/lint owned source files, then let the coordinator schedule the combined repository check/build once both executors finish.
- At the existing localhost:3000 page, compare at least two years with a large change. Record or sample intermediate hero totals, gender strip transforms, gauge stroke values, relationship mini bars and map fills.
- Trigger a second year change while motion is running: values and geometry must retarget rather than reset from zero or flash.
- Test reduced motion and verify every touched moving visual stops interpolating; color may crossfade 120ms.
- Verify first load shows selected-year figures immediately, 2008 has no invented previous-year comparison, 2018/2019 genders handle unavailable categories, and 320px layout still fits.
- Numeric table/export values remain final observations throughout the visual transition. Report actual browser evidence; do not infer smoothness only from the code.

## Measured timing refinement

Root browser sampling of 2025→2024 showed the original 0.6s visual-duration spring still printed 9,243 at 658ms and 9,231 at 1008ms while the chart and gauge had reached their targets. The exact total is 9,230. Replace AnimatedNumber's spring with an interruptible 600ms Motion-value tween using `ease(t) = 1 - (1 - t) ** 4`, the Chart.js `easeOutQuart` function. Start from the current Motion value, stop old controls during retarget/cleanup, initialize at the exact supplied value, and jump immediately under reduced motion. This preserves the intended duration while removing the measured asymptotic tail. The concurrent user-added AnimatedDigits primitive is outside this change and must remain intact.

## Result

Implemented with a shared reactive media-query hook. Numeric frame captures now reach exact targets with the chart and gauge. Browser checks confirmed proportion changes, persistent relationship rows moving to new positions, live reduced-motion interruption, exact initial 2008 data, 2018/2019 gender availability and stable colors, and a fitting 320px layout. The installed Motion projection implementation retains its initial layout option, so relationship rows keep `layout="position"`; reduced motion uses zero duration and a scoped CSS transform override to clear an in-flight projection immediately. See the index for combined validation.
