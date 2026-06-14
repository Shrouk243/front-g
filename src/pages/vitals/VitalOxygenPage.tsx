
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 16 }}>
            <div style={{ background: colors.cardBg, borderRadius: 24, padding: "28px", boxShadow: "0 4px 16px rgba(15,31,61,0.08)", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ position: "relative", width: 160, height: 160, marginBottom: 16 }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="68" fill="none" stroke={colors.borderLight} strokeWidth="14" />
                  <circle cx="80" cy="80" r="68" fill="none" stroke="#0DC9B1" strokeWidth="14" strokeDasharray={`${Math.max(getVitalNumericValue(latest), 0) / 100 * 2 * Math.PI * 68} ${2 * Math.PI * 68}`} strokeLinecap="round" transform="rotate(-90 80 80)" />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 44, fontWeight: 900, color: colors.textPrimary, letterSpacing: "-0.03em", lineHeight: 1 }}>{latest.value}</span>
                  <span style={{ fontSize: 18, color: "#0DC9B1", fontWeight: 700 }}>%</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: colors.textMuted, margin: 0 }}>
                {isAR ? "آخر قراءة: " : "Latest reading: "} {formatLatestDate(latest.measured_at)}
              </p>
            </div>
          </div>

          <div style={{ background: `linear-gradient(180deg, ${colors.cardBg} 0%, ${colors.pageBg} 180%)`, borderRadius: 24, padding: "22px", marginBottom: 14, boxShadow: "0 14px 32px rgba(2,6,23,0.14)", border: `1px solid ${colors.border}` }}>
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: colors.textPrimary, display: "block", marginBottom: 4 }}>{t("vitals_todaysReadings")}</span>
              <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600 }}>
                {isAR ? "أحدث قراءات نسبة الأكسجين المسجلة" : "Latest backend oxygen readings"}
              </span>
            </div>
            <div style={{ background: colors.cardBg, borderRadius: 20, padding: "16px 14px 10px", border: `1px solid ${colors.borderLight}` }}>
              <HealthBarChart
                data={readings}
                series={[{ key: "value", label: t("vital_oxygen"), color: "#2DD4BF", latestColor: "#14B8A6", warningColor: "#F59E0B", criticalColor: "#EF4444", thresholds: { direction: "low", warning: 95, critical: 92 } }]}
                height={220}
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