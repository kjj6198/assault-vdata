import { useMemo } from "react";
import { DataChart } from "../DataChart";
import { AnimatedNumber } from "../StoryMotion";
import { cn } from "../../lib/utils";
import { useI18n } from "../../i18n";
import {
  INK,
  pageWidth,
  heading3,
  footnote,
  panelHeading,
  storySection,
  sum,
  type DashboardData,
} from "./shared";
import { SectionHeading } from "./SectionHeading";

export function TrendSection({
  data,
  onYearChange,
}: {
  data: DashboardData;
  onYearChange: (year: number) => void;
}) {
  const { t } = useI18n();
  const { year, years, records, trend } = data;
  const victimTotal = sum(records.filter((r) => r.dataset === "victims"));
  const trendChart = useMemo(
    () => ({
      labels: trend.map((r) => String(r.year)),
      series: [{ label: t.metric.victims, values: trend.map((r) => r.victims), color: INK }],
    }),
    [trend, t],
  );
  return (
    <section id="trend" className={cn(pageWidth, storySection)}>
      <SectionHeading number="01" eyebrow={t.trend.eyebrow} title={t.trend.title}>
        {t.trend.intro(years[0], years.at(-1) ?? years[0])}
      </SectionHeading>
      <div className="rounded-xl bg-muted px-3.5 pt-5.5 pb-4 sm:px-7.5 sm:pt-7 sm:pb-5.5">
        <div className={panelHeading}>
          <div>
            <h3 className={heading3}>{t.trend.chartTitle}</h3>
            <p className="mt-2 text-xs text-muted-foreground">{t.trend.hint}</p>
          </div>
          <p className="flex items-baseline gap-2 text-caption text-muted-foreground max-sm:mb-1 [&_strong]:font-numeric [&_strong]:text-[2rem] [&_strong]:leading-none [&_strong]:font-medium [&_strong]:tracking-[-0.04em] [&_strong]:text-primary [&_strong]:tabular-nums">
            <span className="mr-2">{t.year(year)}</span>
            <strong>
              <AnimatedNumber value={victimTotal} />
            </strong>
            {t.unit.people}
          </p>
        </div>
        <DataChart
          title={t.trend.chartTitle}
          unit={t.unit.people}
          {...trendChart}
          type="line"
          height={300}
          selectedLabel={String(year)}
          onSelectLabel={(label) => onYearChange(Number(label))}
        />
        <p className={footnote}>{t.trend.footnote}</p>
      </div>
    </section>
  );
}
