import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useAnimationFrame, useReducedMotion } from "motion/react";
import { RiPauseFill, RiPlayFill, RiRestartLine } from "react-icons/ri";
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
    <div className="race">
      <div className="race-toolbar">
        <div className="race-year" aria-live={running ? "off" : "polite"}>
          <span>年度</span>
          <strong>
            <AnimatedValue value={String(year0)} />
          </strong>
        </div>
        <div className="race-controls">
          <Button variant="outline" onClick={togglePlay} aria-label={label} aria-pressed={running}>
            {running ? (
              <RiPauseFill aria-hidden="true" />
            ) : atEnd ? (
              <RiRestartLine aria-hidden="true" />
            ) : (
              <RiPlayFill aria-hidden="true" />
            )}
            {label}
          </Button>
          <label className="race-slider">
            <span className="sr-only">拖曳選擇年度</span>
            <input
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
            <span className="race-slider-ends" aria-hidden="true">
              <span>{startYear}</span>
              <span>{lastYear}</span>
            </span>
          </label>
        </div>
      </div>
      <p className="region-axis-note">
        {measure === "rate"
          ? `長條刻度：0–${scale.rate}／十萬人・${startYear}–${lastYear} 年共用同一刻度，年與年之間的數值為線性內插`
          : `長條刻度依 ${startYear}–${lastYear} 年最大值固定，年與年之間的數值為線性內插`}
      </p>
      <div className="race-list" style={{ "--rows": rows.length } as CSSProperties}>
        {rows.map((r) => (
          <div
            className="region-row race-row"
            key={r.city}
            style={{ "--rank": rankOf.get(r.city) ?? 0 } as CSSProperties}
          >
            <span className="race-rank" aria-hidden="true">
              {(rankOf.get(r.city) ?? 0) + 1}
            </span>
            <span className="region-city">
              {r.city}
              <small>
                人口 {r.population === null ? "無資料" : formatNumber(Math.round(r.population))}
              </small>
            </span>
            <span className="region-track" aria-hidden="true">
              <i
                style={{
                  background: measure === "rate" ? rateColor(r.rate) : undefined,
                  transform: `scaleX(${measure === "rate" ? ratePosition(r.rate ?? 0, scale.rate) : r.value / scale.count})`,
                }}
              />
            </span>
            <b>{measure === "rate" ? formatRate(r.rate) : formatNumber(Math.round(r.value))}</b>
            <span>
              {measure === "rate"
                ? `${formatNumber(Math.round(r.value))} ${unit}`
                : formatRate(r.rate)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
