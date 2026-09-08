import palette from "../lib/palette.json";
import { useEffect, useId, useRef, useState } from "react";
import type { Chart, Plugin } from "chart.js";
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
  selectedLabel?: string;
  onSelectLabel?: (label: string) => void;
};
type ChartData = Pick<Props, "labels" | "series" | "unit" | "selectedLabel" | "onSelectLabel">;
const numericFont = () =>
  getComputedStyle(document.documentElement).getPropertyValue("--font-numeric").trim();
const toLabels = (labels: string[], horizontal: boolean) =>
  labels.map((label) => (horizontal && label.length > 13 ? `${label.slice(0, 12)}…` : label));
const toDatasets = ({ series, labels, selectedLabel }: ChartData, type: "line" | "bar") =>
  series.map((s) => ({
    label: s.label,
    data: s.values,
    borderColor: s.color,
    backgroundColor: type === "line" ? `${s.color}10` : s.color,
    borderWidth: type === "line" ? 2.5 : 0,
    borderRadius: 6,
    borderSkipped: false,
    maxBarThickness: 22,
    pointRadius: labels.map((label) => (label === selectedLabel ? 6 : 3)),
    pointBackgroundColor: labels.map((label) =>
      label === selectedLabel ? palette["data-secondary"].hex : s.color,
    ),
    pointBorderColor: palette.card.hex,
    pointBorderWidth: 2,
    pointHoverRadius: 6,
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
  selectedLabel,
  onSelectLabel,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const latest = useRef<ChartData>({ labels, series, unit, selectedLabel, onSelectLabel });
  const tableId = useId();
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    latest.current = { labels, series, unit, selectedLabel, onSelectLabel };
    const chart = chartRef.current;
    if (!chart) return;
    chart.data.labels = toLabels(labels, horizontal);
    chart.data.datasets = toDatasets(latest.current, type);
    // Update exact values immediately; tweening data suggests observations that do not exist.
    chart.update("none");
  }, [labels, series, unit, type, horizontal, selectedLabel, onSelectLabel]);
  useEffect(() => {
    let disposed = false;
    const annotations: Plugin = {
      id: "readable-values",
      afterDatasetsDraw(chart) {
        const { ctx, chartArea } = chart;
        ctx.save();
        if (horizontal) {
          ctx.fillStyle = palette.foreground.hex;
          ctx.font = `500 12px ${numericFont()}`;
          ctx.textBaseline = "middle";
          chart.data.datasets.forEach((dataset, seriesIndex) => {
            chart.getDatasetMeta(seriesIndex).data.forEach((bar, index) => {
              const value = latest.current.series[seriesIndex]?.values[index];
              if (value !== undefined) ctx.fillText(formatNumber(value), bar.x + 8, bar.y);
            });
          });
        } else if (latest.current.selectedLabel) {
          const index = latest.current.labels.indexOf(latest.current.selectedLabel);
          const point = chart.getDatasetMeta(0).data[index];
          if (point) {
            ctx.strokeStyle = palette["section-marker"].hex;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(point.x, point.y + 9);
            ctx.lineTo(point.x, chartArea.bottom);
            ctx.stroke();
          }
        }
        ctx.restore();
      },
    };
    import("chart.js/auto")
      .then(({ default: ChartJS }) => {
        if (disposed || !canvas.current) return;
        chartRef.current = new ChartJS(canvas.current, {
          type,
          data: {
            labels: toLabels(latest.current.labels, horizontal),
            datasets: toDatasets(latest.current, type),
          },
          plugins: [annotations],
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            indexAxis: horizontal ? "y" : "x",
            interaction: { intersect: false, mode: "index" },
            layout: { padding: { right: horizontal ? 55 : 10, top: 8 } },
            onClick: (_event, elements) => {
              const label = latest.current.labels[elements[0]?.index ?? -1];
              if (label !== undefined) latest.current.onSelectLabel?.(label);
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: palette.foreground.hex,
                padding: 12,
                callbacks: {
                  title: (items) => latest.current.labels[items[0]?.dataIndex ?? 0] ?? "",
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
                  font: { size: 12, family: numericFont() },
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
        setReady(true);
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
  return (
    <figure className="data-figure">
      <div className="chart-legend">
        {series.map((s) => (
          <span key={s.label}>
            <i style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        <span>單位：{unit}</span>
      </div>
      <div style={{ height }} className="chart-canvas" aria-busy={!ready && !failed}>
        {!ready && (
          <p className="chart-loading">
            {failed
              ? "圖表無法載入，完整數據仍可在下方表格查閱。"
              : "圖表載入中，數據也可在下方表格查閱。"}
          </p>
        )}
        <canvas
          ref={canvas}
          role="img"
          aria-label={`${title}。完整數據請見下方表格。`}
          aria-describedby={tableId}
        />
      </div>
      <details className="chart-table-disclosure" open={failed || undefined}>
        <summary>
          查看完整數據表{" "}
          <span>
            {labels.length} 項<RiAddLine aria-hidden="true" />
          </span>
        </summary>
        <div className="data-table-scroll" tabIndex={0} role="region" aria-label={`${title}數據表`}>
          <table id={tableId} className="data-table">
            <caption className="sr-only">
              {title}，單位：{unit}
            </caption>
            <thead>
              <tr>
                <th scope="col">{type === "line" ? "年度" : "分類"}</th>
                {series.map((s) => (
                  <th scope="col" key={s.label}>
                    {s.label}／{unit}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((label, index) => (
                <tr key={label} data-selected={label === selectedLabel || undefined}>
                  <th scope="row">
                    {onSelectLabel ? (
                      <button
                        type="button"
                        onClick={() => onSelectLabel(label)}
                        aria-label={`查看 ${label} 年資料`}
                        aria-pressed={label === selectedLabel}
                      >
                        {label}
                        {label === selectedLabel && <span>目前年度</span>}
                      </button>
                    ) : (
                      label
                    )}
                  </th>
                  {series.map((s) => (
                    <td key={s.label}>
                      {s.values[index] === undefined ? "無資料" : formatNumber(s.values[index])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
