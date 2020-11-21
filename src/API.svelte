<script>
  import { onMount, createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  import Loading from "./Loading.svelte";
  const dispatch = createEventDispatcher();
  let loaded = false;
  let data;
  export let api;

  onMount(() => {
    api()
      .then((res) => res.json())
      .then((d) => {
        loaded = true;
        data = d;
      });
  });

  $: {
    if (data) {
      dispatch("loaded", {
        data: data,
      });
    }
  }
</script>

{#if loaded}
  <div in:fade>
    <slot />
  </div>
{:else}
  <Loading height={400} />
{/if}
