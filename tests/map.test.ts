import { describe, expect, it } from "vite-plus/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { countyColor, mapScale, taiwanMap } from "../src/lib/map";
import { database } from "../src/lib/data.server";
import sources from "../data/geo/source.json";

describe("Taiwan county choropleth", () => {
  it("joins all 22 boundaries to both statistical measures in every year", () => {
    const names = taiwanMap.counties.map((c) => c.name).sort();
    expect(new Set(names).size).toBe(22);
    expect(names).toContain("連江縣");
    expect(names).toContain("金門縣");
    expect(names).toContain("澎湖縣");
    for (const year of database.years)
      for (const dataset of ["victims", "reports"]) {
        const rows = database.records
          .filter((r) => r.dataset === "victims" || r.dataset === "reports")
          .filter((r) => r.year === year && r.dataset === dataset);
        expect(rows.map((r) => r.city).sort()).toEqual(names);
      }
  });
  it("uses fixed count bins and distinguishes missing data from zero", () => {
    expect(countyColor(0)).toBe(mapScale[0].color);
    expect(countyColor(99)).toBe(mapScale[0].color);
    expect(countyColor(100)).toBe(mapScale[1].color);
    expect(countyColor(999)).toBe(mapScale[3].color);
    expect(countyColor(1000)).toBe(mapScale[4].color);
    expect(countyColor(1500)).toBe(mapScale[5].color);
    expect(countyColor(undefined)).not.toBe(countyColor(0));
  });
  it("retains pinned geographic source checksums", () => {
    for (const source of sources.files) {
      const bytes = readFileSync(new URL(`../data/geo/${source.file}`, import.meta.url));
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(source.sha256);
    }
  });
});
