<script>
  import omit from "lodash/omit";
  import BarChart from "./BarChart.svelte";
  import relation from "./relation";
  import Tooltip from "./Tooltip.svelte";
  import colors from "./utils/colors";
  import YearSwitch from "./YearSwitch.svelte";
  let currentYear = 2018;
  $: currentData = relation[currentYear + "年"].filter(
    (d) => d["年齡層"] !== "總計"
  );
  let tooltip = false;
  let tooltipData;
  let tooltipPosition;
</script>

<style>
  .block {
    display: inline-block;
    width: 30px;
    height: 30px;
  }

  .container {
    position: relative;
  }
</style>

<YearSwitch
  initialYear={2018}
  years={Object.keys(relation)
    .map((k) => k.replace('年', ''))
    .map(Number)}
  on:change={(e) => (currentYear = e.detail.year)}>
  <div class="container" slot="chart">
    {#key currentYear}
      <BarChart
        on:show={(e) => {
          tooltip = true;
          tooltipData = e.detail.data;
          const bbox = e.detail.target.getBoundingClientRect();
          tooltipPosition = { x: bbox.width + 120, y: bbox.top - 150 };
        }}
        on:hide={() => {
          tooltip = false;
        }}
        keys={Object.keys(omit(currentData[0], ['年齡層', '年份', '總計']))}
        xTicks={[0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 7000]}
        yTicks={currentData.map((d) => d['年齡層'])}
        data={currentData} />
    {/key}
    {#if tooltip}
      <Tooltip data={tooltipData} position={tooltipPosition} />
    {/if}
    <ul>
      {#each Object.keys(colors) as c}
        <li>
          <span class="block" style="background-color: {colors[c]}" />
          <span>{c}</span>
        </li>
      {/each}
    </ul>
  </div>
</YearSwitch>
