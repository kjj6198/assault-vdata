import {
  type RegionMeasure,
  type RegionRow,
  rateColor,
  rateLegend,
  zeroRateColor,
  formatRate,
} from "../lib/regions";
import { useState } from "react";
import { RiDownloadLine } from "react-icons/ri";
import { cn } from "@/lib/utils";
import { DataSelect } from "./DataSelect";
import { AnimatedValue, AnimatedNumber } from "./StoryMotion";
import { Card } from "./ui/card";
import { taiwanMap, mapScale, countyColor } from "../lib/map";
import { fixed1, formatNumber, share } from "../lib/data";
import { useI18n } from "../i18n";

type Props = {
  year: number;
  metric: "victims" | "reports";
  rows: RegionRow[];
  measure: RegionMeasure;
};
const keySwatch = "inline-block h-3 w-3 border border-border sm:w-4";
export function TaiwanMap({ year, metric, rows, measure }: Props) {
  const { t, name } = useI18n();
  const [selected, setSelected] = useState("新北市");
  const [hovered, setHovered] = useState<string | null>(null);
  const active = hovered ?? selected;
  const byCity = new Map(rows.map((r) => [r.city, r.value]));
  const value = byCity.get(active);
  const total = rows.reduce((n, r) => n + r.value, 0);
  const activeRow = rows.find((r) => r.city === active);
  const activeCounty = taiwanMap.counties.find((county) => county.name === active);
  const fillFor = (city: string) =>
    measure === "rate"
      ? rateColor(rows.find((r) => r.city === city)?.rate ?? null)
      : countyColor(byCity.get(city));
  const displayValue = measure === "rate" ? (activeRow?.rate ?? null) : (value ?? null);
  const rank =
    displayValue === null
      ? null
      : rows.filter((r) => (measure === "rate" ? (r.rate ?? -1) : r.value) > displayValue).length +
        1;
  const legend = measure === "rate" ? rateLegend : mapScale;
  const unit = t.unit[metric === "victims" ? "people" : "reports"];
  const label = t.metric[metric];
  return (
    <div className="mb-8.5 rounded-xl bg-surface-alt px-4 py-5.5 sm:px-5 sm:pt-7 sm:pb-5 md:px-8">
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
        <h3 className="text-base leading-[1.6] font-semibold">
          {t.map.heading(year, label, measure)}
        </h3>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(220px,1fr)] sm:gap-6 md:grid-cols-[minmax(0,1.65fr)_minmax(230px,0.8fr)] md:gap-12">
        <div className="min-w-0">
          <svg
            viewBox={`0 0 ${taiwanMap.width} ${taiwanMap.height}`}
            className="block h-auto max-h-162.5 w-full overflow-visible"
            role="group"
            aria-label={t.map.aria(year, label)}
          >
            <g aria-hidden="true">
              {taiwanMap.insets.map((inset) => (
                <g key={inset.name}>
                  <path
                    d={inset.path}
                    className="fill-transparent stroke-border stroke-[0.8] [stroke-dasharray:4_4]"
                  />
                  <text
                    x={inset.bounds[0][0] + 7}
                    y={inset.bounds[0][1] + 17}
                    className="fill-muted-foreground text-xs"
                  >
                    {name("inset", inset.name)}
                  </text>
                </g>
              ))}
            </g>
            <g>
              {taiwanMap.counties.map((county) => {
                const count = byCity.get(county.name);
                const row = rows.find((r) => r.city === county.name);
                const description = t.map.county(
                  name("city", county.name),
                  count === undefined ? t.noData : `${formatNumber(count)} ${unit}`,
                  formatRate(row?.rate ?? null),
                  unit,
                );
                return (
                  <path
                    key={county.code}
                    d={county.path}
                    data-county={county.name}
                    fill={fillFor(county.name)}
                    className={cn(
                      "cursor-pointer stroke-background stroke-1 outline-none [transition:fill_600ms_var(--ease-out-quart),opacity_200ms_var(--ease-out-quart)] [vector-effect:non-scaling-stroke] motion-reduce:duration-120",
                      active === county.name && "opacity-40",
                    )}
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
            {activeCounty && (
              <path
                key={activeCounty.code}
                d={activeCounty.path}
                fill={fillFor(activeCounty.name)}
                className="pointer-events-none -translate-x-1 -translate-y-1.5 animate-county-lift stroke-map-highlight stroke-[2.5] drop-shadow-county-lift [transition:fill_600ms_var(--ease-out-quart),opacity_200ms_var(--ease-out-quart)] [vector-effect:non-scaling-stroke] motion-reduce:translate-none motion-reduce:animate-none motion-reduce:drop-shadow-none motion-reduce:duration-120"
                aria-hidden="true"
              />
            )}
            <g transform="translate(535,85)" aria-hidden="true">
              <path
                d="M0 20V-10m-5 8 5-8 5 8"
                className="fill-none stroke-muted-foreground stroke-[1.5]"
              />
              <text y="-21" textAnchor="middle" className="fill-muted-foreground text-xs">
                N
              </text>
            </g>
          </svg>
          <p className="mt-3 mb-5 text-[0.6875rem] leading-[1.8] text-muted-foreground">
            {t.map.insetNote}
          </p>
        </div>
        <Card className="gap-0 rounded-none border-border bg-background p-5.5 shadow-none sm:p-5 md:p-6.5">
          <label htmlFor="map-city" className="flex flex-col gap-2.5 text-xs">
            {t.map.selectCity}
            <DataSelect
              id="map-city"
              label={t.map.selectCity}
              value={selected}
              onValueChange={(value) => {
                setSelected(value);
                setHovered(null);
              }}
              options={taiwanMap.counties.map((county) => ({
                value: county.name,
                label: name("city", county.name),
              }))}
              className="w-full"
            />
          </label>
          <div className="pt-5 sm:pt-6.5" aria-live="polite" aria-atomic="true">
            <p className="text-[0.6875rem] text-muted-foreground">
              {t.map.yearMetric(year, label)}
            </p>
            <h4 className="my-2.5 text-[1.875rem] leading-normal font-bold">
              <AnimatedValue value={name("city", active)} />
            </h4>
            <strong className="font-numeric text-5xl font-normal tabular-nums">
              {measure === "rate" ? (
                activeRow?.rate == null ? (
                  <AnimatedValue value="—" />
                ) : (
                  <AnimatedNumber key="rate" value={activeRow.rate} format={formatRate} />
                )
              ) : value === undefined ? (
                <AnimatedValue value="—" />
              ) : (
                <AnimatedNumber key="count" value={value} />
              )}
              <small className="ml-1.5 font-sans text-[0.6875rem] sm:ml-2.5 sm:text-caption">
                {measure === "rate" ? t.perHundredK(unit) : unit}
              </small>
            </strong>
            <p className="mt-3 text-[0.6875rem] text-muted-foreground">
              {t.map.population}{" "}
              {activeRow?.population == null ? (
                t.noData
              ) : (
                <AnimatedNumber value={activeRow.population} />
              )}{" "}
              {t.unit.people}
            </p>
            <div className="mt-3.5 mb-4.5 flex gap-7 sm:mb-6">
              <span className="text-[0.6875rem] text-muted-foreground">
                {measure === "rate" ? t.map.rawCount : t.map.shareNational}
                <b className="mt-1.5 block text-base font-medium text-primary tabular-nums">
                  {value === undefined ? (
                    "—"
                  ) : measure === "rate" ? (
                    <>
                      <AnimatedNumber key="count" value={value} /> {unit}
                    </>
                  ) : (
                    <>
                      <AnimatedNumber key="share" value={share(value, total)} format={fixed1} />%
                    </>
                  )}
                </b>
              </span>
              <span className="text-[0.6875rem] text-muted-foreground">
                {measure === "rate" ? t.map.rankRate : t.map.rankCount}
                <b className="mt-1.5 block text-base font-medium text-primary tabular-nums">
                  {rank === null ? (
                    "—"
                  ) : (
                    <>
                      <AnimatedNumber value={rank} /> / 22
                    </>
                  )}
                </b>
              </span>
            </div>
          </div>
          <div className="border-t border-border pt-5">
            <p className="flex justify-between text-[0.6875rem]">
              {measure === "rate" ? t.map.legendRate : t.map.legendCount}{" "}
              <span>{measure === "rate" ? t.perHundredK(unit) : t.map.unitLabel(unit)}</span>
            </p>
            <ul className="my-3.5 grid grid-cols-3 gap-x-3 gap-y-2.5 max-[23.125rem]:grid-cols-2 sm:grid-cols-2">
              {legend.map((step) => (
                <li
                  key={step.min}
                  className="flex items-center gap-1.25 text-[0.625rem] whitespace-nowrap sm:gap-2"
                >
                  <i className={keySwatch} style={{ background: step.color }} />
                  <span>{step.open ? t.atLeast(step.label) : step.label}</span>
                </li>
              ))}
            </ul>
            {measure === "rate" && (
              <p className="mb-3 flex items-center gap-2 text-[0.625rem]">
                <i className={keySwatch} style={{ background: zeroRateColor }} />
                {t.map.zero}
              </p>
            )}
            <p className="text-[0.625rem] leading-[1.9] text-muted-foreground">
              {measure === "rate" ? t.map.rateNote : t.map.countNote}
            </p>
          </div>
        </Card>
      </div>
      <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-border pt-3.75 text-[0.625rem] leading-[1.9] sm:mt-0">
        <p>
          {t.map.boundary}
          <a
            href="https://data.gov.tw/dataset/7442"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 underline underline-offset-[3px]"
          >
            {t.map.nlsc}
          </a>
          ／
          <a
            href="https://github.com/dkaoster/taiwan-atlas"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 underline underline-offset-[3px]"
          >
            {t.map.atlas}
          </a>
        </p>
        <a
          href="/geo/taiwan-counties.geojson"
          download
          className="inline-flex items-center gap-1.5 underline underline-offset-[3px]"
        >
          {t.map.downloadGeo} <RiDownloadLine aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
