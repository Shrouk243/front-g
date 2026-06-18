
import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import { HealthBarChart } from "../../components/charts/HealthBarChart";
import { fetchVitals } from "../../lib/api";
import { formatVitalTimestamp, getVitalNumericValue } from "../../lib/health-data";
import { ManualReadingDialog } from "../../components/ManualReadingDialog";
import type { BackendVital } from "../../types";

export function VitalHeartRatePage() {
  const { colors, t, language } = useApp();
  const isAR = language === "AR";
  const [items, setItems] = React.useState<BackendVital[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const loadReadings = React.useCallback(async () => {
    const response = await fetchVitals("heart_rate");
    setItems(response.items);
  }, []);

  React.useEffect(() => {
    loadReadings().catch(() => undefined);
  }, [loadReadings]);

  const latest = items[0];

  const readings = items.slice(0, 8).reverse().map((item, index) => ({
    time: item.measured_at ? new Date(item.measured_at).toLocaleTimeString(isAR ? "ar-EG" : "en-US", { 
      hour: "2-digit", 
      minute: "2-digit" 
    }) : `#${index + 1}`,
    value: getVitalNumericValue(item),
  }));

  // استخراج القيمة الحالية عشان نعرض رسالة الخطأ التحذيرية لو القراءة من الداتابيز خيالية
  const currentVal = latest ? getVitalNumericValue(latest) : 0;

  return (
    <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto", direction: isAR ? "rtl" : "ltr" }}>
      <ManualReadingDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        onSaved={loadReadings} 
        initialType="heart_rate" 
        allowMulti={false} 
      />

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <Link to="/dashboard" style={{ 
          width: 42, 
          height: 42, 
          borderRadius: 12, 
          border: `1.5px solid ${colors.border}`, 
          background: colors.cardBg, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          textDecoration: "none",
          transform: isAR ? "rotate(180deg)" : "none" 
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 6L8 10L12 14" stroke={colors.textPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, margin: 0 }}>{t("vital_hr")}</h1>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: 0, fontWeight: 500 }}>{t("vitals_hrUnit")}</p>
        </div>
        <button 
          type="button" 
          onClick={() => setDialogOpen(true)} 
          style={{ 
            height: 42, 
            borderRadius: 10, 
            border: "none", 
            background: "#0F2A5C", 
            color: "white", 
            padding: "0 14px", 
            fontWeight: 700, 
            cursor: "pointer", 
            fontFamily: "inherit" 
          }}
        >
          {t("vitals_addReading")}
        </button>
      </div>

      {latest && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}>
            <div style={{ background: colors.cardBg, borderRadius: 24, padding: "24px", boxShadow: "0 4px 16px rgba(15,31,61,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M8 12C8 7.582 10.5 6 13 6C15.1 6 16.4 7 18 8.8C19.6 7 20.9 6 23 6C25.5 6 28 7.582 28 12C28 19 18 24 18 24C18 24 8 19 8 12Z" fill="#EF4444" /></svg>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 56, fontWeight: 900, color: colors.textPrimary, letterSpacing: "-0.04em", lineHeight: 1 }}>{currentVal}</span>
                    <span style={{ fontSize: 20, color: "#EF4444", fontWeight: 700 }}>bpm</span>
                  </div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: latest.status === "critical" ? "#FEE2E2" : latest.status === "elevated" ? "#FEF3C7" : "#DCFCE7",
                    borderRadius: 12, padding: "5px 12px", marginTop: 6,
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: latest.status === "critical" ? "#EF4444" : latest.status === "elevated" ? "#F59E0B" : "#22C55E" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: latest.status === "critical" ? "#DC2626" : latest.status === "elevated" ? "#B45309" : "#16A34A" }}>
                      {t(`common_${latest.status}`) || latest.status}
                    </span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>
                {isAR ? "آخر قراءة: " : "Latest reading: "} {formatVitalTimestamp(latest.measured_at)}
              </p>

              {/* 🚨 رسالة تحذيرية ذكية تظهر أسفل الكارت الرئيسي لو القراءة المسجلة غير منطقية */}
              {currentVal > 220 || currentVal < 30 ? (
                <div style={{ 
                  marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#991B1B", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>
                    {isAR 
                      ? "تنبيه: قياس نبضات القلب الحالي غير منطقي طبيّاً." 
                      : "Warning: The current heart rate reading is medically invalid."}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ background: `linear-gradient(180deg, ${colors.cardBg} 0%, ${colors.pageBg} 180%)`, borderRadius: 24, padding: "22px", boxShadow: "0 14px 32px rgba(2,6,23,0.14)", border: `1px solid ${colors.border}` }}>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: colors.textPrimary, display: "block" }}>{t("vitals_todaysReadings")}</span>
              <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600 }}>{isAR ? "أحدث قراءات نبضات القلب المستلمة" : "Latest backend heart-rate readings"}</span>
            </div>
            <div style={{ background: colors.cardBg, borderRadius: 20, padding: "16px 14px 10px", border: `1px solid ${colors.borderLight}` }}>
              <HealthBarChart
                data={readings}
                series={[{ key: "value", label: t("vital_hr"), color: "#FB7185", latestColor: "#EF4444", warningColor: "#F59E0B", criticalColor: "#DC2626", thresholds: { direction: "high", warning: 85, critical: 100 } }]}
                height={220}
                unit="bpm"
                yDomain={[40, 140]}
                // 👇 زيادة سُمك الأعمدة والمسافات حاجة بسيطة لتصبح واضحة ومقروءة ووسطية
                barSize={12}
                barGap={5}
                tooltipLabel={t("vitals_todaysReadings")}
                xAxisColor={colors.accentBlue}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}


