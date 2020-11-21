<script>
  import { fade } from "svelte/transition";
  import YearSwitch from "./YearSwitch.svelte";
  import { tweened } from "svelte/motion";
  export let probability = 0.5;
  export let total = 100;
  let currentYear = 2019;
  let data;
  let loading = true;

  const res = fetch(
    "https://vdata.kalan.dev/api/v1/data/sexual_assault/case_year"
  )
    .then((res) => res.json())
    .then((d) => {
      loading = false;
      data = d;
    });

  $: totalAmount = Array.from({ length: total }).fill(0);
  $: currentData = data
    ? data.find((data) => data.year === currentYear.toString())
    : null;

  let femaleCount = tweened(0);
  let maleCount = tweened(0);

  $: {
    if (currentData) {
      femaleCount.set(currentData.female);
      maleCount.set(currentData.male);
    }
  }
</script>

<style>
  .container {
    display: grid;
    grid-gap: 10px;
    grid-template-columns: repeat(2, 1fr);
  }

  .inner {
    display: grid;
    grid-gap: 10px;
    grid-template-columns: repeat(10, 40px);
    grid-template-rows: repeat(10, 65px);
  }

  .title {
    color: var(--main);
    grid-column: 1 / 11;
  }

  @media screen and (max-width: 960px) {
    .container {
      display: block;
    }
    .inner {
      grid-template-columns: repeat(5, 1fr);
      grid-template-rows: initial;
    }
    .title {
      grid-column: span 5;
    }
  }
</style>

<YearSwitch
  initialYear={currentYear}
  years={[2015, 2016, 2017, 2018, 2019]}
  on:change={(e) => (currentYear = e.detail.year)}>
  <div class="wrapper" slot="chart">
    {#if loading}
      <span>loading</span>
    {:else if data}
      <div class="container">
        <div class="inner">
          <h2 class="title">女（{Math.floor($femaleCount)} 人）</h2>
          <p class="title">
            在受害者當中，每 100 人中有
            {Math.floor(currentData.probability * 100)}
            人為女性
          </p>
          {#each Array.from({
            length: currentData.probability * 100,
          }) as item, i (i)}
            <img
              alt="女性"
              aria-hidden="true"
              transition:fade
              src="icons/female.svg" />
          {/each}
        </div>
        <div class="inner">
          <h2 class="title">男（{Math.floor($maleCount)} 人）</h2>
          <p class="title">
            在受害者中，每 100 人中有
            {Math.floor((1 - currentData.probability) * 100)}
            人為男性
          </p>
          {#each Array.from({
            length: (1 - currentData.probability) * 100,
          }) as item, i (i)}
            <img
              alt="男性"
              aria-hidden="true"
              transition:fade
              src="icons/male.svg" />
          {/each}
        </div>
      </div>
    {/if}
  </div>
</YearSwitch>
