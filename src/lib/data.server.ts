import { populationDatabase } from "./population.server";
import raw from "../../data/clean.json";
import { cleanSchema, datasetNames } from "./data";
import { z } from "zod";

export const database = cleanSchema.parse(raw);
export const latestYear = Math.max(...database.years);
export const yearSchema = z
  .number()
  .int()
  .refine((year) => database.years.includes(year), "Year outside available coverage");
const regionHistory = database.records
  .filter((r) => r.dataset === "victims")
  .filter((r) => r.year >= 2019)
  .map((r) => ({
    year: r.year,
    city: r.city,
    victims: r.value,
    reports:
      database.records.find(
        (o) => o.dataset === "reports" && "city" in o && o.city === r.city && o.year === r.year,
      )?.value ?? 0,
    population:
      populationDatabase.records.find((p) => p.city === r.city && p.year === r.year)?.population ??
      null,
  }));
export const querySchema = z.object({
  dataset: z.enum(datasetNames).optional(),
  year: z
    .string()
    .regex(/^\d{4}$/)
    .transform(Number)
    .pipe(yearSchema)
    .optional(),
  city: z
    .string()
    .refine((city) => database.records.some((r) => "city" in r && r.city === city), "Unknown city")
    .optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
export function dataResponse(request: Request) {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);
  const unknown = Object.keys(params).filter(
    (key) => !["year", "dataset", "city", "format"].includes(key),
  );
  const parsed = querySchema.safeParse(params);
  if (!parsed.success || unknown.length)
    return Response.json(
      {
        error: "Invalid query",
        details: parsed.success ? unknown : parsed.error.issues,
        years: database.years,
        datasets: datasetNames,
      },
      { status: 400 },
    );
  const { year, dataset, city, format } = parsed.data;
  if (city && dataset && dataset !== "victims" && dataset !== "reports")
    return Response.json(
      { error: "city is only available for victims and reports" },
      { status: 400 },
    );
  const records = database.records.filter(
    (r) =>
      (year === undefined || r.year === year) &&
      (!dataset || r.dataset === dataset) &&
      (!city || ("city" in r && r.city === city)),
  );
  const headers = { "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" };
  if (format === "csv") {
    const fields = [
      "dataset",
      "year",
      "value",
      "city",
      "age",
      "gender",
      "relationship",
      "source",
      "sheet",
      "row",
      "column",
    ];
    const lines = records.map((r) =>
      [
        r.dataset,
        r.year,
        r.value,
        "city" in r ? r.city : "",
        "age" in r ? r.age : "",
        "gender" in r ? r.gender : "",
        "relationship" in r ? r.relationship : "",
        r.source,
        r.sheet,
        r.row,
        r.column,
      ]
        .map(csvCell)
        .join(","),
    );
    return new Response("\uFEFF" + [fields.join(","), ...lines].join("\r\n"), {
      headers: {
        ...headers,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="taiwan-assault-${year ?? "all"}.csv"`,
      },
    });
  }
  return Response.json(
    {
      schemaVersion: database.schemaVersion,
      count: records.length,
      records,
      sources: database.sources,
      qualityNotes: database.qualityNotes.filter((n) => year === undefined || n.year === year),
    },
    { headers },
  );
}
export function getDashboard(year: number) {
  yearSchema.parse(year);
  return {
    year,
    populations: populationDatabase.records.filter((r) => r.year === year),
    populationSource: populationDatabase.source,
    years: database.years,
    ages: database.ages,
    // Spreadsheet provenance stays in the download API; the dashboard uses observations.
    records: database.records
      .filter((r) => r.year === year)
      .map((record) => {
        const {
          source: _source,
          sheet: _sheet,
          row: _row,
          column: _column,
          ...observation
        } = record;
        return observation;
      }),
    trend: database.years.map((y) => ({
      year: y,
      victims: database.totals.find((t) => t.year === y && t.dataset === "victims")?.value ?? 0,
      reports: database.totals.find((t) => t.year === y && t.dataset === "reports")?.value ?? 0,
    })),
    sources: database.sources,
    qualityNotes: database.qualityNotes.filter((n) => n.year === year),
    regionHistory,
  };
}
