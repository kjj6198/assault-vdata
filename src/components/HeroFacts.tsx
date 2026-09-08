import type { ComponentProps, ReactNode } from "react";
import { motion } from "motion/react";
import { RiArrowRightUpLine } from "react-icons/ri";
import { fixed1, formatNumber, share } from "../lib/data";
import { formatRate } from "../lib/regions";
import { taiwanMap } from "../lib/map";
import { useReducedMotionPreference } from "../lib/use-reduced-motion";
import { AnimatedNumber, AnimatedValue } from "./StoryMotion";
import { cn } from "../lib/utils";
import { useI18n } from "../i18n";

const formatChange = (value: number) => `${value < 0 ? "−" : "+"}${fixed1(Math.abs(value))}`;

type Props = {
  year: number;
  total: number;
  change: number | null;
  previous: { year: number; victims: number } | undefined;
  trend: { year: number; victims: number }[];
  topCity: { city: string; rate: number } | undefined;
  genders: { key: string; label: string; value: number }[];
  minors: number;
  relationships: { label: string; value: number }[];
};

function FactSurface({ className, ...props }: ComponentProps<"article">) {
  return (
    <article
      className={cn(
        "fact-surface flex min-w-0 flex-col rounded-[20px] border-0 bg-(--overview-panel) px-5.5 pt-6 pb-2 text-(--overview-ink) min-[40rem]:px-6.5 min-[40rem]:pt-6.5",
        className,
      )}
      {...props}
    />
  );
}

function FactCard({
  number,
  label,
  href,
  children,
  className = "",
}: {
  number: string;
  label: string;
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <FactSurface className={className}>
      <div className="flex items-center gap-1.5 border-b border-(--overview-line) pb-3 max-[36.25rem]:col-span-full lg:gap-2.25">
        <span className="font-numeric text-caption text-(--overview-muted)" aria-hidden="true">
          {number}
        </span>
        <h3 className="text-label font-bold tracking-wide">{label}</h3>
        <a
          href={href}
          aria-label={t.facts.explore(label)}
          className="-my-2.25 -mr-2.5 ml-auto grid min-h-11 min-w-11 place-items-center rounded-[4px] text-(--overview-muted) hover:bg-(--overview-hover) hover:text-(--overview-ink)"
        >
          <RiArrowRightUpLine className="size-4.25" aria-hidden="true" />
        </a>
      </div>
      {children}
    </FactSurface>
  );
}

