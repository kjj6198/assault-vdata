import { ratePer100k, type RegionMeasure } from "../lib/regions";
import { useMemo, useState } from "react";
import {
  RiAddLine,
  RiArrowDownLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowRightUpLine,
  RiArrowUpLine,
  RiDownloadLine,
  RiSubtractLine,
} from "react-icons/ri";
import type { getDashboard } from "../lib/data.server";
import type { DataRecord } from "../lib/data";
import { fixed1, formatNumber as num, share } from "../lib/data";
import { DataChart } from "./DataChart";
import { TaiwanMap } from "./TaiwanMap";
import { RegionRace } from "./RegionRace";
import { RegionTable } from "./RegionTable";
import { Button } from "./ui/button";
import { HeroFacts } from "./HeroFacts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { DataSelect } from "./DataSelect";
import { Reveal, AnimatedValue, AnimatedNumber } from "./StoryMotion";
import { useActiveSection } from "../lib/use-active-section";
import palette from "../lib/palette.json";
import { cn } from "../lib/utils";

type Props = {
  data: Awaited<ReturnType<typeof getDashboard>>;
  onYearChange: (year: number) => void;
  pending: boolean;
};
const INK = palette["data-people"].hex,
  CORAL = palette["data-relationships"].hex,
  GOLD = palette["data-secondary"].hex,
  GRAY = palette["data-unknown"].hex;
const sectionLinks = [
  { id: "overview", name: "年度重點" },
  { id: "trend", name: "歷年趨勢" },
  { id: "ages", name: "年齡與性別" },
  { id: "relationships", name: "兩造關係" },
  { id: "regions", name: "縣市分布" },
  { id: "sources", name: "資料來源" },
];
const sectionIds = sectionLinks.map((link) => link.id);
const pageWidth =
  "mx-auto w-[calc(100%-40px)] sm:w-[calc(100%-64px)] lg:w-[min(1120px,calc(100%-96px))]";
const eyebrow =
  "flex items-center gap-3 text-[13px] font-semibold tracking-[0.1em] text-muted-foreground [font-variant-caps:small-caps]";
const heading2 = "text-2xl font-bold leading-[1.5] tracking-[0.025em] text-balance sm:text-[32px]";
const heading3 = "text-base font-semibold leading-[1.6]";
const footnote = "mt-4 text-xs leading-[1.9] text-muted-foreground";
const panelHeading =
  "mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6 sm:flex-nowrap sm:gap-4";
const inlineFilter = "flex items-center gap-3 text-xs";
const pendingFade =
  "transition-opacity duration-150 group-data-pending:opacity-50 group-data-pending:duration-200 group-data-pending:delay-150";
const storySection = cn("story-section pt-12 pb-10 sm:pt-16", pendingFade);
const unitLabel = "ml-3 font-sans text-[13px] tracking-normal";
const sum = (rows: DataRecord[]) => rows.reduce((n, row) => n + row.value, 0);
const rankRelationships = (records: DataRecord[], age: string) => {
  const counts = new Map<string, number>();
  for (const r of records)
    if (r.dataset === "relationships" && (age === "全部" || r.age === age))
      counts.set(r.relationship, (counts.get(r.relationship) ?? 0) + r.value);
  return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};
