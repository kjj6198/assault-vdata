import { writable } from "svelte/store";

export const modal = writable({
  status: "closed", // opened | closed,
  title: null,
  component: null,
  params: {},
  firstFocusElement: null,
});

export const open = (title, params = {}) =>
  modal.set({
    status: "opened",
    title,
    params,
    firstFocusElement: document.activeElement,
  });

export const close = () =>
  modal.set({
    status: "closed",
    title: null,
    params: null,
  });
