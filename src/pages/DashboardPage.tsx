
import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import { HealthBarChart, type HealthChartSeries, type HealthChartThresholds } from "../components/charts/HealthBarChart";
import { fetchDashboard } from "../lib/api";
import { formatVitalTimestamp, getVitalLabel, getVitalNumericValue, getVitalUnit } from "../lib/health-data";
import { ManualReadingDialog } from "../components/ManualReadingDialog";
import { getStoredProfile, saveStoredProfile } from "../lib/profile-storage"; 
import type { BackendVital, VitalCardData } from "../types";

interface VitalCardProps extends VitalCardData {
  vitalType: string;
}

function formatChartTimeLabel(value: string) {
  return value.replace(/^0/, "");
}

function getDashboardThresholds(label: string): HealthChartThresholds | undefined {
  switch (label) {
    case "Heart Rate": case "Heart Rate · Today": case "معدل القلب": case "نبضات القلب":
      return { direction: "high", warning: 85, critical: 100 };
    case "Blood Oxygen": case "Blood Oxygen · Today": case "الأكسجين": case "أكسجين الدم":
      return { direction: "low", warning: 95, critical: 92 };
    case "Blood Pressure": case "Blood Pressure · Today": case "ضغط الدم":
      return { direction: "high", warning: 130, critical: 145 };
    case "Blood Glucose": case "Blood Glucose · Today": case "سكر الدم":
      return { direction: "high", warning: 120, critical: 150 };
    default:
      return undefined;
  }
}

function VitalCard({ label, value, unit, trend, trendDir, status, statusColor, statusBg, accentColor, chartData, linkTo, vitalType }: VitalCardProps) {
  const { colors, t } = useApp();
  const trendArrow = trendDir === "up" ? (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 9V3M3 6L6 3L9 6" stroke={statusColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ) : trendDir === "down" ? (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 3V9M3 6L6 9L9 6" stroke={statusColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 6H9" stroke={statusColor} strokeWidth="1.8" strokeLinecap="round" /></svg>
  );

  const latestReading = chartData[chartData.length - 1] ?? { time: "Now", fullTime: "Now", value: 0 };
  const chartSeries: Array<HealthChartSeries<(typeof chartData)[number]>> = [{
    key: "value", label, color: accentColor, latestColor: statusColor, warningColor: "#F59E0B", criticalColor: "#EF4444", thresholds: getDashboardThresholds(label),
  }];

  const translatedLabel = t(`vital_${vitalType === "blood_sugar" ? "glucose" : vitalType === "oxygen" ? "oxygen" : vitalType === "heart_rate" ? "hr" : "bp"}`) || label;
  const translatedStatus = t(`common_${status}`) || status;

  return (
    <Link to={linkTo} style={{ textDecoration: "none" }}>
      <div style={{ background: `linear-gradient(180deg, ${colors.cardBg} 0%, ${colors.pageBg} 150%)`, borderRadius: 24, padding: "18px", boxShadow: "0 2px 12px rgba(15,31,61,0.06)", display: "flex", flexDirection: "column", gap: 14, position: "relative", overflow: "hidden", cursor: "pointer", border: `1px solid ${colors.border}`, height: "100%" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at top right, ${accentColor}18 0%, transparent 40%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accentColor, borderRadius: "24px 24px 0 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, margin: "0 0 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{translatedLabel}</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: colors.textPrimary, letterSpacing: "-0.05em", lineHeight: 1 }}>{value}</span>
              <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600 }}>{unit}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 999, background: statusBg }}>
            {trendArrow}
            <span style={{ fontSize: 10, fontWeight: 800, color: statusColor, letterSpacing: "0.04em", textTransform: "uppercase" }}>{translatedStatus}</span>
          </div>
        </div>
        <div style={{ background: colors.cardBg, borderRadius: 18, padding: "12px 10px 12px", border: `1px solid ${colors.borderLight}`, minHeight: 124 }}>
          <HealthBarChart data={chartData} series={chartSeries} height={104} compact showYAxis={false} showGrid={false} barSize={14} tooltipLabel={translatedLabel} unit={unit} xAxisColor={colors.accentBlue} xTickFormatter={(tick) => formatChartTimeLabel(String(tick))} xInterval="preserveStartEnd" xMinTickGap={20} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600, lineHeight: 1.5 }}>{trend.replace("Latest reading on", t("vitals_readingHistory") === "سجل القراءات" ? "آخر قراءة في" : "Latest reading on")}</span>
          <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 700, flexShrink: 0 }}>{latestReading.fullTime}</span>
        </div>
      </div>
    </Link>
  );
}

