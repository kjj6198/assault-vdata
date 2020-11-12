import { readable } from "svelte/store";

export default readable("laptop", (set) => {
  const query = {
    mobile: "(max-width: 600px)",
    tablet: "(min-width: 601px) and (max-width: 960px)",
    laptop: "(min-width: 961px) and (max-width: 1200px)",
    desktop: "(min-width: 1201px)",
  };

  if (window.matchMedia) {
    Object.keys(query).forEach((key) => {
      const match = window.matchMedia(query[key]);
      match.addEventListener("change", (e) => {
        if (e.matches) {
          set(key);
        }
      });
      if (match.matches) {
        set(key);
      }
    });
  } else {
    set("desktop");
  }
});
