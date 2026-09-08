import { z } from "zod";
import raw from "../../data/population/clean.json";
const populationSchema = z.object({
  source: z.object({
    provider: z.string(),
    title: z.string(),
    page: z.url(),
    url: z.url(),
    file: z.string(),
    sha256: z.string().length(64),
    basis: z.string(),
    geography: z.string(),
  }),
  records: z.array(
    z.object({
      year: z.number().int(),
      city: z.string(),
      population: z.number().int().positive(),
      cells: z.array(
        z.object({
          sheet: z.string(),
          row: z.number().int().positive(),
          column: z.number().int().positive(),
          area: z.string(),
          value: z.number().int().positive(),
        }),
      ),
    }),
  ),
  totals: z.array(z.object({ year: z.number().int(), population: z.number().int().positive() })),
});
export const populationDatabase = populationSchema.parse(raw);
