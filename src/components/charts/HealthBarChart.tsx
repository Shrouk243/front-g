
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../../contexts/AppContext";

type ChartDatum = object;

type ThresholdDirection = "high" | "low";
type MetricState = "normal" | "warning" | "critical";

export interface HealthChartThresholds {
  direction?: ThresholdDirection;
  warning?: number;
  critical?: number;
}

export interface HealthChartReferenceBand {
  y1: number;
  y2: number;
  fill: string;
  opacity?: number;
  stroke?: string;
  strokeDasharray?: string;
}

export interface HealthChartSeries<T extends ChartDatum> {
  key: keyof T & string;
  label: string;
  color: string;
  latestColor?: string;
  normalColor?: string;
  warningColor?: string;
  criticalColor?: string;
  thresholds?: HealthChartThresholds;
  stackId?: string;
}

interface HealthBarChartProps<T extends ChartDatum> {
  data: T[];
  series: Array<HealthChartSeries<T>>;
  xKey?: keyof T & string;
  height?: number;
  unit?: string;
  compact?: boolean;
  showYAxis?: boolean;
  showGrid?: boolean;
  barSize?: number;
  barGap?: number;
  yAxisWidth?: number;
  yDomain?: [number | "auto" | "dataMin", number | "auto" | "dataMax"];
  referenceBands?: HealthChartReferenceBand[];
  tooltipLabel?: string;
  tooltipValueFormatter?: (value: number, seriesLabel: string, datum: T) => string;
  xAxisColor?: string;
  yAxisColor?: string;
  xTickFormatter?: (value: string | number) => string;
  xInterval?: number | "preserveStart" | "preserveEnd" | "preserveStartEnd" | "equidistantPreserveStart";
  xMinTickGap?: number;
}

function evaluateMetricState(
  value: number,
  thresholds?: HealthChartThresholds
): MetricState {
  if (!thresholds) return "normal";

  const direction = thresholds.direction ?? "high";

  if (direction === "low") {
    if (thresholds.critical !== undefined && value <= thresholds.critical) return "critical";
    if (thresholds.warning !== undefined && value <= thresholds.warning) return "warning";
    return "normal";
  }

  if (thresholds.critical !== undefined && value >= thresholds.critical) return "critical";
  if (thresholds.warning !== undefined && value >= thresholds.warning) return "warning";
  return "normal";
}

// التعديل هنا: تم إعطاء الأولوية للـ Critical والـ Warning قبل أي شيء آخر
function getBarFill<T extends ChartDatum>(
  datum: T,
  datumIndex: number,
  total: number,
  series: HealthChartSeries<T>
) {
  const rawValue = (datum as Record<string, number | string>)[series.key];
  const value = typeof rawValue === "number" ? rawValue : Number(rawValue);
  const state = evaluateMetricState(value, series.thresholds);

  if (state === "critical") return series.criticalColor ?? "#ef4444";
  if (state === "warning") return series.warningColor ?? "#f59e0b";
  if (datumIndex === total - 1) return series.latestColor ?? series.color;
  return series.normalColor ?? series.color;
}

