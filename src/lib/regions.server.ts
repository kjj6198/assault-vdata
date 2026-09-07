import { z } from "zod";
import { database, yearSchema } from "./data.server";
import { populationDatabase } from "./population.server";
import { ratePer100k } from "./regions";
const schema = z
  .object({
    year: z
      .string()
      .regex(/^\d{4}$/)
      .transform(Number)
      .pipe(yearSchema)
      .optional(),
    dataset: z.enum(["victims", "reports"]).default("victims"),
    city: z
      .string()
      .refine((s) => populationDatabase.records.some((r) => r.city === s), "Unknown city")
      .optional(),
    format: z.enum(["json", "csv"]).default("json"),
  })
  .strict();
export function regionsResponse(request: Request) {
  const parsed = schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success)
    return Response.json({ error: "Invalid query", details: parsed.error.issues }, { status: 400 });
  const { year, dataset, city, format } = parsed.data;
  const populations = new Map(populationDatabase.records.map((r) => [`${r.year}:${r.city}`, r]));
  const records = database.records
    .filter((r) => r.dataset === "victims" || r.dataset === "reports")
    .filter(
      (r) =>
        r.dataset === dataset &&
        (year === undefined || r.year === year) &&
        (!city || r.city === city),
    )
    .map((r) => {
      const p = populations.get(`${r.year}:${r.city}`);
      return {
        year: r.year,
        city: r.city,
        dataset: r.dataset,
        count: r.value,
        population: p?.population ?? null,
        ratePer100k: ratePer100k(r.value, p?.population ?? null),
        populationBasis: "year-end registered population",
        populationSource: populationDatabase.source.file,
        populationCells: p?.cells ?? [],
        countSource: r.source,
        countSheet: r.sheet,
        countRow: r.row,
        countColumn: r.column,
      };
    });
  const headers = { "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" };
  if (format === "csv") {
    const fields = [
      "year",
      "city",
      "dataset",
      "count",
      "population",
      "ratePer100k",
      "populationBasis",
      "populationSource",
      "populationCells",
      "countSource",
      "countSheet",
      "countRow",
      "countColumn",
    ];
    const cell = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const rows = records.map((r) =>
      [
        r.year,
        r.city,
        r.dataset,
        r.count,
        r.population,
        r.ratePer100k,
        r.populationBasis,
        r.populationSource,
        JSON.stringify(r.populationCells),
        r.countSource,
        r.countSheet,
        r.countRow,
        r.countColumn,
      ]
        .map(cell)
        .join(","),
    );
    return new Response("\uFEFF" + [fields.join(","), ...rows].join("\r\n"), {
      headers: {
        ...headers,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="regions-${dataset}-${year ?? "all"}.csv"`,
      },
    });
  }
  return Response.json(
    {
      source: populationDatabase.source,
      formula: "count / year-end registered population * 100000",
      note: "Crude rate of reported records, not estimated incidence. Bar lengths are linear; color bins and exported rates use untransformed rates.",
      records,
    },
    { headers },
  );
}
