import palette from "../lib/palette.json";
import { useEffect, useRef, useState } from "react";
import type { Chart } from "chart.js";
import { useReducedMotion } from "motion/react";
import { RiAddLine } from "react-icons/ri";
import { formatNumber } from "../lib/data";

type Series = { label: string; values: number[]; color: string };
type Props = {
  title: string;
  labels: string[];
  series: Series[];
  type?: "line" | "bar";
  horizontal?: boolean;
  unit?: string;
  height?: number;
};
type ChartData = Pick<Props, "labels" | "series" | "unit">;
const numericFont = () =>
  getComputedStyle(document.documentElement)
    .getPropertyValue("--font-numeric")
    .trim();
const toLabels = (labels: string[], horizontal: boolean) =>
  labels.map((label) =>
    horizontal && label.length > 13 ? `${label.slice(0, 12)}…` : label,
  );
const toDatasets = (series: Series[], type: "line" | "bar") =>
  series.map((s) => ({
    label: s.label,
    data: s.values,
    borderColor: s.color,
    backgroundColor: type === "line" ? `${s.color}14` : s.color,
    borderWidth: type === "line" ? 2.5 : 0,
    borderRadius: 2,
    maxBarThickness: 30,
    pointRadius: 2.5,
    pointHoverRadius: 5,
    fill: type === "line",
    tension: 0.15,
  }));
export function DataChart({
  title,
  labels,
  series,
  type = "bar",
  horizontal = false,
  unit = "人",
  height = 310,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const latest = useRef<ChartData>({ labels, series, unit });
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    import("chart.js/auto")
      .then(({ default: ChartJS }) => {
        if (disposed || !canvas.current) return;
        chartRef.current = new ChartJS(canvas.current, {
          type,
          data: {
            labels: toLabels(latest.current.labels, horizontal),
            datasets: toDatasets(latest.current.series, type),
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            indexAxis: horizontal ? "y" : "x",
            interaction: { intersect: false, mode: "index" },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: palette.foreground.hex,
                padding: 12,
                callbacks: {
                  title: (items) =>
                    latest.current.labels[items[0]?.dataIndex ?? 0] ?? "",
                  label: (context) =>
                    `${context.dataset.label}：${formatNumber(Number(horizontal ? context.parsed.x : context.parsed.y))} ${latest.current.unit}`,
                },
              },
            },
            scales: {
              x: {
                beginAtZero: horizontal,
                grid: { display: horizontal, color: palette.border.hex },
                border: { display: false },
                ticks: {
                  color: palette["muted-foreground"].hex,
                  maxRotation: 0,
                  font: { size: 11, family: numericFont() },
                },
              },
              y: {
                beginAtZero: true,
                grid: { display: !horizontal, color: palette.border.hex },
                border: { display: false },
                ticks: {
                  color: palette["muted-foreground"].hex,
                  font: { size: 12, family: numericFont() },
                },
              },
            },
          },
        });
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [type, horizontal]);
  useEffect(() => {
    latest.current = { labels, series, unit };
    const chart = chartRef.current;
    if (!chart) return;
    chart.data.labels = toLabels(labels, horizontal);
    chart.data.datasets = toDatasets(series, type);
    chart.options.animation = reduced
      ? false
      : { duration: 450, easing: "easeOutQuart" };
    chart.update();
  }, [labels, series, unit, type, horizontal, reduced]);
  return (
    <figure>
      <div className="mb-5 flex items-center gap-4.5 text-[11px] text-muted-foreground">
        {series.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-2">
            <i
              className="inline-block size-2 rounded-full"
              style={{ background: s.color }}
            />
            {s.label}
          </span>
        ))}
        <span className="ml-auto">單位：{unit}</span>
      </div>
      <div style={{ height }} className="relative min-w-0">
        {failed ? (
          <p>圖表無法載入，請展開下方數據表。</p>
        ) : (
          <canvas
            ref={canvas}
            role="img"
            aria-label={`${title}。對應數據請見下方表格。`}
          />
        )}
      </div>
    </figure>
  );
}