function PremiumTooltip<T extends ChartDatum>({
  active,
  payload,
  label,
  tooltipLabel,
  unit,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; payload?: T; fill?: string; color?: string }>;
  label?: string;
  tooltipLabel?: string;
  unit?: string;
  formatter?: (value: number, seriesLabel: string, datum: T) => string;
}) {
  const datum = payload?.[0]?.payload;

  if (!active || !payload?.length || !datum) return null;

  return (
    <div
      style={{
        minWidth: 140,
        borderRadius: 16,
        background: "rgba(8, 15, 29, 0.96)",
        border: "1px solid rgba(148, 163, 184, 0.22)",
        boxShadow: "0 18px 40px rgba(2, 6, 23, 0.45)",
        padding: "12px 14px",
        backdropFilter: "blur(14px)",
      }}
    >
      <div style={{ fontSize: 11, color: "rgba(191, 219, 254, 0.72)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
        {tooltipLabel ?? "Reading"}
      </div>
      <div style={{ fontSize: 20, color: "#F8FAFC", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 6 }}>
        {payload.map((entry) => {
          const value = entry.value ?? 0;
          const text = formatter ? formatter(value, entry.name ?? "", datum) : `${value}${unit ? ` ${unit}` : ""}`;
          return (
            <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: entry.fill ?? entry.color ?? "#38bdf8", flexShrink: 0 }} />
              <span>{text}</span>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 12, color: "rgba(226, 232, 240, 0.78)", fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

export function HealthBarChart<T extends ChartDatum>({
  data,
  series,
  xKey = "time" as keyof T & string,
  height = 220,
  unit,
  compact = false,
  showYAxis = true,
  showGrid = true,
  barSize,
  barGap = 10,
  yAxisWidth = 34,
  yDomain,
  referenceBands,
  tooltipLabel,
  tooltipValueFormatter,
  xAxisColor,
  yAxisColor,
  xTickFormatter,
  xInterval = 0,
  xMinTickGap,
}: HealthBarChartProps<T>) {
  const { colors } = useApp();
  const resolvedXAxisColor = xAxisColor ?? (colors.cardBg === "white" ? "#5B7DB8" : "#9FB6D5");
  const resolvedYAxisColor = yAxisColor ?? colors.textMuted;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barCategoryGap={compact ? "28%" : "24%"}
          barGap={barGap}
          margin={{
            top: compact ? 6 : 10,
            right: compact ? 4 : 10,
            left: compact ? -14 : -6,
            bottom: compact ? 4 : 2,
          }}
        >
          {referenceBands?.map((band, index) => (
            <ReferenceArea
              key={`${band.y1}-${band.y2}-${index}`}
              y1={band.y1}
              y2={band.y2}
              fill={band.fill}
              fillOpacity={band.opacity ?? 0.12}
              stroke={band.stroke}
              strokeDasharray={band.strokeDasharray}
              ifOverflow="extendDomain"
            />
          ))}

          {showGrid ? (
            <CartesianGrid
              vertical={false}
              stroke={colors.border}
              strokeOpacity={compact ? 0.08 : 0.18}
              strokeDasharray="3 5"
            />
          ) : null}

          <XAxis
            dataKey={xKey}
            axisLine={false}
            tickLine={false}
            tickFormatter={xTickFormatter}
            tick={{
              fill: resolvedXAxisColor,
              fontSize: compact ? 10 : 11,
              fontWeight: 700,
            }}
            tickMargin={compact ? 6 : 10}
            interval={xInterval}
            minTickGap={xMinTickGap}
          />

          <YAxis
            hide={!showYAxis}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: resolvedYAxisColor,
              fontSize: 10,
              fontWeight: 600,
            }}
            tickMargin={8}
            width={yAxisWidth}
            domain={yDomain}
            tickCount={4}
          />

          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.08)", radius: 12 }}
            content={
              <PremiumTooltip
                tooltipLabel={tooltipLabel}
                unit={unit}
                formatter={tooltipValueFormatter}
              />
            }
          />

          {series.map((entry, seriesIndex) => (
            <Bar
              key={entry.key}
              dataKey={entry.key}
              name={entry.label}
              radius={[10, 10, 3, 3]}
              maxBarSize={barSize}
              barSize={barSize}
              stackId={entry.stackId}
              animationDuration={500 + seriesIndex * 120}
            >
              {data.map((datum, datumIndex) => (
                <Cell
                  key={`${entry.key}-${datumIndex}`}
                  fill={getBarFill(datum, datumIndex, data.length, entry)}
                  stroke={datumIndex === data.length - 1 ? "rgba(255,255,255,0.14)" : "transparent"}
                  strokeWidth={datumIndex === data.length - 1 ? 1 : 0}
                />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}