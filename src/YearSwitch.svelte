<script>
  import { createEventDispatcher, afterUpdate, onMount } from "svelte";
  const dispatch = createEventDispatcher();
  export let years = [];
  export let initialYear = years[0];
  let idx = 0;
  let list;

  idx = years.findIndex((y) => y === initialYear) || 0;

  $: {
    dispatch("change", {
      year: years[idx],
    });
  }

  afterUpdate(() => {
    if (list) {
      const target = list.querySelector("[data-current=true]");
      if (target) {
        target.scrollIntoView({ inline: "center" });
      }
    }
  });
</script>

<style>
  .container {
    text-align: center;
  }

  .title {
    border: 0;
    background: none;
    display: inline-block;
    margin: 0 20px;
    color: #444;
    font-size: 1.5rem;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  .title:focus {
    outline: none;
  }

  .prev,
  .next {
    vertical-align: super;
    line-height: 30px;
    color: #444;
    padding: 0;
    margin: 0;
    width: 30px;
    height: 30px;
    background: none;
    border: 0;
    cursor: pointer;
  }

  .active {
    color: #27cca5;
  }

  .list {
    position: relative;
    display: inline-block;
    width: 600px;
    white-space: nowrap;
    overflow-x: hidden;
  }
</style>

<div class="container">
  <button
    class="prev"
    aria-label="上一年"
    on:click={() => {
      idx = idx - 1 < 0 ? years.length - 1 : (idx - 1) % years.length;
    }}>
    <span aria-hidden="true">&#x25C0;</span>
  </button>
  <div class="list" bind:this={list}>
    {#each years as year, i}
      <button
        class="title"
        data-current={year === years[idx]}
        on:focus={() => (idx = i)}
        on:click={() => (idx = i)}
        aria-label={year + '年'}
        class:active={year === years[idx]}
        role="status">{year}</button>
    {/each}
  </div>
  <button
    class="next"
    aria-label="下一年"
    on:click={() => {
      idx = (idx + 1) % years.length;
    }}>
    <span aria-hidden="true">&#x25B6;</span>
  </button>
  <slot name="chart" />
</div>
