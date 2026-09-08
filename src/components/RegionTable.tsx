import { useId, useState } from "react";
import { RiSearchLine, RiAddLine, RiSubtractLine } from "react-icons/ri";
import { formatNumber } from "../lib/data";
import { formatRate, type RegionMeasure, type RegionRow } from "../lib/regions";
import { DataSelect } from "./DataSelect";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useI18n } from "../i18n";

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
  const { t, name, intl } = useI18n();
  const search = query.trim().toLowerCase();
  const rawSearch = search.replaceAll("台", "臺");
  const cityName = (city: string) => name("city", city);
  const byName = (a: RegionRow, b: RegionRow) =>
    cityName(a.city).localeCompare(cityName(b.city), intl);
  const sorted = [...rows].sort((a, b) =>
    sort === "name"
      ? byName(a, b)
      : (measure === "rate" ? (b.rate ?? -1) - (a.rate ?? -1) : b.value - a.value) || byName(a, b),
  );
  const matches = sorted.filter(
    (row) => row.city.includes(rawSearch) || cityName(row.city).toLowerCase().includes(search),
  );
  const visible = showAll || search ? matches : matches.slice(0, 5);
  const unit = t.unit[metric === "victims" ? "people" : "reports"];
  const label = t.metric[metric];

  return (
    <div className="mt-3">
      <div className="flex flex-col items-start justify-between gap-5 pt-3 pb-6 lg:flex-row lg:gap-8 [&_h3]:text-xl [&_h3]:leading-normal [&_h3]:font-bold [&_h3]:text-balance [&_p]:mt-2 [&_p]:max-w-[65ch] [&_p]:text-label [&_p]:leading-[1.8] [&_p]:text-pretty [&_p]:text-muted-foreground">
        <div>
          <h3>{t.table.heading(year)}</h3>
          <p>{t.table.intro}</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:shrink-0">
          <div className="relative min-w-0 flex-[1_1_220px] lg:max-w-64">
            <label className="sr-only" htmlFor={searchId}>
              {t.table.search}
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
              placeholder={t.table.placeholder}
            />
          </div>
          <DataSelect
            label={t.table.sortAria}
            className="max-sm:w-full"
            value={sort}
            onValueChange={setSort}
            options={[
              { value: "value", label: measure === "rate" ? t.table.sortRate : t.table.sortCount },
              { value: "name", label: t.table.sortName },
            ]}
          />
        </div>
      </div>
      <div
        className="max-w-full overflow-x-auto overscroll-x-contain"
        tabIndex={0}
        role="region"
        aria-label={t.table.regionAria(year)}
      >
        <table
          id={tableId}
          className="w-full min-w-135 border-collapse text-caption leading-[1.7] **:data-emphasis:font-bold **:data-emphasis:text-primary [&_button]:inline-flex [&_button]:min-h-11 [&_button]:items-center [&_button]:gap-3 [&_button]:text-primary [&_button]:underline [&_button]:underline-offset-4 [&_button_span]:text-caption [&_button_span]:no-underline [&_caption]:text-left [&_small]:font-normal [&_small]:whitespace-nowrap [&_tbody_th]:text-label [&_tbody_th]:font-bold [&_tbody_tr:hover]:bg-muted [&_td]:border-b [&_td]:border-border [&_td]:tabular-nums [&_td:not([colspan])]:px-3.5 [&_td:not([colspan])]:py-3.25 [&_td:not([colspan])]:text-right [&_td:not([colspan])]:font-numeric [&_td:not([colspan])]:text-label [&_td:not([colspan])]:whitespace-nowrap [&_th]:border-b [&_th]:border-border [&_th]:px-3.5 [&_th]:py-3.25 [&_th]:text-right [&_th]:font-normal [&_th:first-child]:text-left [&_thead]:bg-muted [&_thead]:text-caption [&_thead]:text-muted-foreground [&_tr[data-selected]]:bg-muted"
        >
          <caption className="sr-only">{t.table.caption(year, label)}</caption>
          <thead>
            <tr>
              <th scope="col">{t.table.city}</th>
              <th scope="col" data-emphasis={measure === "count" || undefined}>
                {label} <small>{t.perUnit(unit)}</small>
              </th>
              <th scope="col" data-emphasis={measure === "rate" || undefined}>
                {t.table.perHundredK} <small>{t.perUnit(unit)}</small>
              </th>
              <th scope="col">
                {t.table.population} <small>{t.perUnit(t.unit.people)}</small>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.city}>
                <th scope="row">{cityName(row.city)}</th>
                <td data-emphasis={measure === "count" || undefined}>{formatNumber(row.value)}</td>
                <td data-emphasis={measure === "rate" || undefined}>{formatRate(row.rate)}</td>
                <td>{row.population === null ? t.noData : formatNumber(row.population)}</td>
              </tr>
            ))}
            {matches.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center font-sans text-label whitespace-normal [&_button]:ml-3"
                >
                  {t.table.noMatch(query.trim())}
                  <button type="button" onClick={() => setQuery("")}>
                    {t.table.clear}
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 py-3 text-caption text-muted-foreground max-sm:flex-wrap">
        <output>
          {search ? t.table.matched(matches.length) : t.table.showing(visible.length, rows.length)}
        </output>
        {!search && rows.length > 5 && (
          <Button
            variant="ghost"
            aria-expanded={showAll}
            aria-controls={tableId}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? t.table.collapse : t.table.showAll(rows.length)}
            {showAll ? <RiSubtractLine aria-hidden="true" /> : <RiAddLine aria-hidden="true" />}
          </Button>
        )}
      </div>
    </div>
  );
}
