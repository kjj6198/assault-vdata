import { useMemo } from "react";
import { DataChart } from "../DataChart";
import { AnimatedNumber } from "../StoryMotion";
import { cn } from "../../lib/utils";
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
  const { year, years, records, trend } = data;
  const victimTotal = sum(records.filter((r) => r.dataset === "victims"));
  const trendChart = useMemo(
    () => ({
      labels: trend.map((r) => String(r.year)),
      series: [{ label: "受暴人數", values: trend.map((r) => r.victims), color: INK }],
    }),
    [trend],
  );
  return (
    <section id="trend" className={cn(pageWidth, storySection)}>
      <SectionHeading
        number="01"
        eyebrow="歷年趨勢 / Annual trend"
        title="受暴人數，如何逐年變化？"
      >
        從 {years[0]} 年到 {years.at(-1)} 年，通報系統記錄下的受暴人數如何改變？
      </SectionHeading>
      <div className="rounded-xl bg-muted px-3.5 pt-5.5 pb-4 sm:px-7.5 sm:pt-7 sm:pb-5.5">
        <div className={panelHeading}>
          <div>
            <h3 className={heading3}>歷年受暴人數</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              點選折線上的年份，或使用上方年度選單。
            </p>
          </div>
          <p className="flex items-baseline gap-2 text-caption text-muted-foreground max-sm:mb-1 [&_strong]:font-numeric [&_strong]:text-[2rem] [&_strong]:leading-none [&_strong]:font-medium [&_strong]:tracking-[-0.04em] [&_strong]:text-primary [&_strong]:tabular-nums [&>span]:mr-2">
            <span>{year} 年</span>
            <strong>
              <AnimatedNumber value={victimTotal} />
            </strong>
            人
          </p>
        </div>
        <DataChart
          title="歷年受暴人數"
          {...trendChart}
          type="line"
          height={300}
          selectedLabel={String(year)}
          onSelectLabel={(label) => onYearChange(Number(label))}
        />
        <p className={footnote}>人數不等於發生率；本圖不推論未通報案件，也不直接代表犯罪趨勢。</p>
      </div>
    </section>
  );
}
