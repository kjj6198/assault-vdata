import { useMemo, useState } from "react";
import { RiAddLine, RiSubtractLine } from "react-icons/ri";
import { fixed1, share } from "../../lib/data";
import { DataChart } from "../DataChart";
import { Button } from "../ui/button";
import { DataSelect } from "../DataSelect";
import { AnimatedValue, AnimatedNumber } from "../StoryMotion";
import { cn } from "../../lib/utils";
import { useI18n } from "../../i18n";
import {
  ALL,
  CORAL,
  pageWidth,
  heading3,
  footnote,
  panelHeading,
  storySection,
  unitLabel,
  rankRelationships,
  type DashboardData,
} from "./shared";
import { SectionHeading } from "./SectionHeading";

export function RelationshipsSection({ data }: { data: DashboardData }) {
  const { t, name } = useI18n();
  const { year, records, ages } = data;
  const [relationAge, setRelationAge] = useState(ALL);
  const [showAllRelations, setShowAllRelations] = useState(false);
  const relationships = useMemo(
    () => rankRelationships(records, relationAge),
    [records, relationAge],
  );
  const relationChart = useMemo(() => {
    const rows = showAllRelations ? relationships : relationships.slice(0, 8);
    return {
      labels: rows.map((r) => name("relationship", r.label)),
      series: [{ label: t.metric.victims, values: rows.map((r) => r.value), color: CORAL }],
    };
  }, [relationships, showAllRelations, t, name]);
  const relationTotal = relationships.reduce((n, r) => n + r.value, 0);
  const leadingRelation = relationships[0];
  const ageLabel = relationAge === ALL ? t.relationships.allAges : name("age", relationAge);
  return (
    <section
      id="relationships"
      className="mt-4.5 scroll-mt-35 bg-surface-alt sm:mt-8 lg:scroll-mt-24"
    >
      <div className={cn(pageWidth, storySection, "pb-16.25")}>
        <SectionHeading number="03" eyebrow={t.relationships.eyebrow} title={t.relationships.title}>
          {t.relationships.intro}
        </SectionHeading>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 sm:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.7fr)] sm:gap-10 lg:gap-18.5">
          <aside className="max-sm:border-b max-sm:border-border max-sm:pb-5">
            <label className="flex flex-col gap-3 text-xs" htmlFor="relation-age">
              {t.relationships.ageFilter}
              <DataSelect
                id="relation-age"
                label={t.relationships.ageFilter}
                className="w-full"
                value={relationAge}
                onValueChange={setRelationAge}
                options={[
                  { value: ALL, label: t.relationships.allAges },
                  ...ages.map((age) => ({ value: age, label: name("age", age) })),
                ]}
              />
            </label>
            {leadingRelation && (
              <div className="pt-6 pb-0 sm:py-8">
                <p className="text-xs leading-[1.9] text-muted-foreground">
                  {t.relationships.leadingLede}
                </p>
                <h3 className={cn(heading3, "my-3 text-[1.625rem] wrap-anywhere")}>
                  <AnimatedValue value={name("relationship", leadingRelation.label)} />
                </h3>
                <strong className="font-numeric text-[2.5rem] font-normal text-data-relationships tabular-nums sm:text-[2.875rem]">
                  <AnimatedNumber value={leadingRelation.value} />
                  <small className={unitLabel}>{t.unit.people}</small>
                </strong>
                <p className="mt-2.5 text-xs leading-[1.9] text-muted-foreground">
                  {t.relationships.shareOf}{" "}
                  <AnimatedNumber
                    value={share(leadingRelation.value, relationTotal)}
                    format={fixed1}
                  />
                  %<br />
                  {t.relationships.totalBefore}
                  <AnimatedNumber value={relationTotal} />
                  {t.relationships.totalAfter}
                </p>
              </div>
            )}
            <p className={footnote}>{t.relationships.footnote}</p>
          </aside>
          <div>
            <div className={panelHeading}>
              <h3 className={heading3}>{t.relationships.heading(year)}</h3>
              <span className="text-xs text-muted-foreground">
                {showAllRelations
                  ? t.relationships.showingAll(relationships.length)
                  : t.relationships.showingTop}
              </span>
            </div>
            <DataChart
              title={t.relationships.chartTitle(year, ageLabel)}
              unit={t.unit.people}
              {...relationChart}
              horizontal
              height={showAllRelations ? Math.max(320, relationships.length * 36) : 320}
            />
            <Button
              variant="ghost"
              className="mt-2.5 inline-flex items-center gap-2.5 bg-transparent text-xs"
              onClick={() => setShowAllRelations(!showAllRelations)}
              aria-expanded={showAllRelations}
            >
              {showAllRelations
                ? t.relationships.collapse
                : t.relationships.expand(relationships.length)}{" "}
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
  );
}
