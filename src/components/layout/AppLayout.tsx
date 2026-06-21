
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import type { NavItem, VitalItem } from "../../types";
import { clearAuthToken } from "../../lib/api";
import { clearStoredProfile, getStoredProfile, PROFILE_UPDATED_EVENT } from "../../lib/profile-storage";

const navItems: NavItem[] = [
  {
    id: "dashboard",
    labelKey: "nav_dashboard",
    path: "/dashboard",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M2.5 7.5L10 2L17.5 7.5V17C17.5 17.46 17.12 17.83 16.67 17.83H13V12.5H7V17.83H3.33C2.88 17.83 2.5 17.46 2.5 17V7.5Z"
          strokeWidth="1.6" strokeLinejoin="round" stroke="currentColor" fill="none" />
      </svg>
    ),
  },
  {
    id: "history",
    labelKey: "nav_history",
    path: "/history",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 6.5V10.5L13 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "ai",
    labelKey: "nav_ai",
    path: "/ai-analysis",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L11.5 7.5H17L12.5 10.5L14.5 16L10 12.5L5.5 16L7.5 10.5L3 7.5H8.5L10 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "alerts",
    labelKey: "nav_alerts",
    path: "/alerts",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2C7.24 2 5 4.24 5 7V12L3.5 14H16.5L15 12V7C15 4.24 12.76 2 10 2Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8.5 15.5C8.5 16.33 9.17 17 10 17C10.83 17 11.5 16.33 11.5 15.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    id: "profile",
    labelKey: "nav_profile",
    path: "/profile",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3.5 17C3.5 13.96 6.46 11.5 10 11.5C13.54 11.5 16.5 13.96 16.5 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

const vitalItems: VitalItem[] = [
  { labelKey: "vital_bp", path: "/vitals/bp", color: "#F59E0B" },
  { labelKey: "vital_hr", path: "/vitals/heart-rate", color: "#EF4444" },
  { labelKey: "vital_oxygen", path: "/vitals/oxygen", color: "#0DC9B1" },
  { labelKey: "vital_glucose", path: "/vitals/glucose", color: "#3B82F6" },
];

function ThemeToggleButton() {
  const { theme, toggleTheme, colors } = useApp();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        border: `1px solid ${colors.border}`,
        background: colors.cardBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: colors.textPrimary,
        flexShrink: 0,
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
          <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function LangToggleButton({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, colors } = useApp();
  const isAR = language === "AR";

  const handleToggle = () => setLanguage(isAR ? "EN" : "AR");

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        type="button"
        aria-label={isAR ? "Switch to English" : "التبديل إلى العربية"}
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          border: `1px solid ${colors.border}`,
          background: colors.cardBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
          transition: "background 0.2s, border-color 0.2s",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={colors.accentBlue} strokeWidth="1.6" />
          <path d="M12 3C12 3 9 7.5 9 12C9 16.5 12 21 12 21" stroke={colors.accentBlue} strokeWidth="1.6" />
          <path d="M12 3C12 3 15 7.5 15 12C15 16.5 12 21 12 21" stroke={colors.accentBlue} strokeWidth="1.6" />
          <path d="M3 12H21" stroke={colors.accentBlue} strokeWidth="1.6" />
        </svg>
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: 6, padding: "8px 12px" }}>
      {(["EN", "AR"] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          style={{
            flex: 1,
            padding: "7px 0",
            borderRadius: 8,
            border: `1.5px solid ${language === lang ? colors.accentBlue : colors.border}`,
            background: language === lang ? colors.navActiveBg : "transparent",
            color: language === lang ? colors.accentBlue : colors.textMuted,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.03em",
            transition: "all 0.15s ease",
          }}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { colors, isRTL, t } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [currentProfileName, setCurrentProfileName] = useState<string>(() => getStoredProfile().name);
  const [currentHealthScore, setCurrentHealthScore] = useState<number>(() => getStoredProfile().healthScore ?? 0);

  const activeId = navItems.find(
    (item) => location.pathname === item.path || location.pathname.startsWith(item.path + "/")
  )?.id ?? "dashboard";

  const isVitalPage = location.pathname.startsWith("/vitals/");

  React.useEffect(() => {
    const syncProfile = () => {
      const updatedProfile = getStoredProfile();
      setCurrentProfileName(updatedProfile.name);
      setCurrentHealthScore(updatedProfile.healthScore ?? 0);
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, syncProfile);
    window.addEventListener("storage", syncProfile);

    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, syncProfile);
      window.removeEventListener("storage", syncProfile);
    };
  }, []);

  const sidebarSide = isRTL ? "right" : "left";
  const sidebarTransform = sidebarOpen ? "translateX(0)" : (isRTL ? "translateX(100%)" : "translateX(-100%)");

  const leftItems = navItems.filter(item => item.id === "dashboard" || item.id === "history");
  const aiItem = navItems.find(item => item.id === "ai");
  const rightItems = navItems.filter(item => item.id === "alerts" || item.id === "profile");

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: colors.pageBg,
      fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif",
      transition: "background 0.3s ease",
    }}>

      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(15,31,61,0.4)", zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside style={{
        position: "fixed",
        [sidebarSide]: 0,
        top: 0,
        bottom: 0,
        width: 240,
        background: colors.sidebarBg,
        borderRight: isRTL ? "none" : `1px solid ${colors.border}`,
        borderLeft: isRTL ? `1px solid ${colors.border}` : "none",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        transform: sidebarTransform,
        transition: "transform 0.3s ease, background 0.3s ease",
        overflowY: "auto",
      }}
        className="lg-sidebar"
      >
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${colors.divider}` }}>
          <Link to="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }} onClick={() => setSidebarOpen(false)}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #0F2A5C, #1A6BCC)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 10H9V6H11V10H15" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="1.4" opacity="0.4" />
              </svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: colors.textPrimary, letterSpacing: "-0.02em" }}>HealthSync</span>
          </Link>
        </div>

        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${colors.divider}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, #1A6BCC, #0DC9B1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="7" r="3.5" stroke="white" strokeWidth="1.6" />
                <path d="M3.5 17C3.5 13.96 6.46 11.5 10 11.5C13.54 11.5 16.5 13.96 16.5 17" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>{currentProfileName}</p>
              <p style={{ fontSize: 11, color: colors.textMuted, margin: 0, fontWeight: 500 }}>Score: {currentHealthScore}/100</p>
            </div>
          </div>
        </div>

        <nav style={{ padding: "12px 10px", flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: colors.textMuted, margin: "0 0 8px 10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {t("nav_main")}
          </p>
          {navItems.map((item) => {
            const isActive = item.id === activeId;
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 10,
                  marginBottom: 2,
                  textDecoration: "none",
                  background: isActive ? colors.navActiveBg : "transparent",
                  color: isActive ? colors.navActive : colors.navInactive,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 14,
                  transition: "all 0.15s ease",
                }}
              >
                {item.icon}
                {t(item.labelKey)}
              </Link>
            );
          })}

          <p style={{ fontSize: 10, fontWeight: 700, color: colors.textMuted, margin: "16px 0 8px 10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {t("nav_vitals")}
          </p>
          {vitalItems.map((vital) => {
            const isActive = location.pathname === vital.path;
            return (
              <Link
                key={vital.path}
                to={vital.path}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 10,
                  marginBottom: 2,
                  textDecoration: "none",
                  background: isActive ? colors.navActiveBg : "transparent",
                  color: isActive ? colors.navActive : colors.navInactive,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: vital.color, flexShrink: 0 }} />
                {t(vital.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div style={{ borderTop: `1px solid ${colors.divider}` }}>
          <LangToggleButton compact={false} />
          <Link to="/login" style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 20px 14px",
            textDecoration: "none",
            color: "#EF4444",
            fontWeight: 600,
            fontSize: 13,
          }}
            onClick={() => {
              clearAuthToken();
              clearStoredProfile();
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M10.5 3H13C13.55 3 14 3.45 14 4V14C14 14.55 13.55 15 13 15H10.5M7 12L4 9L7 6M4 9H12" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("nav_signOut")}
          </Link>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", transition: "background 0.3s ease" }} className="main-content">
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: colors.headerBg,
          borderBottom: `1px solid ${colors.border}`,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          transition: "background 0.3s ease, border-color 0.3s ease",
        }} className="mobile-header">
          <button
            onClick={() => setSidebarOpen(true)}
            type="button"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: colors.textPrimary, display: "flex", alignItems: "center" }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 6H19M3 11H19M3 16H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #0F2A5C, #1A6BCC)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path d="M5 10H9V6H11V10H15" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: colors.textPrimary }}>HealthSync</span>
          </div>
          <LangToggleButton compact={true} />
          <ThemeToggleButton />
        </header>

        <main style={{ flex: 1, padding: "0 0 80px 0" }} className="page-main">
          {children}
        </main>

        <nav 
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 35,
            display: "flex",
            justifyContent: "center",
            background: "transparent",
            pointerEvents: "none"
          }} 
          className="bottom-nav"
        >
          <div style={{ position: "relative", width: "100%", maxWidth: 430, height: 70, pointerEvents: "auto" }}>
            
            {aiItem && (
              <div style={{ position: "absolute", left: "50%", top: -8, transform: "translateX(-50%)", zIndex: 40, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Link
                  to={aiItem.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #0f2a5c, #1a6bcc)",
                    color: "white",
                    boxShadow: "0 4px 12px rgba(26,107,204,0.3)",
                    border: `3px solid ${colors.headerBg}`,
                    transition: "transform 0.2s"
                  }}
                >
                  <div style={{ color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>{aiItem.icon}</div>
                </Link>
              </div>
            )}

            <div style={{ position: "absolute", inset: 0, zIndex: 10, filter: "drop-shadow(0 -4px 10px rgba(15,31,61,0.05))" }}>
              <svg width="100%" height="70" viewBox="0 0 400 70" preserveAspectRatio="none">
                <path 
                  d="M0,15 L175,15 C175,15 180,42 190,42 L210,42 C220,42 225,15 225,15 L400,15 L400,70 L0,70 Z"
                  fill={colors.headerBg}
                  style={{ transition: "fill 0.3s ease" }}
                />
              </svg>
            </div>

            <div style={{ position: "relative", zIndex: 20, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 12px 0", height: "100%" }}>
              
              <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", width: "42%", height: "100%" }}>
                {leftItems.map((item) => {
                  const isActive = item.id === activeId || (item.id === "dashboard" && isVitalPage);
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 44,
                        height: 44,
                        textDecoration: "none",
                        color: isActive ? colors.navActive : colors.textMuted,
                        transition: "color 0.2s ease",
                      }}
                    >
                      <div style={{ transform: "scale(1.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</div>
                    </Link>
                  );
                })}
              </div>

              <div style={{ width: "16%" }}></div>

              <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", width: "42%", height: "100%" }}>
                {rightItems.map((item) => {
                  const isActive = item.id === activeId;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 44,
                        height: 44,
                        textDecoration: "none",
                        color: isActive ? colors.navActive : colors.textMuted,
                        transition: "color 0.2s ease",
                      }}
                    >
                      <div style={{ transform: "scale(1.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</div>
                    </Link>
                  );
                })}
              </div>

            </div>

          </div>
        </nav>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 1024px) {
          .lg-sidebar {
            transform: translateX(0) !important;
          }
          .main-content {
            ${isRTL ? "margin-right: 240px;" : "margin-left: 240px;"}
          }
          .mobile-header {
            display: none !important;
          }
          .bottom-nav {
            display: none !important;
          }
          .page-main {
            padding-bottom: 0 !important;
          }
        }
      `}} />
    </div>
  );
}