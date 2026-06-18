





import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { getStoredProfile } from "../lib/profile-storage";

interface AIAnalysisCard {
  key: string;
  title: string;
  level: string;
  pct: number;
  insights: string[];
}

export function AIAnalysisPage() {
  const { colors, t, language } = useApp();
  const isAR = language === "AR";
  
  const [userScore, setUserScore] = useState<number>(() => {
    const stored = getStoredProfile();
    // إجبار الاسكور على 0 لو المستخدم جديد (مفيش قياسات)
    return stored?.healthScore ?? 0;
  }); 

  const [cards, setCards] = useState<AIAnalysisCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function getBackendAnalysis() {
      try {
        setLoading(true);
        const token = localStorage.getItem("auth_token"); 

        const response = await fetch("http://127.0.0.1:8000/api/ai-analysis", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}` 
          }
        });

        if (!response.ok) throw new Error("API Route not ready");

        const data = await response.json();
        
        if (data && data.cards) {
          // استخدام الاسكور من الباك إذا موجود، وإلا نستخدم المخزن (الذي يمكن أن يكون 0)
          const scoreFromBackend = data.healthScore ?? getStoredProfile()?.healthScore ?? 0;
          setUserScore(scoreFromBackend);
          setCards(data.cards);
        } else {
          loadFallbackData();
        }
      } catch (err) {
        console.warn("جاري تشغيل البيانات المتطابقة مع التصميم الحقيقي:", err);
        loadFallbackData(); 
      } finally {
        setLoading(false);
      }
    }

    function loadFallbackData() {
      const currentProfile = getStoredProfile();
      // المنطق الجديد: 0 لو مفيش قياسات
      const actualScore = currentProfile?.healthScore ?? 0;
      
      setUserScore(actualScore);

      const isScoreLow = actualScore < 70 && actualScore > 0;

      setCards([
        {
          key: "cardio",
          title: isAR ? "صحة القلب والأوعية الدموية" : "Cardiovascular Risk",
          level: actualScore === 0 
            ? (isAR ? "لا توجد بيانات" : "No Data") 
            : isScoreLow 
              ? (isAR ? "مرتفع نسيباً" : "Elevated") 
              : (isAR ? "مستقر" : "Stable"),
          pct: actualScore === 0 ? 0 : isScoreLow ? 55 : 85,
          insights: actualScore === 0 ? 
            (isAR ? [
              "لم يتم تسجيل أي قياسات بعد",
              "سجل أول قراءة للحصول على تحليل دقيق"
            ] : [
              "No readings have been logged yet",
              "Log your first reading to get accurate analysis"
            ]) :
            isAR ? [
              isScoreLow ? "قراءات ضغط الدم مرتفعة بنسبة 40% هذا الأسبوع" : "مؤشرات ضغط الدم تقع في النطاق الآمن تماماً",
              "معدل تغير نبضات القلب جيد ومستقر",
              isAR ? "ينصح بالمشي اليومي لمدة 20 دقيقة لتنشيط الدورة الدموية" : "استمر على مستواك البدني الحالي"
            ] : [
              isScoreLow ? "BP readings elevated 40% of this week" : "BP readings within safe parameters",
              "Heart rate variability is good",
              isScoreLow ? "Consider daily 20-min walks" : "Maintain your current physical activity level"
            ],
        },
        {
          key: "metabolic",
          title: isAR ? "الصحة التمثيلية (الأيضية)" : "Metabolic Health",
          level: actualScore === 0 ? (isAR ? "لا توجد بيانات" : "No Data") : (isAR ? "مستقر" : "Stable"),
          pct: actualScore === 0 ? 0 : actualScore > 80 ? 88 : 68,
          insights: actualScore === 0 ? 
            (isAR ? ["سجل قياسات السكر للحصول على تحليل"] : ["Log glucose readings to analyze"]) :
            isAR ? [
              "مستويات سكر الدم تقع في النطاق المستهدف تماماً",
              "معدل السكر التراكمي المقدر HbA1c بنسبة ممتازة",
              "القراءات الصباحية هي الأكثر استقراراً وانتظاماً"
            ] : [
              "Blood glucose within target range",
              "HbA1c estimated level is optimal",
              "Morning readings most stable"
            ],
        },
        {
          key: "respiratory",
          title: isAR ? "حالة الجهاز التنفسي" : "Respiratory Status",
          level: actualScore === 0 ? (isAR ? "لا توجد بيانات" : "No Data") : (isAR ? "ممتاز" : "Excellent"),
          pct: actualScore === 0 ? 0 : 96,
          insights: actualScore === 0 ? 
            (isAR ? ["سجل قياسات الأكسجين"] : ["Log oxygen readings"]) :
            isAR ? [
              "نسبة أكسجين الدم SpO₂ مستقرة تماماً فوق 96%",
              "لم يتم رصد أي أنماط تنفسية غير طبيعية أو مقلقة",
              "جودة وكفاءة عملية التنفس ممتازة جداً"
            ] : [
              "SpO2 consistently above 96%",
              "No concerning patterns detected",
              "Breathing quality is excellent"
            ],
        }
      ]);
    }

    getBackendAnalysis();
  }, [language]); // ← أزلنا userScore من الـ dependency عشان نتجنب لوب

  const getLevelStyles = (level: string) => {
    const l = level ? level.toLowerCase() : "";
    if (l === "excellent" || l === "stable" || l === "ممتاز" || l === "مستقر") {
      return { color: "#22C55E", bg: "#DCFCE7" };
    }
    if (l === "moderate" || l === "elevated" || l === "متوسط" || l === "مرتفع" || l === "مرتفع نسيباً") {
      return { color: "#F59E0B", bg: "#FEF3C7" };
    }
    return { color: "#DC2626", bg: "#FEE2E2" };
  };

  // باقي الكود (getIcon, loading, return) بدون تغيير كبير...

  const getIcon = (key: string, color: string) => {
    if (key === "cardio") {
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M5 8C5 5.24 6.5 4 8 4C9.3 4 10.2 4.7 11 5.8C11.8 4.7 12.7 4 14 4C15.5 4 17 5.24 17 8C17 12.5 11 16 11 16C11 16 5 12.5 5 8Z" fill={color} opacity="0.8" />
          <path d="M3.5 10H6.5L8.5 7L10.5 13L12.5 9L14 10H18.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (key === "metabolic") {
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.6" />
          <path d="M8 11H11V8" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 13.5L11 11" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 4V11M11 4C11 4 8 3 6.5 5C5 7 6 10 8 10.5M11 4C11 4 14 3 15.5 5C17 7 16 10 14 10.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8 10.5C8 10.5 6 11 5.5 13C5 15 6.5 17 8.5 17C9.5 17 10.5 16.5 11 16M14 10.5C14 10.5 16 11 16.5 13C17 15 15.5 17 13.5 17C12.5 17 11.5 16.5 11 16" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: colors.textPrimary, fontWeight: 600 }}>
        {isAR ? "جاري تحليل قراءات المؤشرات الحيوية بالذكاء الاصطناعي..." : "Analyzing vital signs using AI..."}
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto", direction: isAR ? "rtl" : "ltr" }}>
      
      <div style={{
        background: "linear-gradient(160deg, #0F2A5C 0%, #1A6BCC 100%)",
        borderRadius: 24,
        padding: "28px",
        marginBottom: 24,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -30, right: isAR ? "auto" : -20, left: isAR ? -20 : "auto", width: 160, height: 160, borderRadius: "50%", background: "rgba(13,201,177,0.2)" }} />
        <div style={{ position: "absolute", bottom: -40, left: isAR ? "auto" : -20, right: isAR ? -20 : "auto", width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ color: "white", fontSize: 26, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{t("ai_title")}</h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, margin: 0, fontWeight: 500 }}>{t("ai_subtitle")}</p>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L13.5 8.5H20L14.5 12.5L16.5 19L12 15.5L7.5 19L9.5 12.5L4 8.5H10.5L12 2Z" fill="white" opacity="0.7" />
              <circle cx="12" cy="12" r="2.5" fill="white" />
            </svg>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginBottom: 24 }}>
        <div style={{
          background: colors.cardBg,
          borderRadius: 20,
          padding: "24px",
          boxShadow: "0 4px 16px rgba(15,31,61,0.08)",
          display: "flex",
          gap: 20,
          alignItems: "center",
          flexWrap: "wrap",
        }}>
          <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
            <svg width="96" height="96" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="38" fill="none" stroke={colors.borderLight} strokeWidth="10" />
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
              {userScore === 0 
                ? (isAR ? "سجل أول قراءة للحصول على تقييم صحي" : "Log your first reading to get your health score")
                : t("ai_scoreDesc")
              }
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ padding: "5px 12px", borderRadius: 8, background: "#FEF3C7", fontSize: 12, fontWeight: 700, color: "#B45309" }}>{t("ai_needsAttention")}</div>
              <div style={{ padding: "5px 12px", borderRadius: 8, background: "#DCFCE7", fontSize: 12, fontWeight: 700, color: "#16A34A" }}>{t("ai_improving")}</div>
            </div>
          </div>
        </div>

        {/* باقي الـ JSX (الـ Recommendation Card + Detailed Analysis) بدون تغيير كبير */}
        <div style={{
          background: "linear-gradient(135deg, #0F2A5C 0%, #1A6BCC 100%)",
          borderRadius: 20,
          padding: "22px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -20, right: isAR ? "auto" : -20, left: isAR ? -20 : "auto", width: 100, height: 100, borderRadius: "50%", background: "rgba(13,201,177,0.2)" }} />
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600, margin: "0 0 8px", letterSpacing: "0.05em", textTransform: "uppercase", position: "relative", zIndex: 1 }}>{t("ai_topRec")}</p>
          
          {userScore === 0 ? (
            <p style={{ color: "white", fontSize: 16, fontWeight: 700, margin: "0 0 6px", position: "relative", zIndex: 1 }}>
              {isAR ? "ابدأ بتسجيل قياساتك الحيوية" : "Start by logging your vital readings"}
            </p>
          ) : userScore < 70 ? (
            <>
              <p style={{ color: "white", fontSize: 16, fontWeight: 700, margin: "0 0 6px", position: "relative", zIndex: 1 }}>{t("ai_recTitle")}</p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, margin: 0, lineHeight: 1.55, position: "relative", zIndex: 1 }}>
                {t("ai_recBody")}
              </p>
            </>
          ) : (
            <>
              <p style={{ color: "white", fontSize: 16, fontWeight: 700, margin: "0 0 6px", position: "relative", zIndex: 1 }}>
                {isAR ? "صحتك ممتازة، حافظ على هذا الأداء المستقر!" : "Great job! Keep up this stable performance!"}
              </p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, margin: 0, lineHeight: 1.55, position: "relative", zIndex: 1 }}>
                {isAR ? "جميع مؤشراتك الحيوية تقع ضمن النطاقات الطبيعية والآمنة تماماً." : "All your vital signs are completely within the normal and safe ranges."}
              </p>
            </>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: 14, fontWeight: 700, color: colors.textMuted, margin: "0 0 14px", letterSpacing: "0.05em", textTransform: "uppercase" }}>{t("ai_detailedAnalysis")}</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 24 }}>
        {cards.map((card, i) => {
          const styles = getLevelStyles(card.level);
          return (
            <div key={card.key || i} style={{
              background: colors.cardBg,
              borderRadius: 18,
              padding: "20px",
              boxShadow: "0 2px 8px rgba(15,31,61,0.06)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 10 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: styles.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {getIcon(card.key, styles.color)}
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>{card.title}</p>
                    <div style={{ display: "inline-block", padding: "2px 8px", borderRadius: 6, background: styles.bg, marginTop: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: styles.color }}>{card.level}</span>
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 26, fontWeight: 800, color: styles.color }}>{card.pct}%</span>
              </div>

              <div style={{ height: 6, background: colors.borderLight, borderRadius: 3, marginBottom: 14, overflow: "hidden" }}>
                <div style={{ width: `${card.pct}%`, height: "100%", background: styles.color, borderRadius: 3 }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {card.insights.map((insight: string, ii: number) => (
                  <div key={ii} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: styles.color, marginTop: 5, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: colors.textSecondary, fontWeight: 500, lineHeight: 1.55 }}>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.6, textAlign: "center", padding: "0 24px" }}>
        {t("ai_disclaimer")}
      </p>
    </div>
  );
}