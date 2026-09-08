import { RiArrowRightUpLine, RiDownloadLine } from "react-icons/ri";
import { formatNumber as num } from "../../lib/data";
import { Button } from "../ui/button";
import { useI18n } from "../../i18n";
import { pageWidth, heading3, type DashboardData } from "./shared";

const datasetKinds = ["relationships", "demographics", "victims", "reports"] as const;
/** Quality notes quote the source's own age spelling, for example "0~6歲未滿". */
const normalizeAge = (age: string) => age.replace(/^(\d+)~(\d+)歲未滿$/, "$1–未滿$2歲");

export function SourcesSection({ data }: { data: DashboardData }) {
  const { t, name } = useI18n();
  const { year, years } = data;
  const ageLabel = (age: string) => name("age", normalizeAge(age));
  return (
    <section id="sources" className="mt-0 scroll-mt-29.5 bg-muted py-4 sm:py-10">
      <div className={pageWidth}>
        <div className="mt-2 grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-16">
          <div>
            <h3 className={heading3}>{t.sources.heading}</h3>
            <p className="mt-4.5 text-xs leading-loose text-muted-foreground">
              {t.sources.intro(years[0], years.at(-1) ?? years[0])}
            </p>
            <ol className="mt-5 list-[decimal-leading-zero] pl-6.25">
              {datasetKinds.map((kind) => {
                const source = data.sources.find((s) => s.dataset === kind);
                return source ? (
                  <li key={kind} className="py-2 pl-1.5 text-xs">
                    <a
                      href={source.page}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 leading-[1.9] underline underline-offset-4"
                    >
                      {t.sources.dataset[kind]} <RiArrowRightUpLine aria-hidden="true" />
                    </a>
                  </li>
                ) : null;
              })}
            </ol>
          </div>
          <div>
            <h3 className={heading3}>{t.sources.howTo}</h3>
            <ul className="mt-4.5 list-disc space-y-2.25 pl-4.5 text-xs leading-loose text-muted-foreground">
              {t.sources.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
        {data.qualityNotes.length > 0 && (
          <details className="mt-7 rounded-md bg-notice-background px-5 py-2.5 text-xs">
            <summary className="min-h-11 content-center">
              {t.sources.quality(year, data.qualityNotes.length)}
            </summary>
            <ul className="list-disc p-4 leading-loose">
              {data.qualityNotes.map((note, i) => (
                <li key={i}>
                  {note.kind === "published-age-difference"
                    ? t.sources.ageDifference(
                        ageLabel(note.age),
                        num(note.demographics),
                        num(note.relationships),
                      )
                    : t.sources.totalDifference(
                        note.kind === "published-column-total-difference"
                          ? name("relationship", note.relationship)
                          : ageLabel(note.age),
                        num(note.published),
                        num(note.computed),
                      )}
                </li>
              ))}
            </ul>
          </details>
        )}
        <div className="mt-9.5 flex flex-col items-start justify-between gap-8 border-y border-border py-7.5 lg:flex-row lg:items-center">
          <div>
            <h3 className={heading3}>{t.sources.exploreHeading}</h3>
            <p className="mt-2 text-xs leading-[1.9] text-muted-foreground">
              {t.sources.exploreBody}
            </p>
          </div>
          <div className="flex shrink-0 gap-3 max-sm:w-full max-sm:flex-wrap">
            <Button asChild className="max-sm:flex-1">
              <a href={`/api/v1/data?year=${year}&format=csv`}>
                {t.sources.downloadYear(year)} <RiDownloadLine aria-hidden="true" />
              </a>
            </Button>
            <Button variant="outline" asChild className="max-sm:flex-1">
              <a href="/api/v1/data">
                {t.sources.fullJson} <RiArrowRightUpLine aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
        <details className="mt-3 text-xs [&_code]:bg-secondary [&_code]:px-1.25 [&_code]:py-0.5 [&_code]:text-[0.6875rem]">
          <summary className="min-h-11 content-center">{t.sources.api}</summary>
          <p className="my-3 leading-loose wrap-anywhere">{t.sources.apiUsage}</p>
          <p className="my-3 leading-loose wrap-anywhere">{t.sources.apiDatasets}</p>
          <a
            href="/api/v1/data?year=2025&dataset=victims"
            className="inline-flex items-center gap-1.5 underline"
          >
            {t.sources.apiExample} <RiArrowRightUpLine aria-hidden="true" />
          </a>
        </details>
      </div>
    </section>
  );
}
