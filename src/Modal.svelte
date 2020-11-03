<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { close, modal } from "./modal";
  export let title = "modal-title";
  let modalEl;
  function handleKeydown(e) {
    if (e.keyCode === 27) {
      // ESC
      $modal.firstFocusElement.focus();
      close();
    }

    const allFocusableElements = modalEl.querySelectorAll(
      'a[href], input:not(:disabled), button:not(:disabled), area, textarea:not(:disabled), [tabindex="0"]'
    );
    const len = allFocusableElements.length;
    const first = allFocusableElements[0];
    const last = allFocusableElements[len - 1];

    if (e.keyCode === 9) {
      // Tab, shiftTab?
      if (e.shiftKey) {
        // shift + tab
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // tab
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  $: {
    if ($modal.status === "opened") {
      document.body.classList.add("prevent-scroll");
    } else {
      document.body.classList.remove("prevent-scroll");
    }
  }

  onMount(() => {
    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.body.classList.remove("prevent-scroll");
      document.removeEventListener("keydown", handleKeydown);
    };
  });
</script>

<style>
  .modal-wrapper {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(25, 25, 25, 0.77);
  }

  .modal {
    width: 75%;
    max-width: 800px;
    padding: 30px 20px;
    max-height: 75vh;
    margin: 10% auto;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 1px 3px 9px rgba(25, 25, 25, 0.2);
    overflow-y: auto;
  }

  .modal-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .title {
    margin: 0;
  }

  button {
    appearance: none;
    border: 0;
    background-color: transparent;
    margin: 0;
  }

  button:focus {
    outline: 1px solid #aaa;
  }

  :global(.prevent-scroll) {
    overflow-y: hidden;
  }
</style>

<div
  transition:fade={{ delay: 500 }}
  tabindex="-1"
  role="dialog"
  class="modal-wrapper"
  on:mousedown={(e) => {
    if (e.target === e.currentTarget) {
      close();
    }
  }}>
  <div
    class="modal"
    role="document"
    aria-modal={true}
    aria-labelledby="modal"
    bind:this={modalEl}
    transition:fade={{ delay: 50, duration: 300 }}>
    <div class="modal-head">
      <h3 class="title" id="modal">{title}</h3>
      <button type="button" aria-label="關閉視窗" on:click={() => close()}>
        <span aria-hidden={true}>&#10005;</span>
      </button>
    </div>
    <slot>Description</slot>
  </div>
</div>