export function HeroFacts({
  year,
  total,
  change,
  previous,
  trend,
  topCity,
  genders,
  minors,
  relationships,
}: Props) {
  const { t, name } = useI18n();
  const reduced = useReducedMotionPreference();
  const minorShare = share(minors, total);
  const maxVictims = Math.max(1, ...trend.map((row) => row.victims));
  const relationshipTotal = relationships.reduce((sum, row) => sum + row.value, 0);
  const leading = relationships[0];
  return (
    <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:gap-6">
      <FactCard number={String(year)} label={t.facts.minors.label} href="#ages">
        <div className="grid flex-1 grid-cols-[minmax(0,1fr)_42%] items-center gap-4 py-6">
          <div>
            <p className="text-caption leading-[1.8] text-(--overview-muted)">
              {t.facts.minors.lede}
            </p>
            <p className="mt-3.75 mb-1.5 font-numeric text-[clamp(2.5rem,4.3vw,3.625rem)] leading-[1.15] font-normal tracking-[-0.055em] text-(--overview-accent) tabular-nums">
              <AnimatedNumber value={minorShare} format={fixed1} />
              <small className="ml-1 font-sans text-[1.375rem] tracking-[-0.015em]">%</small>
            </p>
            <p className="text-label leading-[1.8]">
              {t.facts.minors.caption}
              <strong className="block">{t.facts.minors.strong}</strong>
            </p>
          </div>
          <div
            className="grid w-full max-w-55 grid-cols-10 gap-1.25 justify-self-end sm:gap-1.5"
            aria-hidden="true"
          >
            {Array.from({ length: 100 }, (_, i) => (
              <i
                className="aspect-square rounded-full bg-(--overview-track) data-filled:bg-(--overview-accent)"
                key={i}
                data-filled={i < Math.round(minorShare) || undefined}
              />
            ))}
          </div>
        </div>
        <p className="mt-auto min-h-12 border-t border-(--overview-line) py-4 text-caption leading-[1.8] text-pretty text-(--overview-muted)">
          {t.facts.minors.note}
        </p>
      </FactCard>
      <FactCard number={String(year)} label={t.facts.gender.label} href="#ages">
        <div className="flex-1 py-6">
          <p className="text-caption leading-[1.8] text-(--overview-muted)">
            {t.facts.gender.allAges}
          </p>
          <div className="my-5 flex h-2.25 gap-0.5 overflow-hidden rounded-xs" aria-hidden="true">
            {genders.map((row) => (
              <i
                key={row.key}
                className="min-w-px data-[gender=不詳]:bg-(--overview-unknown) data-[gender=其他]:bg-(--overview-other) data-[gender=女]:bg-(--overview-female) data-[gender=男]:bg-(--overview-accent)"
                data-gender={row.key}
                style={{ width: `${share(row.value, total)}%` }}
              />
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-x-5 gap-y-6 [&_dd]:text-right [&_dd]:font-numeric [&_dd]:text-2xl [&_dd]:leading-[1.4] [&_dd]:tabular-nums [&_dd_small]:ml-0.5 [&_dd_small]:text-caption [&_dt]:pt-1 [&_dt]:text-label [&_dt]:whitespace-nowrap [&_dt_i]:mr-1.75 [&_dt_i]:inline-block [&_dt_i]:size-1.75 [&_dt_i]:rounded-full">
            {genders.map((row) => (
              <div
                key={row.key}
                className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 gap-y-1"
              >
                <dt>
                  <i
                    className="data-[gender=不詳]:bg-(--overview-unknown) data-[gender=其他]:bg-(--overview-other) data-[gender=女]:bg-(--overview-female) data-[gender=男]:bg-(--overview-accent)"
                    data-gender={row.key}
                  />
                  {row.label}
                </dt>
                <dd>
                  <span className="block">
                    {row.value > 0 && share(row.value, total) < 0.1
                      ? "<0.1"
                      : fixed1(share(row.value, total))}
                    <small>%</small>
                  </span>
                  <span className="mt-1 block text-caption text-(--overview-muted)">
                    {formatNumber(row.value)} {t.unit.people}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="mt-auto min-h-12 border-t border-(--overview-line) py-4 text-caption leading-[1.8] text-pretty text-(--overview-muted)">
          {t.facts.gender.note}
        </p>
      </FactCard>
      <FactCard
        number="01"
        label={t.facts.change.label}
        href="#trend"
        className="max-[36.25rem]:grid max-[36.25rem]:grid-cols-[1fr_1fr] max-[36.25rem]:gap-x-4"
      >
        <p className="mt-4 mb-1.25 text-caption leading-[1.8] text-(--overview-muted) max-[36.25rem]:col-start-1">
          {t.facts.change.lede}
        </p>
        <p className="font-numeric text-[clamp(2.5rem,4.3vw,3.625rem)] leading-[1.15] font-normal tracking-[-0.055em] text-(--overview-accent) tabular-nums max-[36.25rem]:col-start-1 max-[36.25rem]:mb-4.5 max-[36.25rem]:text-[2.875rem]">
          {change === null ? "—" : <AnimatedNumber value={change} format={formatChange} />}
          {change !== null && (
            <small className="ml-1 font-sans text-[1.375rem] tracking-[-0.015em]">%</small>
          )}
        </p>
        <div
          className="mt-5 mb-0 flex h-16.5 items-end gap-1.25 border-b border-(--overview-line) max-[36.25rem]:col-start-2 max-[36.25rem]:row-[2/4] max-[36.25rem]:h-15.5 max-[36.25rem]:gap-0.75 max-[36.25rem]:self-center"
          role="img"
          aria-label={t.facts.change.chartAria(
            trend.map((row) => ({ year: row.year, victims: formatNumber(row.victims) })),
          )}
        >
          {trend.map((row) => (
            <div key={row.year} className="flex h-full flex-1 items-end">
              <span
                className="min-h-px w-full rounded-[4px] bg-(--overview-bar) transition-colors duration-600 ease-out-quart data-selected:bg-(--overview-accent) motion-reduce:duration-120"
                style={{ height: `${(row.victims / maxVictims) * 100}%` }}
                data-selected={row.year === year || undefined}
              />
            </div>
          ))}
        </div>
        <div
          className="mt-1.25 mb-3.5 flex justify-between font-numeric text-caption text-(--overview-muted) max-[36.25rem]:col-start-2 max-[36.25rem]:-mt-3.5"
          aria-hidden="true"
        >
          <span>{trend[0]?.year}</span>
          <span>{trend.at(-1)?.year}</span>
        </div>
        <p className="mt-auto min-h-12 border-t border-(--overview-line) py-4 text-caption leading-[1.8] text-pretty text-(--overview-muted) max-[36.25rem]:col-span-full">
          {previous ? (
            <>
              {t.facts.change.at(previous.year)} <AnimatedNumber value={previous.victims} />{" "}
              {t.unit.people} → {t.facts.change.at(year)} <AnimatedNumber value={total} />{" "}
              {t.unit.people}
            </>
          ) : (
            t.facts.change.noPrevious
          )}
        </p>
      </FactCard>

      <FactCard number="02" label={t.facts.topRate.label} href="#regions">
        <div className="grid flex-1 grid-cols-[minmax(0,1fr)_32%] items-center gap-3 py-6">
          <div>
            <p className="text-caption leading-[1.8] text-(--overview-muted)">
              {t.facts.topRate.lede}
            </p>
            <p className="mt-0.75 mb-3.75 text-[1.75rem] leading-[1.6] font-bold tracking-[0.015em] max-[36.25rem]:mt-0.5 max-[36.25rem]:mb-2">
              <AnimatedValue value={topCity ? name("city", topCity.city) : t.noData} />
            </p>
            <p className="font-numeric text-[clamp(2.25rem,3.5vw,3.25rem)] leading-[1.15] font-normal tracking-[-0.055em] tabular-nums">
              {topCity ? <AnimatedNumber value={topCity.rate} format={formatRate} /> : "—"}
              <small className="ml-1.75 font-sans text-caption tracking-[-0.015em]">
                {t.unit.people}
              </small>
            </p>
            <p className="text-caption leading-[1.8] text-(--overview-muted)">
              {t.facts.topRate.per}
            </p>
          </div>
          <svg
            className="h-38.75 w-full overflow-visible max-[36.25rem]:h-34"
            viewBox={`0 0 ${taiwanMap.width} ${taiwanMap.height}`}
            aria-hidden="true"
          >
            {taiwanMap.counties.map((county) => (
              <path
                className="fill-(--overview-track) stroke-(--overview-panel) stroke-[2.5] transition-[fill] duration-600 ease-out-quart data-selected:fill-(--overview-accent) motion-reduce:duration-120"
                key={county.code}
                d={county.path}
                data-selected={county.name === topCity?.city || undefined}
              />
            ))}
          </svg>
        </div>
        <p className="mt-auto min-h-12 border-t border-(--overview-line) py-4 text-caption leading-[1.8] text-pretty text-(--overview-muted)">
          {t.facts.topRate.note}
        </p>
      </FactCard>

      <FactCard
        number="03"
        label={t.facts.relation.label}
        href="#relationships"
        className="col-span-full"
      >
        <div className="grid flex-1 grid-cols-1 gap-6 py-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:gap-8">
          <div className="min-w-0 sm:border-r sm:border-(--overview-line) sm:pr-6">
            <p className="text-caption leading-[1.8] text-(--overview-muted)">
              {t.facts.relation.lede}
            </p>
            <p className="mt-1 mb-2 text-[1.75rem] leading-[1.6] font-bold tracking-[0.015em] wrap-anywhere max-[36.25rem]:text-[1.5rem]">
              <AnimatedValue value={leading ? name("relationship", leading.label) : t.noData} />
            </p>
            <p className="mb-1.5 font-numeric text-[2.375rem] leading-[1.15] font-normal tracking-[-0.055em] tabular-nums">
              {leading ? <AnimatedNumber value={leading.value} /> : "—"}
              <small className="ml-2 font-sans text-caption tracking-[-0.015em]">
                {t.unit.people}
              </small>
            </p>
            <p className="text-caption leading-[1.8] text-(--overview-muted)">
              {t.facts.relation.share}{" "}
              {leading ? (
                <AnimatedNumber value={share(leading.value, relationshipTotal)} format={fixed1} />
              ) : (
                "—"
              )}
              %
            </p>
          </div>
          <ol className="grid min-w-0 gap-5 self-center [&_b]:mr-2.5 [&_b]:font-numeric [&_b]:text-caption [&_b]:font-normal [&_b]:text-(--overview-muted) [&_small]:ml-0.5 [&_small]:text-caption [&_strong]:font-numeric [&_strong]:text-[1.0625rem] [&_strong]:font-medium [&_strong]:whitespace-nowrap">
            {relationships.slice(0, 3).map((row, index) => (
              <motion.li
                key={row.label}
                className="motion-reduce:transform-none!"
                layout="position"
                initial={false}
                transition={{ duration: reduced ? 0 : 0.6, ease: [0.25, 1, 0.5, 1] }}
              >
                <div className="mb-2 flex items-baseline justify-between gap-4 text-caption">
                  <span className="wrap-anywhere">
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    {name("relationship", row.label)}
                  </span>
                  <strong>
                    <AnimatedNumber value={share(row.value, relationshipTotal)} format={fixed1} />
                    <small>%</small>
                  </strong>
                </div>
                <div className="h-1.5 rounded-full bg-(--overview-track)" aria-hidden="true">
                  <i
                    className={cn(
                      "block size-full origin-left rounded-full bg-(--overview-bar-strong) transition-[transform,background-color] duration-600 ease-out-quart motion-reduce:transition-colors motion-reduce:duration-120",
                      index === 0 && "bg-(--overview-accent)",
                    )}
                    style={{ transform: `scaleX(${share(row.value, relationshipTotal) / 100})` }}
                  />
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
        <p className="mt-auto min-h-12 border-t border-(--overview-line) py-4 text-caption leading-[1.8] text-pretty text-(--overview-muted)">
          {t.facts.relation.note}
        </p>
      </FactCard>
    </div>
  );
}
