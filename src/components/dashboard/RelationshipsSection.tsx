import { useMemo, useState } from "react";
import { RiAddLine, RiSubtractLine } from "react-icons/ri";
import { fixed1, share } from "../../lib/data";
import { DataChart } from "../DataChart";
import { Button } from "../ui/button";
import { DataSelect } from "../DataSelect";
import { AnimatedValue, AnimatedNumber } from "../StoryMotion";
import { cn } from "../../lib/utils";
import {
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
  const { year, records, ages } = data;
  const [relationAge, setRelationAge] = useState("全部");
  const [showAllRelations, setShowAllRelations] = useState(false);
  const relationships = useMemo(
    () => rankRelationships(records, relationAge),
    [records, relationAge],
  );
  const relationChart = useMemo(() => {
    const rows = showAllRelations ? relationships : relationships.slice(0, 8);
    return {
      labels: rows.map((r) => r.label),
      series: [{ label: "受暴人數", values: rows.map((r) => r.value), color: CORAL }],
    };
  }, [relationships, showAllRelations]);
  const relationTotal = relationships.reduce((n, r) => n + r.value, 0);
  const leadingRelation = relationships[0];
  return (
    <section
      id="relationships"
      className="mt-4.5 scroll-mt-35 bg-surface-alt sm:mt-8 lg:scroll-mt-24"
    >
      <div className={cn(pageWidth, storySection, "pb-16.25")}>
        <SectionHeading
          number="03"
          eyebrow="兩造關係 / Relationships"
          title="被害人與加害人，是什麼關係？"
        >
          從原始分類了解被害人與加害人的關係。選擇不同年齡，觀察分布如何改變。
        </SectionHeading>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 sm:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.7fr)] sm:gap-10 lg:gap-18.5">
          <aside className="max-sm:border-b max-sm:border-border max-sm:pb-5">
            <label className="flex flex-col gap-3 text-xs" htmlFor="relation-age">
              被害人年齡
              <DataSelect
                id="relation-age"
                label="被害人年齡"
                className="w-full"
                value={relationAge}
                onValueChange={setRelationAge}
                options={[
                  { value: "全部", label: "全部年齡" },
                  ...ages.map((age) => ({ value: age, label: age })),
                ]}
              />
            </label>
            {leadingRelation && (
              <div className="pt-6 pb-0 sm:py-8">
                <p className="text-xs leading-[1.9] text-muted-foreground">
                  此年齡範圍中，最多紀錄的關係為
                </p>
                <h3 className={cn(heading3, "my-3 text-[1.625rem] wrap-anywhere")}>
                  <AnimatedValue value={leadingRelation.label} />
                </h3>
                <strong className="font-numeric text-[2.5rem] font-normal text-data-relationships tabular-nums sm:text-[2.875rem]">
                  <AnimatedNumber value={leadingRelation.value} />
                  <small className={unitLabel}>人</small>
                </strong>
                <p className="mt-2.5 text-xs leading-[1.9] text-muted-foreground">
                  占此範圍{" "}
                  <AnimatedNumber
                    value={share(leadingRelation.value, relationTotal)}
                    format={fixed1}
                  />
                  %<br />共 <AnimatedNumber value={relationTotal} /> 人，包含關係不詳者
                </p>
              </div>
            )}
            <p className={footnote}>
              分類在 2019、2021 年調整。不同年份的同類名稱，不一定能直接比較。
            </p>
          </aside>
          <div>
            <div className={panelHeading}>
              <h3 className={heading3}>{year} 年・兩造關係</h3>
              <span className="text-xs text-muted-foreground">
                {showAllRelations ? `全部 ${relationships.length} 項` : "前 8 項"}
              </span>
            </div>
            <DataChart
              title={`${year} 年兩造關係（${relationAge}）`}
              {...relationChart}
              horizontal
              height={showAllRelations ? Math.max(320, relationships.length * 36) : 320}
            />
            <Button
              variant="ghost"
              className="mt-2.5 inline-flex items-center gap-2.5 border-b border-muted-foreground bg-transparent text-xs"
              onClick={() => setShowAllRelations(!showAllRelations)}
              aria-expanded={showAllRelations}
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
  );
}
