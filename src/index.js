import App from "./App.svelte";
import colors from './constants/colors';

function injectColors() {
  const root = document.documentElement;
  Object.keys(colors)
    .forEach(key => {
      root.style.setProperty(`--${key}`, colors[key]);
    }) 
}

injectColors()

var app = new App({
  target: document.body,
});

export default app;


// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/#hot-module-replacement
if (import.meta.env.NODE_ENV) {
  if (import.meta.hot) {
    import.meta.hot.accept();
    import.meta.hot.dispose(() => {
      app.$destroy();
    });
  }
}