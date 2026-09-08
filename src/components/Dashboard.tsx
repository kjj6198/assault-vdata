import { ratePer100k, formatRate, type RegionMeasure } from "../lib/regions";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  RiAddLine,
  RiArrowDownLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowRightDownLine,
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
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
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
  { id: "trend", name: "歷年趨勢" },
  { id: "ages", name: "年齡與性別" },
  { id: "relationships", name: "兩造關係" },
  { id: "regions", name: "縣市分布" },
];
const sectionIds = sectionLinks.map((link) => link.id);
const pageWidth =
  "mx-auto w-[calc(100%-40px)] sm:w-[calc(100%-64px)] lg:w-[min(1120px,calc(100%-96px))]";
const eyebrow =
  "flex items-center gap-3 text-[13px] font-semibold tracking-[0.1em] text-muted-foreground [font-variant-caps:small-caps]";
const heading2 = "text-2xl font-bold leading-[1.5] tracking-[0.025em] text-balance sm:text-[29px]";
const heading3 = "text-base font-semibold leading-[1.6]";
const footnote = "mt-4 text-[11px] leading-[1.9] text-muted-foreground";
const panelHeading =
  "mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6 sm:flex-nowrap sm:gap-4";
const inlineFilter = "flex items-center gap-3 text-xs";
const pendingFade =
  "transition-opacity duration-150 group-data-pending:opacity-50 group-data-pending:duration-200 group-data-pending:delay-150";
const storySection = cn("pt-13 pb-9 scroll-mt-[118px] sm:pt-19 sm:scroll-mt-[90px]", pendingFade);
const unitLabel = "ml-3 font-sans text-[13px] tracking-normal";
const widthTransition =
  "transition-[width] duration-500 ease-out-quart motion-reduce:transition-none";
const genderTone: Record<string, string> = {
  女: "bg-hero-muted",
  男: "bg-data-secondary",
  其他: "bg-map-3",
  不詳: "bg-section-marker",
};
const sum = (rows: DataRecord[]) => rows.reduce((n, row) => n + row.value, 0);
const rankRelationships = (records: DataRecord[], age: string) => {
  const counts = new Map<string, number>();
  for (const r of records)
    if (r.dataset === "relationships" && (age === "全部" || r.age === age))
      counts.set(r.relationship, (counts.get(r.relationship) ?? 0) + r.value);
  return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};
