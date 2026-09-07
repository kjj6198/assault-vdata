import palette from "./palette.json";
export type RegionMeasure = "count" | "rate";
export type RegionRow = {
  city: string;
  value: number;
  population: number | null;
  rate: number | null;
};
export const ratePer100k = (count: number, population: number | null) =>
  population !== null && population > 0 ? (count / population) * 100_000 : null;
// One shared zero-based linear scale for all counties, independent of search/sort.
export const rateAxisMax = (rates: (number | null)[]) =>
  Math.max(25, Math.ceil(Math.max(0, ...rates.map((rate) => rate ?? 0)) / 25) * 25);
export const ratePosition = (rate: number, maximum: number) =>
  maximum > 0 ? Math.min(1, Math.max(0, rate / maximum)) : 0;
export const formatRate = (rate: number | null) =>
  rate === null ? "—" : rate > 0 && rate < 0.01 ? "<0.01" : rate.toFixed(2);
// Fixed, readable boundaries span the observed 2008–2025 distribution.
// Bins stay identical across years and measures.
export const rateLegend = [
  { min: 0, label: ">0–<25", color: palette["map-1"].css },
  { min: 25, label: "25–<35", color: palette["map-2"].css },
  { min: 35, label: "35–<45", color: palette["map-3"].css },
  { min: 45, label: "45–<60", color: palette["map-4"].css },
  { min: 60, label: "60–<80", color: palette["map-5"].css },
  { min: 80, label: "80 以上", color: palette["map-6"].css },
];
export function rateColor(rate: number | null) {
  if (rate === null) return palette["map-missing"].css;
  if (rate === 0) return palette.card.css;
  return (
    [...rateLegend].reverse().find((step) => rate >= step.min)?.color ?? palette["map-missing"].css
  );
}
export const zeroRateColor = palette.card.css;
