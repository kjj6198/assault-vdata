import { useI18n } from "../../i18n";
import { fixed1, formatNumber, share } from "../../lib/data";
import { cn } from "../../lib/utils";
import { AnimatedNumber } from "../StoryMotion";
import { SectionHeading } from "./SectionHeading";
import {
  CORAL,
  GOLD,
  GRAY,
  INK,
  heading3,
  pageWidth,
  storySection,
  sum,
  type DashboardData,
} from "./shared";

const genderColors: Record<string, string> = { 男: GOLD, 女: INK, 其他: CORAL, 不詳: GRAY };
const formatPercentage = (value: number) => (value > 0 && value < 0.1 ? "<0.1" : fixed1(value));

export function SuspectsSection({ data }: { data: DashboardData }) {
  const { t, name } = useI18n();
  const { year } = data;
  const records = data.records.filter((r) => r.dataset === "suspects");
  const total = sum(records);
  // Only render categories actually published for this year.
  const genders = ["男", "女", "其他", "不詳"].flatMap((gender) => {
    const record = records.find((r) => r.gender === gender);
    return record
      ? [{ ...record, label: name("gender", gender), color: genderColors[gender] }]
      : [];
  });
  return (
    <section id="suspects" className={cn(pageWidth, storySection)}>
      <SectionHeading number="03" eyebrow={t.suspects.eyebrow} title={t.suspects.title}>
        {t.suspects.intro}
      </SectionHeading>
      {records.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-sm leading-loose text-muted-foreground">
          {t.suspects.unavailable(year)}
        </p>
      ) : (
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <div className="mb-7 flex flex-wrap items-baseline justify-between gap-3">
              <h3 className={heading3}>{t.suspects.heading(year)}</h3>
              <p className="text-xs text-muted-foreground">
                <AnimatedNumber
                  value={total}
                  format={(value) => t.suspects.total(formatNumber(Math.round(value)))}
                />
              </p>
            </div>
            <div className="mb-6 flex gap-8 sm:gap-16">
              {genders
                .filter((g) => g.gender === "男" || g.gender === "女")
                .map((g) => (
                  <div key={g.gender}>
                    <p className="mb-2 flex items-center gap-2 text-sm">
                      <i
                        className="size-2.5 rounded-full"
                        style={{ background: g.color }}
                        aria-hidden="true"
                      />
                      {g.label}
                    </p>
                    <p className="font-numeric text-4xl leading-tight tabular-nums sm:text-5xl">
                      <AnimatedNumber value={share(g.value, total)} format={formatPercentage} />
                      <span className="ml-1 text-xl">%</span>
                    </p>
                  </div>
                ))}
            </div>
            <div className="flex h-7 overflow-hidden rounded-md" aria-hidden="true">
              {genders.map((g) => (
                <span
                  key={g.gender}
                  style={{ width: `${share(g.value, total)}%`, background: g.color }}
                />
              ))}
            </div>
          </div>
          <table className="w-full self-start text-sm">
            <caption className="sr-only">{t.suspects.heading(year)}</caption>
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th scope="col" className="pb-3 text-left font-normal">
                  {t.suspects.gender}
                </th>
                <th scope="col" className="pb-3 text-right font-normal">
                  {t.suspects.count}
                </th>
                <th scope="col" className="pb-3 text-right font-normal">
                  {t.suspects.percentage}
                </th>
              </tr>
            </thead>
            <tbody>
              {genders.map((g) => (
                <tr key={g.gender} className="border-b border-border">
                  <th scope="row" className="py-3.5 text-left font-normal">
                    <span className="flex items-center gap-2">
                      <i
                        className="size-2 rounded-full"
                        style={{ background: g.color }}
                        aria-hidden="true"
                      />
                      {g.label}
                    </span>
                  </th>
                  <td className="py-3.5 text-right font-numeric tabular-nums">
                    <AnimatedNumber value={g.value} />
                  </td>
                  <td className="py-3.5 text-right font-numeric tabular-nums">
                    <AnimatedNumber value={share(g.value, total)} format={formatPercentage} />%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
