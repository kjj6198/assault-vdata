<script>
  import { scaleLinear } from "d3-scale";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import extent from "./utils/extent";
  import TaiwanMap from "./TaiwanMap.svelte";
  import YearSwitch from "./YearSwitch.svelte";
  import taiwanCity from "./constants/taiwanCity";
  import MapTooltip from "./MapTooltip.svelte";
  import Button from "./components/Button.svelte";
  import Api from "./API.svelte";

  let currentYear = 2019;
  let tooltipStatus = "closed";
  let currentCity = "";
  let data = null;
  let currentData = [];

  $: {
    if (data) {
      currentData = data[currentYear.toString()];
    } else {
      currentData = [];
    }
  }

  let offset = tweened(0, {
    duration: 400,
    easing: cubicOut,
  });
  $: console.log(currentData);
  $: colorScale =
    currentData.length > 0
      ? scaleLinear()
          .domain(extent(currentData, (d) => d["合計"]))
          .range([93, 24])
      : null;

  $: scaleLabel = colorScale
    ? [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800].map((n) => [
        n,
        `hsl(214, 77%, ${Math.round(colorScale(n))}%)`,
      ])
    : [];

  function openTooltip(city) {
    currentCity = city;
    tooltipStatus = "opened";
    offset.set(120);
  }
</script>

<style>
  .container {
    position: relative;
  }

  .btn-group {
    margin-bottom: 3em;
  }

  .block {
    position: relative;
    display: inline-block;
    width: 30px;
    height: 30px;
  }

  .block > .scale {
    position: absolute;
    bottom: 100%;
    left: -50%;
    font-size: 0.6rem;
  }
</style>

<div class="container">
  <Api
    api={() => fetch('https://vdata.kalan.dev/api/v1/data/sexual_assault')}
    on:loaded={(e) => (data = e.detail.data)}>
    <YearSwitch
      initialYear={2019}
      years={[2015, 2016, 2017, 2018, 2019]}
      on:change={(e) => (currentYear = e.detail.year)}>
      <div slot="chart">
        <div class="btn-group">
          {#each taiwanCity as city (city)}
            <Button
              style={city === currentCity ? 'filled' : 'primary'}
              onClick={() => openTooltip(city)}>
              {city}
            </Button>
          {/each}
        </div>
        <div class="scale-label">
          {#each scaleLabel as label, idx (label[0])}
            <span class="block" style="background-color: {label[1]}">
              {#if idx % 3 === 0}<span class="scale"> {label[0]} </span>{/if}
            </span>
          {/each}
        </div>
        {#key currentYear}
          <TaiwanMap
            transform="translate({$offset}, 0)"
            on:selected={(e) => {
              openTooltip(e.detail);
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
  </Api>
</div>
