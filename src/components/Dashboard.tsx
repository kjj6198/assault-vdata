import { RiArrowUpLine, RiGithubLine, RiThreadsLine, RiTwitterXLine } from "react-icons/ri";
import { cn } from "../lib/utils";
import { useI18n } from "../i18n";
import { pageWidth, type DashboardData } from "./dashboard/shared";
import { HeroSection } from "./dashboard/HeroSection";
import { ChapterNavigation } from "./dashboard/ChapterNavigation";
import { TrendSection } from "./dashboard/TrendSection";
import { DemographicsSection } from "./dashboard/DemographicsSection";
import { RelationshipsSection } from "./dashboard/RelationshipsSection";
import { RegionsSection } from "./dashboard/RegionsSection";
import { SourcesSection } from "./dashboard/SourcesSection";
import { LanguageSwitcher } from "./LanguageSwitcher";

const socialLinks = [
  { label: "GitHub", href: "https://github.com/kjj6198/assault-vdata", Icon: RiGithubLine },
  { label: "X", href: "https://x.com/kalanyei", Icon: RiTwitterXLine },
  { label: "Threads", href: "https://www.threads.com/@kalan_jp_log", Icon: RiThreadsLine },
];

type Props = {
  data: DashboardData;
  onYearChange: (year: number) => void;
  pending: boolean;
};
export function Dashboard({ data, onYearChange, pending }: Props) {
  const { t, locale } = useI18n();
  return (
    <>
      <a
        className="fixed top-3 left-3 z-60 translate-y-[-160%] bg-primary px-5 py-3 text-primary-foreground focus:translate-y-0"
        href="#overview"
      >
        {t.skipLink}
      </a>
      <main id="main" className="group" data-pending={pending || undefined} data-locale={locale}>
        <HeroSection data={data} onYearChange={onYearChange} pending={pending} />
        <ChapterNavigation data={data} onYearChange={onYearChange} pending={pending} />
        <TrendSection data={data} onYearChange={onYearChange} />
        <DemographicsSection data={data} />
        <RelationshipsSection data={data} />
        <RegionsSection data={data} />
        <SourcesSection data={data} />
      </main>
      <footer
        className={cn(
          pageWidth,
          "flex min-h-27.5 flex-wrap items-center gap-3 py-7 text-[0.6875rem] sm:flex-nowrap sm:gap-7.5 sm:py-0",
        )}
      >
        <div className="space-y-1 leading-relaxed text-muted-foreground max-sm:order-3 max-sm:w-full">
          <p className="font-bold">{t.footer.site}</p>
          <p>{t.footer.design}</p>
          <p>{t.footer.code}</p>
        </div>
        <nav
          aria-label={t.footer.social}
          className="ml-auto flex items-center gap-1 max-sm:order-1"
        >
          {socialLinks.map(({ label, href, Icon }) => (
            <a
              key={href}
              href={href}
              aria-label={label}
              target="_blank"
              rel="noreferrer"
              className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Icon className="size-4" aria-hidden="true" />
            </a>
          ))}
        </nav>
        <LanguageSwitcher className="max-sm:order-2" />
        <a
          href="#main"
          className="inline-flex min-h-11 items-center gap-1.5 text-[0.6875rem] max-sm:order-2"
        >
          {t.footer.top} <RiArrowUpLine aria-hidden="true" />
        </a>
      </footer>
    </>
  );
}
