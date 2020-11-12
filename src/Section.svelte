<script>
  import LabelTitle from "./LabelTitle.svelte";

  export let num;
  export let title;
  export let description;
  export let size = "medium";
</script>

<style>
  section {
    position: relative;
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

  .issue {
    position: absolute;
    right: 20px;
    top: 20px;
    font-size: 4rem;
    color: #444;
    opacity: 0.4;
    font-family: Oswald;
  }

  .issue::before {
    content: "#";
  }
</style>

<section class={size}>
  <span class="issue">{num}</span>
  <LabelTitle {title} id={title} type="anchor" />

  <p>{description}</p>

  <slot />
</section>
