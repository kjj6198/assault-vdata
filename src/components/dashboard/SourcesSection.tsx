import { RiArrowRightUpLine, RiDownloadLine } from "react-icons/ri";
import { formatNumber as num } from "../../lib/data";
import { Button } from "../ui/button";
import { pageWidth, heading3, type DashboardData } from "./shared";

export function SourcesSection({ data }: { data: DashboardData }) {
  const { year, years } = data;
  return (
    <section id="sources" className="mt-0 scroll-mt-29.5 bg-muted py-4 sm:py-10">
      <div className={pageWidth}>
        <div className="mt-2 grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-16">
          <div>
            <h3 className={heading3}>資料來源</h3>
            <p className="mt-4.5 text-xs leading-loose text-muted-foreground">
              本專題整理衛生福利部保護服務司的四份公開統計，涵蓋 {years[0]}—{years.at(-1)} 年。
            </p>
            <ol className="mt-5 list-[decimal-leading-zero] pl-6.25">
              {["relationships", "demographics", "victims", "reports"].map((kind) => {
                const source = data.sources.find((s) => s.dataset === kind);
                return source ? (
                  <li key={kind} className="py-2 pl-1.5 text-xs">
                    <a
                      href={source.page}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 leading-[1.9] underline underline-offset-4"
                    >
                      {source.title.split("(")[0]} <RiArrowRightUpLine aria-hidden="true" />
                    </a>
                  </li>
                ) : null;
              })}
            </ol>
          </div>
          <div>
            <h3 className={heading3}>如何閱讀這些數字？</h3>
            <ul className="mt-4.5 list-disc pl-4.5 text-xs leading-[2] text-muted-foreground [&>li]:mb-[9px]">
              <li>「受暴人數」以人為單位；「通報件數」以件為單位，兩者不可混用。</li>
              <li>
                所有百分比以同年度、同指標的總數為分母，包含「不詳」。四捨五入後可能不恰為 100%。
              </li>
              <li>空白且當年未設的關係分類不轉為 0。2019、2021 年分類改制，跨年比較請參照原表。</li>
              <li>
                圖表採底層儲存格加總。原表的印列合計若有差異，另存於品質註記，不擅自修改原始數值。
              </li>
            </ul>
          </div>
        </div>
        {data.qualityNotes.length > 0 && (
          <details className="mt-7 rounded-md bg-notice-background px-5 py-2.5 text-xs">
            <summary className="min-h-11 content-center">
              {year} 年資料品質註記（{data.qualityNotes.length} 項）
            </summary>
            <ul className="list-disc p-4 leading-loose">
              {data.qualityNotes.map((note, i) => (
                <li key={i}>
                  {note.kind === "published-age-difference"
                    ? `${note.age}：性別表為 ${num(note.demographics)} 人，關係表儲存格合計為 ${num(note.relationships)} 人，保留各表口徑。`
                    : `${note.kind === "published-column-total-difference" ? note.relationship : note.age}：關係表印列合計 ${num(note.published)} 人，儲存格合計 ${num(note.computed)} 人；圖表採儲存格合計。`}
                </li>
              ))}
            </ul>
          </details>
        )}
        <div className="mt-9.5 flex flex-col items-start justify-between gap-8 border-y border-border py-7.5 lg:flex-row lg:items-center">
          <div>
            <h3 className={heading3}>繼續探索，或自己分析。</h3>
            <p className="mt-2 text-xs leading-[1.9] text-muted-foreground">
              下載含來源欄位的乾淨資料；完整資料可透過公開 API 取得。
            </p>
          </div>
          <div className="flex shrink-0 gap-3 max-sm:w-full max-sm:flex-wrap">
            <Button asChild className="max-sm:flex-1">
              <a href={`/api/v1/data?year=${year}&format=csv`}>
                下載 {year} 年 CSV <RiDownloadLine aria-hidden="true" />
              </a>
            </Button>
            <Button variant="outline" asChild className="max-sm:flex-1">
              <a href="/api/v1/data">
                完整 JSON <RiArrowRightUpLine aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
        <details className="mt-3 text-xs [&_code]:bg-secondary [&_code]:px-1.25 [&_code]:py-0.5 [&_code]:text-[11px]">
          <summary className="min-h-11 content-center">API 使用方式</summary>
          <p className="my-3 leading-loose wrap-anywhere">
            <code>GET /api/v1/data</code> 提供完整資料。可加上 <code>year</code>、
            <code>dataset</code>、<code>city</code> 與 <code>format=csv</code> 篩選。
          </p>
          <p className="my-3 leading-loose wrap-anywhere">
            dataset 支援 demographics、relationships、victims、reports。city
            僅適用縣市統計。年份與來源請見{" "}
            <a href="/api/v1/meta" className="underline">
              /api/v1/meta
            </a>
            。
          </p>
          <a
            href="/api/v1/data?year=2025&dataset=victims"
            className="inline-flex items-center gap-1.5 underline"
          >
            範例：2025 年各縣市受暴人數 <RiArrowRightUpLine aria-hidden="true" />
          </a>
        </details>
      </div>
    </section>
  );
}
