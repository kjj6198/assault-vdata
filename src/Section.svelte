<script>
  import LabelTitle from "./LabelTitle.svelte";

  export let num;
  export let title;
  export let description;
  export let size = "medium";
</script>

<style>
  section {
    width: 95%;
    margin: 4rem auto;
  }

  .small {
    max-width: 960px;
  }

  .medium {
    max-width: 1080px;
  }

  .large {
    max-width: 1200px;
  }
</style>

<section class={size}>
  <LabelTitle {title} id={title} type="anchor" />

  <p>{description}</p>

  <slot />
</section>
