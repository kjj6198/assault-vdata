<script>
  import { flip } from "svelte/animate";
  import SVG from "./SVG.svelte";
  import { scaleLinear, scaleBand } from "d3-scale";
  export let data;
  export let xTicks;
  export let yTicks;
  export let fillColor;
  export let barHeight = 10;
  let width = 800;
  let height = 600;

  let padding = {
    left: 80,
    bottom: 10,
    top: 10,
    right: 10,
  };

  $: xScale = scaleLinear()
    .domain([0, Math.max(...xTicks)])
    .range([padding.left, width - padding.right - padding.left]);
  $: yScale = scaleBand()
    .domain(yTicks)
    .range([height - padding.top, padding.bottom])
    .padding([0.2]);
</script>

<style>
  text {
    font-family: Oswald;
    font-size: 12px;
  }
  line {
    stroke: #aaa;
    stroke-dasharray: 2;
  }

  rect {
    transition: ease 0.3s width;
  }

  rect:hover {
    stroke-width: 1px;
    stroke: #333;
  }
</style>

<SVG viewBox="0 0 {width * 1.08} {height * 1}">
  <g transform="translate({padding.left}, {height - padding.bottom})">
    {#each xTicks as tick, i (tick)}
      <g animate:flip transform="translate({xScale(tick)}, 2)">
        <text text-anchor="middle">{tick}</text>
        <line y1="-15" y2="-100%" />
      </g>
    {/each}
    <text y={-20} x={width - padding.left}>(通報件數)</text>
  </g>
  <g transform="translate(0, 0)">
    {#each yTicks as tick, i}
      <g transform="translate(0, {yScale(tick)})">
        <text>{tick}</text>
      </g>
    {/each}
  </g>

  <g class="bars" transform="translate({padding.left})">
    {#each Object.keys(data) as k, i (k)}
      {#if k !== '年份'}
        <rect
          y={yScale(k) - 8}
          fill={fillColor}
          x={padding.left}
          height={barHeight}
          width={xScale(+data[k].replace(',', '')) - padding.left} />
        <text y={yScale(k) + 1} x={5 + xScale(+data[k].replace(',', ''))}>
          {data[k]}
        </text>
      {/if}
    {/each}
  </g>
</SVG>
