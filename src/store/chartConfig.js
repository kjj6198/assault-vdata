import step from "../utils/step";
import viewport from "./viewport";
import { derived } from "svelte/store";

export default derived(viewport, ($viewport, set) => {
  const config = {
    mobile: {
      placeChart: {
        textWidth: "20%",
        xTickTextOffset: 30,
        width: 350,
        height: 700,
        xTicks: step(0, 4500, 800),
        padding: 70,
      },
      relationChart: {
        width: 400,
        height: 700,
      },
    },
    desktop: {
      relationChart: {
        width: 850,
        height: 700,
      },
      placeChart: {
        xTickTextOffset: 0,
        width: 800,
        height: 650,
        padding: 80,
        xTicks: step(0, 4500, 400),
      },
    },
  };
  if ($viewport === "mobile" || $viewport === "tablet") {
    set(config.mobile);
  } else if (["laptop", "desktop"].includes($viewport)) {
    set(config.desktop);
  }
});
