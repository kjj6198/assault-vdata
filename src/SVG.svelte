<script>
  import { onMount } from "svelte";
  let svg;
  export let viewBox;
  let aspect;
  let width;
  let height;

  onMount(() => {
    width = svg.clientWidth;
    height = svg.clientHeight;
    aspect = width / height;
  });
</script>

<svelte:window
  on:resize={() => {
    const container = svg.parentNode;
    const targetWidth = container.clientWidth;
    width = targetWidth;
    height = Math.round(targetWidth / aspect);
  }} />

<svg {width} {height} bind:this={svg} preserveAspectRatio="xMinYMid" {viewBox}>
  <slot />
</svg>
