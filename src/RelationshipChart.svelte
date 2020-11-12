<script>
  import omit from "lodash/omit";
  import BarChart from "./BarChart.svelte";
  import relation from "./relation";
  import RelationModel from "./models/relation";
  import Tooltip from "./Tooltip.svelte";
  import colors from "./utils/colors";
  import step from "./utils/step";
  import YearSwitch from "./YearSwitch.svelte";
  import RankingTable from "./RankingTable.svelte";
  import chartConfig from "./store/chartConfig";
  import viewport from "./store/viewport";
  let currentYear = 2018;

  $: currentData = relation[currentYear + "年"].filter(
    (d) => d["年齡層"] !== "總計"
  );

  $: model = new RelationModel(currentData);

  let selected = [];
  let tooltip = false;
  let tooltipData;
  let tooltipPosition;

  const headers = [
    { name: "兩造關係", accessor: (d) => d[0], align: "left", width: "30%" },
    {
      name: "案件數 （排除其他與不詳）",
      accessor: (d) => d[1],
      align: "right",
      type: "number",
    },
    {
      name: "比例",
      accessor: (d) => (model.getProbabilityFor(d[0]) * 100).toFixed(2) + "%",
      align: "right",
    },
  ];
</script>

<style>
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

  .spacer {
    padding: 0;
    margin: 50px 0;
    height: 0;
    border: 0;
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
          if ($viewport === 'mobile') {
            tooltipPosition = { x: bbox.width + 80, y: bbox.top - 100 };
          } else {
            tooltipPosition = { x: bbox.width + 120, y: bbox.top - 150 };
          }
        }}
        width={$chartConfig.relationChart.width}
        height={$chartConfig.relationChart.height}
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

<hr class="spacer" />

<YearSwitch
  initialYear={currentYear}
  years={Object.keys(relation)
    .map((k) => k.replace('年', ''))
    .map(Number)}
  on:change={(e) => (currentYear = e.detail.year)}>
  <div slot="chart">
    <RankingTable
      caption="受害者與加害者關係 （{currentYear} 年）"
      {headers}
      data={model.getRanking().slice(0, 10)} />
  </div>
</YearSwitch>
