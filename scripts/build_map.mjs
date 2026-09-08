import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { feature } from "topojson-client";
import { geoIdentity, geoPath } from "d3-geo";

const geographic = JSON.parse(
  readFileSync(new URL("../data/geo/counties.topo.json", import.meta.url), "utf8"),
);
const projected = JSON.parse(
  readFileSync(new URL("../data/geo/counties-mercator.topo.json", import.meta.url), "utf8"),
);
const normalize = (name) => name.replaceAll("台", "臺");
const geojson = feature(geographic, geographic.objects.counties);
for (const county of geojson.features)
  county.properties.COUNTYNAME = normalize(county.properties.COUNTYNAME);
const counties = feature(projected, projected.objects.counties);
const borders = feature(projected, projected.objects.compBorders);
const projection = geoIdentity().fitExtent(
  [
    [25, 25],
    [575, 625],
  ],
  counties,
);
const path = geoPath(projection).digits(2);
const data = {
  width: 600,
  height: 650,
  counties: counties.features.map((county) => ({
    name: normalize(county.properties.COUNTYNAME),
    code: county.properties.COUNTYCODE,
    path: path(county),
    center: path.centroid(county),
  })),
  insets: borders.features.map((border) => ({
    name: normalize(border.properties.NAME),
    path: path(border),
    bounds: path.bounds(border),
  })),
};
const stats = JSON.parse(readFileSync(new URL("../data/clean.json", import.meta.url), "utf8"));
const names = new Set(stats.records.filter((r) => r.dataset === "victims").map((r) => r.city));
if (
  data.counties.length !== 22 ||
  new Set(data.counties.map((c) => c.name)).size !== 22 ||
  data.counties.some((c) => !names.has(c.name) || !c.path || c.path.includes("NaN"))
)
  throw new Error("Map must match all 22 statistical counties");
writeFileSync(new URL("../data/geo/map-paths.json", import.meta.url), JSON.stringify(data) + "\n");
writeFileSync(
  new URL("../public/geo/taiwan-counties.geojson", import.meta.url),
  JSON.stringify(geojson) + "\n",
);
const source = {
  provider: "內政部國土測繪中心",
  source: "https://data.gov.tw/dataset/7442",
  redistribution: "https://github.com/dkaoster/taiwan-atlas",
  version: "2021.9.20",
  license: "政府資料開放授權條款第1版；Taiwan Atlas redistribution: MIT",
  note: "縣市名稱的台統一為臺；展示採 mercatorTw 離島內嵌投影，離島位置經移置，不用於測距。所有年度套用此縣市界線快照。",
  files: ["counties", "counties-mercator"].map((name) => ({
    file: `${name}.topo.json`,
    url: `https://cdn.jsdelivr.net/npm/taiwan-atlas@2021.9.20/${name}-10t.json`,
    sha256: createHash("sha256")
      .update(readFileSync(new URL(`../data/geo/${name}.topo.json`, import.meta.url)))
      .digest("hex"),
  })),
};
writeFileSync(
  new URL("../data/geo/source.json", import.meta.url),
  JSON.stringify(source, null, 2) + "\n",
);
console.log(
  "Built 22 county paths and downloadable geographic GeoJSON; all statistical joins match.",
);
console.log(data.insets.map((i) => ({ name: i.name, bounds: i.bounds })));
