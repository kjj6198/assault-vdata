<script>
  import { flip } from "svelte/animate";
  import SVG from "./SVG.svelte";
  import { scaleLinear } from "d3-scale";
  export let data;
  export let xTicks;
  export let yTicks;
  let width = 800;
  let height = 400;
  let padding = {
    left: 20,
    bottom: 10,
    top: 10,
    right: 10,
  };

  $: xScale = scaleLinear()
    .domain([0, xTicks.length])
    .range([padding.left, width - padding.right]);

  $: yScale = scaleLinear()
    .domain([0, Math.max(...yTicks)])
    .range([height - padding.top, padding.bottom]);
</script>

<style>
  text {
    font-size: 12px;
  }
  line {
    stroke: #aaa;
    stroke-dasharray: 2;
  }

  rect {
    transition: ease 0.3s all;
  }
</style>

<SVG viewBox="0 0 800 500">
  <g transform="translate({padding.left}, {height - padding.bottom})">
    {#each xTicks as tick, i (tick)}
      <g animate:flip transform="translate({xScale(i)}, 2)">
        <text transform="rotate(90)">{tick}</text>
      </g>
    {/each}
  </g>
  <g transform="translate(0, 0)">
    {#each yTicks as tick (tick)}
      <g transform="translate(0, {yScale(tick)})">
        <line x1="20" x2="100%" />
        <text y="5">{tick}</text>
      </g>
    {/each}
  </g>
  <g class="bars" transform="translate({padding.left})">
    {#each data as d, i}
      <rect
        fill={'#fe6565'}
        x={xScale(i)}
        y={yScale(d['女']) - (height - padding.bottom - yScale(d['男']))}
        width={10}
        height={height - padding.bottom - yScale(d['女'])} />
      <rect
        fill={'#27cc95'}
        x={xScale(i)}
        y={yScale(d['男'])}
        width={10}
        height={height - padding.bottom - yScale(d['男'])} />
    {/each}
  </g>
</SVG>
