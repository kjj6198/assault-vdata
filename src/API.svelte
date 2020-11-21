<script>
  import { onMount, createEventDispatcher } from "svelte";
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
  <slot />
{:else}<span>loading</span>{/if}
