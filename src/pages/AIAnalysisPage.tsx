

import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { getStoredProfile } from "../lib/profile-storage"; 
import type { AnalysisCard } from "../types";

export function AIAnalysisPage() {
  const { colors, t } = useApp();
  
  const [userScore, setUserScore] = useState<number>(0);

  useEffect(() => {
    try {
      const profile = getStoredProfile();
      if (profile && typeof profile.healthScore === "number") {
        setUserScore(profile.healthScore); 
      }
    } catch (error) {
      console.error("Error reading profile data:", error);
    }
  }, []);

  const analysisCards: AnalysisCard[] = [
    {
      title: "Cardiovascular Risk",
      level: "Moderate",
      levelColor: "#F59E0B",
      levelBg: "#FEF3C7",
      pct: 55,
      pctColor: "#F59E0B",
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M5 8C5 5.24 6.5 4 8 4C9.3 4 10.2 4.7 11 5.8C11.8 4.7 12.7 4 14 4C15.5 4 17 5.24 17 8C17 12.5 11 16 11 16C11 16 5 12.5 5 8Z" fill="#F59E0B" opacity="0.8" />
          <path d="M3.5 10H6.5L8.5 7L10.5 13L12.5 9L14 10H18.5" stroke="#F59E0B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      insights: ["BP readings elevated 40% of this week", "Heart rate variability is good", "Consider daily 20-min walks"],
    },
    {
      title: "Metabolic Health",
      level: "Stable",
      levelColor: "#22C55E",
      levelBg: "#DCFCE7",
      pct: userScore, 
      pctColor: "#22C55E",
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="7" stroke="#22C55E" strokeWidth="1.6" />
          <path d="M8 11H11V8" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 13.5L11 11" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
      insights: ["Blood glucose within target range", "HbA1c estimated at 6.8% (good)", "Morning readings most stable"],
    },
    {
      title: "Respiratory Status",
      level: "Excellent",
      levelColor: "#0DC9B1",
      levelBg: "#E6FAF8",
      pct: 96,
      pctColor: "#0DC9B1",
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 4V11M11 4C11 4 8 3 6.5 5C5 7 6 10 8 10.5M11 4C11 4 14 3 15.5 5C17 7 16 10 14 10.5" stroke="#0DC9B1" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M8 10.5C8 10.5 6 11 5.5 13C5 15 6.5 17 8.5 17C9.5 17 10.5 16.5 11 16M14 10.5C14 10.5 16 11 16.5 13C17 15 15.5 17 13.5 17C12.5 17 11.5 16.5 11 16" stroke="#0DC9B1" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
      insights: ["SpO₂ consistently above 96%", "No concerning patterns detected", "Breathing quality is excellent"],
    },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
      {/* الـ Header */}
      <div style={{
        background: "linear-gradient(160deg, #0F2A5C 0%, #1A6BCC 100%)",
        borderRadius: 24,
        padding: "28px",
        marginBottom: 24,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -30, right: -20, width: 160, height: 160, borderRadius: "50%", background: "rgba(13,201,177,0.2)" }} />
        <div style={{ position: "absolute", bottom: -40, left: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ color: "white", fontSize: 26, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{t("ai_title")}</h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, margin: 0, fontWeight: 500 }}>{t("ai_subtitle")}</p>
          </div>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L13.5 8.5H20L14.5 12.5L16.5 19L12 15.5L7.5 19L9.5 12.5L4 8.5H10.5L12 2Z" fill="white" opacity="0.7" />
              <circle cx="12" cy="12" r="2.5" fill="white" />
            </svg>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginBottom: 24 }}>
        {/* كارت الـ Score الرئيسي */}
        <div style={{
          background: colors.cardBg,
          borderRadius: 20,
          padding: "24px",
          boxShadow: "0 4px 16px rgba(15,31,61,0.08)",
          display: "flex",
          gap: 20,
          alignItems: "center",
          flexWrap: "wrap",
          transition: "background 0.3s ease",
        }}>
          <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
            <svg width="96" height="96" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="38" fill="none" stroke={colors.borderLight} strokeWidth="10" />
              {/* رسمة الدائرة بتتحرك ديناميكياً مع الـ userScore */}
              <circle cx="44" cy="44" r="38" fill="none" stroke="#1A6BCC" strokeWidth="10"
                strokeDasharray={`${(userScore / 100) * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
                strokeDashoffset={2 * Math.PI * 38 * 0.25}
                strokeLinecap="round"
                transform="rotate(-90 44 44)" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: colors.textPrimary }}>{userScore}</span>
              <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500 }}>/100</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.textPrimary, margin: "0 0 8px" }}>{t("ai_scoreLabel")}</h2>
            <p style={{ fontSize: 14, color: colors.textSecondary, margin: "0 0 14px", lineHeight: 1.55 }}>
              {t("ai_scoreDesc")}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ padding: "5px 12px", borderRadius: 8, background: "#FEF3C7", fontSize: 12, fontWeight: 700, color: "#B45309" }}>{t("ai_needsAttention")}</div>
              <div style={{ padding: "5px 12px", borderRadius: 8, background: "#DCFCE7", fontSize: 12, fontWeight: 700, color: "#16A34A" }}>{t("ai_improving")}</div>
            </div>
          </div>
        </div>

        {/* كارت الـ Recommendation */}
        <div style={{
          background: "linear-gradient(135deg, #0F2A5C 0%, #1A6BCC 100%)",
          borderRadius: 20,
          padding: "22px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(13,201,177,0.2)" }} />
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600, margin: "0 0 8px", letterSpacing: "0.05em", textTransform: "uppercase", position: "relative", zIndex: 1 }}>{t("ai_topRec")}</p>
          <p style={{ color: "white", fontSize: 16, fontWeight: 700, margin: "0 0 6px", position: "relative", zIndex: 1 }}>{t("ai_recTitle")}</p>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, margin: 0, lineHeight: 1.55, position: "relative", zIndex: 1 }}>
            {t("ai_recBody")}
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: 14, fontWeight: 700, color: colors.textMuted, margin: "0 0 14px", letterSpacing: "0.05em", textTransform: "uppercase" }}>{t("ai_detailedAnalysis")}</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 24 }}>
        {analysisCards.map((card, i) => (
          <div key={i} style={{
            background: colors.cardBg,
            borderRadius: 18,
            padding: "20px",
            boxShadow: "0 2px 8px rgba(15,31,61,0.06)",
            transition: "background 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: card.levelBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {card.icon}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>{card.title}</p>
                  <div style={{ display: "inline-block", padding: "2px 8px", borderRadius: 6, background: card.levelBg, marginTop: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: card.levelColor }}>{card.level}</span>
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 26, fontWeight: 800, color: card.levelColor }}>{card.pct}%</span>
            </div>

            <div style={{ height: 6, background: colors.borderLight, borderRadius: 3, marginBottom: 14, overflow: "hidden" }}>
              <div style={{ width: `${card.pct}%`, height: "100%", background: card.pctColor, borderRadius: 3 }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {card.insights.map((insight, ii) => (
                <div key={ii} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: card.pctColor, marginTop: 5, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: colors.textSecondary, fontWeight: 500, lineHeight: 1.55 }}>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.6, textAlign: "center", padding: "0 24px" }}>
        {t("ai_disclaimer")}
      </p>
    </div>
  );
}






















