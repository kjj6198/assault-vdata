import { readable } from "svelte/store";

export default readable("portrait", (set) => {
  if (window.matchMedia) {
    const match = window.matchMedia("(orientation: landscape)");
    match.addEventListener("change", (e) => {
      if (e.matches) {
        set("landscape");
      } else {
        set("portrait");
      }
    });
  }
});