function getTrendDirection(vital: BackendVital) { return vital.status === "critical" || vital.status === "elevated" ? "up" : "flat"; }

function buildVitalCard(vital: BackendVital, recentVitals: BackendVital[]): VitalCardData & { vitalType: string } {
  const scoped = recentVitals.filter((item) => item.type === vital.type).slice(0, 7).reverse().map((item, index) => {
    const timestamp = item.measured_at ? new Date(item.measured_at) : null;
    return { time: timestamp ? timestamp.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : `#${index + 1}`, fullTime: timestamp ? timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : `#${index + 1}`, value: getVitalNumericValue(item) };
  });
  const lastMeasured = formatVitalTimestamp(vital.measured_at);
  const statusColor = vital.status === "critical" ? "#DC2626" : vital.status === "elevated" ? "#B45309" : "#16A34A";
  const statusBg = vital.status === "critical" ? "#FEE2E2" : vital.status === "elevated" ? "#FEF3C7" : "#DCFCE7";
  const accentColor = vital.type === "blood_pressure" ? "#F59E0B" : vital.type === "heart_rate" ? "#EF4444" : vital.type === "oxygen" ? "#0DC9B1" : "#3B82F6";
  return { vitalType: vital.type, label: getVitalLabel(vital.type), value: vital.type === "blood_pressure" && vital.systolic !== null && vital.diastolic !== null ? `${vital.systolic}/${vital.diastolic}` : vital.value?.toString() || "0", unit: getVitalUnit(vital.type), trend: `Latest reading on ${lastMeasured}`, trendDir: getTrendDirection(vital), status: vital.status, statusColor, statusBg, accentColor, chartData: scoped.length ? scoped : [{ time: "Now", fullTime: "Now", value: getVitalNumericValue(vital) }], linkTo: vital.type === "blood_pressure" ? "/vitals/bp" : vital.type === "heart_rate" ? "/vitals/heart-rate" : vital.type === "oxygen" ? "/vitals/oxygen" : "/vitals/glucose" };
}

