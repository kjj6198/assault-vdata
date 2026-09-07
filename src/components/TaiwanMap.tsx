import {
  type RegionMeasure,
  type RegionRow,
  rateColor,
  rateLegend,
  zeroRateColor,
  formatRate,
} from "../lib/regions";
import { useState } from "react";
import { DataSelect } from "./DataSelect";
import { Card } from "./ui/card";
import { taiwanMap, mapScale, countyColor } from "../lib/map";
import { formatNumber, percent } from "../lib/data";

type Props = {
  year: number;
  metric: "victims" | "reports";
  rows: RegionRow[];
  measure: RegionMeasure;
};
export function TaiwanMap({ year, metric, rows, measure }: Props) {
  const [selected, setSelected] = useState("新北市");
  const [hovered, setHovered] = useState<string | null>(null);
  const active = hovered ?? selected;
  const byCity = new Map(rows.map((r) => [r.city, r.value]));
  const value = byCity.get(active);
  const total = rows.reduce((n, r) => n + r.value, 0);
  const activeRow = rows.find((r) => r.city === active);
  const displayValue = measure === "rate" ? (activeRow?.rate ?? null) : (value ?? null);
  const rank =
    displayValue === null
      ? null
      : rows.filter((r) => (measure === "rate" ? (r.rate ?? -1) : r.value) > displayValue).length +
        1;
  const legend = measure === "rate" ? rateLegend : mapScale;
  const unit = metric === "victims" ? "人" : "件";
  const label = metric === "victims" ? "受暴人數" : "通報件數";
  return (
    <div className="county-map-panel">
      <div className="map-title">
        <h3>
          {year} 年・台灣{label}
          {measure === "rate" ? "每十萬人口比率" : "分布"}
        </h3>
        <span>顏色越深，{measure === "rate" ? "比率越高・固定六級" : "數量越多"}</span>
      </div>
      <div className="county-map-layout">
        <div className="map-drawing">
          <svg
            viewBox={`0 0 ${taiwanMap.width} ${taiwanMap.height}`}
            className="taiwan-map"
            role="group"
            aria-label={`${year} 年台灣縣市${label}地圖；可用 Tab、Enter 選擇縣市`}
          >
            <g className="island-insets" aria-hidden="true">
              {taiwanMap.insets.map((inset) => (
                <g key={inset.name}>
                  <path d={inset.path} />
                  <text x={inset.bounds[0][0] + 7} y={inset.bounds[0][1] + 17}>
                    {inset.name === "烏坵鄉" ? "烏坵" : inset.name}
                  </text>
                </g>
              ))}
            </g>
            <g>
              {taiwanMap.counties.map((county) => {
                const count = byCity.get(county.name);
                const row = rows.find((r) => r.city === county.name);
                const description = `${county.name}：${count === undefined ? "無資料" : `${formatNumber(count)} ${unit}`}；每十萬人口 ${formatRate(row?.rate ?? null)} ${unit}`;
                return (
                  <path
                    key={county.code}
                    d={county.path}
                    data-county={county.name}
                    fill={measure === "rate" ? rateColor(row?.rate ?? null) : countyColor(count)}
                    className={active === county.name ? "county-shape is-active" : "county-shape"}
                    tabIndex={0}
                    role="button"
                    aria-label={description}
                    aria-pressed={selected === county.name}
                    onMouseEnter={() => setHovered(county.name)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(county.name)}
                    onBlur={() => setHovered(null)}
                    onClick={() => setSelected(county.name)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelected(county.name);
                      }
                    }}
                  >
                    <title>{description}</title>
                  </path>
                );
              })}
            </g>
            <g className="map-compass" transform="translate(535,85)" aria-hidden="true">
              <path d="M0 20V-10m-5 8 5-8 5 8" />
              <text y="-21" textAnchor="middle">
                N
              </text>
            </g>
          </svg>
          <p className="map-inset-note">離島採內嵌圖，位置經移置。點選或移至縣市，可查看數值。</p>
        </div>
        <Card className="map-detail">
          <label htmlFor="map-city">
            選擇縣市
            <DataSelect
              id="map-city"
              label="選擇縣市"
              value={selected}
              onValueChange={(value) => {
                setSelected(value);
                setHovered(null);
              }}
              options={taiwanMap.counties.map((county) => ({
                value: county.name,
                label: county.name,
              }))}
            />
          </label>
          <div className="map-detail-value" aria-live="polite" aria-atomic="true">
            <p>
              {year} 年・{label}
            </p>
            <h4>{active}</h4>
            <strong>
              {measure === "rate"
                ? formatRate(activeRow?.rate ?? null)
                : value === undefined
                  ? "—"
                  : formatNumber(value)}
              <small>{measure === "rate" ? `${unit}／十萬人` : unit}</small>
            </strong>
            <p className="map-population">
              年底人口{" "}
              {activeRow?.population == null ? "無資料" : formatNumber(activeRow.population)} 人
            </p>
            <div className="map-detail-stats">
              <span>
                {measure === "rate" ? "原始數量" : "占全國"}
                <b>
                  {value === undefined
                    ? "—"
                    : measure === "rate"
                      ? `${formatNumber(value)} ${unit}`
                      : `${percent(value, total)}%`}
                </b>
              </span>
              <span>
                {measure === "rate" ? "縣市比率排序" : "縣市數量排序"}
                <b>{rank === null ? "—" : `${rank} / 22`}</b>
              </span>
            </div>
          </div>
          <div className="map-key">
            <p>
              {measure === "rate" ? "每十萬人口分級" : "色階範圍"}{" "}
              <span>{measure === "rate" ? `${unit}／十萬人` : `單位：${unit}`}</span>
            </p>
            <ul>
              {legend.map((step) => (
                <li key={step.min}>
                  <i style={{ background: step.color }} />
                  <span>{step.label}</span>
                </li>
              ))}
            </ul>
            {measure === "rate" && (
              <p className="map-zero-key">
                <i style={{ background: zeroRateColor }} />
                0（零紀錄）
              </p>
            )}
            <p className="map-key-note">
              {measure === "rate"
                ? "色階界線固定為 25、35、45、60、80，各年度共用。零值留白，缺少人口時顯示灰色。"
                : "各年度與兩種指標使用同一組數量區間。"}
            </p>
          </div>
        </Card>
      </div>
      <div className="map-source">
        <p>
          界線：
          <a href="https://data.gov.tw/dataset/7442" target="_blank" rel="noreferrer">
            內政部國土測繪中心
          </a>
          ／
          <a href="https://github.com/dkaoster/taiwan-atlas" target="_blank" rel="noreferrer">
            Taiwan Atlas（2021.9.20）
          </a>
        </p>
        <a href="/geo/taiwan-counties.geojson" download>
          下載 GeoJSON ↓
        </a>
      </div>
    </div>
  );
}
