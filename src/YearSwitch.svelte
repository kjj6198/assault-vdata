<script>
  import { createEventDispatcher, afterUpdate, onMount, tick } from "svelte";
  const dispatch = createEventDispatcher();
  export let years = [];
  export let initialYear = years[0];

  let list;
  $: idx = years.findIndex((y) => y === initialYear) || 0;

  $: {
    dispatch("change", {
      year: years[idx],
    });
  }

  onMount(() => {
    const target = list.querySelector("[data-current=true]");
    if (target) {
      list.scrollLeft = target.offsetLeft;
    }
  });

  afterUpdate(() => {
    const target = list.querySelector("[data-current=true]");
    if (target) {
      if (target.offsetLeft - target.offsetWidth < list.scrollLeft) {
        list.scrollLeft = target.offsetLeft - target.offsetWidth;
      } else if (
        target.offsetLeft + target.offsetWidth / 2 >
        list.scrollLeft + list.clientWidth
      ) {
        list.scrollLeft = target.offsetLeft + target.offsetWidth;
      }
    }
  });
</script>

<style>
  .year-switch-container {
    margin: 30px auto;
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
  }

  @media screen and (max-width: 960px) {
    .title {
      font-size: 1rem;
    }
  }

  .title:focus {
    outline: none;
  }

  .prev,
  .next {
    vertical-align: super;
    line-height: 30px;
    color: var(--main);
    padding: 0;
    margin: 0;
    width: 30px;
    height: 30px;
    background: none;
    border: 0;
    cursor: pointer;
  }

  .active {
    color: var(--em3);
  }

  .list {
    position: relative;
    display: inline-block;
    width: 80%;
    max-width: 600px;
    white-space: nowrap;
    overflow-x: hidden;
  }
</style>

<div class="year-switch-container">
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
</div>
<slot name="chart" />
