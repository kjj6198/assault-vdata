import palette from "./palette.json";
import { z } from "zod";
import raw from "../../data/geo/map-paths.json";

const point = z.tuple([z.number().finite(), z.number().finite()]);
const mapSchema = z.object({
  width: z.number(),
  height: z.number(),
  counties: z
    .array(z.object({ name: z.string(), code: z.string(), path: z.string().min(1), center: point }))
    .length(22),
  insets: z.array(
    z.object({ name: z.string(), path: z.string(), bounds: z.tuple([point, point]) }),
  ),
});
export const taiwanMap = mapSchema.parse(raw);
// Fixed thresholds across years and both metrics: colors remain comparable.
export const mapScale = [
  { min: 0, label: "0–99", color: palette["map-1"].css },
  { min: 100, label: "100–299", color: palette["map-2"].css },
  { min: 300, label: "300–599", color: palette["map-3"].css },
  { min: 600, label: "600–999", color: palette["map-4"].css },
  { min: 1000, label: "1,000–1,499", color: palette["map-5"].css },
  { min: 1500, label: "1,500 以上", color: palette["map-6"].css },
];
export function countyColor(value: number | undefined) {
  if (value === undefined) return palette["map-missing"].css;
  return (
    [...mapScale].reverse().find((step) => value >= step.min)?.color ?? palette["map-missing"].css
  );
}
