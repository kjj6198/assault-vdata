<script>
  import data from "./data";
  import YearSwitch from "./YearSwitch.svelte";
  import HorizontalBarChart from "./HorizontalBarChart.svelte";
  import { onMount } from "svelte";
  let count = 0;
  let currentYear = 2019;

  $: currentYearData = data.result[currentYear.toString()];

  onMount(() => {
    const interval = setInterval(() => count++, 1000);
    return () => {
      clearInterval(interval);
    };
  });
</script>

<YearSwitch
  initialYear={2019}
  years={[2015, 2016, 2017, 2018, 2019]}
  on:change={(e) => (currentYear = e.detail.year)}>
  <div class="container" slot="chart">
    <HorizontalBarChart
      xTicks={currentYearData
        .sort((a, b) => b['合計'] - a['合計'])
        .map((d) => d['縣市'])}
      yTicks={[0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800]}
      data={currentYearData}
      accessor={(d) => d['合計']} />
  </div>
</YearSwitch>