export function DashboardPage() {
  const { colors, t, language, profile } = useApp(); 
  const [currentVitals, setCurrentVitals] = React.useState<BackendVital[]>([]);
  const [recentVitals, setRecentVitals] = React.useState<BackendVital[]>([]);
  const [healthScore, setHealthScore] = React.useState<number | null>(null);
  const [healthMessage, setHealthMessage] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [userName, setUserName] = React.useState<string>(() => getStoredProfile().name?.trim().split(" ")[0] || "User");

  React.useEffect(() => {
    if (profile?.healthScore !== undefined && profile.healthScore !== null) {
      setHealthScore(profile.healthScore);
    }
  }, [profile]);

  const loadDashboard = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchDashboard();
      setCurrentVitals(response.current_vitals || []);
      setRecentVitals(response.recent_vitals || []);
      const score = response.analysis_preview?.health_score ?? response.latest_analysis?.health_score ?? null;
      const message = response.analysis_preview?.health_message || response.latest_analysis?.health_message || response.analysis_preview?.recommendation || "";
      setHealthScore(score);
      setHealthMessage(message);
      const currentProfile = getStoredProfile();
      setUserName(currentProfile.name?.trim().split(" ")[0] || "User");
      saveStoredProfile({ ...currentProfile, healthScore: score });
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReadingSaved = React.useCallback(async () => {
    setDialogOpen(false);
    await loadDashboard();
  }, [loadDashboard]);

  React.useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const vitalCards = currentVitals.map((vital) => buildVitalCard(vital, recentVitals));
  const displayScore = healthScore ?? 0;
  const isAR = language === "AR";
  const greetingText = isAR ? `صباح الخير، ${userName}` : `Good morning, ${userName}`;

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <ManualReadingDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSaved={handleReadingSaved} allowMulti={true} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: colors.textMuted, fontWeight: 500 }}>{new Date().toLocaleDateString(isAR ? "ar-EG" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          <h1 style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 800, color: colors.textPrimary, letterSpacing: "-0.03em" }}>{greetingText}</h1>
        </div>
        <Link to="/profile" style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #1A6BCC, #0DC9B1)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke="white" strokeWidth="1.6" /><path d="M3.5 17C3.5 13.96 6.46 11.5 10 11.5C13.54 11.5 16.5 13.96 16.5 17" stroke="white" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#0F2A5C", borderRadius: 20, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(13,201,177,0.12)" }} />
          <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} /><span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{t("dash_overallStatus")}</span></div>
            {isLoading ? <div style={{ height: 52, background: "rgba(255,255,255,0.1)", borderRadius: 12, width: "75%" }} /> : <p style={{ color: "white", fontSize: 18, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em", lineHeight: 1.4 }}>{healthMessage || (isAR ? "صحتك جيدة" : "Your health looks good")}</p>}
          </div>
          <div style={{ textAlign: "right", position: "relative", zIndex: 1, flexShrink: 0 }}>
            <div style={{ fontSize: 40, fontWeight: 900, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>{displayScore}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{t("dash_healthScore")}</div>
          </div>
        </div>
        <div style={{ background: colors.cardBg, borderRadius: 20, padding: "18px 20px", display: "flex", gap: 14, alignItems: "flex-start", border: `1.5px solid ${colors.border}`, boxShadow: "0 2px 8px rgba(15,31,61,0.04)" }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: colors.navActiveBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M9 1.5L10.5 7H16L11.5 10.5L13.5 16L9 12.5L4.5 16L6.5 10.5L2 7H7.5L9 1.5Z" stroke="#1A6BCC" strokeWidth="1.4" strokeLinejoin="round" /></svg></div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}><span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{t("dash_aiInsight")}</span><span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500 }}>{isAR ? "تجريبي" : "Supportive"}</span></div>
            <p style={{ fontSize: 14, color: colors.textSecondary, margin: "0 0 10px", lineHeight: 1.55 }}>{t("dash_aiInsightBody")}</p>
            <Link to="/ai-analysis" style={{ fontSize: 13, color: colors.accentBlue, fontWeight: 700, textDecoration: "none" }}>{t("dash_viewFullAnalysis")}</Link>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: colors.textPrimary, margin: 0, letterSpacing: "-0.01em" }}>{t("dash_vitalSigns")}</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>{vitalCards.map((card) => <VitalCard key={card.label} {...card} />)}</div>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: colors.textPrimary, margin: "0 0 14px", letterSpacing: "-0.01em" }}>{t("dash_quickActions")}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <button type="button" onClick={() => setDialogOpen(true)} style={{ flex: "1 1 140px", padding: "14px 10px", borderRadius: 14, background: "#EBF3FF", color: "#1A6BCC", fontSize: 14, fontWeight: 700, cursor: "pointer", border: "none", fontFamily: "inherit" }}>{isAR ? "تسجيل قراءة" : "Log Reading"}</button>
        {[
          { labelKey: "dash_viewHistory" as const, color: "#0DC9B1", bg: "#E6FAF8", path: "/history" },
          { labelKey: "dash_askAI" as const, color: "#8B5CF6", bg: "#EDE9FE", path: "/ai-analysis" },
          { labelKey: "dash_viewAlerts" as const, color: "#EF4444", bg: "#FEE2E2", path: "/alerts" },
        ].map((action) => (
          <Link key={action.path} to={action.path} style={{ flex: "1 1 140px", padding: "14px 10px", borderRadius: 14, background: action.bg, color: action.color, fontSize: 14, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>{t(action.labelKey)}</Link>
        ))}
      </div>
    </div>
  );
}