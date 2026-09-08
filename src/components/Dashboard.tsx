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
  eyebrow,
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
      <div className="section-heading">
        <span className="section-number" aria-hidden="true">
          {number}
        </span>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="section-description">{children}</p>
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
  const facts: { label: string; value: ReactNode; note: ReactNode; icon?: ReactNode }[] = [
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
      <a className="skip-link" href="#main">
        跳至主要內容
      </a>
      <header className="masthead">
        <a href="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          看見數字背後<span className="brand-en">TAIWAN DATA STORIES</span>
        </a>
        <a href="#sources" className="header-link">
          資料與方法 <RiArrowRightUpLine aria-hidden="true" />
        </a>
      </header>
      <main id="main" data-pending={pending || undefined}>
        <div className="hero-band">
          <section className="hero page-width">
            <div className="hero-copy">
              <p className="eyebrow">
                <span className="small-rule" />
                台灣性侵害統計・{years[0]}—{years.at(-1)}
              </p>
              <h1>
                每個數字，
                <br />
                都是<span>一個人。</span>
              </h1>
              <p className="hero-description">
                從通報紀錄出發，看見性侵害的樣貌。
                <br className="hidden sm:block" />
                透過年齡、關係與地域，理解數字背後的處境。
              </p>
              <a href="#explore" className="explore-link">
                一起讀懂這些數據 <RiArrowDownLine aria-hidden="true" />
              </a>
              <p className="hero-source">資料來源：衛生福利部保護服務司</p>
            </div>
            <Card className="hero-visual">
              <div className="visual-topline">
                <span>被記錄的，是人生。</span>
                <span>{year}</span>
              </div>
              <div className="dot-grid" aria-hidden="true">
                {Array.from({ length: 100 }, (_, i) => (
                  <i
                    key={i}
                    style={{ "--i": i } as CSSProperties}
                    className={
                      i < Math.round((minors / victimTotal) * 100) ? "dot-young" : "dot-adult"
                    }
                  />
                ))}
              </div>
              <div className="visual-caption">
                <strong>
                  <AnimatedNumber value={share(minors, victimTotal)} format={fixed1} />
                  <small>%</small>
                </strong>
                <p>
                  當年受暴人中
                  <br />
                  <b>未滿 18 歲</b>
                </p>
              </div>
              <p className="dot-note">每個圓點約代表 1% 的受暴人數，含年齡不詳者。</p>
              <div className="hero-gender">
                <p className="hero-gender-heading">當年受暴人的性別比例</p>
                <div className="hero-gender-bar" aria-hidden="true">
                  {genderTotals.map((g) => (
                    <i
                      key={g.label}
                      data-gender={g.label}
                      style={{ width: `${(g.value / victimTotal) * 100}%` }}
                    />
                  ))}
                </div>
                <dl className="hero-gender-legend">
                  {genderTotals.map((g) => (
                    <div key={g.label}>
                      <dt>
                        <i data-gender={g.label} aria-hidden="true" />
                        {g.label}
                      </dt>
                      <dd>
                        {g.value > 0 && g.value / victimTotal < 0.001 ? (
                          "<0.1"
                        ) : (
                          <AnimatedNumber value={share(g.value, victimTotal)} format={fixed1} />
                        )}
                        <small>%</small>
                        <span>
                          <AnimatedNumber value={g.value} /> 人
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="hero-gender-note">
                  以全部受暴人數為分母{year >= 2019 ? "，含其他與不詳" : "，含不詳"}
                  ；四捨五入後合計可能不為 100%。
                </p>
              </div>
            </Card>
          </section>
        </div>
        <section className="facts page-width" aria-labelledby="facts-heading">
          <div className="facts-heading">
            <p className="eyebrow">
              <span className="small-rule" />
              At a glance・{year}
            </p>
            <h2 id="facts-heading">五個數字，先看重點。</h2>
          </div>
          <ul className="fact-grid">
            {facts.map((fact, i) => (
              <li className="fact-card" key={fact.label} style={{ "--i": i } as CSSProperties}>
                <p className="fact-label">{fact.label}</p>
                <strong className="fact-value">
                  {typeof fact.value === "string" ? (
                    <AnimatedValue value={fact.value} />
                  ) : (
                    fact.value
                  )}
                  {fact.icon}
                </strong>
                <p className="fact-note">{fact.note}</p>
              </li>
            ))}
          </ul>
        </section>
        <div className="reading-note page-width">
          <Badge variant="outline" className="note-label">
            閱讀之前
          </Badge>
          <p>
            這些是進入通報系統的紀錄，無法呈現所有未被通報的經驗。通報增加，也可能反映求助意願與通報制度的改變。
          </p>
        </div>
        <div id="explore" className="explorer-bar">
          <div className="page-width explorer-inner">
            <nav aria-label="專題章節">
              {sectionLinks.map((link, i) => (
                <a
                  href={`#${link.id}`}
                  key={link.id}
                  aria-current={activeSection === link.id ? "true" : undefined}
                >
                  <span>0{i + 1}</span>
                  {link.name}
                </a>
              ))}
            </nav>
            <div className="year-control">
              <label htmlFor="year">統計年度</label>
              <Button
                variant="ghost"
                aria-label="上一年"
                disabled={yearIndex === 0}
                onClick={() => onYearChange(years[yearIndex - 1])}
              >
                <RiArrowLeftSLine aria-hidden="true" />
              </Button>
              <DataSelect
                id="year"
                label="統計年度"
                value={String(year)}
                onValueChange={(value) => onYearChange(Number(value))}
                options={[...years].reverse().map((y) => ({ value: String(y), label: String(y) }))}
              />
              <Button
                variant="ghost"
                aria-label="下一年"
                disabled={yearIndex === years.length - 1}
                onClick={() => onYearChange(years[yearIndex + 1])}
              >
                <RiArrowRightSLine aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
        <div className="page-width">
          <output className="year-status">
            {pending ? "正在載入資料…" : `正在閱讀 ${year} 年資料`}
            <span>民國 {year - 1911} 年・全國統計</span>
          </output>
          <div className="stat-grid">
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
        <section id="trend" className="story-section page-width">
          <SectionHeading number="01" eyebrow="Across the years" title="沿著時間，看見變化。">
            從 {years[0]} 年到 {years.at(-1)} 年，通報系統記錄下的受暴人數如何改變？
          </SectionHeading>
          <div className="chart-panel">
            <div className="panel-heading">
              <h3>歷年受暴人數</h3>
              <span>
                {years[0]}—{years.at(-1)}
              </span>
            </div>
            <DataChart title="歷年受暴人數" {...trendChart} type="line" height={320} />
            <p className="chart-footnote">
              人數不等於發生率；本圖不推論未通報案件，也不直接代表犯罪趨勢。
            </p>
          </div>
        </section>
        <section id="ages" className="story-section page-width">
          <SectionHeading number="02" eyebrow="Age & gender" title="受暴，發生在不同的人生階段。">
            保留每個年齡區間與性別分類，讓容易被忽略的經驗也能被看見。
          </SectionHeading>
          <div className="age-layout">
            <div>
              <div className="panel-heading">
                <h3>{year} 年・年齡分布</h3>
                <span className="inline-filter">
                  性別
                  <DataSelect
                    label="年齡分布的性別"
                    value={safeGender}
                    onValueChange={setGender}
                    options={["全部", ...genders].map((g) => ({ value: g, label: g }))}
                  />
                </span>
              </div>
              <DataChart
                title={`${year} 年年齡分布（${safeGender}）`}
                {...ageChart}
                horizontal
                height={360}
              />
              <p className="chart-footnote">
                「12–&lt;18歲」表示滿 12 歲、未滿 18 歲。年齡不詳獨立列出。
              </p>
            </div>
            <aside className="gender-panel">
              <p className="eyebrow">{year} 年・全部年齡</p>
              <h3>性別分布</h3>
              <div className="gender-stack" aria-hidden="true">
                {genderTotals.map((g) => (
                  <i
                    key={g.label}
                    style={{ width: `${(g.value / victimTotal) * 100}%`, background: g.color }}
                  />
                ))}
              </div>
              {genderTotals.map((g) => (
                <div className="gender-row" key={g.label}>
                  <span>
                    <i style={{ background: g.color }} />
                    {g.label}
                  </span>
                  <b>
                    <AnimatedNumber value={g.value} /> <small>人</small>
                  </b>
                  <span>
                    {g.value > 0 && g.value / victimTotal < 0.001 ? (
                      "<0.1"
                    ) : (
                      <AnimatedNumber value={share(g.value, victimTotal)} format={fixed1} />
                    )}
                    %
                  </span>
                </div>
              ))}
              <p>性別「其他」自 2019 年起新增。此前未設此欄位，不以零人代替。</p>
            </aside>
          </div>
        </section>
        <section id="relationships" className="relationship-band">
          <div className="story-section page-width">
            <SectionHeading
              number="03"
              eyebrow="Behind the relationship"
              title="兩造之間，是什麼關係？"
            >
              從原始分類了解被害人與加害人的關係。選擇不同年齡，觀察分布如何改變。
            </SectionHeading>
            <div className="relationship-layout">
              <aside>
                <label className="block-filter" htmlFor="relation-age">
                  被害人年齡
                  <DataSelect
                    id="relation-age"
                    label="被害人年齡"
                    value={relationAge}
                    onValueChange={setRelationAge}
                    options={[
                      { value: "全部", label: "全部年齡" },
                      ...ages.map((age) => ({ value: age, label: age })),
                    ]}
                  />
                </label>
                {leadingRelation && (
                  <div className="relationship-insight">
                    <p>此年齡範圍中，最多紀錄的關係為</p>
                    <h3>
                      <AnimatedValue value={leadingRelation.label} />
                    </h3>
                    <strong>
                      <AnimatedNumber value={leadingRelation.value} />
                      <small>人</small>
                    </strong>
                    <p>
                      占此範圍{" "}
                      <AnimatedNumber
                        value={share(leadingRelation.value, relationTotal)}
                        format={fixed1}
                      />
                      %<br />共 <AnimatedNumber value={relationTotal} /> 人，包含關係不詳者
                    </p>
                  </div>
                )}
                <p className="chart-footnote">
                  分類在 2019、2021 年調整。不同年份的同類名稱，不一定能直接比較。
                </p>
              </aside>
              <div>
                <div className="panel-heading">
                  <h3>{year} 年・兩造關係</h3>
                  <span>{showAllRelations ? `全部 ${relationships.length} 項` : "前 8 項"}</span>
                </div>
                <DataChart
                  title={`${year} 年兩造關係（${relationAge}）`}
                  {...relationChart}
                  horizontal
                  height={showAllRelations ? Math.max(320, relationships.length * 36) : 320}
                />
                <Button
                  variant="ghost"
                  className="text-button"
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
        <section id="regions" className="story-section page-width">
          <SectionHeading number="04" eyebrow="Across Taiwan" title="放回地方，看見分布。">
            以同年度人口比較 22
            縣市的通報紀錄。每十萬人口比率可減少人口規模的影響，但不代表未通報事件的實際發生率。
          </SectionHeading>
          <div className="population-controls">
            <span className="inline-filter">
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
            <p>
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
            <TabsList aria-label="縣市統計指標" className="metric-tabs">
              <TabsTrigger value="victims">受暴人數</TabsTrigger>
              <TabsTrigger value="reports">通報件數</TabsTrigger>
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
          <div className="region-toolbar region-table-toolbar">
            <h3>縣市排名，逐年變化</h3>
            <span>
              2019—{years.at(-1)}・依{regionMeasure === "rate" ? "每十萬人口比率" : "原始數量"}
              排序
            </span>
          </div>
          <RegionRace
            history={data.regionHistory}
            metric={regionMetric}
            measure={regionMeasure}
            startYear={2019}
          />
          <p className="population-note">
            人口來源：
            <a href={data.populationSource.page} target="_blank" rel="noreferrer">
              內政部戶政司・縣市人口統計
            </a>
            ，採各年年底戶籍人口。改制前縣市人口合併為現行 22
            縣市口徑。這是未經年齡標準化的粗比率；小人口縣市的比率較易隨少數通報波動。
            {regionMeasure === "rate" && "顏色使用各年度共用的固定六級比率區間，零值獨立留白。"}
          </p>
          <a
            className="download-link"
            href={`/api/v1/regions?dataset=${regionMetric}&year=${year}&format=csv`}
          >
            下載 {year} 年縣市數據 CSV <RiDownloadLine aria-hidden="true" />
          </a>
        </section>
        <section id="sources" className="sources-section">
          <div className="page-width">
            <p className="eyebrow">Sources & methodology</p>
            <h2>讓每個數字，都有出處。</h2>
            <div className="sources-layout">
              <div>
                <h3>資料從哪裡來？</h3>
                <p>
                  本專題整理衛生福利部保護服務司的四份公開統計，涵蓋 {years[0]}—{years.at(-1)}{" "}
                  年。保留原始試算表，逐格擷取並檢查加總；每筆下載資料附有來源檔名、工作表與儲存格位置。
                </p>
                <ol className="source-links">
                  {["relationships", "demographics", "victims", "reports"].map((kind) => {
                    const source = data.sources.find((s) => s.dataset === kind);
                    return source ? (
                      <li key={kind}>
                        <a href={source.page} target="_blank" rel="noreferrer">
                          {source.title.split("(")[0]} <RiArrowRightUpLine aria-hidden="true" />
                        </a>
                      </li>
                    ) : null;
                  })}
                </ol>
              </div>
              <div>
                <h3>如何閱讀這些數字？</h3>
                <ul className="method-list">
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
              <details className="quality-note">
                <summary>
                  {year} 年資料品質註記（{data.qualityNotes.length} 項）
                </summary>
                <ul>
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
            <div className="download-panel">
              <div>
                <h3>繼續探索，或自己分析。</h3>
                <p>下載含來源欄位的乾淨資料；完整資料可透過公開 API 取得。</p>
              </div>
              <div className="download-actions">
                <Button asChild>
                  <a href={`/api/v1/data?year=${year}&format=csv`}>
                    下載 {year} 年 CSV <RiDownloadLine aria-hidden="true" />
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/api/v1/data">
                    完整 JSON <RiArrowRightUpLine aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </div>
            <details className="api-details">
              <summary>API 使用方式</summary>
              <p>
                <code>GET /api/v1/data</code> 提供完整資料。可加上 <code>year</code>、
                <code>dataset</code>、<code>city</code> 與 <code>format=csv</code> 篩選。
              </p>
              <p>
                dataset 支援 demographics、relationships、victims、reports。city
                僅適用縣市統計。年份與來源請見 <a href="/api/v1/meta">/api/v1/meta</a>。
              </p>
              <a href="/api/v1/data?year=2025&dataset=victims">
                範例：2025 年各縣市受暴人數 <RiArrowRightUpLine aria-hidden="true" />
              </a>
            </details>
          </div>
        </section>
      </main>
      <footer className="page-width footer">
        <a className="brand" href="#main">
          看見數字背後
        </a>
        <p>台灣性侵害統計・以理解，取代想像。</p>
        <a href="#main">
          回到頂端 <RiArrowUpLine aria-hidden="true" />
        </a>
      </footer>
    </>
  );
}
