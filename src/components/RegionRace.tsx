import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useAnimationFrame } from "motion/react";
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
import { useReducedMotionPreference } from "../lib/use-reduced-motion";
import { AnimatedDigits } from "./StoryMotion";
import { Button } from "./ui/button";
import { useI18n } from "../i18n";

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
  const { t, name } = useI18n();
  const reduced = useReducedMotionPreference();
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
      .map((r) => ({
        value: r[metric],
        rate: ratePer100k(r[metric], r.population),
      }));
    return {
      rate: rateAxisMax(frames.map((r) => r.rate)),
      count: Math.max(1, ...frames.map((r) => r.value)),
    };
  }, [history, metric, startYear]);

  const year0 = Math.min(Math.floor(time), lastYear);
  const year1 = Math.min(year0 + 1, lastYear);
  // Interpolation is only a playback aid. Resting and reduced-motion frames show source data.
  const fraction = running && !reduced && year1 !== year0 ? time - year0 : 0;
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
  const unit = t.unit[metric === "victims" ? "people" : "reports"];
  const label = running ? t.race.pause : atEnd ? t.race.replay : t.race.play;
  const togglePlay = () => {
    if (atEnd) {
      setTime(startYear);
      setPlaying(true);
      return;
    }
    if (running) setTime(year0);
    setPlaying(!playing);
  };
  return (
    <div>
      <div className="flex flex-col items-stretch gap-4 pt-1 pb-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-8 sm:gap-y-5">
        <div
          className="flex flex-col gap-1.5 text-xs text-muted-foreground"
          aria-live={running ? "off" : "polite"}
        >
          <strong className="font-numeric text-[clamp(2.75rem,5vw,5rem)] leading-none font-semibold tracking-[-0.02em] text-foreground tabular-nums">
            <AnimatedDigits value={year0} />
          </strong>
        </div>
        <div className="flex flex-1 items-center justify-between gap-5 sm:min-w-70 sm:justify-end">
          <Button
            className="min-h-12 min-w-25"
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
            <span className="sr-only">{t.race.slider}</span>
            <input
              className="min-h-11 w-full border-0 bg-transparent p-0 accent-primary"
              type="range"
              min={startYear}
              max={lastYear}
              step={1}
              value={year0}
              aria-valuetext={t.year(year0)}
              onChange={(event) => {
                setPlaying(false);
                setTime(Number(event.target.value));
              }}
            />
            <span
              className="flex justify-between text-[0.6875rem] text-muted-foreground tabular-nums"
              aria-hidden="true"
            >
              <span>{startYear}</span>
              <span>{lastYear}</span>
            </span>
          </label>
        </div>
      </div>

      <div
        className="grid grid-cols-[16px_78px_minmax(0,1fr)_60px] items-center gap-1.75 pt-4.5 pb-3 text-caption text-muted-foreground group-data-[locale=en]:grid-cols-[16px_104px_minmax(0,1fr)_60px] sm:grid-cols-[26px_112px_minmax(0,1fr)_80px_80px] sm:gap-4 sm:group-data-[locale=en]:grid-cols-[26px_168px_minmax(0,1fr)_80px_80px]"
        aria-hidden="true"
      >
        <span>#</span>
        <span>{t.race.cityPopulation}</span>
        <span className="max-sm:text-[0]">
          {measure === "rate" ? t.measure.rate : t.race.rawCount}
        </span>
        <span className="text-right">{measure === "rate" ? t.perHundredK(unit) : unit}</span>
        <span className="text-right max-sm:hidden">
          {measure === "rate"
            ? t.race[metric === "victims" ? "rawVictims" : "rawReports"]
            : t.race.perHundredK}
        </span>
      </div>
      <div
        className="relative h-[calc(var(--rows)*var(--row-height))] overflow-hidden border-t border-border [--row-height:64px]"
        style={{ "--rows": TOP } as CSSProperties}
      >
        {rows.map((r) => {
          const rank = rankOf.get(r.city) ?? 0;
          return (
            <div
              className="absolute inset-x-0 top-0 grid h-(--row-height) translate-y-[calc(var(--rank)*var(--row-height))] grid-cols-[16px_78px_minmax(0,1fr)_60px] items-center gap-1.75 border-b border-border font-numeric text-caption tabular-nums will-change-transform [transition:translate_600ms_var(--ease-out-quart),opacity_400ms_ease] group-data-[locale=en]:grid-cols-[16px_104px_minmax(0,1fr)_60px] data-out:pointer-events-none data-out:opacity-0 motion-reduce:transition-none sm:grid-cols-[26px_112px_minmax(0,1fr)_80px_80px] sm:gap-4 sm:group-data-[locale=en]:grid-cols-[26px_168px_minmax(0,1fr)_80px_80px]"
              key={r.city}
              data-out={rank >= TOP || undefined}
              aria-hidden={rank >= TOP || undefined}
              style={{ "--rank": Math.min(rank, TOP) } as CSSProperties}
            >
              <span className="text-xs text-muted-foreground tabular-nums" aria-hidden="true">
                {rank + 1}
              </span>
              <span className="text-lg">
                {name("city", r.city)}
                <small className="mt-1.25 block text-[0.625rem] whitespace-nowrap text-muted-foreground [&_svg]:mr-1 [&_svg]:inline [&_svg]:align-[-0.15em]">
                  <RiGroupLine aria-hidden="true" />
                  <span className="sr-only">{t.race.population}</span>
                  {r.population === null ? t.noData : formatNumber(Math.round(r.population))}
                </small>
              </span>
              <span className="block h-3.5 rounded-full bg-secondary sm:h-4.5" aria-hidden="true">
                <i
                  className="block h-full w-full origin-left rounded-[inherit] bg-map-4 transition-[transform,background-color] duration-500 ease-out-quart motion-reduce:transition-none"
                  style={{
                    background: measure === "rate" ? rateColor(r.rate) : undefined,
                    transform: `scaleX(${measure === "rate" ? ratePosition(r.rate ?? 0, scale.rate) : r.value / scale.count})`,
                  }}
                />
              </span>
              <b className="text-right text-base font-medium">
                {measure === "rate" ? formatRate(r.rate) : formatNumber(Math.round(r.value))}
                <small className="mt-1 block text-caption font-normal whitespace-nowrap text-muted-foreground sm:hidden">
                  {measure === "rate"
                    ? `${formatNumber(Math.round(r.value))} ${unit}`
                    : t.perHundredK(formatRate(r.rate))}
                </small>
              </b>
              <span className="text-right text-[0.6875rem] text-muted-foreground max-sm:hidden">
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
