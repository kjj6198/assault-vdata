import { describe, expect, it } from "vite-plus/test";
import { database, getDashboard, dataResponse } from "../src/lib/data.server";

describe("the published MOHW data", () => {
  it("reconciles national totals with additional suspect coverage from 2015", () => {
    expect(database.years).toEqual(Array.from({ length: 18 }, (_, i) => 2008 + i));
    expect(database.records).toHaveLength(5760);
    for (const year of database.years) {
      const rows = database.records.filter((r) => r.year === year);
      const annual = database.totals.filter((r) => r.year === year);
      expect(annual).toHaveLength(year >= 2015 ? 5 : 4);
      for (const t of annual)
        expect(rows.filter((r) => r.dataset === t.dataset).reduce((n, r) => n + r.value, 0)).toBe(
          t.value,
        );
      const people = annual
        .filter((r) => r.dataset !== "reports" && r.dataset !== "suspects")
        .map((r) => r.value);
      expect(new Set(people).size).toBe(1);
      expect(rows.filter((r) => r.dataset === "victims")).toHaveLength(22);
      expect(rows.filter((r) => r.dataset === "reports")).toHaveLength(22);
    }
  });
  it("extracts annual suspect totals across three sheets without double-counting partial years", () => {
    const expected = [
      [2015, 9069, 661, 985],
      [2016, 7120, 554, 901],
      [2017, 6976, 549, 1131],
      [2018, 7235, 559, 1040],
      [2019, 6534, 753, 403],
      [2020, 7350, 986, 315],
      [2021, 6316, 736, 206],
      [2022, 6874, 783, 208],
      [2023, 7600, 883, 248],
      [2024, 7442, 790, 239],
      [2025, 7664, 828, 276],
    ];
    for (const [year, male, female, remaining] of expected) {
      const rows = getDashboard(year).records.filter((r) => r.dataset === "suspects");
      expect(rows.find((r) => r.gender === "男")?.value).toBe(male);
      expect(rows.find((r) => r.gender === "女")?.value).toBe(female);
      expect(rows.reduce((total, r) => total + r.value, 0)).toBe(male + female + remaining);
      expect(rows.map((r) => r.gender).sort()).toEqual(
        (year < 2019
          ? ["男", "女", "不詳"]
          : year < 2021
            ? ["男", "女", "其他"]
            : ["男", "女", "其他", "不詳"]
        ).sort(),
      );
    }
    expect(getDashboard(2014).records.some((r) => r.dataset === "suspects")).toBe(false);
    expect(
      getDashboard(2025).records.find((r) => r.dataset === "suspects" && r.gender === "男"),
    ).toMatchObject({
      sheet: "歷年(2021~)",
      row: 39,
      column: 33,
      value: 7664,
    });
  });
  it("matches independently inspected 2025 workbook cells and preserves zeros", () => {
    const { records } = getDashboard(2025);
    expect(records.find((r) => r.dataset === "victims" && r.city === "新北市")?.value).toBe(1745);
    expect(
      records.find(
        (r) => r.dataset === "demographics" && r.gender === "女" && r.age === "12–未滿18歲",
      )?.value,
    ).toBe(2877);
    expect(
      records.find(
        (r) =>
          r.dataset === "relationships" && r.relationship === "直系親屬" && r.age === "0–未滿6歲",
      )?.value,
    ).toBe(83);
    expect(
      records.find(
        (r) =>
          r.dataset === "relationships" && r.relationship === "婚姻中" && r.age === "0–未滿6歲",
      )?.value,
    ).toBe(0);
  });
  it("does not turn unpublished categories into zero observations", () => {
    expect(
      database.records.some(
        (r) => r.dataset === "demographics" && r.year < 2019 && r.gender === "其他",
      ),
    ).toBe(false);
    expect(
      database.records.some(
        (r) => r.dataset === "relationships" && r.year === 2019 && r.relationship === "男女朋友",
      ),
    ).toBe(false);
    expect(
      database.records.some(
        (r) => r.dataset === "relationships" && r.year === 2020 && r.relationship === "男女朋友",
      ),
    ).toBe(true);
  });
  it("retains all known published inconsistencies instead of changing counts", () => {
    expect(database.qualityNotes).toHaveLength(10);
    expect(database.qualityNotes).toContainEqual({
      kind: "published-row-total-difference",
      year: 2024,
      age: "0~6歲未滿",
      source: "relationships-2024.ods",
      row: 7,
      published: 269,
      computed: 266,
    });
    expect(getDashboard(2020).qualityNotes).toHaveLength(7);
    expect(getDashboard(2025).qualityNotes).toEqual([]);
    expect(() => getDashboard(2026)).toThrow();
  });
});

describe("the real API handler", () => {
  it("filters records by year, dataset, and city", async () => {
    const response = dataResponse(
      new Request("http://localhost/api/v1/data?year=2025&dataset=victims&city=新北市"),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.count).toBe(1);
    expect(body.records[0].value).toBe(1745);
    expect(body.sources.length).toBeGreaterThan(4);
  });
  it.each([
    "year=banana",
    "year=2026",
    "year=2025.0",
    "year=",
    "dataset=unknown",
    "format=exe",
    "city=unknown",
    "city=臺北市&dataset=demographics",
    "city=臺北市&dataset=suspects",
    "typo=1",
  ])("rejects invalid query: %s", (query) => {
    expect(dataResponse(new Request(`http://localhost/api/v1/data?${query}`)).status).toBe(400);
  });
  it("exports suspect gender observations with sheet-level provenance and leaves missing years empty", async () => {
    const response = dataResponse(
      new Request("http://localhost/api/v1/data?dataset=suspects&year=2025&format=csv"),
    );
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(text.split("\r\n")).toHaveLength(5);
    expect(text).toContain('"suspects","2025","7664","","","男"');
    expect(text).toContain('"歷年(2021~)","39","33"');
    const missing = await dataResponse(
      new Request("http://localhost/api/v1/data?dataset=suspects&year=2014"),
    ).json();
    expect(missing.count).toBe(0);
  });
  it("exports CSV with a BOM, exact records, and provenance columns", async () => {
    const response = dataResponse(
      new Request("http://localhost/api/v1/data?dataset=victims&year=2025&format=csv"),
    );
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(Array.from(bytes.slice(0, 3))).toEqual([239, 187, 191]);
    const text = new TextDecoder().decode(bytes);
    expect(text.split("\r\n")).toHaveLength(23);
    expect(text).toContain("source,sheet,row,column");
    expect(text).toContain('"1745","新北市"');
    expect(response.headers.get("Content-Disposition")).toContain("attachment");
  });
});
