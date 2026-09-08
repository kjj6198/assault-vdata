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
          className="mb-4.5 h-auto min-h-12.5 rounded-lg border border-border p-0.75 max-sm:w-full"
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
          <div className="rounded-[6px] border border-t-3 border-border border-t-primary bg-card px-3.5 pt-5.5 pb-4 sm:px-8 sm:pt-7 sm:pb-6">
            <div className="pt-0 pb-6 [&_h3]:text-[1.375rem] [&_h3]:font-bold [&_h3]:tracking-[0.02em] sm:[&_h3]:text-[1.625rem]">
              <p className="mb-2.5 font-numeric text-caption tracking-[0.08em] text-primary">
                2019—{years.at(-1)} / 縣市動態比較
              </p>
              <h3>縣市排序，隨時間變化</h3>
              <p className="mt-2 text-caption leading-[1.8] text-muted-foreground">
                按下播放，看前十名縣市如何變化。也可拖曳時間軸，停在你想看的年份。
                播放中的數值為年度間插值；暫停或拖曳後顯示該年度原始數據。
              </p>
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
      <div className="mt-8 sm:mt-11">
        <div className="mb-6 [&_h3]:mt-2.5 [&_h3]:text-[1.375rem] [&_h3]:font-bold [&_h3]:tracking-[0.02em] sm:[&_h3]:text-[1.625rem]">
          <p className="mb-2.5 font-numeric text-caption tracking-[0.08em] text-primary">
            {year} / 縣市地圖
          </p>
          <h3>在地圖上，找到你的縣市。</h3>
          <p className="mt-2.5 max-w-[65ch] text-label leading-[1.9] text-muted-foreground">
            點選縣市，查看 {year} 年的數量、人口與全國排序。可使用上方年度選單切換年份。
          </p>
        </div>
        <TaiwanMap year={year} metric={regionMetric} measure={regionMeasure} rows={allRegionRows} />
      </div>
      <details className="group mt-7 border-y border-border py-1">
        <summary className="flex min-h-19 list-none items-center justify-between gap-5 text-label font-bold [&::-webkit-details-marker]:hidden">
          <span>
            查詢 {year} 年各縣市完整數據
            <small className="mt-1.5 block text-caption font-normal text-muted-foreground">
              搜尋 22 個縣市・比較人數、件數與每十萬人口比率
            </small>
          </span>
          <RiAddLine aria-hidden="true" className="size-4.5 group-open:rotate-45" />
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
