<script>
  import { scaleLinear } from "d3-scale";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import TaiwanMap from "./TaiwanMap.svelte";
  import YearSwitch from "./YearSwitch.svelte";
  import data from "./data";
  import MapTooltip from "./MapTooltip.svelte";
  let currentYear = 2019;
  let tooltipStatus = "closed";
  let currentCity = "";
  $: currentData = data.result[currentYear.toString()];

  let offset = tweened(0, {
    duration: 400,
    easing: cubicOut,
  });

  $: colorScale = scaleLinear()
    .domain([
      Math.min(...currentData.map((d) => d["合計"])),
      Math.max(...currentData.map((d) => d["合計"])),
    ])
    .range([93, 24]);
</script>

<style>
  .container {
    position: relative;
  }
</style>

<div class="container">
  <YearSwitch
    initialYear={2019}
    years={[2015, 2016, 2017, 2018, 2019]}
    on:change={(e) => (currentYear = e.detail.year)}>
    <div slot="chart">
      {#key currentYear}
        <TaiwanMap
          transform="translate({$offset}, 0)"
          on:selected={(e) => {
            currentCity = e.detail;
            tooltipStatus = 'opened';
            offset.set(120);
          }}
          color={(d) => {
            const selected = currentData.find((c) => c['縣市'] === d);
            const color = colorScale(selected['合計']);
            return `hsl(214, 77%, ${Math.round(color)}%)`;
          }} />
      {/key}
    </div>
  </YearSwitch>
  {#if tooltipStatus === 'opened'}
    <MapTooltip
      on:close={() => {
        tooltipStatus = 'closed';
        offset.set(0, { delay: 250 });
      }}
      data={currentData.find((c) => c['縣市'] === currentCity)} />
  {/if}
</div>