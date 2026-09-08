import { useId, useState } from "react";
import { RiSearchLine, RiAddLine, RiSubtractLine } from "react-icons/ri";
import { formatNumber } from "../lib/data";
import { formatRate, type RegionMeasure, type RegionRow } from "../lib/regions";
import { DataSelect } from "./DataSelect";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type Props = {
  year: number;
  metric: "victims" | "reports";
  measure: RegionMeasure;
  rows: RegionRow[];
};

export function RegionTable({ year, metric, measure, rows }: Props) {
  const searchId = useId();
  const tableId = useId();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("value");
  const [showAll, setShowAll] = useState(false);
  const search = query.trim().replaceAll("台", "臺");
  const sorted = [...rows].sort((a, b) =>
    sort === "name"
      ? a.city.localeCompare(b.city, "zh-Hant")
      : (measure === "rate" ? (b.rate ?? -1) - (a.rate ?? -1) : b.value - a.value) ||
        a.city.localeCompare(b.city, "zh-Hant"),
  );
  const matches = sorted.filter((row) => row.city.includes(search));
  const visible = showAll || search ? matches : matches.slice(0, 5);
  const unit = metric === "victims" ? "人" : "件";
  const label = metric === "victims" ? "受暴人數" : "通報件數";

  return (
    <div className="region-table-panel">
      <div className="region-table-heading">
        <div>
          <h3>{year} 年・縣市數據比較</h3>
          <p>查看原始數量與人口換算結果，或搜尋你的縣市。</p>
        </div>
        <div className="region-table-controls">
          <div className="region-search">
            <label className="sr-only" htmlFor={searchId}>
              搜尋縣市
            </label>
            <RiSearchLine aria-hidden="true" />
            <Input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜尋縣市，例如台北"
            />
          </div>
          <DataSelect
            label="縣市數據排序"
            value={sort}
            onValueChange={setSort}
            options={[
              { value: "value", label: measure === "rate" ? "比率由高到低" : "數量由多到少" },
              { value: "name", label: "依縣市名稱" },
            ]}
          />
        </div>
      </div>
      <div
        className="data-table-scroll"
        tabIndex={0}
        role="region"
        aria-label={`${year} 年縣市數據表，可左右捲動`}
      >
        <table id={tableId} className="data-table region-data-table">
          <caption className="sr-only">
            {year} 年各縣市{label}、每十萬人口比率與年底人口
          </caption>
          <thead>
            <tr>
              <th scope="col">縣市</th>
              <th scope="col" data-emphasis={measure === "count" || undefined}>
                {label} <small>／{unit}</small>
              </th>
              <th scope="col" data-emphasis={measure === "rate" || undefined}>
                每十萬人口 <small>／{unit}</small>
              </th>
              <th scope="col">
                年底人口 <small>／人</small>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.city}>
                <th scope="row">{row.city}</th>
                <td data-emphasis={measure === "count" || undefined}>{formatNumber(row.value)}</td>
                <td data-emphasis={measure === "rate" || undefined}>{formatRate(row.rate)}</td>
                <td>{row.population === null ? "無資料" : formatNumber(row.population)}</td>
              </tr>
            ))}
            {matches.length === 0 && (
              <tr>
                <td colSpan={4} className="table-empty">
                  找不到「{query.trim()}」相關縣市。
                  <button type="button" onClick={() => setQuery("")}>
                    清除搜尋
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="region-table-footer">
        <output>
          {search
            ? `符合搜尋：${matches.length} 個縣市`
            : `顯示 ${visible.length} / ${rows.length} 個縣市`}
        </output>
        {!search && rows.length > 5 && (
          <Button
            variant="ghost"
            aria-expanded={showAll}
            aria-controls={tableId}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "收合為前 5 個" : `查看全部 ${rows.length} 個縣市`}
            {showAll ? <RiSubtractLine aria-hidden="true" /> : <RiAddLine aria-hidden="true" />}
          </Button>
        )}
      </div>
    </div>
  );
}
