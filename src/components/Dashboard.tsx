import { RiArrowRightUpLine, RiArrowUpLine } from "react-icons/ri";
import { cn } from "../lib/utils";
import { pageWidth, type DashboardData } from "./dashboard/shared";
import { HeroSection } from "./dashboard/HeroSection";
import { ChapterNavigation } from "./dashboard/ChapterNavigation";
import { TrendSection } from "./dashboard/TrendSection";
import { DemographicsSection } from "./dashboard/DemographicsSection";
import { RelationshipsSection } from "./dashboard/RelationshipsSection";
import { RegionsSection } from "./dashboard/RegionsSection";
import { SourcesSection } from "./dashboard/SourcesSection";

type Props = { data: DashboardData; onYearChange: (year: number) => void; pending: boolean };
export function Dashboard({ data, onYearChange, pending }: Props) {
  return (
    <>
      <a className="skip-link" href="#overview">
        跳至年度重點
      </a>
      <main id="main" className="group" data-pending={pending || undefined}>
        <HeroSection data={data} onYearChange={onYearChange} pending={pending} />
        <ChapterNavigation data={data} onYearChange={onYearChange} pending={pending} />
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
        <TrendSection data={data} onYearChange={onYearChange} />
        <DemographicsSection data={data} />
        <RelationshipsSection data={data} />
        <RegionsSection data={data} />
        <SourcesSection data={data} />
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