function SectionHeading({
  number,
  eyebrow: label,
  title,
  children,
}: {
  number: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <div className="mb-7 flex items-start gap-4 sm:mb-9.5 sm:gap-7">
        <span
          className="w-[43px] shrink-0 font-numeric text-[46px] leading-none tracking-[-0.03em] text-section-marker sm:w-16 sm:text-[66px]"
          aria-hidden="true"
        >
          {number}
        </span>
        <div>
          <p className={cn(eyebrow, "mt-0.5 mb-2.5 text-[9px] sm:mb-[13px] sm:text-[13px]")}>
            {label}
          </p>
          <h2 className={heading2}>{title}</h2>
          <p className="mt-3 max-w-[720px] text-sm leading-[1.9] text-muted-foreground sm:text-[15px]">
            {children}
          </p>
        </div>
      </div>
    </Reveal>
  );
}
export function Dashboard({ data, onYearChange, pending }: Props) {
  const { year, years, records, trend, ages } = data;
  const [gender, setGender] = useState("全部");
  const [relationAge, setRelationAge] = useState("全部");
  const [regionMetric, setRegionMetric] = useState<"victims" | "reports">("victims");
  const [regionMeasure, setRegionMeasure] = useState<RegionMeasure>("rate");
  const [showAllRelations, setShowAllRelations] = useState(false);
  const activeSection = useActiveSection(sectionIds);
  const demo = records.filter((r) => r.dataset === "demographics");
  const victimTotal = sum(records.filter((r) => r.dataset === "victims"));
  const reportTotal = sum(records.filter((r) => r.dataset === "reports"));
  const minors = sum(demo.filter((r) => ages.slice(0, 3).includes(r.age)));
  const previous = trend.find((r) => r.year === year - 1);
  const change = previous ? (victimTotal / previous.victims - 1) * 100 : null;
  const yearIndex = years.indexOf(year);
  const genders = ["女", "男", ...(year >= 2019 ? ["其他"] : []), "不詳"];
  const safeGender = genders.includes(gender) ? gender : "全部";
  const genderTotals = genders.map((label) => ({
    label,
    value: sum(demo.filter((r) => r.gender === label)),
    color: label === "女" ? INK : label === "男" ? GOLD : label === "其他" ? CORAL : GRAY,
  }));
  const trendChart = useMemo(
    () => ({
      labels: trend.map((r) => String(r.year)),
      series: [{ label: "受暴人數", values: trend.map((r) => r.victims), color: INK }],
    }),
    [trend],
  );
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
  const relationships = useMemo(
    () => rankRelationships(records, relationAge),
    [records, relationAge],
  );
  const overallRelations = useMemo(() => rankRelationships(records, "全部"), [records]);
  const relationChart = useMemo(() => {
    const rows = showAllRelations ? relationships : relationships.slice(0, 8);
    return {
      labels: rows.map((r) => r.label),
      series: [{ label: "受暴人數", values: rows.map((r) => r.value), color: CORAL }],
    };
  }, [relationships, showAllRelations]);
  const populationByCity = new Map(data.populations.map((r) => [r.city, r.population]));
  const allRegionRows = records
    .filter((r) => r.dataset === "victims" || r.dataset === "reports")
    .filter((r) => r.dataset === regionMetric)
    .map((r) => {
      const population = populationByCity.get(r.city) ?? null;
      return { ...r, population, rate: ratePer100k(r.value, population) };
    });
  const topRateCity = records
    .filter((r) => r.dataset === "victims")
    .map((r) => ({
      city: r.city,
      rate: ratePer100k(r.value, populationByCity.get(r.city) ?? null),
    }))
    .filter((r): r is { city: string; rate: number } => r.rate !== null)
    .sort((a, b) => b.rate - a.rate)[0];
  const female = genderTotals[0];
  const male = genderTotals[1];
  const relationTotal = relationships.reduce((n, r) => n + r.value, 0);
  const leadingRelation = relationships[0];
  return (
    <>
      <a className="skip-link" href="#overview">
        跳至年度重點
      </a>
      <main id="main" className="group" data-pending={pending || undefined}>
        <div className="hero-overview">
          <div className="hero-original-background">
            <header className={cn(pageWidth, "hero-masthead")}>
              <a href="#main">
                看見數字背後<span>TAIWAN / DATA STORIES</span>
              </a>
              <a className="masthead-source" href="#sources">
                資料來源與下載 <RiArrowRightUpLine aria-hidden="true" />
              </a>
            </header>
            <section className={cn(pageWidth, "hero-intro")}>
              <div className="animate-story-enter motion-reduce:animate-fade-enter">
                <p className="hero-overline">衛生福利部公開資料・{years.length} 年統計</p>
                <h1 className="hero-title">
                  台灣性侵害統計
                  <br />
                  <span>
                    {years[0]}—{years.at(-1)}
                  </span>
                </h1>
                <p className="text-sm leading-loose text-muted-foreground sm:text-[15px]">
                  有多少人被記錄？他們的年齡、性別與處境是什麼？
                  <br className="hidden sm:block" />
                  從全國趨勢到你的縣市，一起讀懂通報數據。
                </p>
                <a href="#overview" className="hero-cta">
                  先看年度重點 <RiArrowDownLine aria-hidden="true" />
                </a>
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
                <p className="hero-summary-note">人數與件數為不同統計口徑，不能直接相加。</p>
              </aside>
            </section>
          </div>
        </div>
        <div id="explore" className="explore-nav">
          <div className={cn(pageWidth, "explore-nav-inner")}>
            <nav aria-label="專題章節" className="chapter-links">
              {sectionLinks.map((link) => (
                <a
                  href={`#${link.id}`}
                  key={link.id}
                  aria-current={activeSection === link.id ? "true" : undefined}
                  className="chapter-link"
                >
                  {link.name}
                </a>
              ))}
            </nav>
            <div className="nav-year-control">
              <label htmlFor="year" className="nav-year-label">
                統計年度
              </label>
              <Button
                variant="ghost"
                className="w-11 bg-transparent text-base sm:w-8.5"
                aria-label="上一年"
                disabled={pending || yearIndex === 0}
                onClick={() => onYearChange(years[yearIndex - 1])}
              >
                <RiArrowLeftSLine aria-hidden="true" />
              </Button>
              <DataSelect
                id="year"
                label="統計年度"
                className="min-w-[92px] font-semibold tabular-nums"
                value={String(year)}
                onValueChange={(value) => onYearChange(Number(value))}
                options={[...years].reverse().map((y) => ({ value: String(y), label: String(y) }))}
              />
              <Button
                variant="ghost"
                className="w-11 bg-transparent text-base sm:w-8.5"
                aria-label="下一年"
                disabled={pending || yearIndex === years.length - 1}
                onClick={() => onYearChange(years[yearIndex + 1])}
              >
                <RiArrowRightSLine aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
        <div className="hero-overview">
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
              <a className="overview-download" href={`/api/v1/data?year=${year}&format=csv`}>
                下載 {year} 年資料 <RiDownloadLine aria-hidden="true" />
              </a>
            </div>
            <HeroFacts
              year={year}
              total={victimTotal}
              change={change}
              previous={previous}
              trend={trend}
              topCity={topRateCity}
              female={female.value}
              male={male.value}
              minors={minors}
              relationships={overallRelations}
            />
            <p className="facts-source">
              資料來源：衛生福利部保護服務司・百分比依同年度資料計算，含不詳類別。
              <a href="#sources">
                資料與計算方式 <RiArrowRightUpLine aria-hidden="true" />
              </a>
            </p>
          </section>
        </div>
        <div className={cn(pageWidth, "reading-guide")}>
          <span className="reading-guide-label">閱讀前，先了解</span>
          <p>
            這些是<strong>已通報的紀錄</strong>
            。未通報的經驗不在數據中，數量變化也不等於實際發生率的變化。
          </p>
          <a href="#sources">
            統計口徑 <RiArrowRightUpLine aria-hidden="true" />
          </a>
        </div>
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
              <p className="trend-selected">
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
            <p className={footnote}>
              人數不等於發生率；本圖不推論未通報案件，也不直接代表犯罪趨勢。
            </p>
          </div>
        </section>
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
              <p className={footnote}>
                「12–&lt;18歲」表示滿 12 歲、未滿 18 歲。年齡不詳獨立列出。
              </p>
            </div>
            <aside className="self-start rounded-xl border border-border bg-card p-6 sm:p-7">
              <p className={eyebrow}>{year} 年・全部年齡</p>
              <h3 className={cn(heading3, "mt-3.5 mb-6 text-[23px]")}>性別分布</h3>
              <div
                className="gender-strip mb-6 h-3.5 overflow-hidden rounded-full"
                aria-hidden="true"
              >
                {genderTotals.map((g, index) => (
                  <i
                    key={g.label}
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
                  className="grid grid-cols-[1fr_1.2fr_1fr] items-center gap-2.5 border-b border-border py-[15px] text-[13px] tabular-nums font-numeric"
                  key={g.label}
                >
                  <span className="flex items-center gap-2">
                    <i
                      className="inline-block size-2 rounded-full"
                      style={{ background: g.color }}
                    />
                    {g.label}
                  </span>
                  <b className="text-right font-medium">
                    <AnimatedNumber value={g.value} /> <small className="text-[10px]">人</small>
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
              <p className="mt-6 text-[11px] leading-[1.9] text-muted-foreground">
                性別「其他」自 2019 年起新增。此前未設此欄位，不以零人代替。
              </p>
            </aside>
          </div>
        </section>
        <section id="relationships" className="story-section mt-4.5 bg-surface-alt sm:mt-8">
          <div className={cn(pageWidth, storySection, "pb-[65px]")}>
            <SectionHeading
              number="03"
              eyebrow="兩造關係 / Relationships"
              title="被害人與加害人，是什麼關係？"
            >
              從原始分類了解被害人與加害人的關係。選擇不同年齡，觀察分布如何改變。
            </SectionHeading>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-8 sm:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.7fr)] sm:gap-10 lg:gap-[74px]">
              <aside className="max-sm:border-b max-sm:border-border max-sm:pb-5">
                <label className="flex flex-col gap-3 text-xs" htmlFor="relation-age">
                  被害人年齡
                  <DataSelect
                    id="relation-age"
                    label="被害人年齡"
                    className="w-full"
                    value={relationAge}
                    onValueChange={setRelationAge}
                    options={[
                      { value: "全部", label: "全部年齡" },
                      ...ages.map((age) => ({ value: age, label: age })),
                    ]}
                  />
                </label>
                {leadingRelation && (
                  <div className="pt-6 pb-0 sm:py-8">
                    <p className="text-xs leading-[1.9] text-muted-foreground">
                      此年齡範圍中，最多紀錄的關係為
                    </p>
                    <h3 className={cn(heading3, "my-3 text-[26px] [overflow-wrap:anywhere]")}>
                      <AnimatedValue value={leadingRelation.label} />
                    </h3>
                    <strong className="font-numeric text-[40px] font-normal text-data-relationships tabular-nums sm:text-[46px]">
                      <AnimatedNumber value={leadingRelation.value} />
                      <small className={unitLabel}>人</small>
                    </strong>
                    <p className="mt-2.5 text-xs leading-[1.9] text-muted-foreground">
                      占此範圍{" "}
                      <AnimatedNumber
                        value={share(leadingRelation.value, relationTotal)}
                        format={fixed1}
                      />
                      %<br />共 <AnimatedNumber value={relationTotal} /> 人，包含關係不詳者
                    </p>
                  </div>
                )}
                <p className={footnote}>
                  分類在 2019、2021 年調整。不同年份的同類名稱，不一定能直接比較。
                </p>
              </aside>
              <div>
                <div className={panelHeading}>
                  <h3 className={heading3}>{year} 年・兩造關係</h3>
                  <span className="text-xs text-muted-foreground">
                    {showAllRelations ? `全部 ${relationships.length} 項` : "前 8 項"}
                  </span>
                </div>
                <DataChart
                  title={`${year} 年兩造關係（${relationAge}）`}
                  {...relationChart}
                  horizontal
                  height={showAllRelations ? Math.max(320, relationships.length * 36) : 320}
                />
                <Button
                  variant="ghost"
                  className="mt-2.5 inline-flex items-center gap-2.5 border-b border-muted-foreground bg-transparent text-xs"
                  onClick={() => setShowAllRelations(!showAllRelations)}
                  aria-expanded={showAllRelations}
                >
                  {showAllRelations ? "收合為前 8 項" : `展開全部 ${relationships.length} 項關係`}{" "}
                  {showAllRelations ? (
                    <RiSubtractLine aria-hidden="true" />
                  ) : (
                    <RiAddLine aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section id="regions" className={cn(pageWidth, storySection)}>
          <SectionHeading
            number="04"
            eyebrow="縣市分布 / Regional comparison"
            title="你的縣市，記錄了多少？"
          >
            以同年度人口比較 22
            縣市的通報紀錄。每十萬人口比率可減少人口規模的影響，但不代表未通報事件的實際發生率。
          </SectionHeading>
          <div className="mb-5.5 flex flex-wrap items-start gap-x-6 gap-y-3 sm:items-center">
            <span className={cn(inlineFilter, "flex-wrap sm:flex-nowrap")}>
              比較方式
              <DataSelect
                label="縣市比較方式"
                value={regionMeasure}
                onValueChange={(value) => {
                  if (value === "rate" || value === "count") setRegionMeasure(value);
                }}
                options={[
                  { value: "rate", label: "每十萬人口比率" },
                  { value: "count", label: "原始人數／件數" },
                ]}
              />
            </span>
            <p className="text-xs leading-[1.9] text-muted-foreground">
              {regionMeasure === "rate"
                ? "每十萬人口比率 = 人數或件數 ÷ 當年年底戶籍人口 × 100,000"
                : "原始數量保留各縣市通報紀錄的規模。"}
            </p>
          </div>
          <Tabs
            value={regionMetric}
            onValueChange={(value) => {
              if (value === "victims" || value === "reports") setRegionMetric(value);
            }}
          >
            <TabsList
              aria-label="縣市統計指標"
              className="mb-4.5 h-auto min-h-[50px] rounded-lg border border-border p-[3px] max-sm:w-full"
            >
              <TabsTrigger
                value="victims"
                className="px-5.5 text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none!"
              >
                受暴人數
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="px-5.5 text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none!"
              >
                通報件數
              </TabsTrigger>
            </TabsList>
            <TabsContent value={regionMetric}>
              <div className="race-primary">
                <div className="race-section-heading">
                  <p className="race-eyebrow">2019—{years.at(-1)} / 縣市動態比較</p>
                  <h3>縣市排序，隨時間變化</h3>
                  <p>按下播放，看前十名縣市如何變化。也可拖曳時間軸，停在你想看的年份。</p>
                </div>
                <RegionRace
                  history={data.regionHistory}
                  metric={regionMetric}
                  measure={regionMeasure}
                  startYear={2019}
                />
              </div>
            </TabsContent>
          </Tabs>
          <div className="region-map-section">
            <div className="region-map-heading">
              <p className="race-eyebrow">{year} / 縣市地圖</p>
              <h3>在地圖上，找到你的縣市。</h3>
              <p>點選縣市，查看 {year} 年的數量、人口與全國排序。可使用上方年度選單切換年份。</p>
            </div>
            <TaiwanMap
              year={year}
              metric={regionMetric}
              measure={regionMeasure}
              rows={allRegionRows}
            />
          </div>
          <details className="history-disclosure">
            <summary>
              <span>
                查詢 {year} 年各縣市完整數據
                <small>搜尋 22 個縣市・比較人數、件數與每十萬人口比率</small>
              </span>
              <RiAddLine aria-hidden="true" />
            </summary>
            <div className="pt-6">
              <RegionTable
                year={year}
                metric={regionMetric}
                measure={regionMeasure}
                rows={allRegionRows}
              />
            </div>
          </details>
          <p className="mt-6 text-xs leading-[1.9] text-muted-foreground">
            人口來源：
            <a
              href={data.populationSource.page}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-[3px]"
            >
              內政部戶政司・縣市人口統計
            </a>
            ，採各年年底戶籍人口。改制前縣市人口合併為現行 22
            縣市口徑。這是未經年齡標準化的粗比率；小人口縣市的比率較易隨少數通報波動。
            {regionMeasure === "rate" && "顏色使用各年度共用的固定六級比率區間，零值獨立留白。"}
          </p>
          <a
            className="mt-5 inline-flex items-center gap-2 py-3 text-xs underline underline-offset-[5px]"
            href={`/api/v1/regions?dataset=${regionMetric}&year=${year}&format=csv`}
          >
            下載 {year} 年縣市數據 CSV <RiDownloadLine aria-hidden="true" />
          </a>
        </section>
        <section
          id="sources"
          className="mt-7.5 scroll-mt-[118px] bg-muted py-12 sm:mt-15 sm:scroll-mt-[90px] sm:py-16"
        >
          <div className={pageWidth}>
            <p className={eyebrow}>資料來源 / Sources & methodology</p>
            <h2 className={cn(heading2, "mt-3")}>讀得懂，也查得到來源。</h2>
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-16">
              <div>
                <h3 className={heading3}>資料從哪裡來？</h3>
                <p className="mt-4.5 text-xs leading-[2] text-muted-foreground">
                  本專題整理衛生福利部保護服務司的四份公開統計，涵蓋 {years[0]}—{years.at(-1)}{" "}
                  年。保留原始試算表，逐格擷取並檢查加總；每筆下載資料附有來源檔名、工作表與儲存格位置。
                </p>
                <ol className="mt-5 list-[decimal-leading-zero] pl-[25px]">
                  {["relationships", "demographics", "victims", "reports"].map((kind) => {
                    const source = data.sources.find((s) => s.dataset === kind);
                    return source ? (
                      <li key={kind} className="py-2 pl-1.5 text-xs">
                        <a
                          href={source.page}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 leading-[1.9] underline underline-offset-4"
                        >
                          {source.title.split("(")[0]} <RiArrowRightUpLine aria-hidden="true" />
                        </a>
                      </li>
                    ) : null;
                  })}
                </ol>
              </div>
              <div>
                <h3 className={heading3}>如何閱讀這些數字？</h3>
                <ul className="mt-4.5 list-disc pl-4.5 text-xs leading-[2] text-muted-foreground [&>li]:mb-[9px]">
                  <li>「受暴人數」以人為單位；「通報件數」以件為單位，兩者不可混用。</li>
                  <li>
                    所有百分比以同年度、同指標的總數為分母，包含「不詳」。四捨五入後可能不恰為
                    100%。
                  </li>
                  <li>
                    空白且當年未設的關係分類不轉為 0。2019、2021 年分類改制，跨年比較請參照原表。
                  </li>
                  <li>
                    圖表採底層儲存格加總。原表的印列合計若有差異，另存於品質註記，不擅自修改原始數值。
                  </li>
                </ul>
              </div>
            </div>
            {data.qualityNotes.length > 0 && (
              <details className="mt-7 rounded-md bg-notice-background px-5 py-2.5 text-xs">
                <summary className="min-h-11 content-center">
                  {year} 年資料品質註記（{data.qualityNotes.length} 項）
                </summary>
                <ul className="list-disc p-4 leading-[2]">
                  {data.qualityNotes.map((note, i) => (
                    <li key={i}>
                      {note.kind === "published-age-difference"
                        ? `${note.age}：性別表為 ${num(note.demographics)} 人，關係表儲存格合計為 ${num(note.relationships)} 人，保留各表口徑。`
                        : `${note.kind === "published-column-total-difference" ? note.relationship : note.age}：關係表印列合計 ${num(note.published)} 人，儲存格合計 ${num(note.computed)} 人；圖表採儲存格合計。`}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <div className="mt-9.5 flex flex-col items-start justify-between gap-8 border-y border-border py-7.5 lg:flex-row lg:items-center">
              <div>
                <h3 className={heading3}>繼續探索，或自己分析。</h3>
                <p className="mt-2 text-xs leading-[1.9] text-muted-foreground">
                  下載含來源欄位的乾淨資料；完整資料可透過公開 API 取得。
                </p>
              </div>
              <div className="flex shrink-0 gap-3 max-sm:w-full max-sm:flex-wrap">
                <Button asChild className="max-sm:flex-1">
                  <a href={`/api/v1/data?year=${year}&format=csv`}>
                    下載 {year} 年 CSV <RiDownloadLine aria-hidden="true" />
                  </a>
                </Button>
                <Button variant="outline" asChild className="max-sm:flex-1">
                  <a href="/api/v1/data">
                    完整 JSON <RiArrowRightUpLine aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </div>
            <details className="mt-3 text-xs [&_code]:bg-secondary [&_code]:px-[5px] [&_code]:py-0.5 [&_code]:text-[11px]">
              <summary className="min-h-11 content-center">API 使用方式</summary>
              <p className="my-3 leading-[2] [overflow-wrap:anywhere]">
                <code>GET /api/v1/data</code> 提供完整資料。可加上 <code>year</code>、
                <code>dataset</code>、<code>city</code> 與 <code>format=csv</code> 篩選。
              </p>
              <p className="my-3 leading-[2] [overflow-wrap:anywhere]">
                dataset 支援 demographics、relationships、victims、reports。city
                僅適用縣市統計。年份與來源請見{" "}
                <a href="/api/v1/meta" className="underline">
                  /api/v1/meta
                </a>
                。
              </p>
              <a
                href="/api/v1/data?year=2025&dataset=victims"
                className="inline-flex items-center gap-1.5 underline"
              >
                範例：2025 年各縣市受暴人數 <RiArrowRightUpLine aria-hidden="true" />
              </a>
            </details>
          </div>
        </section>
      </main>
      <footer
        className={cn(
          pageWidth,
          "flex min-h-[110px] flex-wrap items-center gap-3 py-7 text-[11px] sm:flex-nowrap sm:gap-7.5 sm:py-0",
        )}
      >
        <a
          className="inline-flex items-center gap-3 text-[15px] font-bold tracking-[0.04em]"
          href="#main"
        >
          看見數字背後
        </a>
        <p className="text-muted-foreground max-sm:order-3 max-sm:w-full">
          台灣性侵害統計・以理解，取代想像。
        </p>
        <a href="#main" className="ml-auto inline-flex min-h-11 items-center gap-1.5 text-[11px]">
          回到頂端 <RiArrowUpLine aria-hidden="true" />
        </a>
      </footer>
    </>
  );
}
