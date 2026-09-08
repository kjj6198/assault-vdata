import { useMemo, useState } from "react";
import { fixed1, share } from "../../lib/data";
import { DataChart } from "../DataChart";
import { DataSelect } from "../DataSelect";
import { AnimatedNumber } from "../StoryMotion";
import { cn } from "../../lib/utils";
import { useI18n } from "../../i18n";
import {
  ALL,
  INK,
  CORAL,
  GOLD,
  GRAY,
  pageWidth,
  eyebrow,
  heading3,
  footnote,
  panelHeading,
  inlineFilter,
  storySection,
  sum,
  type DashboardData,
} from "./shared";
import { SectionHeading } from "./SectionHeading";

export function DemographicsSection({ data }: { data: DashboardData }) {
  const { t, name } = useI18n();
  const { year, records, ages } = data;
  const [gender, setGender] = useState(ALL);
  const demo = records.filter((r) => r.dataset === "demographics");
  const victimTotal = sum(records.filter((r) => r.dataset === "victims"));

  const genders = ["女", "男", ...(year >= 2019 ? ["其他"] : []), "不詳"];
  const genderTotals = genders.map((key) => ({
    key,
    label: name("gender", key),
    value: sum(demo.filter((r) => r.gender === key)),
    color: key === "女" ? INK : key === "男" ? GOLD : key === "其他" ? CORAL : GRAY,
  }));
  const safeGender = genders.includes(gender) ? gender : ALL;
  const genderLabel = safeGender === ALL ? t.all : name("gender", safeGender);
  const ageChart = useMemo(
    () => ({
      labels: ages.map((age) => name("age", age).replace("–未滿", "–<")),
      series: [
        {
          label: safeGender === ALL ? t.demographics.allGenders : name("gender", safeGender),
          values: ages.map((age) =>
            sum(
              records.filter(
                (r) =>
                  r.dataset === "demographics" &&
                  r.age === age &&
                  (safeGender === ALL || r.gender === safeGender),
              ),
            ),
          ),
          color: INK,
        },
      ],
    }),
    [ages, records, safeGender, t, name],
  );
  return (
    <section id="ages" className={cn(pageWidth, storySection)}>
      <SectionHeading number="02" eyebrow={t.demographics.eyebrow} title={t.demographics.title}>
        {t.demographics.intro}
      </SectionHeading>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 sm:grid-cols-[minmax(0,1.65fr)_minmax(250px,1fr)] lg:gap-16">
        <div>
          <div className={panelHeading}>
            <h3 className={heading3}>{t.demographics.ageHeading(year)}</h3>
            <span className={inlineFilter}>
              {t.demographics.genderFilter}
              <DataSelect
                label={t.demographics.genderFilterAria}
                value={safeGender}
                onValueChange={setGender}
                options={[
                  { value: ALL, label: t.all },
                  ...genders.map((g) => ({ value: g, label: name("gender", g) })),
                ]}
              />
            </span>
          </div>
          <DataChart
            title={t.demographics.chartTitle(year, genderLabel)}
            unit={t.unit.people}
            {...ageChart}
            horizontal
            height={360}
          />
          <p className={footnote}>{t.demographics.ageFootnote}</p>
        </div>
        <aside className="self-start rounded-xl border border-border bg-card p-6 sm:p-7">
          <p className={eyebrow}>{t.demographics.allAges(year)}</p>
          <h3 className={cn(heading3, "mt-3.5 mb-6 text-[1.4375rem]")}>
            {t.demographics.genderDistribution}
          </h3>
          <div className="relative mb-6 h-3.5 overflow-hidden rounded-full" aria-hidden="true">
            {genderTotals.map((g, index) => (
              <i
                key={g.key}
                className="absolute inset-0 size-full origin-left transition-transform duration-600 ease-out-quart motion-reduce:transition-none"
                style={{
                  transform: `translateX(${share(
                    genderTotals.slice(0, index).reduce((total, row) => total + row.value, 0),
                    victimTotal,
                  )}%) scaleX(${share(g.value, victimTotal) / 100})`,
                  background: g.color,
                }}
              />
            ))}
          </div>
          {genderTotals.map((g) => (
            <div
              className="grid grid-cols-[1fr_1.2fr_1fr] items-center gap-2.5 border-b border-border py-3.75 font-numeric text-caption tabular-nums"
              key={g.key}
            >
              <span className="flex items-center gap-2">
                <i className="inline-block size-2 rounded-full" style={{ background: g.color }} />
                {g.label}
              </span>
              <b className="text-right font-medium">
                <AnimatedNumber value={g.value} />{" "}
                <small className="text-[0.625rem]">{t.unit.people}</small>
              </b>
              <span className="text-right text-xs text-muted-foreground">
                {g.value > 0 && g.value / victimTotal < 0.001 ? (
                  "<0.1"
                ) : (
                  <AnimatedNumber value={share(g.value, victimTotal)} format={fixed1} />
                )}
                %
              </span>
            </div>
          ))}
          <p className="mt-6 text-[0.6875rem] leading-[1.9] text-muted-foreground">
            {t.demographics.otherNote}
          </p>
        </aside>
      </div>
    </section>
  );
}
