import type { ReactNode } from "react";
import { motion } from "motion/react";
import { RiArrowRightUpLine } from "react-icons/ri";
import { fixed1, formatNumber, share } from "../lib/data";
import { formatRate } from "../lib/regions";
import { taiwanMap } from "../lib/map";
import { useReducedMotionPreference } from "../lib/use-reduced-motion";
import { AnimatedNumber, AnimatedValue } from "./StoryMotion";

const formatChange = (value: number) => `${value < 0 ? "−" : "+"}${fixed1(Math.abs(value))}`;

type Props = {
  year: number;
  total: number;
  change: number | null;
  previous: { year: number; victims: number } | undefined;
  trend: { year: number; victims: number }[];
  topCity: { city: string; rate: number } | undefined;
  genders: { label: string; value: number }[];
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
  genders,
  minors,
  relationships,
}: Props) {
  const reduced = useReducedMotionPreference();
  const minorShare = share(minors, total);
  const maxVictims = Math.max(1, ...trend.map((row) => row.victims));
  const relationshipTotal = relationships.reduce((sum, row) => sum + row.value, 0);
  const leading = relationships[0];
  return (
    <div className="facts-grid">
      <article
        className="fact-card fact-people fact-underage"
        aria-label={`${year} 年未滿 18 歲受暴人比例`}
      >
        <div className="people-heading">
          <span>被記錄的，是人生。</span>
          <span>{year}</span>
        </div>
        <div className="people-dots" aria-hidden="true">
          {Array.from({ length: 100 }, (_, i) => (
            <i key={i} data-filled={i < Math.round(minorShare) || undefined} />
          ))}
        </div>
        <div className="people-age">
          <p className="fact-number">
            <AnimatedNumber value={minorShare} format={fixed1} />
            <small>%</small>
          </p>
          <h3>
            當年受暴人中<strong>未滿 18 歲</strong>
          </h3>
        </div>
        <p className="people-caption">每個圓點約代表 1% 的受暴人數，含年齡不詳者。</p>
      </article>
      <article className="fact-card fact-people fact-sex" aria-label={`${year} 年受暴人的性別比例`}>
        <div className="people-heading">
          <h3>受暴人的性別比例</h3>
          <span>{year}</span>
        </div>
        <div className="people-gender">
          <div className="people-gender-heading">
            <p>全部年齡</p>
            <a href="#ages" className="fact-detail-link" aria-label="探索年齡與性別">
              <RiArrowRightUpLine aria-hidden="true" />
            </a>
          </div>
          <div className="people-gender-bar" aria-hidden="true">
            {genders.map((row) => (
              <i
                key={row.label}
                data-gender={row.label}
                style={{ width: `${share(row.value, total)}%` }}
              />
            ))}
          </div>
          <dl className="people-gender-list">
            {genders.map((row) => (
              <div key={row.label}>
                <dt>
                  <i data-gender={row.label} />
                  {row.label}
                </dt>
                <dd>
                  <span>
                    {row.value > 0 && share(row.value, total) < 0.1
                      ? "<0.1"
                      : fixed1(share(row.value, total))}
                    <small>%</small>
                  </span>
                  <span>{formatNumber(row.value)} 人</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="people-caption people-footnote">
          以全部受暴人數為分母，含其他與不詳；四捨五入後合計可能不為 100%。
        </p>
      </article>
      <FactCard number="01" label="與前一年相比" href="#trend" className="fact-trend">
        <p className="fact-kicker">受暴人數的年度變化</p>
        <p className="fact-number">
          {change === null ? "—" : <AnimatedNumber value={change} format={formatChange} />}
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
          {previous ? (
            <>
              {previous.year} 年 <AnimatedNumber value={previous.victims} /> 人 → {year} 年{" "}
              <AnimatedNumber value={total} /> 人
            </>
          ) : (
            "資料起始年度，無前一年可比較"
          )}
        </p>
      </FactCard>

      <FactCard number="02" label="每十萬人口比率最高" href="#regions" className="fact-region">
        <div className="fact-region-body">
          <div>
            <p className="fact-kicker">受暴人數・縣市分布</p>
            <p className="fact-name">
              <AnimatedValue value={topCity?.city ?? "無資料"} />
            </p>
            <p className="fact-number">
              {topCity ? <AnimatedNumber value={topCity.rate} format={formatRate} /> : "—"}
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

      <FactCard
        number="03"
        label="被害人與加害人的關係"
        href="#relationships"
        className="fact-relationships"
      >
        <div className="fact-relationships-body">
          <div className="fact-relationship-lead">
            <p className="fact-kicker">最多紀錄的兩造關係</p>
            <p className="fact-name">
              <AnimatedValue value={leading?.label ?? "無資料"} />
            </p>
            <p className="fact-number">
              {leading ? <AnimatedNumber value={leading.value} /> : "—"}
              <small>人</small>
            </p>
            <p className="fact-unit">
              占關係紀錄{" "}
              {leading ? (
                <AnimatedNumber value={share(leading.value, relationshipTotal)} format={fixed1} />
              ) : (
                "—"
              )}
              %
            </p>
          </div>
          <ol className="fact-ranking">
            {relationships.slice(0, 3).map((row, index) => (
              <motion.li
                key={row.label}
                layout="position"
                initial={false}
                transition={{ duration: reduced ? 0 : 0.6, ease: [0.25, 1, 0.5, 1] }}
              >
                <div>
                  <span>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    {row.label}
                  </span>
                  <strong>
                    <AnimatedNumber value={share(row.value, relationshipTotal)} format={fixed1} />
                    <small>%</small>
                  </strong>
                </div>
                <div className="fact-rank-track" aria-hidden="true">
                  <i
                    style={{ transform: `scaleX(${share(row.value, relationshipTotal) / 100})` }}
                  />
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
        <p className="fact-note">以當年度兩造關係紀錄總數為分母，包含不詳</p>
      </FactCard>
    </div>
  );
}
