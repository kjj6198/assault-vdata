<script>
  import omit from "lodash/omit";
  import pick from "lodash/pick";
  import BarChart from "./BarChart.svelte";
  import RankingTable from "./RankingTable.svelte";
  import relation from "./relation";
  import Tooltip from "./Tooltip.svelte";
  import colors from "./utils/colors";
  import step from "./utils/step";
  import YearSwitch from "./YearSwitch.svelte";
  let currentYear = 2018;

  $: currentData = relation[currentYear + "年"].filter(
    (d) => d["年齡層"] !== "總計"
  );

  let selected = [];
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

  .capsule {
    display: inline-block;
    padding: 8px 16px;
    background: none;
    border: 2px solid;
    border-radius: 20px;
    margin-right: 8px;
    margin-bottom: 8px;
  }
  .active {
    color: var(--white);
  }
</style>

<YearSwitch
  initialYear={2018}
  years={Object.keys(relation)
    .map((k) => k.replace('年', ''))
    .map(Number)}
  on:change={(e) => (currentYear = e.detail.year)}>
  <div class="container" slot="chart">
    {#each Object.keys(omit(currentData[0], ['年齡層', '年份', '總計'])) as key}
      <button
        style="border-color: {colors[key]}; background-color: {selected.includes(key) ? colors[key] : '#ffffff'};"
        class="capsule"
        class:active={selected.includes(key)}
        on:click={() => {
          const idx = selected.findIndex((s) => s === key);
          if (idx >= 0) {
            selected = selected.filter((s) => s !== key);
          } else {
            selected = selected.concat([key]);
          }
        }}>{key}</button>
    {/each}
    {#key currentYear}
      <BarChart
        {selected}
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
        xTicks={step(0, 7000, 1000)}
        yTicks={currentData.map((d) => d['年齡層'])}
        data={currentData} />
    {/key}
    {#if tooltip}
      <Tooltip data={tooltipData} position={tooltipPosition} />
    {/if}
  </div>
</YearSwitch>
