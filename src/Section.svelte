<script>
  export let num;
  export let title;
  export let description;
  export let size = 'medium';
</script>

<style>
  section {
    width: 95%;
    margin: 0 auto;
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

<section class="{size}">
  <span>議題 {num}</span>
  <h2>{title}</h2>
  
  <p>{description}</p>
  
  <slot></slot>
</section>