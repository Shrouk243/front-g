

import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import { HealthBarChart } from "../../components/charts/HealthBarChart";
import { fetchVitals } from "../../lib/api";
import { getVitalNumericValue } from "../../lib/health-data";
import { ManualReadingDialog } from "../../components/ManualReadingDialog";
import type { BackendVital } from "../../types";

export function VitalOxygenPage() {
  const { colors, t, language } = useApp();
  const isAR = language === "AR";
  const [items, setItems] = React.useState<BackendVital[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const loadReadings = React.useCallback(async () => {
    const response = await fetchVitals("oxygen");
    setItems(response.items);
  }, []);

  React.useEffect(() => {
    loadReadings().catch(() => undefined);
  }, [loadReadings]);

  const latest = items[0];

  const readings = items.slice(0, 8).reverse().map((item, index) => {
    let formattedTime = `#${index + 1}`;
    if (item.measured_at) {
      formattedTime = new Date(item.measured_at).toLocaleTimeString(isAR ? "ar-EG" : "en-US", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    }
    return {
      time: formattedTime,
      value: getVitalNumericValue(item),
    };
  });

  const formatLatestDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    const dateObj = new Date(dateString);
    return dateObj.toLocaleString(isAR ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // ديناميكية لتحديد حالة القراءة ولونها بناءً على الأكسجين
  const getStatusDetails = (value: number) => {
    if (value >= 95) return { text: "Normal", color: "#0DC9B1", bg: "#E6FBF8" };
    if (value >= 92) return { text: "Warning", color: "#F59E0B", bg: "#FEF3C7" };
    return { text: "Critical", color: "#EF4444", bg: "#FEE2E2" };
  };

  const status = latest ? getStatusDetails(latest.value) : { text: "Normal", color: "#0DC9B1", bg: "#E6FBF8" };

  return (
    <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto", direction: isAR ? "rtl" : "ltr" }}>
      <ManualReadingDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        onSaved={loadReadings} 
        initialType="oxygen" 
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, margin: 0 }}>{t("vital_oxygen")}</h1>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: 0, fontWeight: 500 }}>{t("vitals_oxygenUnit") || "%"}</p>
        </div>
        <button type="button" onClick={() => setDialogOpen(true)} style={{ height: 42, borderRadius: 10, border: "none", background: "#0F2A5C", color: "white", padding: "0 14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          {t("vitals_addReading")}
        </button>
      </div>

      {latest && (
        <>
          {/* كارت عرض القراءة الحالية بتعديل الـ Layout الجديد الأفقي الموحد */}
          <div style={{ background: colors.cardBg, borderRadius: 24, padding: "24px", boxShadow: "0 4px 16px rgba(15,31,61,0.05)", border: `1px solid ${colors.borderLight}`, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 14 }}>
              {/* أيقونة الأكسجين الطبية الدائرية على اليسار */}
              <div style={{ width: 64, height: 64, borderRadius: 18, background: "#EBFBFA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C7.5 2 4 6.5 4 11C4 16.5 12 22 12 22C12 22 20 16.5 20 11C20 6.5 16.5 2 12 2Z" stroke="#0DC9B1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 7V13M9 10H15" stroke="#0DC9B1" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>

              {/* الرقم والوحدة والحالة ترتدي ستايل الفلكس الأفقي */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, lineHeight: 1 }}>
                  <span style={{ fontSize: 48, fontWeight: 800, color: colors.textPrimary, letterSpacing: "-0.02em" }}>
                    {latest.value}
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#0DC9B1" }}>%</span>
                </div>
                
                {/* شارة الحالة الملونة ديناميكياً */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: status.bg, color: status.color, padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700, marginTop: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: status.color }} />
                  {isAR ? (status.text === "Normal" ? "طبيعي" : status.text === "Warning" ? "تحذير" : "حرج") : status.text}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 12, color: colors.textMuted, margin: 0, borderTop: `1px solid ${colors.borderLight}`, paddingTop: 12, fontWeight: 500 }}>
              {isAR ? "آخر قراءة تم تسجيلها: " : "Latest reading: "} {formatLatestDate(latest.measured_at)}
            </p>
          </div>

          {/* شارت قراءات اليوم المصغر والمعدل */}
          <div style={{ background: `linear-gradient(180deg, ${colors.cardBg} 0%, ${colors.pageBg} 180%)`, borderRadius: 24, padding: "22px", marginBottom: 14, boxShadow: "0 14px 32px rgba(2,6,23,0.14)", border: `1px solid ${colors.border}` }}>
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: colors.textPrimary, display: "block", marginBottom: 4 }}>{t("vitals_todaysReadings")}</span>
              <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600 }}>
                {isAR ? "أحدث قراءات نسبة الأكسجين المسجلة" : "Latest backend oxygen readings"}
              </span>
            </div>
            <div style={{ background: colors.cardBg, borderRadius: 20, padding: "12px 14px 8px", border: `1px solid ${colors.borderLight}` }}>
              <HealthBarChart
                data={readings}
                series={[{ key: "value", label: t("vital_oxygen"), color: "#2DD4BF", latestColor: "#14B8A6", warningColor: "#F59E0B", criticalColor: "#EF4444", thresholds: { direction: "low", warning: 95, critical: 92 } }]}
                height={130}
                compact={true}
                barSize={16}
                unit="%"
                yDomain={[85, 100]}
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