<script>
  import { flip } from "svelte/animate";
  import SVG from "./SVG.svelte";
  import { scaleLinear, scaleBand } from "d3-scale";
  import { stack, stackOrderDescending } from "d3-shape";
  import colors from "./utils/colors";
  import { createEventDispatcher } from "svelte";
  export let data = [];
  export let xTicks;
  export let yTicks;
  export let width = 1000;
  export let height = 700;
  export let keys = [];
  let padding = {
    left: 50,
    bottom: 30,
    top: 10,
    right: 20,
  };

  $: stackData = stack().order(stackOrderDescending).keys(keys)(data);

  $: xScale = scaleLinear()
    .domain([0, Math.max(...xTicks)])
    .range([padding.left, width - padding.right - padding.left]);
  $: yScale = scaleBand()
    .domain(yTicks)
    .range([height - padding.top, padding.bottom])
    .padding([0.2]);

  let groupData = {};
  function groupStackData() {
    stackData.forEach((data) => {
      data.forEach((d) => {
        const age = d.data["年齡層"];
        if (groupData[age]) {
          d.key = data.key;
          groupData[age].push(d);
        } else {
          d.key = data.key;
          groupData[age] = [d];
        }
      });
    });
  }

  $: stackData ? groupStackData() : null;

  const dispatch = createEventDispatcher();

  function displayTooltip(e, groupData) {
    dispatch("show", {
      target: e.target,
      data: groupData,
    });
  }

  function hideTooltip(e, groupData) {
    dispatch("hide", {
      target: e.target,
      data: groupData,
    });
  }
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

<SVG viewBox="0 0 {width} {height}">
  <g transform="translate({padding.left}, {height - padding.bottom})">
    {#each xTicks as tick, i (tick)}
      <g animate:flip transform="translate({xScale(tick)}, 2)">
        <text text-anchor="middle">{tick}</text>
        <line y1="-15" y2="-100%" />
      </g>
    {/each}
  </g>
  <g transform="translate(0, 0)">
    {#each yTicks as tick, i}
      <g transform="translate(0, {yScale(tick)})">
        <text>{tick}</text>
      </g>
    {/each}
  </g>

  {#each Object.keys(groupData) as key (key)}
    <g
      on:mouseenter={(e) => displayTooltip(e, groupData[key])}
      on:mouseleave={(e) => hideTooltip(e, groupData[key])}>
      {#each groupData[key] as d, i (i)}
        <rect
          y={yScale(key) - 15}
          x={padding.left + xScale(d[0])}
          fill={colors[d.key]}
          height={30}
          width={xScale(d[1]) - xScale(d[0])} />
      {/each}
    </g>
  {/each}

  <g>
    {#each data as d}
      <text
        x={xScale(+d['總計']) + padding.left + 10}
        y={yScale(d['年齡層']) + 4}>
        {d['總計']}
      </text>
    {/each}
  </g>
</SVG>
