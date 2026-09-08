import palette from "../lib/palette.json";
import { useEffect, useId, useRef, useState } from "react";
import type { AnimationSpec, Chart, Element, Plugin } from "chart.js";
import { RiAddLine } from "react-icons/ri";
import { formatNumber } from "../lib/data";
import { useReducedMotionPreference } from "../lib/use-reduced-motion";

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
const dataTransition = { duration: 600, easing: "easeOutQuart" } satisfies AnimationSpec<"bar">;
type DisplayValue = { value: number; target: number };
const numericFont = () =>
  getComputedStyle(document.documentElement).getPropertyValue("--font-numeric").trim();
// Chart.js requires numeric pixel sizes; resolve 0.75rem from the browser's root size.
const chartFont = () => ({
  size: Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.75,
  family: numericFont(),
});
const toLabels = (labels: string[], horizontal: boolean) =>
  labels.map((label) => (horizontal && label.length > 13 ? `${label.slice(0, 12)}…` : label));
const toDatasets = ({ series }: ChartData, type: "line" | "bar") =>
  series.map((s) => ({
    label: s.label,
    data: [...s.values],
    borderColor: s.color,
    backgroundColor:
      type === "line" ? `color-mix(in oklch, ${s.color} 6.275%, transparent)` : s.color,
    borderWidth: type === "line" ? 2.5 : 0,
    borderRadius: 6,
    borderSkipped: false,
    maxBarThickness: 22,
    pointRadius: 3,
    pointBackgroundColor: s.color,
    pointBorderColor: palette.card.css,
    pointBorderWidth: 2,
    pointHoverRadius: 6,
    hoverBackgroundColor: `color-mix(in oklch, ${s.color} 90%, oklch(0 0 0))`,
    hoverBorderColor: s.color,
    pointHoverBackgroundColor: s.color,
    pointHoverBorderColor: palette.card.css,
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
  const updateRef = useRef<((data: ChartData, reducedMotion: boolean) => void) | null>(null);
  const latest = useRef<ChartData>({ labels, series, unit, selectedLabel, onSelectLabel });
  const reducedMotion = useReducedMotionPreference();
  const tableId = useId();
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    latest.current = { labels, series, unit, selectedLabel, onSelectLabel };
  }, [labels, series, unit, selectedLabel, onSelectLabel]);
  useEffect(() => {
    updateRef.current?.(latest.current, reducedMotion);
  }, [labels, series, unit, selectedLabel, reducedMotion]);
  useEffect(() => {
    let disposed = false;
    let displayedValues: Map<string, DisplayValue>[] = [];
    const newElements = new Set<Element>();
    const selection = { value: latest.current.labels.indexOf(latest.current.selectedLabel ?? "") };
    let selectionTarget = selection.value;
    const annotations: Plugin = {
      id: "readable-values",
      beforeDatasetUpdate(_chart, { meta }) {
        // A newly introduced classification has no previous observation to interpolate.
        meta.data.forEach((element, index) => {
          if (newElements.delete(element)) {
            meta.controller.updateElements(meta.data, index, 1, "none");
          }
        });
      },
      afterDatasetsDraw(chart) {
        const { ctx, chartArea } = chart;
        ctx.save();
        if (horizontal) {
          ctx.fillStyle = palette.foreground.css;
          ctx.font = `500 0.75rem ${numericFont()}`;
          ctx.textBaseline = "middle";
          chart.data.datasets.forEach((dataset, seriesIndex) => {
            chart.getDatasetMeta(seriesIndex).data.forEach((bar, index) => {
              const label = latest.current.labels[index];
              const value = displayedValues[seriesIndex]?.get(label)?.value;
              if (seriesIndex === 0) {
                ctx.fillStyle = palette["muted-foreground"].css;
                ctx.textAlign = "right";
                ctx.fillText(toLabels([label], true)[0], chartArea.left - 12, bar.y);
              }
              if (value !== undefined) {
                ctx.fillStyle = palette.foreground.css;
                ctx.textAlign = "left";
                ctx.fillText(formatNumber(Math.round(value)), bar.x + 8, bar.y);
              }
            });
          });
        } else if (latest.current.selectedLabel) {
          const points = chart.getDatasetMeta(0).data;
          const index = Math.max(0, Math.min(points.length - 1, selection.value));
          const start = points[Math.floor(index)];
          const end = points[Math.ceil(index)];
          if (start && end) {
            const progress = index % 1;
            const x = start.x + (end.x - start.x) * progress;
            const y = start.y + (end.y - start.y) * progress;
            ctx.strokeStyle = palette["section-marker"].css;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(x, y + 9);
            ctx.lineTo(x, chartArea.bottom);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = palette["data-secondary"].css;
            ctx.strokeStyle = palette.card.css;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
        ctx.restore();
      },
    };
    import("chart.js/auto")
      .then(({ default: ChartJS, Animations, BarElement, PointElement }) => {
        if (disposed || !canvas.current) return;
        let previousLabels = latest.current.labels;
        displayedValues = latest.current.series.map(
          (s) =>
            new Map(
              previousLabels.map((label, index) => [
                label,
                {
                  value: s.values[index],
                  target: s.values[index],
                },
              ]),
            ),
        );
        selection.value = previousLabels.indexOf(latest.current.selectedLabel ?? "");
        selectionTarget = selection.value;
        const chart = new ChartJS(canvas.current, {
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
            // Canvas accepts OKLCH directly; Chart.js's color interpolator does not.
            animations: { colors: false },
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
                backgroundColor: palette.foreground.css,
                titleColor: palette["primary-foreground"].css,
                bodyColor: palette["primary-foreground"].css,
                footerColor: palette["primary-foreground"].css,
                multiKeyBackground: palette.card.css,
                padding: 12,
                titleFont: () => ({ ...chartFont(), weight: "bold" }),
                bodyFont: chartFont,
                footerFont: () => ({ ...chartFont(), weight: "bold" }),
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
                grid: { display: horizontal, color: palette.border.css },
                border: { display: false },
                ticks: {
                  color: palette["muted-foreground"].css,
                  maxRotation: 0,
                  font: chartFont,
                },
              },
              y: {
                beginAtZero: true,
                grid: { display: !horizontal, color: palette.border.css },
                border: { display: false },
                ticks: {
                  color: horizontal ? "transparent" : palette["muted-foreground"].css,
                  font: chartFont,
                },
              },
            },
          },
        });
        chartRef.current = chart;
        const valueAnimations = new Animations(chart, {
          value: { type: "number", ...dataTransition },
        });
        updateRef.current = (data, reduce) => {
          if (reduce) chart.stop();
          chart.options.animation = reduce ? false : dataTransition;
          const nextDatasets = toDatasets(data, type);
          nextDatasets.forEach((nextDataset, seriesIndex) => {
            const dataset = chart.data.datasets[seriesIndex];
            if (dataset) Object.assign(dataset, nextDataset);
            else chart.data.datasets.push(nextDataset);

            const meta = chart.getDatasetMeta(seriesIndex);
            const previousElements = new Map(
              previousLabels.map((label, index) => [label, meta.data[index]]),
            );
            meta.data = data.labels.map((label) => {
              const retained = previousElements.get(label);
              if (retained) return retained;
              const element = type === "bar" ? new BarElement({}) : new PointElement({});
              newElements.add(element);
              return element;
            });

            const previousValues = displayedValues[seriesIndex];
            displayedValues[seriesIndex] = new Map(
              data.labels.map((label, index) => {
                const target = nextDataset.data[index];
                const displayed = previousValues?.get(label) ?? { value: target, target };
                if (reduce) displayed.value = target;
                else if (displayed.target !== target) {
                  valueAnimations.update(displayed, { value: target });
                }
                displayed.target = target;
                return [label, displayed];
              }),
            );
          });
          chart.data.datasets.length = nextDatasets.length;
          displayedValues.length = nextDatasets.length;
          chart.data.labels = toLabels(data.labels, horizontal);
          previousLabels = data.labels;
          const selectedIndex = data.labels.indexOf(data.selectedLabel ?? "");
          if (reduce || selection.value < 0 || selectedIndex < 0) selection.value = selectedIndex;
          else if (selectionTarget !== selectedIndex) {
            valueAnimations.update(selection, { value: selectedIndex });
          }
          selectionTarget = selectedIndex;
          // Chart.js drives bar geometry, numeric labels and selection with the same clock.
          chart.update(reduce ? "none" : undefined);
        };
        setReady(true);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      chartRef.current?.destroy();
      chartRef.current = null;
      updateRef.current = null;
    };
  }, [type, horizontal]);
  return (
    <figure>
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-caption text-muted-foreground [&_i]:size-2 [&_i]:rounded-full [&>span]:inline-flex [&>span]:items-center [&>span]:gap-2 [&>span:last-child]:ml-auto">
        {series.map((s) => (
          <span key={s.label}>
            <i style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        <span>單位：{unit}</span>
      </div>
      <div style={{ height }} className="relative min-w-0" aria-busy={!ready && !failed}>
        {!ready && (
          <p className="absolute inset-0 grid place-content-center bg-muted p-6 text-caption leading-[1.9] text-muted-foreground">
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
      <details
        className="mt-4.5 border-t border-border [&_summary_svg]:size-4.5 [&_summary::-webkit-details-marker]:hidden [&>summary]:flex [&>summary]:min-h-12 [&>summary]:list-none [&>summary]:items-center [&>summary]:justify-between [&>summary]:gap-3 [&>summary]:text-caption [&>summary]:text-primary [&>summary>span]:flex [&>summary>span]:items-center [&>summary>span]:gap-3 [&>summary>span]:text-caption [&>summary>span]:text-muted-foreground [&[open]>summary_svg]:rotate-45"
        open={failed || undefined}
      >
        <summary>
          查看完整數據表{" "}
          <span>
            {labels.length} 項<RiAddLine aria-hidden="true" />
          </span>
        </summary>
        <div
          className="max-w-full overflow-x-auto overscroll-x-contain"
          tabIndex={0}
          role="region"
          aria-label={`${title}數據表`}
        >
          <table
            id={tableId}
            className="w-full border-collapse text-caption leading-[1.7] [&_[data-emphasis]]:font-bold [&_[data-emphasis]]:text-primary [&_button]:inline-flex [&_button]:min-h-11 [&_button]:items-center [&_button]:gap-3 [&_button]:text-primary [&_button]:underline [&_button]:underline-offset-4 [&_button_span]:text-caption [&_button_span]:no-underline [&_caption]:text-left [&_small]:font-normal [&_small]:whitespace-nowrap [&_tbody_tr:hover]:bg-muted [&_td]:border-b [&_td]:border-border [&_td]:tabular-nums [&_td:not([colspan])]:px-3.5 [&_td:not([colspan])]:py-3.25 [&_td:not([colspan])]:text-right [&_td:not([colspan])]:font-numeric [&_td:not([colspan])]:text-label [&_td:not([colspan])]:whitespace-nowrap [&_th]:border-b [&_th]:border-border [&_th]:px-3.5 [&_th]:py-3.25 [&_th]:text-right [&_th]:font-normal [&_th:first-child]:text-left [&_thead]:bg-muted [&_thead]:text-caption [&_thead]:text-muted-foreground [&_tr[data-selected]]:bg-muted"
          >
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
