<script>
  import { tweened } from "svelte/motion";
  import { createEventDispatcher, onMount } from "svelte";
  import { scale } from "svelte/transition";
  const male = tweened(0);
  const female = tweened(0);
  const dispatch = createEventDispatcher();

  $: {
    male.set(data["男"]);
    female.set(data["女"]);
  }

  function handleKeydown(e) {
    if (e.key === "Escape") {
      dispatch("close");
    }
  }
  onMount(() => {
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  });
  export let data;
</script>

<style>
  .tooltip {
    position: absolute;
    top: 15%;
    left: 30px;
    max-width: 500px;
    width: 90%;
    padding: 20px;
    border-radius: 20px;
    background-color: #fff;
    box-shadow: 0 3px 19px rgba(100, 100, 100, 0.4);
  }

  h3.city {
    margin: 0;
    padding-left: 10px;
    line-height: 1;
    border-left: 8px solid currentColor;
    font-size: 2.2rem;
    color: var(--main);
  }

  ul {
    font-size: 2rem;
    text-align: center;
    list-style: none;
    padding: 0;
  }

  ul > li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .gender {
    width: 20%;
  }

  .male,
  .female {
    width: 20px;
  }

  .number {
    font-size: 2em;
  }

  .close-btn {
    position: absolute;
    right: 20px;
    top: 20px;
    width: 30px;
    height: 30px;
    line-height: 30px;
    font-size: 30px;
    border: 0;
    background: none;
    border-radius: 3px;
    cursor: pointer;
    appearance: none;
  }

  .close-btn:hover {
    background-color: rgba(100, 100, 100, 0.1);
  }

  @media screen and (max-width: 960px) {
    .tooltip {
      font-size: 14px;
      top: 50%;
    }

    h3 {
      font-size: 2rem;
    }

    .number {
      font-size: 2rem;
    }
  }
</style>

<div
  class="tooltip"
  in:scale={{ duration: 350, delay: 500 }}
  out:scale={{ duration: 350, delay: 0 }}>
  <button class="close-btn" on:click={() => dispatch('close')}>
    <span aria-hidden="true">&times;</span>
  </button>
  <h4>性侵害通報案件數 ({data['年份']}年)</h4>
  <h3 class="city">{data['縣市']}</h3>
  <ul>
    <li>
      <div class="gender">
        <img class="male" src="icons/male.svg" alt="男性" />
        <span>男</span>
      </div>
      <div class="data">
        <strong class="number">{Math.floor($male)}</strong>
        人
      </div>
    </li>
    <li>
      <div class="gender">
        <img class="female" src="icons/female.svg" alt="女性" />
        <span>女</span>
      </div>
      <div class="data">
        <strong class="number">{Math.floor($female)}</strong>
        人
      </div>
    </li>
  </ul>
</div>
