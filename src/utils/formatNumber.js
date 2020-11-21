export default function formatNumber(number) {
  return Intl.NumberFormat("en-US").format(number);
}
