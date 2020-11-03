<script>
  import { fade } from "svelte/transition";
  import colors from "./utils/colors";

  export let position = {
    x: 0,
    y: 0,
  };
  export let data;
</script>

<style>
  .tooltip {
    border-radius: 4px;
    position: absolute;
    width: 150px;
    padding: 10px;
    background-color: rgba(125, 125, 125, 0.8);
    transition: all ease 0.3s;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  ul > li {
    font-size: 0.9em;
    margin-bottom: 3px;
    color: #fff;
  }

  .block {
    display: inline-block;
    width: 10px;
    height: 10px;
    border: 1px solid #fff;
  }
</style>

<div
  transition:fade
  class="tooltip"
  style="left: {position.x}px; top: {position.y}px">
  <ul>
    {#if data}
      {#each data as d}
        <li>
          <span class="block" style="background-color: {colors[d.key]}" />
          {d.key}
          {d.data[d.key]}
        </li>
      {/each}
    {/if}
  </ul>
</div>
