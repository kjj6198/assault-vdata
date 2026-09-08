import { useMemo, useState } from "react";
import { fixed1, share } from "../../lib/data";
import { DataChart } from "../DataChart";
import { DataSelect } from "../DataSelect";
import { AnimatedNumber } from "../StoryMotion";
import { cn } from "../../lib/utils";
import {
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
  const { year, records, ages } = data;
  const [gender, setGender] = useState("全部");
  const demo = records.filter((r) => r.dataset === "demographics");
  const victimTotal = sum(records.filter((r) => r.dataset === "victims"));

  const genders = ["女", "男", ...(year >= 2019 ? ["其他"] : []), "不詳"];
  const genderTotals = genders.map((label) => ({
    label,
    value: sum(demo.filter((r) => r.gender === label)),
    color: label === "女" ? INK : label === "男" ? GOLD : label === "其他" ? CORAL : GRAY,
  }));
  const safeGender = genders.includes(gender) ? gender : "全部";
  const ageChart = useMemo(
    () => ({
      labels: ages.map((age) => age.replace("–未滿", "–<")),
      series: [
        {
          label: safeGender === "全部" ? "全部性別" : safeGender,
          values: ages.map((age) =>
            sum(
              records.filter(
                (r) =>
                  r.dataset === "demographics" &&
                  r.age === age &&
                  (safeGender === "全部" || r.gender === safeGender),
              ),
            ),
          ),
          color: INK,
        },
      ],
    }),
    [ages, records, safeGender],
  );
  return (
    <section id="ages" className={cn(pageWidth, storySection)}>
      <SectionHeading
        number="02"
        eyebrow="年齡與性別 / Demographics"
        title="哪些年齡與性別被記錄？"
      >
        查看各年齡層的人數，或篩選性別。右側性別分布以全部年齡為範圍。
      </SectionHeading>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 sm:grid-cols-[minmax(0,1.65fr)_minmax(250px,1fr)] lg:gap-16">
        <div>
          <div className={panelHeading}>
            <h3 className={heading3}>{year} 年・年齡分布</h3>
            <span className={inlineFilter}>
              性別
              <DataSelect
                label="年齡分布的性別"
                value={safeGender}
                onValueChange={setGender}
                options={["全部", ...genders].map((g) => ({
                  value: g,
                  label: g,
                }))}
              />
            </span>
          </div>
          <DataChart
            title={`${year} 年年齡分布（${safeGender}）`}
            {...ageChart}
            horizontal
            height={360}
          />
          <p className={footnote}>「12–&lt;18歲」表示滿 12 歲、未滿 18 歲。年齡不詳獨立列出。</p>
        </div>
        <aside className="self-start rounded-xl border border-border bg-card p-6 sm:p-7">
          <p className={eyebrow}>{year} 年・全部年齡</p>
          <h3 className={cn(heading3, "mt-3.5 mb-6 text-[1.4375rem]")}>性別分布</h3>
          <div className="relative mb-6 h-3.5 overflow-hidden rounded-full" aria-hidden="true">
            {genderTotals.map((g, index) => (
              <i
                key={g.label}
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
              key={g.label}
            >
              <span className="flex items-center gap-2">
                <i className="inline-block size-2 rounded-full" style={{ background: g.color }} />
                {g.label}
              </span>
              <b className="text-right font-medium">
                <AnimatedNumber value={g.value} /> <small className="text-[0.625rem]">人</small>
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
            性別「其他」自 2019 年起新增。此前未設此欄位，不以零人代替。
          </p>
        </aside>
      </div>
    </section>
  );
}
