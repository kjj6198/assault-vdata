<script>
  export let text;
  export let onClick;
  export let disabled;
  export let type = "button";
  export let style = "primary"; // primary | filled
  export let ariaProps = {};
</script>

<style>
  .btn {
    display: inline-block;
    padding: 8px 16px;
    background: none;
    border: 2px solid;
    border-radius: 20px;
    margin-right: 8px;
    margin-bottom: 8px;
  }

  .primary {
  }

  .filled {
    background-color: var(--main);
    color: #fff;
  }
</style>

<button {...ariaProps} {type} {disabled} on:click={onClick} class="btn {style}">
  <slot>{text}</slot>
</button>
