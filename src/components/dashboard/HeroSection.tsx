import { ratePer100k } from "../../lib/regions";
import { useMemo } from "react";
import { HeroFacts } from "../HeroFacts";
import { DataSelect } from "../DataSelect";
import { AnimatedNumber } from "../StoryMotion";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { cn } from "../../lib/utils";
import { useI18n } from "../../i18n";
import {
  ALL,
  INK,
  CORAL,
  GOLD,
  GRAY,
  pageWidth,
  pendingFade,
  sum,
  rankRelationships,
  type DashboardData,
} from "./shared";

export function HeroSection({
  data,
  onYearChange,
  pending,
}: {
  data: DashboardData;
  onYearChange: (year: number) => void;
  pending: boolean;
}) {
  const { t, name } = useI18n();
  const { year, years, records, trend, ages } = data;
  const demo = records.filter((r) => r.dataset === "demographics");
  const victimTotal = sum(records.filter((r) => r.dataset === "victims"));
  const reportTotal = sum(records.filter((r) => r.dataset === "reports"));
  const minors = sum(demo.filter((r) => ages.slice(0, 3).includes(r.age)));
  const previous = trend.find((r) => r.year === year - 1);
  const change = previous ? (victimTotal / previous.victims - 1) * 100 : null;
  const genders = ["女", "男", ...(year >= 2019 ? ["其他"] : []), "不詳"];
  const genderTotals = genders.map((key) => ({
    key,
    label: name("gender", key),
    value: sum(demo.filter((r) => r.gender === key)),
    color: key === "女" ? INK : key === "男" ? GOLD : key === "其他" ? CORAL : GRAY,
  }));
  const overallRelations = useMemo(() => rankRelationships(records, ALL), [records]);
  const populationByCity = new Map(data.populations.map((r) => [r.city, r.population]));
  const topRateCity = records
    .filter((r) => r.dataset === "victims")
    .map((r) => ({
      city: r.city,
      rate: ratePer100k(r.value, populationByCity.get(r.city) ?? null),
    }))
    .filter((r): r is { city: string; rate: number } => r.rate !== null)
    .sort((a, b) => b.rate - a.rate)[0];
  return (
    <div className="hero-overview border-b border-border bg-background text-foreground">
      <div className="relative isolate overflow-hidden bg-background bg-(image:--hero-gradient) after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:bg-(image:--grain) after:opacity-7 after:mix-blend-multiply after:content-['']">
        <div className={cn(pageWidth, "flex justify-end pt-3")}>
          <LanguageSwitcher className="-mr-2.5" />
        </div>
        <section
          className={cn(
            pageWidth,
            "grid min-w-0 grid-cols-1 items-center gap-8 pt-2 pb-8 sm:gap-10 sm:pt-4 sm:pb-12 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16",
          )}
        >
          <div className="animate-story-enter motion-reduce:animate-fade-enter">
            <h1 className="mb-0 text-[clamp(2rem,4.4vw,4rem)] leading-[1.35] font-bold tracking-[0.01em] text-balance">
              {t.hero.title}
              <br />
              <span className="font-numeric text-[0.65em] font-normal tracking-[-0.04em] tabular-nums">
                {years[0]}—{years.at(-1)}
              </span>
            </h1>
          </div>
          <aside
            className="rounded-[7px] border border-t-3 border-(--overview-line) border-t-data-relationships bg-(--overview-panel) p-5 sm:rounded-[4px] sm:p-7 sm:max-lg:pl-6.25"
            aria-label={t.hero.national(year)}
          >
            <p className="flex items-center gap-2.25 text-caption text-(--overview-muted)">
              <span className="size-1.5 rounded-full bg-(--overview-accent)" />
              {t.hero.national(year)}
            </p>
            <p className="mt-3.5 text-caption sm:mt-6.25">{t.hero.victims}</p>
            <p className="font-numeric text-[4.125rem] leading-tight tracking-[-0.06em] tabular-nums sm:text-[clamp(4rem,6.7vw,5.875rem)]">
              <AnimatedNumber value={victimTotal} />
              <small className="ml-3.5 font-sans text-label tracking-normal">{t.unit.people}</small>
            </p>
            <div className="mt-2.5 flex items-baseline justify-between gap-4 border-t border-(--overview-line) pt-3 text-caption sm:mt-3.25 sm:pt-4.25 [&_small]:font-sans [&_small]:text-caption">
              <span>{t.hero.reports}</span>
              <span className="font-numeric text-[1.4375rem]">
                <AnimatedNumber value={reportTotal} /> <small>{t.unit.reports}</small>
              </span>
            </div>
          </aside>
        </section>
        <section
          id="overview"
          tabIndex={-1}
          className={cn(
            pageWidth,
            "scroll-mt-35 pt-2 pb-10 focus:outline-none sm:pb-14 lg:scroll-mt-24",
            pendingFade,
          )}
          aria-labelledby="facts-heading"
          aria-busy={pending}
        >
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pt-4 pb-6 sm:pb-8 [&_h2]:text-2xl [&_h2]:leading-[1.4] [&_h2]:font-bold [&_h2]:text-balance sm:[&_h2]:text-section">
            <div>
              <output className="mb-2 block font-numeric text-caption font-medium tracking-[0.06em] text-(--overview-muted)">
                {pending ? t.hero.loading : t.hero.yearWithRoc(year)}
              </output>
              <h2 id="facts-heading">{t.hero.overview}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <DataSelect
                id="hero-year"
                label={t.hero.yearSelect}
                value={String(year)}
                onValueChange={(value) => onYearChange(Number(value))}
                options={[...years].reverse().map((y) => ({ value: String(y), label: t.year(y) }))}
              />
            </div>
          </div>
          <HeroFacts
            year={year}
            total={victimTotal}
            change={change}
            previous={previous}
            trend={trend}
            topCity={topRateCity}
            genders={genderTotals}
            minors={minors}
            relationships={overallRelations}
          />
        </section>
      </div>
    </div>
  );
}
