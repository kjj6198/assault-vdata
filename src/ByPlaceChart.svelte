<script>
  import omit from "lodash/omit";
  import place from "./place";
  import PlaceChart from "./PlaceChart.svelte";
  import YearSwitch from "./YearSwitch.svelte";
  let currentYear = 2018;

  $: data = place.find((p) => p["年份"] === currentYear.toString());
</script>

<YearSwitch
  initialYear={currentYear}
  years={place.map((d) => +d['年份'])}
  on:change={(e) => (currentYear = e.detail.year)} />
<PlaceChart
  yTicks={Object.keys(omit(place[0], ['年份']))}
  xTicks={[0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 3000, 4000, 4500]}
  {data} />
