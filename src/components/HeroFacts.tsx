import type { ReactNode } from "react";
import { RiArrowRightUpLine } from "react-icons/ri";
import { fixed1, formatNumber, share } from "../lib/data";
import { formatRate } from "../lib/regions";
import { taiwanMap } from "../lib/map";

type Props = {
  year: number;
  total: number;
  change: number | null;
  previous: { year: number; victims: number } | undefined;
  trend: { year: number; victims: number }[];
  topCity: { city: string; rate: number } | undefined;
  female: number;
  male: number;
  minors: number;
  relationships: { label: string; value: number }[];
};

function FactCard({
  number,
  label,
  href,
  children,
  className = "",
}: {
  number: string;
  label: string;
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={`fact-card ${className}`}>
      <div className="fact-card-heading">
        <span className="fact-index" aria-hidden="true">
          {number}
        </span>
        <h3>{label}</h3>
        <a href={href} aria-label={`探索${label}`} className="fact-detail-link">
          <RiArrowRightUpLine aria-hidden="true" />
        </a>
      </div>
      {children}
    </article>
  );
}

export function HeroFacts({
  year,
  total,
  change,
  previous,
  trend,
  topCity,
  female,
  male,
  minors,
  relationships,
}: Props) {
  const femaleShare = share(female, total);
  const minorShare = share(minors, total);
  const maxVictims = Math.max(1, ...trend.map((row) => row.victims));
  const relationshipTotal = relationships.reduce((sum, row) => sum + row.value, 0);
  const leading = relationships[0];
  return (
    <div className="facts-grid">
      <FactCard number="01" label="與前一年相比" href="#trend" className="fact-trend">
        <p className="fact-kicker">受暴人數的年度變化</p>
        <p className="fact-number">
          {change === null ? "—" : `${change < 0 ? "−" : "+"}${fixed1(Math.abs(change))}`}
          {change !== null && <small>%</small>}
        </p>
        <div
          className="fact-history"
          role="img"
          aria-label={`歷年受暴人數，${trend.map((row) => `${row.year} 年 ${formatNumber(row.victims)} 人`).join("；")}`}
        >
          {trend.map((row) => (
            <div key={row.year} className="fact-history-column">
              <span
                style={{ height: `${(row.victims / maxVictims) * 100}%` }}
                data-selected={row.year === year || undefined}
              />
            </div>
          ))}
        </div>
        <div className="fact-axis" aria-hidden="true">
          <span>{trend[0]?.year}</span>
          <span>{trend.at(-1)?.year}</span>
        </div>
        <p className="fact-note">
          {previous
            ? `${previous.year} 年 ${formatNumber(previous.victims)} 人 → ${year} 年 ${formatNumber(total)} 人`
            : "資料起始年度，無前一年可比較"}
        </p>
      </FactCard>

      <FactCard number="02" label="每十萬人口比率最高" href="#regions" className="fact-region">
        <div className="fact-region-body">
          <div>
            <p className="fact-kicker">受暴人數・縣市分布</p>
            <p className="fact-name">{topCity?.city ?? "無資料"}</p>
            <p className="fact-number">
              {topCity ? formatRate(topCity.rate) : "—"}
              <small>人</small>
            </p>
            <p className="fact-unit">每 10 萬人口</p>
          </div>
          <svg
            className="fact-map"
            viewBox={`0 0 ${taiwanMap.width} ${taiwanMap.height}`}
            aria-hidden="true"
          >
            {taiwanMap.counties.map((county) => (
              <path
                key={county.code}
                d={county.path}
                data-selected={county.name === topCity?.city || undefined}
              />
            ))}
          </svg>
        </div>
        <p className="fact-note">依縣市人口換算，並非案件總數排名</p>
      </FactCard>

      <FactCard number="03" label="受暴人的性別比例" href="#ages" className="fact-gender">
        <div className="fact-gauge">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <circle className="gauge-track" cx="100" cy="100" r="79" />
            <circle
              className="gauge-value"
              cx="100"
              cy="100"
              r="79"
              pathLength="100"
              strokeDasharray={`${femaleShare} ${100 - femaleShare}`}
              transform="rotate(-90 100 100)"
            />
            <circle
              className="gauge-ticks"
              cx="100"
              cy="100"
              r="94"
              pathLength="100"
              strokeDasharray="0.3 2.2"
            />
          </svg>
          <div>
            <p className="fact-kicker">女性占比</p>
            <p className="fact-number">
              {fixed1(femaleShare)}
              <small>%</small>
            </p>
          </div>
        </div>
        <p className="fact-note fact-legend">
          <span>
            <i />
            女性 {formatNumber(female)} 人
          </span>
          <span>男性 {fixed1(share(male, total))}%</span>
        </p>
      </FactCard>

      <FactCard number="04" label="受暴人中，未滿 18 歲" href="#ages" className="fact-minors">
        <div className="fact-minors-body">
          <div>
            <p className="fact-number">
              {fixed1(minorShare)}
              <small>%</small>
            </p>
            <p className="fact-unit">{formatNumber(minors)} 位未滿 18 歲受暴人</p>
          </div>
          <div className="fact-waffle" aria-hidden="true">
            {Array.from({ length: 100 }, (_, i) => (
              <i key={i} data-filled={i < Math.round(minorShare) || undefined} />
            ))}
          </div>
        </div>
        <p className="fact-note">每格約代表 1%・分母包含年齡不詳者</p>
      </FactCard>

      <FactCard
        number="05"
        label="被害人與加害人的關係"
        href="#relationships"
        className="fact-relationships"
      >
        <div className="fact-relationships-body">
          <div className="fact-relationship-lead">
            <p className="fact-kicker">最多紀錄的兩造關係</p>
            <p className="fact-name">{leading?.label ?? "無資料"}</p>
            <p className="fact-number">
              {leading ? formatNumber(leading.value) : "—"}
              <small>人</small>
            </p>
            <p className="fact-unit">
              占關係紀錄 {leading ? fixed1(share(leading.value, relationshipTotal)) : "—"}%
            </p>
          </div>
          <ol className="fact-ranking">
            {relationships.slice(0, 3).map((row, index) => (
              <li key={row.label}>
                <div>
                  <span>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    {row.label}
                  </span>
                  <strong>
                    {fixed1(share(row.value, relationshipTotal))}
                    <small>%</small>
                  </strong>
                </div>
                <div className="fact-rank-track" aria-hidden="true">
                  <i style={{ width: `${share(row.value, relationshipTotal)}%` }} />
                </div>
              </li>
            ))}
          </ol>
        </div>
        <p className="fact-note">以當年度兩造關係紀錄總數為分母，包含不詳</p>
      </FactCard>
    </div>
  );
}
