<script>
  import omit from "lodash/omit";
  import PlaceChart from "./PlaceChart.svelte";
  import YearSwitch from "./YearSwitch.svelte";
  import RankingTable from "./RankingTable.svelte";
  import chartConfig from "./store/chartConfig";
  import API from "./API.svelte";
  let place = [];
  let currentYear = 2018;
  let data;

  let ranking = [];

  $: data = place.find((p) => p["年份"] === currentYear.toString());
  $: {
    const obj = {};
    Object.keys(omit(data, ["年份"])).forEach((k) => {
      obj[k] = parseInt(data[k].replace(",", ""), 10);
    });

    ranking = Object.keys(obj)
      .map((key) => {
        return [key, obj[key]];
      })
      .sort((a, b) => b[1] - a[1]);
  }

  $: sum = ranking.reduce((acc, cur) => (acc = acc + cur[1]), 0);

  const config = [
    { name: "場所", accessor: (d) => d[0], align: "center", width: "50%" },
    { name: "案件數", accessor: (d) => d[1], align: "right", type: "number" },
    {
      name: "佔總案件比",
      accessor: (d) => `${Math.round((d[1] / sum) * 100)}%`,
      align: "right",
    },
  ];
</script>

<API
  on:loaded={(e) => {
    place = e.detail.data;
  }}
  api={() => fetch('https://vdata.kalan.dev/api/v1/data/sexual_assault/place')}>
  {#if place.length > 0 && data}
    <YearSwitch
      initialYear={currentYear}
      years={place.map((d) => +d['年份'])}
      on:change={(e) => (currentYear = e.detail.year)} />
    <PlaceChart
      fillColor="var(--main)"
      barHeight={10}
      yTicks={Object.keys(omit(place[0], ['年份']))}
      xTicks={$chartConfig.placeChart.xTicks}
      {data} />
    <RankingTable
      caption={currentYear}
      headers={config}
      data={ranking.slice(0, 10)} />
  {/if}
</API>
