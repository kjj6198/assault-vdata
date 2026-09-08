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
    <div
      id="explore"
      className="sticky top-0 z-20 border-y border-border bg-transparent shadow-[0_3px_8px_oklch(0.25_0.028_255/0.035)] backdrop-blur-lg"
    >
      <div
        className={cn(
          pageWidth,
          "flex flex-col-reverse items-center justify-between gap-0 lg:flex-row lg:gap-5",
        )}
      >
        <nav
          aria-label="專題章節"
          className="flex min-w-0 items-stretch gap-4 max-lg:w-full max-sm:[scrollbar-width:thin] max-sm:[scrollbar-color:var(--border)_transparent] max-sm:justify-start max-sm:overflow-x-auto sm:max-lg:justify-between lg:gap-6.5"
        >
          {sectionLinks.map((link) => (
            <a
              href={`#${link.id}`}
              key={link.id}
              aria-current={activeSection === link.id ? "true" : undefined}
              className="inline-flex min-h-10 items-center border-b-3 border-transparent pt-0.75 text-caption whitespace-nowrap text-muted-foreground transition-colors duration-150 hover:text-foreground hover:no-underline aria-[current=true]:border-primary aria-[current=true]:font-bold aria-[current=true]:text-primary sm:min-h-13 lg:min-h-17.5"
            >
              {link.name}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-0.5 pt-0.5 pb-0 max-lg:self-end max-sm:w-full sm:pt-2 lg:pb-2">
          <label
            htmlFor="year"
            className="mr-auto text-caption whitespace-nowrap text-muted-foreground sm:mr-2"
          >
            統計年度
          </label>
          <Button
            variant="ghost"
            className="w-9 bg-transparent text-sm max-sm:min-h-9 max-sm:px-2 sm:w-8.5 sm:text-base"
            aria-label="上一年"
            disabled={pending || yearIndex === 0}
            onClick={() => onYearChange(years[yearIndex - 1])}
          >
            <RiArrowLeftSLine aria-hidden="true" />
          </Button>
          <DataSelect
            id="year"
            label="統計年度"
            className="min-w-[92px] border-border bg-card font-semibold tabular-nums max-sm:min-h-9 max-sm:min-w-20 max-sm:px-2 max-sm:py-1 max-sm:text-sm"
            value={String(year)}
            onValueChange={(value) => onYearChange(Number(value))}
            options={[...years].reverse().map((y) => ({ value: String(y), label: String(y) }))}
          />
          <Button
            variant="ghost"
            className="w-9 bg-transparent text-sm max-sm:min-h-9 max-sm:px-2 sm:w-8.5 sm:text-base"
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
