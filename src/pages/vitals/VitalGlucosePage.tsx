import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import { HealthBarChart } from "../../components/charts/HealthBarChart";
import { fetchVitals } from "../../lib/api";
import { getVitalNumericValue } from "../../lib/health-data";
import { ManualReadingDialog } from "../../components/ManualReadingDialog";
import type { BackendVital } from "../../types";

type GlucoseType = "fasting" | "random";

export function VitalGlucosePage() {
  const { colors, t, language } = useApp();
  const isAR = language === "AR";
  const [items, setItems] = React.useState<BackendVital[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [glucoseType, setGlucoseType] = React.useState<GlucoseType>("fasting");

  // دالة حساب الحالة المدمجة بدعم اللغة العربية ونوع الفحص (صائم / عشوائي)
  const getGlucoseStatus = (value: number, type: GlucoseType) => {
    if (type === "fasting") {
      if (value < 70)   return { label: t("common_critical" as any) || "Critical", color: "#DC2626", bg: "#FEE2E2" };
      if (value <= 99)  return { label: t("common_normal" as any) || "Normal", color: "#16A34A", bg: "#DCFCE7" };
      if (value <= 125) return { label: isAR ? "مرحلة ما قبل السكري" : "Pre-Diabetic", color: "#B45309", bg: "#FEF3C7" };
      return                   { label: t("common_critical" as any) || "High", color: "#DC2626", bg: "#FEE2E2" };
    }
    // للحالة العشوائية (Random)
    if (value < 70)  return { label: t("common_critical" as any) || "Critical", color: "#DC2626", bg: "#FEE2E2" };
    if (value < 140) return { label: t("common_normal" as any) || "Normal", color: "#16A34A", bg: "#DCFCE7" };
    if (value < 200) return { label: t("common_elevated" as any) || "Elevated", color: "#B45309", bg: "#FEF3C7" };
    return                   { label: isAR ? "مرتفع جداً" : "Very High", color: "#DC2626", bg: "#FEE2E2" };
  };

  const loadReadings = React.useCallback(async () => {
    const response = await fetchVitals("blood_sugar");
    setItems(response.items || []);
  }, []);

  React.useEffect(() => {
    loadReadings().catch(() => undefined);
  }, [loadReadings]);

  const latest = items[0];
  
  const readings = items.slice(0, 8).reverse().map((item: any, index) => {
    let formattedTime = `#${index + 1}`;
    if (item && (item.measured_at || item.created_at || item.date)) {
      const dateValue = item.measured_at || item.created_at || item.date;
      formattedTime = new Date(dateValue).toLocaleTimeString(isAR ? "ar-EG" : "en-US", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    }
    return {
      time: formattedTime,
      value: getVitalNumericValue(item),
    };
  });

  const log = items.slice(0, 5);

  const formatLatestDate = (item: any) => {
    if (!item) return "";
    const dateValue = item.measured_at || item.created_at || item.date;
    if (!dateValue) return "";
    return new Date(dateValue).toLocaleString(isAR ? "ar-EG" : "en-US", {
      month: "short", 
      day: "numeric", 
      hour: "2-digit", 
      minute: "2-digit"
    });
  };

  return (
    <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto", direction: isAR ? "rtl" : "ltr" }}>
      <ManualReadingDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        onSaved={loadReadings} 
        initialType="blood_sugar" 
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, margin: 0 }}>{t("vital_glucose")}</h1>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: 0, fontWeight: 500 }}>{t("vitals_glucoseUnit")}</p>
        </div>
        <button type="button" onClick={() => setDialogOpen(true)} style={{ height: 42, borderRadius: 10, border: "none", background: "#0F2A5C", color: "white", padding: "0 14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          {t("vitals_addReading")}
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 4, width: "fit-content" }}>
        {(["fasting", "random"] as GlucoseType[]).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setGlucoseType(opt)}
            style={{
              height: 34, borderRadius: 9, border: "none", padding: "0 16px",
              background: glucoseType === opt ? "#0F2A5C" : "transparent",
              color: glucoseType === opt ? "white" : colors.textMuted,
              fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13,
              transition: "all 0.15s",
            }}
          >
            {opt === "fasting" ? (isAR ? "صائم" : "Fasting") : (isAR ? "عشوائي" : "Random")}
          </button>
        ))}
      </div>

      {latest && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}>
            <div style={{ background: colors.cardBg, borderRadius: 24, padding: "24px", boxShadow: "0 4px 16px rgba(15,31,61,0.08)" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none"><path d="M15 5C15 5 7 14 7 19C7 23.42 10.58 27 15 27C19.42 27 23 23.42 23 19C23 14 15 5 15 5Z" fill="#3B82F6" opacity="0.25" /></svg>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 52, fontWeight: 900, color: colors.textPrimary, letterSpacing: "-0.04em", lineHeight: 1 }}>{getVitalNumericValue(latest)}</span>
                    <span style={{ fontSize: 16, color: "#3B82F6", fontWeight: 700 }}>mg/dL</span>
                  </div>
                  {(() => {
                    const st = getGlucoseStatus(getVitalNumericValue(latest), glucoseType);
                    return (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: st.bg, borderRadius: 10, padding: "4px 12px" }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: st.color }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: st.color }}>{st.label}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <p style={{ fontSize: 12, color: colors.textMuted, margin: "0 0 8px" }}>
                {isAR ? "آخر قراءة: " : "Latest reading: "} {formatLatestDate(latest)}
              </p>
              <div style={{ background: colors.pageBg, border: `1px solid ${colors.borderLight}`, borderRadius: 8, padding: "6px 10px" }}>
                <p style={{ fontSize: 11, color: colors.textMuted, margin: 0, fontWeight: 600 }}>
                  {glucoseType === "fasting"
                    ? (isAR ? "التشخيص كـ صائم · الطبيعي: 70–99 mg/dL" : "Interpreted as Fasting · Normal: 70–99 mg/dL")
                    : (isAR ? "التشخيص كـ عشوائي · الطبيعي: < 140 mg/dL" : "Interpreted as Random · Normal: < 140 mg/dL")}
                </p>
              </div>
            </div>
          </div>

          <div style={{ background: `linear-gradient(180deg, ${colors.cardBg} 0%, ${colors.pageBg} 180%)`, borderRadius: 24, padding: "22px", marginBottom: 16, boxShadow: "0 14px 32px rgba(2,6,23,0.14)", border: `1px solid ${colors.border}` }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: colors.textPrimary, display: "block", marginBottom: 4 }}>{t("vitals_todaysPattern")}</span>
              <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600 }}>
                {isAR ? "أحدث قراءات سكر الدم المستلمة من السيرفر" : "Most recent backend glucose readings"}
              </span>
            </div>
            <div style={{ background: colors.cardBg, borderRadius: 20, padding: "12px 14px 8px", border: `1px solid ${colors.borderLight}` }}>
              <HealthBarChart
                data={readings}
                series={[{
                  key: "value", label: t("vital_glucose"),
                  color: "#3B82F6", latestColor: "#0EA5E9",
                  warningColor: "#F59E0B", criticalColor: "#EF4444",
                  thresholds: glucoseType === "fasting"
                    ? { direction: "high", warning: 100, critical: 126 }
                    : { direction: "high", warning: 140, critical: 200 },
                }]}
                height={130}
                compact={true}
                barSize={16}
                unit="mg/dL"
                yDomain={[60, 220]}
                tooltipLabel={t("vitals_todaysPattern")}
                xAxisColor={colors.accentBlue}
              />
            </div>
          </div>

          <h2 style={{ fontSize: 12, fontWeight: 700, color: colors.textMuted, margin: "0 0 10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t("vitals_todaysLog")}</h2>
          <div style={{ background: colors.cardBg, borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 8px rgba(15,31,61,0.06)" }}>
            {log.map((entry, index) => {
              const numericValue = getVitalNumericValue(entry);
              const st = getGlucoseStatus(numericValue, glucoseType);
              return (
                <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 18px", borderBottom: index < log.length - 1 ? `1px solid ${colors.borderLight}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: st.color }} />
                    <span style={{ fontSize: 14, color: colors.textPrimary, fontWeight: 600 }}>{formatLatestDate(entry)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 17, fontWeight: 800, color: colors.textPrimary }}>{numericValue}<span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500, [isAR ? "marginRight" : "marginLeft"]: 3 }}>mg/dL</span></span>
                    <div style={{ padding: "4px 10px", borderRadius: 6, background: st.bg }}><span style={{ fontSize: 12, fontWeight: 700, color: st.color }}>{st.label}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}