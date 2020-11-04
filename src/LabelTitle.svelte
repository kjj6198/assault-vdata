<script>
  export let type = "anchor"; // anchor | text
  export let id;
  export let title;
</script>

<style>
  .tag {
    display: inline-block;
    padding: 15px;
    text-align: center;
    border-radius: 10px;
    background-color: var(--main);
  }

  a.tag {
    color: inherit;
    text-decoration: none;
  }

  .title {
    font-size: 22px;
    color: var(--white);
  }
</style>

{#if type === 'anchor'}
  <a class="tag" href={'#' + id}> <span class="title">{title}</span> </a>
{:else}
  <div class="tag">
    <h3 class="title">{title}</h3>
  </div>
{/if}
