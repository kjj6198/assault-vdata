import { z } from "zod";

const count = z.number().int().nonnegative();
const origin = {
  year: z.number().int(),
  value: count,
  source: z.string(),
  sheet: z.string(),
  row: count,
  column: count,
};
export const recordSchema = z.discriminatedUnion("dataset", [
  z.object({ ...origin, dataset: z.literal("demographics"), age: z.string(), gender: z.string() }),
  z.object({
    ...origin,
    dataset: z.literal("relationships"),
    age: z.string(),
    relationship: z.string(),
  }),
  z.object({ ...origin, dataset: z.literal("victims"), city: z.string() }),
  z.object({ ...origin, dataset: z.literal("reports"), city: z.string() }),
]);
export const datasetNames = ["demographics", "relationships", "victims", "reports"] as const;
export const sourceSchema = z.object({
  dataset: z.enum(datasetNames),
  file: z.string(),
  title: z.string(),
  page: z.url(),
  url: z.url(),
  sha256: z.string().length(64),
});
export const qualitySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("published-column-total-difference"),
    year: z.number(),
    relationship: z.string(),
    source: z.string(),
    column: count,
    published: count,
    computed: count,
  }),
  z.object({
    kind: z.literal("published-age-difference"),
    year: z.number(),
    age: z.string(),
    demographics: count,
    relationships: count,
  }),
  z.object({
    kind: z.literal("published-row-total-difference"),
    year: z.number(),
    age: z.string(),
    source: z.string(),
    row: count,
    published: count,
    computed: count,
  }),
]);
export const cleanSchema = z.object({
  schemaVersion: z.literal(1),
  years: z.array(z.number()),
  ages: z.array(z.string()),
  sources: z.array(sourceSchema),
  records: z.array(recordSchema),
  totals: z.array(
    z.object({ dataset: z.enum(datasetNames), year: z.number(), value: count, source: z.string() }),
  ),
  qualityNotes: z.array(qualitySchema),
});
export type DataRecord = z.infer<typeof recordSchema>;
export const formatNumber = (n: number) => new Intl.NumberFormat("zh-TW").format(n);
export const percent = (n: number, total: number) =>
  total === 0 ? "0.0" : ((n / total) * 100).toFixed(1);
