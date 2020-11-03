export default function extent(arr, acc) {
  if (typeof acc === "function") {
    const max = Math.max(...arr.map(acc));
    const min = Math.min(...arr.map(acc));
    return [min, max];
  }

  return [Math.min(...arr), Math.max(...arr)];
}
