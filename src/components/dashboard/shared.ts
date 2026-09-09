import type { getDashboard } from "../../lib/data.server";
import type { DataRecord } from "../../lib/data";
import palette from "../../lib/palette.json";
import { cn } from "../../lib/utils";
export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;
export const INK = palette["data-people"].css,
  CORAL = palette["data-relationships"].css,
  GOLD = palette["data-secondary"].css,
  GRAY = palette["data-unknown"].css;
export const sectionIds = [
  "trend",
  "ages",
  "suspects",
  "relationships",
  "regions",
  "sources",
] as const;
export const pageWidth =
  "mx-auto w-[calc(100%-40px)] sm:w-[calc(100%-64px)] lg:w-[min(1120px,calc(100%-96px))]";
export const eyebrow =
  "flex items-center gap-3 text-[0.8125rem] font-semibold tracking-[0.1em] text-muted-foreground [font-variant-caps:small-caps]";
export const heading2 =
  "text-2xl font-bold leading-[1.5] tracking-[0.025em] text-balance sm:text-[2rem]";
export const heading3 = "text-base font-semibold leading-[1.6]";
export const footnote = "mt-4 text-xs leading-[1.9] text-muted-foreground";
export const panelHeading =
  "mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6 sm:flex-nowrap sm:gap-4";
export const inlineFilter = "flex items-center gap-3 text-xs";
export const pendingFade =
  "transition-opacity duration-150 group-data-pending:opacity-50 group-data-pending:duration-200 group-data-pending:delay-150";
export const storySection = cn("scroll-mt-35 pt-12 pb-10 sm:pt-16 lg:scroll-mt-24", pendingFade);
export const unitLabel = "ml-3 font-sans text-[0.8125rem] tracking-normal";
/** Sentinel filter value that keeps every category. */
export const ALL = "all";
export const sum = (rows: DataRecord[]) => rows.reduce((n, row) => n + row.value, 0);
export const rankRelationships = (records: DataRecord[], age: string) => {
  const counts = new Map<string, number>();
  for (const r of records)
    if (r.dataset === "relationships" && (age === ALL || r.age === age))
      counts.set(r.relationship, (counts.get(r.relationship) ?? 0) + r.value);
  return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};