const signed = (value: number) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(1)}%`;
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
          <p className="mt-3 max-w-[720px] text-xs leading-[1.9] text-muted-foreground sm:text-[13px]">
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
  const genderTotals = genders.map((label, i) => ({
    label,
    value: sum(demo.filter((r) => r.gender === label)),
    color: [INK, GOLD, CORAL, GRAY][i],
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
  const overallRelation = overallRelations[0];
  const overallRelationTotal = overallRelations.reduce((n, r) => n + r.value, 0);
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
  const facts: {
    label: string;
    value: ReactNode;
    note: ReactNode;
    icon?: ReactNode;
  }[] = [
    {
      label: "較前一年的變化",
      value: change === null ? "—" : <AnimatedNumber value={change} format={signed} />,
      icon:
        change === null ? null : change >= 0 ? (
          <RiArrowRightUpLine aria-hidden="true" />
        ) : (
          <RiArrowRightDownLine aria-hidden="true" />
        ),
      note:
        previous === undefined ? (
          "資料起始年度，無前一年可比"
        ) : (
          <>
            受暴人數 <AnimatedNumber value={victimTotal} /> 人，前一年{" "}
            <AnimatedNumber value={previous.victims} /> 人
          </>
        ),
    },
    {
      label: "每十萬人口比率最高",
      value: topRateCity?.city ?? "—",
      note: topRateCity ? (
        <>
          每十萬人 <AnimatedNumber value={topRateCity.rate} format={formatRate} /> 人・受暴人數
        </>
      ) : (
        "缺少人口資料"
      ),
    },
    {
      label: "女性占受暴人數",
      value: (
        <>
          <AnimatedNumber value={share(female.value, victimTotal)} format={fixed1} />%
        </>
      ),
      note: (
        <>
          <AnimatedNumber value={female.value} /> 人；男性{" "}
          <AnimatedNumber value={share(male.value, victimTotal)} format={fixed1} />%
        </>
      ),
    },
    {
      label: "受暴人中未滿 18 歲",
      value: (
        <>
          <AnimatedNumber value={share(minors, victimTotal)} format={fixed1} />%
        </>
      ),
      note: (
        <>
          <AnimatedNumber value={minors} /> 人，含年齡不詳者的分母
        </>
      ),
    },
    {
      label: "最多紀錄的兩造關係",
      value: overallRelation?.label ?? "—",
      note: overallRelation ? (
        <>
          <AnimatedNumber value={overallRelation.value} /> 人，占{" "}
          <AnimatedNumber
            value={share(overallRelation.value, overallRelationTotal)}
            format={fixed1}
          />
          %
        </>
      ) : (
        "無資料"
      ),
    },
  ];
  const relationTotal = relationships.reduce((n, r) => n + r.value, 0);
  const leadingRelation = relationships[0];
  return (
    <>
      <a
        className="fixed -top-[100px] left-4 z-[100] bg-foreground p-3.5 text-white focus:top-2.5"
        href="#main"
      >
        跳至主要內容
      </a>
      <header className="flex min-h-[70px] items-center justify-between gap-3 border-b border-border px-5 py-3 sm:min-h-[84px] sm:gap-6 sm:px-12 sm:py-4">
        <a
          href="/"
          className="inline-flex items-center gap-[9px] text-[15px] font-bold tracking-[0.04em] sm:gap-3 sm:text-lg"
        >
          <span className="flex h-6 items-end gap-[3px]" aria-hidden="true">
            <i className="h-[17px] w-1 bg-primary" />
            <i className="h-6 w-1 bg-primary" />
            <i className="h-3 w-1 bg-primary" />
          </span>
        </a>
        <a
          href="#sources"
          className="inline-flex min-h-11 items-center gap-[7px] text-[11px] sm:gap-1.5 sm:text-[13px]"
        >
          資料與方法 <RiArrowRightUpLine aria-hidden="true" />
        </a>
      </header>
      <main id="main" className="group" data-pending={pending || undefined}>
        <div className="relative isolate overflow-hidden bg-background bg-(image:--hero-gradient) after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:bg-(image:--grain) after:opacity-[0.18] after:mix-blend-multiply after:content-['']">
          <section
            className={cn(
              pageWidth,
              "grid grid-cols-1 items-center gap-[42px] py-[42px] sm:grid-cols-[1.2fr_1fr] sm:gap-[45px] sm:py-16 lg:gap-20 lg:pt-22 lg:pb-19 xl:gap-[110px]",
            )}
          >
            <div className="animate-story-enter motion-reduce:animate-fade-enter">
              <h1 className="my-5.5 text-[clamp(39px,9vw,62px)] font-bold leading-[1.5] tracking-[0.045em] text-balance sm:mt-7 sm:mb-6 sm:text-[clamp(42px,5.1vw,68px)]">
                台灣性侵害統計
                <br />
                {years[0]}—{years.at(-1)}
              </h1>
              <p className="text-sm leading-[2] text-muted-foreground sm:text-[15px]">
                從通報紀錄出發，看見性侵害的樣貌。
                <br className="hidden sm:block" />
                透過年齡、關係與地域，理解數字背後的處境。
              </p>
              <a
                href="#explore"
                className="mt-8.5 inline-flex items-center gap-[46px] border-b border-foreground py-2.5 text-sm font-semibold [&_svg]:size-5.5 [&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-out-quart hover:[&_svg]:translate-y-[3px] motion-reduce:[&_svg]:transition-none"
              >
                一起讀懂這些數據 <RiArrowDownLine aria-hidden="true" />
              </a>
              <p className="mt-5.5 text-[11px] text-muted-foreground sm:mt-7.5">
                資料來源：衛生福利部保護服務司
              </p>
            </div>
            <Card className="w-[min(100%,420px)] max-w-[410px] animate-story-enter justify-self-center gap-0 border-0 bg-hero-background px-7 py-5.5 text-hero-foreground shadow-none [animation-delay:80ms] motion-reduce:animate-fade-enter sm:w-full sm:justify-self-end sm:px-6 sm:pt-[25px] sm:pb-5.5 lg:px-8">
              <div className="flex justify-between border-b border-hero-border pb-3.5 text-xs tracking-[0.08em] text-hero-muted">
                <span>被記錄的，是人生。</span>
                <span className="font-numeric text-[19px]">{year}</span>
              </div>
              <div
                className="mx-auto my-6 grid w-full max-w-[280px] grid-cols-10 gap-[9px]"
                aria-hidden="true"
              >
                {Array.from({ length: 100 }, (_, i) => (
                  <i
                    key={i}
                    style={{ "--i": i } as CSSProperties}
                    className={cn(
                      "aspect-square w-full animate-dot-enter rounded-full transition-colors duration-400 [animation-delay:calc(220ms+var(--i)*5ms)] motion-reduce:animate-none",
                      i < Math.round((minors / victimTotal) * 100)
                        ? "bg-data-secondary"
                        : "bg-hero-dot",
                    )}
                  />
                ))}
              </div>
              <div className="flex items-center gap-6">
                <strong className="font-numeric text-[55px] font-medium leading-none tracking-[-0.025em] sm:text-[64px]">
                  <AnimatedNumber value={share(minors, victimTotal)} format={fixed1} />
                  <small className="text-[27px]">%</small>
                </strong>
                <p className="text-[13px] leading-[1.8]">
                  當年受暴人中
                  <br />
                  <b>未滿 18 歲</b>
                </p>
              </div>
              <p className="mt-4 text-[11px] leading-[1.8] text-hero-muted">
                每個圓點約代表 1% 的受暴人數，含年齡不詳者。
              </p>
              <div className="mt-5.5 border-t border-hero-border pt-5">
                <p className="text-xs font-medium">當年受暴人的性別比例</p>
                <div
                  className="my-4 flex h-2 gap-0.5 overflow-hidden rounded-[2px]"
                  aria-hidden="true"
                >
                  {genderTotals.map((g) => (
                    <i
                      key={g.label}
                      className={cn(genderTone[g.label], widthTransition)}
                      style={{ width: `${(g.value / victimTotal) * 100}%` }}
                    />
                  ))}
                </div>
                <dl className="mb-4 grid grid-cols-2 gap-x-5 gap-y-4 sm:gap-x-6">
                  {genderTotals.map((g, i) => (
                    <div className="flex justify-between gap-2" key={g.label}>
                      <dt className="flex items-baseline gap-1.5 pt-[3px] text-xs">
                        <i
                          className={cn(
                            "inline-block size-[7px] rounded-full",
                            genderTone[g.label],
                          )}
                          aria-hidden="true"
                        />
                        {g.label}
                      </dt>
                      <dd
                        className={cn(
                          "m-0 text-right whitespace-nowrap tabular-nums",
                          i >= 2 ? "text-sm" : "text-[19px]",
                        )}
                      >
                        {g.value > 0 && g.value / victimTotal < 0.001 ? (
                          "<0.1"
                        ) : (
                          <AnimatedNumber value={share(g.value, victimTotal)} format={fixed1} />
                        )}
                        <small className="ml-0.5 text-[11px]">%</small>
                        <span className="mt-[3px] block text-[10px] text-hero-muted">
                          <AnimatedNumber value={g.value} /> 人
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="text-[10px] leading-[1.8] text-hero-muted">
                  以全部受暴人數為分母
                  {year >= 2019 ? "，含其他與不詳" : "，含不詳"}
                  ；四捨五入後合計可能不為 100%。
                </p>
              </div>
            </Card>
          </section>
        </div>
        <section className={cn(pageWidth, "pt-10 pb-5 sm:pt-14")} aria-labelledby="facts-heading">
          <div>
            <p className={eyebrow}>
              <span className="h-0.5 w-6.5 bg-primary" />
              At a glance・{year}
            </p>
            <h2 id="facts-heading" className={cn(heading2, "mt-3.5 text-2xl sm:text-2xl")}>
              五個數字，先看重點。
            </h2>
          </div>
        </section>
        <div
          className={cn(
            pageWidth,
            "flex items-start gap-4 border-t border-border pt-6 pb-6.5 sm:gap-7 sm:pb-9",
          )}
        >
          <Badge variant="outline" className="shrink-0 pt-[3px] text-xs font-semibold">
            閱讀之前
          </Badge>
        </div>
        <div id="explore" className="sticky top-0 z-10 border-y border-border bg-background">
          <div
            className={cn(
              pageWidth,
              "flex min-h-[74px] flex-col-reverse items-center justify-between gap-0 sm:flex-row sm:gap-4.5",
            )}
          >
            <nav
              aria-label="專題章節"
              className="flex w-full justify-between gap-2 sm:w-auto sm:justify-start sm:gap-4 lg:gap-7"
            >
              {sectionLinks.map((link, i) => (
                <a
                  href={`#${link.id}`}
                  key={link.id}
                  aria-current={activeSection === link.id ? "true" : undefined}
                  className="flex min-h-[43px] items-center gap-[7px] text-[11px] whitespace-nowrap text-muted-foreground shadow-[inset_0_-2px_0_transparent] transition-[color,box-shadow] duration-150 hover:text-foreground hover:no-underline aria-[current=true]:text-foreground aria-[current=true]:shadow-[inset_0_-2px_0_var(--primary)] sm:min-h-11 sm:text-[13px]"
                >
                  <span className="hidden text-[10px] text-muted-foreground lg:inline">
                    0{i + 1}
                  </span>
                  {link.name}
                </a>
              ))}
            </nav>
            <div className="flex w-full items-center justify-center gap-[5px] border-b border-border py-[5px] sm:w-auto sm:justify-start sm:border-0 sm:py-0">
              <label
                htmlFor="year"
                className="mr-5 block text-[11px] whitespace-nowrap sm:hidden lg:mr-2.5 lg:block"
              >
                統計年度
              </label>
              <Button
                variant="ghost"
                className="w-11 bg-transparent text-base sm:w-8.5"
                aria-label="上一年"
                disabled={yearIndex === 0}
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
                disabled={yearIndex === years.length - 1}
                onClick={() => onYearChange(years[yearIndex + 1])}
              >
                <RiArrowRightSLine aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
        <div className={pageWidth}>
          <output className="mt-6 mb-6 flex justify-between gap-5 text-[11px] sm:mt-8 sm:text-xs">
            {pending ? "正在載入資料…" : `正在閱讀 ${year} 年資料`}
            <span className="text-[10px] text-muted-foreground sm:text-[11px]">
              民國 {year - 1911} 年・全國統計
            </span>
          </output>
          <div
            className={cn(
              "grid grid-cols-1 gap-5.5 border-b border-border pb-7.5 sm:grid-cols-3 sm:gap-9 sm:pb-10 [&>div]:grid [&>div]:grid-cols-2 [&>div]:items-center sm:[&>div]:block sm:[&>div]:border-l sm:[&>div]:border-border sm:[&>div]:pl-7.5 sm:[&>div:first-child]:border-l-0 sm:[&>div:first-child]:pl-0 [&_p]:text-xs sm:[&_p]:text-[13px] [&_strong]:row-span-2 [&_strong]:my-0 [&_strong]:block [&_strong]:text-right [&_strong]:font-numeric [&_strong]:text-[38px] [&_strong]:font-normal [&_strong]:leading-[1.25] [&_strong]:tracking-[-0.015em] [&_strong]:tabular-nums sm:[&_strong]:row-span-1 sm:[&_strong]:my-2.5 sm:[&_strong]:text-left sm:[&_strong]:text-[clamp(35px,4.5vw,54px)] [&_small]:ml-3 [&_small]:font-sans [&_small]:text-[13px] [&_small]:tracking-normal [&>div>span]:col-start-1 [&>div>span]:mt-[7px] [&>div>span]:text-[10px] [&>div>span]:text-muted-foreground sm:[&>div>span]:mt-0 sm:[&>div>span]:text-[11px] [&>div:last-child_strong]:text-primary",
              pendingFade,
            )}
          >
            <div>
              <p>受暴人數</p>
              <strong>
                <AnimatedNumber value={victimTotal} />
                <small>人</small>
              </strong>
              <span>
                {change === null ? (
                  "資料起始年度"
                ) : (
                  <>
                    較前一年{change >= 0 ? "增加" : "減少"}{" "}
                    <AnimatedNumber value={Math.abs(change)} format={fixed1} />%
                  </>
                )}
              </span>
            </div>
            <div>
              <p>通報件數</p>
              <strong>
                <AnimatedNumber value={reportTotal} />
                <small>件</small>
              </strong>
              <span>通報件數與受暴人數為不同統計口徑</span>
            </div>
            <div>
              <p>未滿 18 歲受暴人數</p>
              <strong>
                <AnimatedNumber value={minors} />
                <small>人</small>
              </strong>
              <span>
                占當年受暴人數 <AnimatedNumber value={share(minors, victimTotal)} format={fixed1} />
                %
              </span>
            </div>
          </div>
        </div>
        <section id="trend" className={cn(pageWidth, storySection)}>
          <SectionHeading number="01" eyebrow="Across the years" title="沿著時間，看見變化。">
            從 {years[0]} 年到 {years.at(-1)} 年，通報系統記錄下的受暴人數如何改變？
          </SectionHeading>
          <div className="rounded-xl bg-muted px-3.5 pt-5.5 pb-4 sm:px-7.5 sm:pt-7 sm:pb-5.5">
            <div className={panelHeading}>
              <h3 className={heading3}>歷年受暴人數</h3>
              <span className="text-xs text-muted-foreground">
                {years[0]}—{years.at(-1)}
              </span>
            </div>
            <DataChart title="歷年受暴人數" {...trendChart} type="line" height={320} />
            <p className={footnote}>
              人數不等於發生率；本圖不推論未通報案件，也不直接代表犯罪趨勢。
            </p>
          </div>
        </section>
        <section id="ages" className={cn(pageWidth, storySection)}>
          <SectionHeading number="02" eyebrow="Age & gender" title="受暴，發生在不同的人生階段。">
            保留每個年齡區間與性別分類，讓容易被忽略的經驗也能被看見。
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
              <div className="mb-6 flex h-3.5 gap-px" aria-hidden="true">
                {genderTotals.map((g) => (
                  <i
                    key={g.label}
                    className={widthTransition}
                    style={{
                      width: `${(g.value / victimTotal) * 100}%`,
                      background: g.color,
                    }}
                  />
                ))}
              </div>
              {genderTotals.map((g) => (
                <div
                  className="grid grid-cols-[1fr_1.2fr_1fr] items-center gap-2.5 border-b border-border py-[15px] text-[13px] tabular-nums"
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
        <section id="relationships" className="mt-4.5 bg-surface-alt sm:mt-13">
          <div className={cn(pageWidth, storySection, "pb-[65px]")}>
            <SectionHeading
              number="03"
              eyebrow="Behind the relationship"
              title="兩造之間，是什麼關係？"
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
          <SectionHeading number="04" eyebrow="Across Taiwan" title="放回地方，看見分布。">
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
                  { value: "rate", label: "每十萬人口・線性刻度" },
                  { value: "count", label: "原始數量・線性刻度" },
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
              <TaiwanMap
                year={year}
                metric={regionMetric}
                measure={regionMeasure}
                rows={allRegionRows}
              />
            </TabsContent>
          </Tabs>
          <div className="flex flex-wrap items-start gap-4.5 pt-2.5 pb-6.5 sm:items-center sm:gap-4 lg:gap-6">
            <h3 className={cn(heading3, "text-sm max-sm:w-full")}>前十名縣市，逐年變化</h3>
            <span>
              2019—{years.at(-1)}・依
              {regionMeasure === "rate" ? "每十萬人口比率" : "原始數量"}
              排序
            </span>
          </div>
          <RegionRace
            history={data.regionHistory}
            metric={regionMetric}
            measure={regionMeasure}
            startYear={2019}
          />
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
            <p className={eyebrow}>Sources & methodology</p>
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
