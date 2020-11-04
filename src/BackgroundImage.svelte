<script>
  export let height;
  export let imageURL;
</script>

<style>
  .bg {
    width: 100%;
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
  }
</style>

<div class="bg" style="height: {height || 'auto'}; background-image: url({imageURL})">
  <slot />
</div>