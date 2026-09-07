import palette from "../lib/palette.json";
import { useEffect, useRef, useState } from "react";
import type { Chart } from "chart.js";
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
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    let chart: Chart | undefined;
    import("chart.js/auto")
      .then(({ default: ChartJS }) => {
        if (disposed || !canvas.current) return;
        chart = new ChartJS(canvas.current, {
          type,
          data: {
            labels: labels.map((label) =>
              horizontal && label.length > 13 ? `${label.slice(0, 12)}…` : label,
            ),
            datasets: series.map((s) => ({
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
            })),
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
                  title: (items) => labels[items[0]?.dataIndex ?? 0] ?? "",
                  label: (context) =>
                    `${context.dataset.label}：${formatNumber(Number(horizontal ? context.parsed.x : context.parsed.y))} ${unit}`,
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
                  font: { size: 11 },
                },
              },
              y: {
                beginAtZero: true,
                grid: { display: !horizontal, color: palette.border.hex },
                border: { display: false },
                ticks: { color: palette["muted-foreground"].hex, font: { size: 12 } },
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
      chart?.destroy();
    };
  }, [labels, series, type, horizontal, unit]);
  return (
    <figure className="data-figure">
      <div className="chart-legend">
        {series.map((s) => (
          <span key={s.label}>
            <i style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        <span className="ml-auto">單位：{unit}</span>
      </div>
      <div style={{ height }} className="chart-canvas">
        {failed ? (
          <p>圖表無法載入，請展開下方數據表。</p>
        ) : (
          <canvas ref={canvas} role="img" aria-label={`${title}。對應數據請見下方表格。`} />
        )}
      </div>
      <details className="data-details">
        <summary>
          查看圖表數據 <span aria-hidden="true">＋</span>
        </summary>
        <div className="table-scroll" tabIndex={0} role="region" aria-label={`${title}數據表`}>
          <table>
            <caption>
              {title}（{unit}）
            </caption>
            <thead>
              <tr>
                <th scope="col">項目</th>
                {series.map((s) => (
                  <th scope="col" key={s.label}>
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((label, i) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {series.map((s) => (
                    <td key={s.label}>{formatNumber(s.values[i] ?? 0)}</td>
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
