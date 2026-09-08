import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useAnimationFrame, useReducedMotion } from "motion/react";
import { RiGroupLine, RiPauseFill, RiPlayFill, RiRestartLine } from "react-icons/ri";
import {
  type RegionMeasure,
  formatRate,
  ratePer100k,
  rateAxisMax,
  rateColor,
  ratePosition,
} from "../lib/regions";
import { formatNumber } from "../lib/data";
import { AnimatedValue } from "./StoryMotion";
import { Button } from "./ui/button";

export type RegionHistoryRow = {
  year: number;
  city: string;
  victims: number;
  reports: number;
  population: number | null;
};
type Props = {
  history: RegionHistoryRow[];
  metric: "victims" | "reports";
  measure: RegionMeasure;
  startYear: number;
};
/** Milliseconds the race spends moving from one year to the next. */
const YEAR_MS = 2400;
/** Counties shown at once; the rest wait just below the list and fade in when they climb. */
const TOP = 10;
const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

export function RegionRace({ history, metric, measure, startYear }: Props) {
  const reduced = useReducedMotion();
  const years = useMemo(
    () =>
      [...new Set(history.map((r) => r.year))].filter((y) => y >= startYear).sort((a, b) => a - b),
    [history, startYear],
  );
  const lastYear = years.at(-1) ?? startYear;
  const [time, setTime] = useState(startYear);
  const [playing, setPlaying] = useState(false);
  const atEnd = time >= lastYear;
  const running = playing && !atEnd;
  useAnimationFrame((_, delta) => {
    if (!running || reduced) return;
    setTime((current) => Math.min(lastYear, current + delta / YEAR_MS));
  });
  useEffect(() => {
    if (!running || !reduced) return;
    const timer = window.setTimeout(
      () => setTime((current) => Math.min(lastYear, Math.floor(current) + 1)),
      YEAR_MS,
    );
    return () => window.clearTimeout(timer);
  }, [running, reduced, time, lastYear]);

  const byCity = useMemo(() => {
    const map = new Map<string, Map<number, RegionHistoryRow>>();
    for (const r of history) {
      if (r.year < startYear) continue;
      if (!map.has(r.city)) map.set(r.city, new Map());
      map.get(r.city)?.set(r.year, r);
    }
    return map;
  }, [history, startYear]);
  const scale = useMemo(() => {
    const frames = history
      .filter((r) => r.year >= startYear)
      .map((r) => ({ value: r[metric], rate: ratePer100k(r[metric], r.population) }));
    return {
      rate: rateAxisMax(frames.map((r) => r.rate)),
      count: Math.max(1, ...frames.map((r) => r.value)),
    };
  }, [history, metric, startYear]);

  const year0 = Math.min(Math.floor(time), lastYear);
  const year1 = Math.min(year0 + 1, lastYear);
  const fraction = year1 === year0 ? 0 : time - year0;
  const rows = [...byCity.entries()]
    .map(([city, byYear]) => {
      const a = byYear.get(year0);
      const b = byYear.get(year1) ?? a;
      if (!a || !b) return null;
      const value = lerp(a[metric], b[metric], fraction);
      const population =
        a.population === null || b.population === null
          ? null
          : lerp(a.population, b.population, fraction);
      return { city, value, population, rate: ratePer100k(value, population) };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  const ranked = [...rows].sort((a, b) =>
    measure === "rate" ? (b.rate ?? -1) - (a.rate ?? -1) : b.value - a.value,
  );
  const rankOf = new Map(ranked.map((r, i) => [r.city, i]));
  const unit = metric === "victims" ? "人" : "件";
  const label = running ? "暫停" : atEnd ? "重播" : "播放";
  const togglePlay = () => {
    if (atEnd) {
      setTime(startYear);
      setPlaying(true);
      return;
    }
    setPlaying(!playing);
  };
  return (
    <div>
      <div className="flex flex-col items-stretch gap-4 pt-1 pb-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-8 sm:gap-y-5">
        <div
          className="flex flex-col gap-1.5 text-xs text-muted-foreground"
          aria-live={running ? "off" : "polite"}
        >
          <span>年度</span>
          <strong className="font-numeric text-[clamp(44px,5vw,64px)] leading-none font-semibold tracking-[-0.02em] text-foreground tabular-nums">
            <AnimatedValue value={String(year0)} />
          </strong>
        </div>
        <div className="flex flex-1 items-center justify-between gap-5 sm:min-w-[280px] sm:justify-end">
          <Button
            variant="outline"
            className="min-w-[100px]"
            onClick={togglePlay}
            aria-label={label}
            aria-pressed={running}
          >
            {running ? (
              <RiPauseFill aria-hidden="true" />
            ) : atEnd ? (
              <RiRestartLine aria-hidden="true" />
            ) : (
              <RiPlayFill aria-hidden="true" />
            )}
            {label}
          </Button>
          <label className="flex w-[min(360px,100%)] flex-col gap-0.5">
            <span className="sr-only">拖曳選擇年度</span>
            <input
              className="min-h-11 w-full border-0 bg-transparent p-0 accent-primary"
              type="range"
              min={startYear}
              max={lastYear}
              step={0.01}
              value={time}
              aria-valuetext={`${year0} 年`}
              onChange={(event) => {
                setPlaying(false);
                setTime(Number(event.target.value));
              }}
            />
            <span
              className="flex justify-between text-[11px] text-muted-foreground tabular-nums"
              aria-hidden="true"
            >
              <span>{startYear}</span>
              <span>{lastYear}</span>
            </span>
          </label>
        </div>
      </div>
      <p className="pt-3 pb-1 text-[11px] leading-[1.8] text-muted-foreground">
        {measure === "rate"
          ? `長條刻度：0–${scale.rate}／十萬人・${startYear}–${lastYear} 年共用同一刻度，年與年之間的數值為線性內插`
          : `長條刻度依 ${startYear}–${lastYear} 年最大值固定，年與年之間的數值為線性內插`}
      </p>
      <div
        className="relative h-[calc(var(--rows)*var(--row-height))] overflow-hidden border-t border-border [--row-height:64px]"
        style={{ "--rows": TOP } as CSSProperties}
      >
        {rows.map((r) => {
          const rank = rankOf.get(r.city) ?? 0;
          return (
            <div
              className="absolute inset-x-0 top-0 grid h-(--row-height) translate-y-[calc(var(--rank)*var(--row-height))] grid-cols-[20px_78px_1fr_50px_56px] items-center gap-2 border-b border-border text-[13px] tabular-nums will-change-transform [transition:translate_600ms_var(--ease-out-quart),opacity_400ms_ease] data-out:pointer-events-none data-out:opacity-0 motion-reduce:transition-none sm:grid-cols-[26px_96px_1fr_64px_72px] sm:gap-4"
              key={r.city}
              data-out={rank >= TOP || undefined}
              aria-hidden={rank >= TOP || undefined}
              style={{ "--rank": Math.min(rank, TOP) } as CSSProperties}
            >
              <span className="text-xs text-muted-foreground tabular-nums" aria-hidden="true">
                {rank + 1}
              </span>
              <span>
                {r.city}
                <small className="mt-1.25 block text-[10px] whitespace-nowrap text-muted-foreground [&_svg]:mr-1 [&_svg]:inline [&_svg]:[vertical-align:-0.15em]">
                  <RiGroupLine aria-hidden="true" />
                  <span className="sr-only">人口</span>
                  {r.population === null ? "無資料" : formatNumber(Math.round(r.population))}
                </small>
              </span>
              <span className="block h-2 bg-secondary" aria-hidden="true">
                <i
                  className="block h-full w-full origin-left bg-map-4 transition-[transform,background-color] duration-500 ease-out-quart motion-reduce:transition-none"
                  style={{
                    background: measure === "rate" ? rateColor(r.rate) : undefined,
                    transform: `scaleX(${measure === "rate" ? ratePosition(r.rate ?? 0, scale.rate) : r.value / scale.count})`,
                  }}
                />
              </span>
              <b className="text-right font-medium">
                {measure === "rate" ? formatRate(r.rate) : formatNumber(Math.round(r.value))}
              </b>
              <span className="text-right text-[11px] text-muted-foreground">
                {measure === "rate"
                  ? `${formatNumber(Math.round(r.value))} ${unit}`
                  : formatRate(r.rate)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
