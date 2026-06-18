
import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import { HealthBarChart } from "../../components/charts/HealthBarChart";
import { fetchVitals } from "../../lib/api";
import { formatVitalTimestamp } from "../../lib/health-data";
import { ManualReadingDialog } from "../../components/ManualReadingDialog";
import type { BackendVital } from "../../types";

type StatusKey = "normal" | "elevated" | "critical";

/**
 * دالة طبية للتحقق من منطقية القراءات وتحديد حالة ضغط الدم ديناميكياً
 * تمنع الأرقام الخيالية العالية جداً أو المنخفضة جداً الناتجة عن أخطاء الإدخال
 */
function calculateBPStatus(systolic: number | undefined, diastolic: number | undefined): StatusKey {
  const sys = systolic ?? 0;
  const dia = diastolic ?? 0;

  // 1. الحماية من الأرقام الخيالية (Upper & Lower Limits Validation)
  if (sys > 250 || sys < 40 || dia > 150 || dia < 30) {
    return "critical"; // التعامل مع القراءات الشاذة جداً كحالة حرجة تستدعي الفحص
  }

  // 2. النطاق الحرج (Critical Flow)
  if (sys >= 140 || dia >= 90) {
    return "critical";
  }

  // 3. النطاق المرتفع / النص نص (Elevated Flow)
  if ((sys >= 120 && sys < 140) || (dia >= 80 && dia < 90)) {
    return "elevated";
  }

  // 4. النطاق الطبيعي المستقر (Normal Flow)
  return "normal";
}

export function VitalBPPage() {
  const { colors, t, language } = useApp();
  const isAR = language === "AR";
  const [items, setItems] = React.useState<BackendVital[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const loadReadings = React.useCallback(async () => {
    const response = await fetchVitals("blood_pressure");
    setItems(response.items);
  }, []);

  React.useEffect(() => {
    loadReadings().catch(() => undefined);
  }, [loadReadings]);

  const latest = items[0];
  const readings = items.slice(0, 8).reverse().map((item, index) => ({
    time: item.measured_at ? new Date(item.measured_at).toLocaleTimeString(isAR ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" }) : `#${index + 1}`,
    sys: item.systolic ?? 0,
    dia: item.diastolic ?? 0,
  }));
  const log = items.slice(0, 5);

  const statusStyle: Record<StatusKey, { color: string; bg: string; label: string }> = {
    normal: { color: "#16A34A", bg: "#DCFCE7", label: t("common_normal") },
    elevated: { color: "#B45309", bg: "#FEF3C7", label: t("common_elevated") },
    critical: { color: "#DC2626", bg: "#FEE2E2", label: t("common_critical") },
  };

  return (
    <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto", direction: isAR ? "rtl" : "ltr" }}>
      <ManualReadingDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        onSaved={loadReadings} 
        initialType="blood_pressure" 
        allowMulti={false} 
      />

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <Link to="/dashboard" style={{ 
          width: 42, height: 42, borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.cardBg, 
          display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none",
          transform: isAR ? "rotate(180deg)" : "none"
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 6L8 10L12 14" stroke={colors.textPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, margin: 0 }}>{t("vital_bp")}</h1>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: 0, fontWeight: 500 }}>{t("vitals_bpUnit")}</p>
        </div>
        <button type="button" onClick={() => setDialogOpen(true)} style={{ height: 42, borderRadius: 10, border: "none", background: "#0F2A5C", color: "white", padding: "0 14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          {t("vitals_addReading")}
        </button>
      </div>

      {latest && (() => {
        // حساب الحالة ديناميكياً للـ Latest Reading بناءً على التعديلات الطبية الجديدة
        const currentStatus = calculateBPStatus(latest.systolic, latest.diastolic);
        const s = statusStyle[currentStatus];

        return (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}>
              <div style={{ background: colors.cardBg, borderRadius: 24, padding: "24px", boxShadow: "0 4px 16px rgba(15,31,61,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                      <path d="M15 8V13.5L18 15.5" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6 20L4 26H26L24 20" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 52, fontWeight: 900, color: colors.textPrimary, letterSpacing: "-0.04em", lineHeight: 1 }}>{latest.systolic}</span>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#F59E0B" }}>SYS</span>
                        <div style={{ width: 20, height: 1.5, background: colors.textMuted, margin: "4px 0" }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#1A6BCC" }}>DIA {latest.diastolic}</span>
                      </div>
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: s.bg, borderRadius: 10, padding: "5px 12px" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.label}</span>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>
                  {isAR ? "آخر قراءة: " : "Latest reading: "} {formatVitalTimestamp(latest.measured_at)}
                </p>
              </div>
            </div>

            <div style={{ background: `linear-gradient(180deg, ${colors.cardBg} 0%, ${colors.pageBg} 180%)`, borderRadius: 24, padding: "22px", marginBottom: 16, boxShadow: "0 14px 32px rgba(2,6,23,0.14)", border: `1px solid ${colors.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: colors.textPrimary, display: "block" }}>{t("vitals_todaysTrend")}</span>
                  <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600 }}>
                      {isAR ? "أحدث قراءات ضغط الدم" : "Latest backend readings for systolic and diastolic values"}
                  </span>
                </div>
              </div>
              <div style={{ background: colors.cardBg, borderRadius: 20, padding: "16px 14px 10px", border: `1px solid ${colors.borderLight}` }}>
                <HealthBarChart
                  data={readings}
                  series={[
                    { key: "sys", label: t("history_systolic"), color: "#F59E0B", latestColor: "#FB923C", warningColor: "#F97316", criticalColor: "#EF4444", thresholds: { direction: "high", warning: 120, critical: 140 } },
                    { key: "dia", label: t("history_diastolic"), color: "#38BDF8", latestColor: "#1D4ED8", warningColor: "#F59E0B", criticalColor: "#EF4444", thresholds: { direction: "high", warning: 80, critical: 90 } },
                  ]}
                  height={230}
                  unit="mmHg"
                  yDomain={[60, 190]}
                  barSize={14}
                  barGap={6}
                  tooltipLabel={t("vitals_todaysTrend")}
                  xAxisColor={colors.accentBlue}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color: colors.textMuted, margin: "10px 0 0", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t("vitals_todaysLog")}</h2>
              <div style={{ background: colors.cardBg, borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 8px rgba(15,31,61,0.06)" }}>
                {log.map((entry, index) => {
                  // حساب حالة كل سطر في الجدول ديناميكياً لتحديث ألوان السجل القديم
                  const entryStatus = calculateBPStatus(entry.systolic, entry.diastolic);
                  const sLog = statusStyle[entryStatus];
                  return (
                    <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: index < log.length - 1 ? `1px solid ${colors.borderLight}` : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: sLog.color }} />
                        <span style={{ fontSize: 14, color: colors.textPrimary, fontWeight: 600 }}>{formatVitalTimestamp(entry.measured_at)}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div>
                          <span style={{ fontSize: 17, fontWeight: 800, color: "#F59E0B" }}>{entry.systolic}</span>
                          <span style={{ fontSize: 14, color: colors.textMuted, fontWeight: 500, margin: "0 4px" }}>/</span>
                          <span style={{ fontSize: 17, fontWeight: 800, color: "#1A6BCC" }}>{entry.diastolic}</span>
                          <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4 }}>mmHg</span>
                        </div>
                        <div style={{ padding: "4px 10px", borderRadius: 6, background: sLog.bg }}><span style={{ fontSize: 12, fontWeight: 700, color: sLog.color }}>{sLog.label}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}