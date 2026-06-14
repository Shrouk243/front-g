

import React from "react";
import { useApp } from "../contexts/AppContext";
import { fetchVitals } from "../lib/api";
import { getVitalNumericValue, groupHistoryRows } from "../lib/health-data";
import type { BackendVital, VitalReading } from "../types";

type StatusKey = VitalReading["status"];

export function HistoryPage() {
  const { colors, t, isRTL } = useApp();
  const [items, setItems] = React.useState<BackendVital[]>([]);

  React.useEffect(() => {
    fetchVitals().then((response) => setItems(response.items)).catch(() => undefined);
  }, []);

  const groupedRows = groupHistoryRows(items);
  const bpValues = items.filter((item) => item.type === "blood_pressure" && item.systolic && item.diastolic);
  const hrValues = items.filter((item) => item.type === "heart_rate");
  const oxygenValues = items.filter((item) => item.type === "oxygen");
  const glucoseValues = items.filter((item) => item.type === "blood_sugar");

  const statusColors: Record<StatusKey, { color: string; bg: string; label: string }> = {
    normal: { color: "#16A34A", bg: "#DCFCE7", label: t("common_normal") || "Normal" },
    elevated: { color: "#B45309", bg: "#FEF3C7", label: t("common_elevated") || "Elevated" },
    critical: { color: "#DC2626", bg: "#FEE2E2", label: t("common_critical") || "High" },
  };

  const averages = {
    bp: bpValues.length ? `${Math.round(bpValues.reduce((sum, item) => sum + (item.systolic ?? 0), 0) / bpValues.length)}/${Math.round(bpValues.reduce((sum, item) => sum + (item.diastolic ?? 0), 0) / bpValues.length)}` : "—",
    hr: hrValues.length ? `${Math.round(hrValues.reduce((sum, item) => sum + getVitalNumericValue(item), 0) / hrValues.length)} bpm` : "—",
    spo2: oxygenValues.length ? `${(oxygenValues.reduce((sum, item) => sum + getVitalNumericValue(item), 0) / oxygenValues.length).toFixed(1)}%` : "—",
    glucose: glucoseValues.length ? `${Math.round(glucoseValues.reduce((sum, item) => sum + getVitalNumericValue(item), 0) / glucoseValues.length)} mg/dL` : "—",
  };

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: colors.textPrimary, margin: "0 0 4px", letterSpacing: "-0.03em" }}>{t("history_title")}</h1>
        <p style={{ fontSize: 14, color: colors.textMuted, margin: 0, fontWeight: 500 }}>{t("history_subtitle")}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { labelKey: "history_avgBP" as const, value: averages.bp, color: "#F59E0B", bg: "#FEF3C7" },
          { labelKey: "history_avgHR" as const, value: averages.hr, color: "#EF4444", bg: "#FEE2E2" },
          { labelKey: "history_avgSpO2" as const, value: averages.spo2, color: "#0DC9B1", bg: "#E6FAF8" },
          { labelKey: "history_avgGlucose" as const, value: averages.glucose, color: "#3B82F6", bg: "#DBEAFE" },
        ].map((stat) => (
          <div key={stat.labelKey} style={{ background: colors.cardBg, borderRadius: 16, padding: "16px", textAlign: "center", boxShadow: "0 2px 8px rgba(15,31,61,0.06)", border: `1px solid ${stat.bg}` }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: stat.color, margin: "0 0 4px" }}>{stat.value}</p>
            <p style={{ fontSize: 12, color: colors.textMuted, margin: 0, fontWeight: 500 }}>{t(stat.labelKey)}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, color: colors.textMuted, margin: "0 0 14px", letterSpacing: "0.04em", textTransform: "uppercase" }}>{t("history_readingsLog")}</h2>

      <div style={{ width: "100%" }}>
        {groupedRows.map((row, index) => {
          const s = statusColors[row.status];
          return (
            <div key={`${row.date}-${row.time}-${index}`} style={{
              background: colors.cardBg,
              borderRadius: 14,
              padding: "14px 16px",
              boxShadow: "0 1px 4px rgba(15,31,61,0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: `1px solid ${row.status === "critical" ? "#FECACA" : colors.border}`,
              gap: 16,
              marginBottom: 10,
              width: "100%",
              boxSizing: "border-box",
            }}
              className="history-row-card"
            >
              <div style={{ minWidth: 90, flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500, marginBottom: 2 }}>{row.date}</div>
                <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 700, marginBottom: 4 }}>{row.time}</div>
                <div style={{ display: "inline-flex", alignItems: "center", padding: "2px 6px", borderRadius: 5, background: s.bg }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label}</span>
                </div>
              </div>

              <div 
                style={{ gap: "10px 16px", flex: 1, display: "grid" }} 
                className="vitals-values-grid"
              >
                <div>
                  <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500, display: "block" }}>{t("vital_bp")}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{row.bp}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500, display: "block" }}>{t("vital_hr")}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{row.hr}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500, display: "block" }}>{t("vital_oxygen")}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{row.spo2}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500, display: "block" }}>{t("vital_glucose")}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{row.glucose}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .vitals-values-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        
        @media (min-width: 580px) {
          .vitals-values-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .history-row-card {
          direction: ${isRTL ? "rtl" : "ltr"};
        }
      `}} />
    </div>
  );
}