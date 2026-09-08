import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotionPreference } from "../lib/use-reduced-motion";
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
import { AnimatedDigits } from "./StoryMotion";
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
const ROW_HEIGHT = 64;
const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

export function RegionRace({ history, metric, measure, startYear }: Props) {
  const reduced = useReducedMotionPreference();
  const container = useRef<HTMLDivElement>(null);
  const currentTime = useRef(startYear);
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

  const rowsAt = useMemo(
    () => (time: number) => {
      const year0 = Math.min(Math.floor(time), lastYear);
      const year1 = Math.min(year0 + 1, lastYear);
      const fraction = year1 === year0 ? 0 : time - year0;
      return [...byCity.entries()]
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
    },
    [byCity, metric, lastYear],
  );
  const year0 = Math.min(Math.floor(time), lastYear);
  const rows = rowsAt(time);
  const ranked = [...rows].sort((a, b) =>
    measure === "rate" ? (b.rate ?? -1) - (a.rate ?? -1) : b.value - a.value,
  );
  const rankOf = new Map(ranked.map((r, i) => [r.city, i]));
  const unit = metric === "victims" ? "人" : "件";
  useEffect(() => {
    const root = container.current;
    if (!root) return;
    // Cache DOM references once. Frame updates never enter React's render cycle.
    const elements = new Map(
      Array.from(root.querySelectorAll<HTMLElement>("[data-race-city]"), (row) => [
        row.dataset.raceCity,
        {
          row,
          rank: row.querySelector("[data-race-rank]"),
          population: row.querySelector("[data-race-population]"),
          value: row.querySelector("[data-race-value]"),
          secondary: row.querySelector("[data-race-secondary]"),
          mobile: row.querySelector("[data-race-mobile]"),
          bar: row.querySelector<HTMLElement>("[data-race-bar]"),
        },
      ]),
    );
    const writeText = (element: Element | null, value: string) => {
      if (element && element.textContent !== value) element.textContent = value;
    };
    const paint = () => {
      const frame = rowsAt(currentTime.current).sort((a, b) =>
        measure === "rate" ? (b.rate ?? -1) - (a.rate ?? -1) : b.value - a.value,
      );
      frame.forEach((r, rank) => {
        const nodes = elements.get(r.city);
        if (!nodes) return;
        const out = rank >= TOP;
        nodes.row.toggleAttribute("data-out", out);
        nodes.row.setAttribute("aria-hidden", String(out));
        nodes.row.style.transform = `translateY(${Math.min(rank, TOP) * ROW_HEIGHT}px)`;
        // Hidden rows retain position, but don't need numeric text or bar paints.
        if (out) return;
        const count = formatNumber(Math.round(r.value));
        const rate = formatRate(r.rate);
        writeText(nodes.rank, String(rank + 1));
        writeText(
          nodes.population,
          r.population === null ? "無資料" : formatNumber(Math.round(r.population)),
        );
        writeText(nodes.value, measure === "rate" ? rate : count);
        writeText(nodes.secondary, measure === "rate" ? `${count} ${unit}` : rate);
        writeText(nodes.mobile, measure === "rate" ? `${count} ${unit}` : `${rate}／十萬人`);
        if (nodes.bar) {
          nodes.bar.style.transform = `scaleX(${measure === "rate" ? ratePosition(r.rate ?? 0, scale.rate) : r.value / scale.count})`;
          nodes.bar.style.background = measure === "rate" ? rateColor(r.rate) : "";
        }
      });
    };
    paint();
    if (!running) return;
    let frameId = 0;
    let timerId = 0;
    let visible = false;
    let previous: number | undefined;
    const stop = () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timerId);
      previous = undefined;
    };
    const tick = (now: number) => {
      const delta = previous === undefined ? 0 : now - previous;
      previous = now;
      currentTime.current = Math.min(lastYear, currentTime.current + delta / YEAR_MS);
      paint();
      // The year label and controls render only at year boundaries.
      if (Math.floor(currentTime.current) !== year0) setTime(Math.floor(currentTime.current));
      if (currentTime.current < lastYear) frameId = requestAnimationFrame(tick);
    };
    const step = () => {
      currentTime.current = Math.min(lastYear, Math.floor(currentTime.current) + 1);
      paint();
      setTime(currentTime.current);
    };
    const resume = () => {
      stop();
      if (!visible || document.hidden) return;
      if (reduced) timerId = window.setTimeout(step, YEAR_MS);
      else frameId = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    observer.observe(root);
    document.addEventListener("visibilitychange", resume);
    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", resume);
    };
  }, [rowsAt, measure, unit, scale, running, reduced, lastYear, year0, time]);
  const label = running ? "暫停" : atEnd ? "重播" : "播放";
  const togglePlay = () => {
    if (atEnd) {
      currentTime.current = startYear;
      setTime(startYear);
      setPlaying(true);
      return;
    }
    if (playing) setTime(currentTime.current);
    setPlaying(!playing);
  };
  return (
    <div ref={container} data-race-running={running || undefined}>
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
            <span className="sr-only">拖曳選擇年度</span>
            <input
              className="min-h-11 w-full border-0 bg-transparent p-0 accent-primary"
              type="range"
              min={startYear}
              max={lastYear}
              step={1}
              value={time}
              aria-valuetext={`${year0} 年`}
              onChange={(event) => {
                setPlaying(false);
                currentTime.current = Number(event.target.value);
                setTime(currentTime.current);
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
        className="grid grid-cols-[16px_78px_minmax(0,1fr)_60px] items-center gap-1.75 pt-4.5 pb-3 text-caption text-muted-foreground sm:grid-cols-[26px_112px_minmax(0,1fr)_80px_80px] sm:gap-4 max-sm:[&>span:last-child]:hidden max-sm:[&>span:nth-child(3)]:text-[0] [&>span:nth-last-child(-n+2)]:text-right"
        aria-hidden="true"
      >
        <span>#</span>
        <span>縣市／年底人口</span>
        <span>{measure === "rate" ? "每十萬人口比率" : "原始數量"}</span>
        <span>{measure === "rate" ? `${unit}／十萬人` : unit}</span>
        <span>
          {measure === "rate" ? `原始${metric === "victims" ? "人數" : "件數"}` : "每十萬人口"}
        </span>
      </div>
      <div
        className="relative overflow-hidden border-t border-border"
        style={{ height: TOP * ROW_HEIGHT }}
      >
        {rows.map((r) => {
          const rank = rankOf.get(r.city) ?? 0;
          return (
            <div
              className="absolute inset-x-0 top-0 grid  grid-cols-[16px_78px_minmax(0,1fr)_60px] items-center gap-1.75 border-b border-border font-numeric text-[0.8125rem] tabular-nums [transition:transform_600ms_var(--ease-out-quart),opacity_400ms_ease] data-out:pointer-events-none data-out:opacity-0 motion-reduce:transition-none sm:grid-cols-[26px_112px_minmax(0,1fr)_80px_80px] sm:gap-4 [&>b]:text-base max-sm:[&>span:last-child]:hidden"
              key={r.city}
              data-race-city={r.city}
              data-out={rank >= TOP || undefined}
              aria-hidden={rank >= TOP || undefined}
              style={{
                height: ROW_HEIGHT,
                transform: `translateY(${Math.min(rank, TOP) * ROW_HEIGHT}px)`,
              }}
            >
              <span
                data-race-rank
                className="text-xs text-muted-foreground tabular-nums"
                aria-hidden="true"
              >
                {rank + 1}
              </span>
              <span className="text-lg">
                {r.city}
                <small className="mt-1.25 block text-[0.625rem] whitespace-nowrap text-muted-foreground [&_svg]:mr-1 [&_svg]:inline [&_svg]:align-[-0.15em]">
                  <RiGroupLine aria-hidden="true" />
                  <span className="sr-only">人口</span>
                  <span data-race-population>
                    {r.population === null ? "無資料" : formatNumber(Math.round(r.population))}
                  </span>
                </small>
              </span>
              <span
                className="block h-3.5 rounded-full bg-secondary sm:h-4.5 [&>i]:rounded-[inherit]"
                aria-hidden="true"
              >
                <i
                  data-race-bar
                  className="block h-full w-full origin-left bg-map-4 transition-transform duration-500 ease-out-quart [[data-race-running]_&]:transition-none motion-reduce:transition-none"
                  style={{
                    background: measure === "rate" ? rateColor(r.rate) : undefined,
                    transform: `scaleX(${measure === "rate" ? ratePosition(r.rate ?? 0, scale.rate) : r.value / scale.count})`,
                  }}
                />
              </span>
              <b className="text-right font-medium">
                <span data-race-value>
                  {measure === "rate" ? formatRate(r.rate) : formatNumber(Math.round(r.value))}
                </span>
                <small
                  data-race-mobile
                  className="mt-1 block text-caption font-normal whitespace-nowrap text-muted-foreground sm:hidden"
                >
                  {measure === "rate"
                    ? `${formatNumber(Math.round(r.value))} ${unit}`
                    : `${formatRate(r.rate)}／十萬人`}
                </small>
              </b>
              <span
                data-race-secondary
                className="text-right text-[0.6875rem] text-muted-foreground"
              >
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
