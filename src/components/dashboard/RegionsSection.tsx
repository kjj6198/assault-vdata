import { ratePer100k, type RegionMeasure } from "../../lib/regions";
import { useState } from "react";
import { RiAddLine, RiDownloadLine } from "react-icons/ri";
import { TaiwanMap } from "../TaiwanMap";
import { RegionRace } from "../RegionRace";
import { RegionTable } from "../RegionTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { DataSelect } from "../DataSelect";
import { cn } from "../../lib/utils";
import { useI18n } from "../../i18n";
import { pageWidth, inlineFilter, storySection, type DashboardData } from "./shared";
import { SectionHeading } from "./SectionHeading";

export function RegionsSection({ data }: { data: DashboardData }) {
  const { t } = useI18n();
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
      <SectionHeading number="04" eyebrow={t.regions.eyebrow} title={t.regions.title}>
        {t.regions.intro}
      </SectionHeading>
      <div className="mb-5.5 flex flex-wrap items-start gap-x-6 gap-y-3 sm:items-center">
        <span className={cn(inlineFilter, "flex-wrap sm:flex-nowrap")}>
          {t.regions.measure}
          <DataSelect
            label={t.regions.measureAria}
            className="min-h-8 gap-1.5 px-2 py-1 data-[size=default]:h-8"
            value={regionMeasure}
            onValueChange={(value) => {
              if (value === "rate" || value === "count") setRegionMeasure(value);
            }}
            options={[
              { value: "rate", label: t.measure.rate },
              { value: "count", label: t.measure.count },
            ]}
          />
        </span>
        <p className="text-xs leading-[1.9] text-muted-foreground">
          {regionMeasure === "rate" ? t.regions.rateFormula : t.regions.countNote}
        </p>
      </div>
      <Tabs
        value={regionMetric}
        onValueChange={(value) => {
          if (value === "victims" || value === "reports") setRegionMetric(value);
        }}
      >
        <TabsList
          aria-label={t.regions.metricAria}
          className="mb-4.5 h-auto min-h-12.5 rounded-lg border border-border p-0.75 max-sm:w-full"
        >
          <TabsTrigger
            value="victims"
            className="px-5.5 text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none!"
          >
            {t.metric.victims}
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="px-5.5 text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none!"
          >
            {t.metric.reports}
          </TabsTrigger>
        </TabsList>
        <TabsContent value={regionMetric}>
          <div className="rounded-[6px] border border-t-3 border-border border-t-primary bg-card px-3.5 pt-5.5 pb-4 sm:px-8 sm:pt-7 sm:pb-6">
            <div className="pt-0 pb-6 [&_h3]:text-[1.375rem] [&_h3]:font-bold [&_h3]:tracking-[0.02em] sm:[&_h3]:text-[1.625rem]">
              <p className="mb-2.5 font-numeric text-caption tracking-[0.08em] text-primary">
                {t.regions.raceEyebrow(years.at(-1) ?? year)}
              </p>
              <h3>{t.regions.raceTitle}</h3>
              <p className="mt-2 text-caption leading-[1.8] text-muted-foreground">
                {t.regions.raceIntro}
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
            {t.regions.mapEyebrow(year)}
          </p>
          <h3>{t.regions.mapTitle}</h3>
          <p className="mt-2.5 max-w-[65ch] text-label leading-[1.9] text-muted-foreground">
            {t.regions.mapIntro(year)}
          </p>
        </div>
        <TaiwanMap year={year} metric={regionMetric} measure={regionMeasure} rows={allRegionRows} />
      </div>
      <details className="group mt-7 border-y border-border py-1">
        <summary className="flex min-h-19 list-none items-center justify-between gap-5 text-label font-bold [&::-webkit-details-marker]:hidden">
          <span>
            {t.regions.tableSummary(year)}
            <small className="mt-1.5 block text-caption font-normal text-muted-foreground">
              {t.regions.tableHint}
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
        {t.regions.populationSource}
        <a
          href={data.populationSource.page}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-[3px]"
        >
          {t.regions.populationSourceLink}
        </a>
        {t.regions.populationNote}
        {regionMeasure === "rate" && t.regions.rateColorNote}
      </p>
      <a
        className="mt-5 inline-flex items-center gap-2 py-3 text-xs underline underline-offset-[5px]"
        href={`/api/v1/regions?dataset=${regionMetric}&year=${year}&format=csv`}
      >
        {t.regions.downloadCsv(year)} <RiDownloadLine aria-hidden="true" />
      </a>
    </section>
  );
}
