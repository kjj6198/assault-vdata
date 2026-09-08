import { describe, expect, it } from "vite-plus/test";
import { database } from "../src/lib/data.server";
import { taiwanMap } from "../src/lib/map";
import { en } from "../src/i18n/en";
import { ja } from "../src/i18n/ja";
import type { LabelKind, Labels } from "../src/i18n/zh";

const dataValues: Record<LabelKind, Set<string>> = {
  city: new Set(database.records.flatMap((r) => ("city" in r ? [r.city] : []))),
  inset: new Set(taiwanMap.insets.map((inset) => inset.name)),
  age: new Set(database.ages),
  gender: new Set(database.records.flatMap((r) => ("gender" in r ? [r.gender] : []))),
  relationship: new Set(
    database.records.flatMap((r) => ("relationship" in r ? [r.relationship] : [])),
  ),
};

describe.each<[string, Labels]>([
  ["en", en.labels],
  ["ja", ja.labels],
])("%s data labels", (_locale, labels) => {
  it.each(Object.keys(dataValues) as LabelKind[])(
    "translate every %s in the dataset with a distinct name",
    (kind) => {
      const missing = [...dataValues[kind]].filter((value) => !labels[kind][value]);
      expect(missing).toEqual([]);
      for (const year of database.years) {
        const yearValues = database.records
          .filter((r) => r.year === year)
          .flatMap((r) => (kind in r ? [String(r[kind as keyof typeof r])] : []));
        const translated = [...new Set(yearValues)].map((value) => labels[kind][value]);
        expect(new Set(translated).size).toBe(translated.length);
      }
    },
  );
});
