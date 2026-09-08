import { ratePer100k, type RegionMeasure } from "../../lib/regions";
import { useState } from "react";
import { RiAddLine, RiDownloadLine } from "react-icons/ri";
import { TaiwanMap } from "../TaiwanMap";
import { RegionRace } from "../RegionRace";
import { RegionTable } from "../RegionTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { DataSelect } from "../DataSelect";
import { cn } from "../../lib/utils";
import { pageWidth, inlineFilter, storySection, type DashboardData } from "./shared";
import { SectionHeading } from "./SectionHeading";

export function RegionsSection({ data }: { data: DashboardData }) {
  const { year, years, records } = data;
  const [regionMetric, setRegionMetric] = useState<"victims" | "reports">("victims");
  const [regionMeasure, setRegionMeasure] = useState<RegionMeasure>("rate");
  const populationByCity = new Map(data.populations.map((r) => [r.city, r.population]));
  const allRegionRows = records
    .filter((r) => r.dataset === "victims" || r.dataset === "reports")
    .filter((r) => r.dataset === regionMetric)
    .map((r) => {
      const population = populationByCity.get(r.city) ?? null;
      return { ...r, population, rate: ratePer100k(r.value, population) };
    });
  return (
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
            className="min-h-8 gap-1.5 px-2 py-1 data-[size=default]:h-8"
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
        <TaiwanMap year={year} metric={regionMetric} measure={regionMeasure} rows={allRegionRows} />
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
  );
}
