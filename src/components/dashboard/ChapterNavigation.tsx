import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { Button } from "../ui/button";
import { DataSelect } from "../DataSelect";
import { useActiveSection } from "../../lib/use-active-section";
import { cn } from "../../lib/utils";
import { sectionLinks, sectionIds, pageWidth, type DashboardData } from "./shared";

export function ChapterNavigation({
  data,
  onYearChange,
  pending,
}: {
  data: DashboardData;
  onYearChange: (year: number) => void;
  pending: boolean;
}) {
  const { year, years } = data;
  const activeSection = useActiveSection(sectionIds);
  const yearIndex = years.indexOf(year);
  return (
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
  );
}
