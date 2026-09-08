import { describe, expect, it } from "vite-plus/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { populationDatabase } from "../src/lib/population.server";
import { database } from "../src/lib/data.server";
import { ratePer100k, ratePosition, rateAxisMax, rateColor, rateLegend } from "../src/lib/regions";
import { regionsResponse } from "../src/lib/regions.server";
describe("population-adjusted regional comparisons", () => {
  it("covers all 22 counties in every statistical year and reconciles national totals", () => {
    for (const year of database.years) {
      const rows = populationDatabase.records.filter((r) => r.year === year);
      expect(rows).toHaveLength(22);
      expect(new Set(rows.map((r) => r.city)).size).toBe(22);
      expect(rows.reduce((n, r) => n + r.population, 0)).toBe(
        populationDatabase.totals.find((r) => r.year === year)?.population,
      );
      for (const r of rows) expect(r.cells.reduce((n, c) => n + c.value, 0)).toBe(r.population);
    }
    expect(
      populationDatabase.records
        .find((r) => r.year === 2008 && r.city === "高雄市")
        ?.cells.map((c) => c.area)
        .sort(),
    ).toEqual(["高雄市", "高雄縣"]);
    expect(
      populationDatabase.records.find((r) => r.year === 2025 && r.city === "新北市")?.population,
    ).toBe(4044831);
  });
  it("preserves the downloaded population source checksum", () => {
    const bytes = readFileSync(new URL("../data/population/counties-age-sex.ods", import.meta.url));
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(populationDatabase.source.sha256);
  });
  it("keeps rates untransformed and distinguishes zero from absent population", () => {
    expect(ratePer100k(1508, 3897367)).toBeCloseTo(38.6928, 4);
    expect(ratePer100k(0, 10000)).toBe(0);
    expect(ratePer100k(10, null)).toBeNull();
    expect(ratePer100k(10, 0)).toBeNull();
    expect(ratePosition(0, 100)).toBe(0);
    expect(ratePosition(200, 200)).toBe(1);
    expect(ratePosition(500, 200)).toBe(1);
    expect(ratePosition(40, 100)).toBe(2 * ratePosition(20, 100));
    expect(rateAxisMax([null, 0])).toBe(25);
    expect(rateAxisMax([14.68, 81.52])).toBe(100);
    expect(rateAxisMax([112.75, 40])).toBe(125);
    expect(rateColor(null)).not.toBe(rateColor(0));
    expect(rateColor(0)).not.toBe(rateColor(1));
    for (const step of rateLegend.slice(1)) expect(rateColor(step.min)).toBe(step.color);
    const currentRates = database.records
      .filter((r) => r.dataset === "victims")
      .filter((r) => r.year === 2025)
      .map((r) =>
        ratePer100k(
          r.value,
          populationDatabase.records.find((p) => p.year === r.year && p.city === r.city)
            ?.population ?? null,
        ),
      );
    expect(new Set(currentRates.map(rateColor)).size).toBe(6);
  });
  it("exports raw counts, matched population, unrounded rate and provenance", async () => {
    const response = regionsResponse(
      new Request("http://localhost/api/v1/regions?year=2010&city=新北市"),
    );
    const body = await response.json();
    expect(body.records).toHaveLength(1);
    expect(body.records[0]).toMatchObject({
      count: 1508,
      population: 3897367,
      ratePer100k: (1508 / 3897367) * 100000,
    });
    expect(body.records[0].populationCells[0]).toMatchObject({ sheet: "99", column: 3 });
    const csv = regionsResponse(
      new Request("http://localhost/api/v1/regions?year=2025&dataset=reports&format=csv"),
    );
    expect((await csv.text()).trim().split("\r\n")).toHaveLength(23);
    expect(csv.headers.get("Content-Type")).toContain("text/csv");
  });
  it("rejects unsupported dataset, year, city and query fields", () => {
    for (const query of ["dataset=demographics", "year=1999", "city=不存在", "scale=log"])
      expect(regionsResponse(new Request(`http://localhost/api/v1/regions?${query}`)).status).toBe(
        400,
      );
  });
});
