import { ratePer100k } from "../../lib/regions";
import { useMemo } from "react";
import { HeroFacts } from "../HeroFacts";
import { DataSelect } from "../DataSelect";
import { AnimatedNumber } from "../StoryMotion";
import { cn } from "../../lib/utils";
import {
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
  const { year, years, records, trend, ages } = data;
  const demo = records.filter((r) => r.dataset === "demographics");
  const victimTotal = sum(records.filter((r) => r.dataset === "victims"));
  const reportTotal = sum(records.filter((r) => r.dataset === "reports"));
  const minors = sum(demo.filter((r) => ages.slice(0, 3).includes(r.age)));
  const previous = trend.find((r) => r.year === year - 1);
  const change = previous ? (victimTotal / previous.victims - 1) * 100 : null;
  const genders = ["女", "男", ...(year >= 2019 ? ["其他"] : []), "不詳"];
  const genderTotals = genders.map((label) => ({
    label,
    value: sum(demo.filter((r) => r.gender === label)),
    color: label === "女" ? INK : label === "男" ? GOLD : label === "其他" ? CORAL : GRAY,
  }));
  const overallRelations = useMemo(() => rankRelationships(records, "全部"), [records]);
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
    <div className="hero-overview">
      <div className="hero-original-background">
        <section className={cn(pageWidth, "hero-intro")}>
          <div className="animate-story-enter motion-reduce:animate-fade-enter">
            <h1 className="hero-title">
              台灣性侵害統計
              <br />
              <span>
                {years[0]}—{years.at(-1)}
              </span>
            </h1>
          </div>
          <aside className="hero-summary" aria-label={`${year} 年全國統計`}>
            <p className="hero-summary-label">
              <span className="hero-status-dot" />
              {year} 年・全國統計
            </p>
            <p className="hero-total-label">通報紀錄中的受暴人數</p>
            <p className="hero-total">
              <AnimatedNumber value={victimTotal} />
              <small>人</small>
            </p>
            <div className="hero-summary-footer">
              <span>同年度通報件數</span>
              <span>
                <AnimatedNumber value={reportTotal} /> <small>件</small>
              </span>
            </div>
          </aside>
        </section>
        <section
          id="overview"
          tabIndex={-1}
          className={cn(pageWidth, "hero-facts", pendingFade)}
          aria-labelledby="facts-heading"
          aria-busy={pending}
        >
          <div className="facts-toolbar">
            <div>
              <output className="facts-eyebrow">
                {pending ? "正在載入資料…" : `${year} 年・民國 ${year - 1911} 年`}
              </output>
              <h2 id="facts-heading">這一年，值得看見的數字</h2>
            </div>
            <div className="facts-controls">
              <DataSelect
                id="hero-year"
                label="年度重點統計年度"
                value={String(year)}
                onValueChange={(value) => onYearChange(Number(value))}
                options={[...years].reverse().map((y) => ({ value: String(y), label: `${y} 年` }))}
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
