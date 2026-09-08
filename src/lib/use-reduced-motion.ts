import { useSyncExternalStore } from "react";

let mediaQuery: MediaQueryList | undefined;

const getMediaQuery = () => (mediaQuery ??= window.matchMedia("(prefers-reduced-motion: reduce)"));
const getSnapshot = () => getMediaQuery().matches;
const getServerSnapshot = () => true;
const subscribe = (onChange: () => void) => {
  const query = getMediaQuery();
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

export function useReducedMotionPreference() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
