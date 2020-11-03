<script>
  import { tweened } from "svelte/motion";
  import { createEventDispatcher } from "svelte";
  import { scale } from "svelte/transition";
  const male = tweened(0);
  const female = tweened(0);
  const dispatch = createEventDispatcher();

  $: {
    male.set(data["男"]);
    female.set(data["女"]);
  }
  export let data;
</script>

<style>
  .tooltip {
    position: absolute;
    top: 10%;
    left: 30px;
    width: 500px;
    padding: 20px;
    border-radius: 20px;
    background-color: #fff;
    box-shadow: 0 3px 19px rgba(100, 100, 100, 0.4);
  }

  h3 {
    font-size: 2.8rem;
    padding-left: 10px;
    line-height: 1;
    border-left: 8px solid currentColor;
    margin: 0;
  }

  ul {
    font-size: 2rem;
    text-align: center;
    display: flex;
    justify-content: space-between;
    list-style: none;
    padding: 0;
  }

  ul > li {
    flex-basis: 50%;
  }

  .number {
    font-size: 2em;
  }
</style>

<div
  class="tooltip"
  in:scale={{ duration: 350, delay: 500 }}
  out:scale={{ duration: 350, delay: 0 }}>
  <button on:click={() => dispatch('close')}>close</button>
  <h4>性侵害通報案件數 ({data['年份']}年)</h4>
  <h3>{data['縣市']}</h3>
  <ul>
    <li>男<br /><strong class="number">{Math.floor($male)}</strong> 人</li>
    <li>女<br /><strong class="number">{Math.floor($female)}</strong> 人</li>
  </ul>
</div>
