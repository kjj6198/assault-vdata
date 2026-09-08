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
    <div className="mt-3">
      <div className="flex flex-col items-start justify-between gap-5 pt-3 pb-6 lg:flex-row lg:gap-8 [&_h3]:text-xl [&_h3]:leading-[1.5] [&_h3]:font-bold [&_h3]:text-balance [&_p]:mt-2 [&_p]:max-w-[65ch] [&_p]:text-label [&_p]:leading-[1.8] [&_p]:text-pretty [&_p]:text-muted-foreground">
        <div>
          <h3>{year} 年・縣市數據比較</h3>
          <p>查看原始數量與人口換算結果，或搜尋你的縣市。</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:shrink-0">
          <div className="relative min-w-0 flex-[1_1_220px] lg:max-w-64">
            <label className="sr-only" htmlFor={searchId}>
              搜尋縣市
            </label>
            <RiSearchLine
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id={searchId}
              type="search"
              className="min-h-11 bg-card pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜尋縣市，例如台北"
            />
          </div>
          <DataSelect
            label="縣市數據排序"
            className="max-sm:w-full"
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
        className="max-w-full overflow-x-auto overscroll-x-contain"
        tabIndex={0}
        role="region"
        aria-label={`${year} 年縣市數據表，可左右捲動`}
      >
        <table
          id={tableId}
          className="w-full min-w-135 border-collapse text-caption leading-[1.7] [&_[data-emphasis]]:font-bold [&_[data-emphasis]]:text-primary [&_button]:inline-flex [&_button]:min-h-11 [&_button]:items-center [&_button]:gap-3 [&_button]:text-primary [&_button]:underline [&_button]:underline-offset-4 [&_button_span]:text-caption [&_button_span]:no-underline [&_caption]:text-left [&_small]:font-normal [&_small]:whitespace-nowrap [&_tbody_th]:text-label [&_tbody_th]:font-bold [&_tbody_tr:hover]:bg-muted [&_td]:border-b [&_td]:border-border [&_td]:tabular-nums [&_td:not([colspan])]:px-3.5 [&_td:not([colspan])]:py-3.25 [&_td:not([colspan])]:text-right [&_td:not([colspan])]:font-numeric [&_td:not([colspan])]:text-label [&_td:not([colspan])]:whitespace-nowrap [&_th]:border-b [&_th]:border-border [&_th]:px-3.5 [&_th]:py-3.25 [&_th]:text-right [&_th]:font-normal [&_th:first-child]:text-left [&_thead]:bg-muted [&_thead]:text-caption [&_thead]:text-muted-foreground [&_tr[data-selected]]:bg-muted"
        >
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
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center font-sans text-label whitespace-normal [&_button]:ml-3"
                >
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
      <div className="flex items-center justify-between gap-3 py-3 text-caption text-muted-foreground max-sm:flex-wrap">
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
