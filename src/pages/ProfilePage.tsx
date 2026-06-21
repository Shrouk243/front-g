import { Link } from "react-router-dom";
import React from "react";
import { useApp } from "../contexts/AppContext";
import { buildFullName, calculateAge, clearStoredProfile, formatDateOfBirth, getStoredProfile, saveStoredProfile } from "../lib/profile-storage";
import type { Language, UserProfile } from "../types";
import {
  clearAuthToken,
  createTelegramConnectToken,
  disconnectTelegram,
  fetchProfile,
  fetchTelegramStatus,
  getApiErrorMessage,
  sendTelegramTestMessage,
  updateProfile,
  updateTelegramPreferences,
} from "../lib/api";
import { mergeBackendProfile, profileConditionsToBackend, profileGenderToBackend } from "../lib/health-data";
interface RowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}
const bloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const genderOptions = ["Male", "Female", "Other"];
const medicalConditionOptions = [
  "No Known Condition",
  "Hypertension",
  "Hypotension",
  "Type 1 Diabetes",
  "Type 2 Diabetes",
  "Coronary Artery Disease",
  "Heart Failure",
  "Arrhythmia",
  "Asthma",
  "COPD",
  "Sleep Apnea",
  "Chronic Hypoxemia",
];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const days = Array.from({ length: 31 }, (_, index) => String(index + 1));
const years = Array.from({ length: 80 }, (_, index) => String(new Date().getFullYear() - 18 - index));
const countryCodes = ["+966", "+20", "+971", "+965", "+973", "+974"];
function getConditionStyle(label: string) {
  if (label === "No Known Condition") return { color: "#16A34A", bg: "#DCFCE7" };
  if (label.includes("Diabetes")) return { color: "#2563EB", bg: "#DBEAFE" };
  if (label.includes("Heart") || label.includes("Coronary") || label.includes("Arrhythmia")) return { color: "#DC2626", bg: "#FEE2E2" };
  if (label.includes("Asthma") || label.includes("COPD") || label.includes("Hypoxemia") || label.includes("Apnea")) return { color: "#0F766E", bg: "#CCFBF1" };
  return { color: "#B45309", bg: "#FEF3C7" };
}
// ✅ السهم يظهر فقط لما يكون في onClick
function Row({ icon, label, value, onClick, children }: RowProps) {
  const { colors } = useApp();
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 0",
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: colors.inputBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>{label}</p>
        {value && <p style={{ fontSize: 13, color: colors.textMuted, margin: "2px 0 0", fontWeight: 500 }}>{value}</p>}
        {children}
      </div>
      {onClick && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 4L10 8L6 12" stroke={colors.border} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}
export function ProfilePage() {
  const { colors, language, setLanguage, t } = useApp();
  const [profile, setProfile] = React.useState<UserProfile>(() => getStoredProfile());
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const [draft, setDraft] = React.useState<UserProfile>(() => getStoredProfile());
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [pageError, setPageError] = React.useState<string | null>(null);
  const [telegramOpen, setTelegramOpen] = React.useState<boolean>(false);
  const [telegramStatus, setTelegramStatus] = React.useState({
    connected: false,
    telegram_username: null as string | null,
    telegram_connected_at: null as string | null,
    preferences: {
      critical_alerts: true,
      recommendations: true,
      daily_summary: false,
    },
    bot_username: null as string | null,
  });
  const [telegramBusy, setTelegramBusy] = React.useState<string | null>(null);
  const [telegramNotice, setTelegramNotice] = React.useState<string | null>(null);
  React.useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const [profileResponse, telegramResponse] = await Promise.all([
          fetchProfile(),
          fetchTelegramStatus(),
        ]);
        if (!active) return;
        const merged = mergeBackendProfile(profileResponse.user);
        saveStoredProfile(merged);
        setProfile(merged);
        setDraft(merged);
        setTelegramStatus(telegramResponse);
      } catch (error) {
        if (!active) return;
        const stored = getStoredProfile();
        setProfile(stored);
        setDraft(stored);
        setPageError(getApiErrorMessage(error, "Unable to load profile data."));
      }
    }
    loadProfile();
    return () => {
      active = false;
    };
  }, []);
  function openEditor() {
    setDraft(profile);
    setIsEditing(true);
  }
  function handleDraftChange<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  function toggleMedicalCondition(condition: string) {
    setDraft((current) => {
      const conditions = current.medicalConditions;
      let nextConditions: string[];
      if (condition === "No Known Condition") {
        nextConditions = ["No Known Condition"];
      } else if (conditions.includes(condition)) {
        nextConditions = conditions.filter((item) => item !== condition);
        if (!nextConditions.length) nextConditions = ["No Known Condition"];
      } else {
        nextConditions = [...conditions.filter((item) => item !== "No Known Condition"), condition];
      }
      return { ...current, medicalConditions: nextConditions };
    });
  }
  async function handleSaveProfile() {
    const nextProfile: UserProfile = {
      ...draft,
      name: buildFullName(draft.firstName, draft.lastName),
      age: calculateAge(draft.dobDay, draft.dobMonth, draft.dobYear),
      dateOfBirth: formatDateOfBirth(draft.dobDay, draft.dobMonth, draft.dobYear),
      height: Number(draft.height) || 0,
      weight: Number(draft.weight) || 0,
    };
    setIsSaving(true);
    setPageError(null);
    try {
      const response = await updateProfile({
        name: nextProfile.name,
        date_of_birth: nextProfile.dobDay && nextProfile.dobMonth && nextProfile.dobYear
          ? new Date(`${nextProfile.dobMonth} ${nextProfile.dobDay}, ${nextProfile.dobYear}`).toISOString().slice(0, 10)
          : null,
        gender: profileGenderToBackend(nextProfile.gender),
        chronic_conditions: profileConditionsToBackend(nextProfile.medicalConditions),
        height_cm: nextProfile.height || null,
        weight_kg: nextProfile.weight || null,
      });
      const merged = mergeBackendProfile(response.user);
      // ✅ إعادة تطبيق الحقول اللي الباكند ما بيحفظها (bloodType, phone, hospitalName)
      const finalProfile: UserProfile = {
        ...merged,
        bloodType: nextProfile.bloodType,
        hospitalName: nextProfile.hospitalName,
        phoneCountryCode: nextProfile.phoneCountryCode,
        phoneNumber: nextProfile.phoneNumber,
      };
      saveStoredProfile(finalProfile);
      setProfile(finalProfile);
      setDraft(finalProfile);
      setIsEditing(false);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to save profile changes.");
    } finally {
      setIsSaving(false);
    }
  }
  async function handleConnectTelegram() {
    setTelegramBusy("connect");
    setPageError(null);
    setTelegramNotice(null);
    try {
      const response = await createTelegramConnectToken();
      if (response.data.connect_url) {
        window.open(response.data.connect_url, "_blank", "noopener,noreferrer");
      } else {
        setPageError("Telegram bot username is not configured yet.");
      }
      const refreshed = await fetchTelegramStatus();
      setTelegramStatus(refreshed);
    } catch (error) {
      setPageError(getApiErrorMessage(error, "Unable to create the Telegram connection link."));
    } finally {
      setTelegramBusy(null);
    }
  }
  async function handleTelegramPreferenceChange(key: "critical_alerts" | "recommendations" | "daily_summary", value: boolean) {
    const nextPreferences = { ...telegramStatus.preferences, [key]: value };
    setTelegramStatus((current) => ({ ...current, preferences: nextPreferences }));
    setTelegramBusy(key);
    setTelegramNotice(null);
    try {
      await updateTelegramPreferences(nextPreferences);
      setTelegramNotice("Telegram preferences updated.");
    } catch (error) {
      setPageError(getApiErrorMessage(error, "Unable to update Telegram preferences."));
      setTelegramStatus((current) => ({ ...current, preferences: telegramStatus.preferences }));
    } finally {
      setTelegramBusy(null);
    }
  }
  async function handleTelegramTestMessage() {
    setTelegramBusy("test");
    setPageError(null);
    setTelegramNotice(null);
    try {
      const response = await sendTelegramTestMessage();
      setTelegramNotice(response.message);
    } catch (error) {
      setPageError(getApiErrorMessage(error, "Unable to send the test message."));
    } finally {
      setTelegramBusy(null);
    }
  }
  async function handleDisconnectTelegram() {
    setTelegramBusy("disconnect");
    setPageError(null);
    setTelegramNotice(null);
    try {
      const response = await disconnectTelegram();
      setTelegramStatus((current) => ({
        ...current,
        connected: false,
        telegram_username: null,
        telegram_connected_at: null,
      }));
      setTelegramNotice(response.message);
    } catch (error) {
      setPageError(getApiErrorMessage(error, "Unable to disconnect Telegram."));
    } finally {
      setTelegramBusy(null);
    }
  }
  return (
    <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: "-0.03em" }}>{t("profile_title")}</h1>
        <button
          onClick={openEditor}
          style={{
            padding: "10px 20px",
            borderRadius: 12,
            border: `1.5px solid ${colors.border}`,
            background: colors.cardBg,
            fontSize: 14,
            fontWeight: 700,
            color: colors.accentBlue,
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(15,31,61,0.04)",
            fontFamily: "inherit",
            transition: "background 0.2s",
          }}
        >
          {t("profile_edit")}
        </button>
      </div>
      {/* Hero Card */}
      <div style={{
        background: "#0F2A5C",
        borderRadius: 24,
        padding: "24px",
        marginBottom: 20,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(13,201,177,0.15)" }} />
        <div style={{ position: "absolute", bottom: -30, left: 80, width: 120, height: 120, borderRadius: "50%", background: "rgba(26,107,204,0.3)" }} />
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", position: "relative", zIndex: 1, flexWrap: "wrap" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "linear-gradient(135deg, #1A6BCC, #0DC9B1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, border: "2.5px solid rgba(255,255,255,0.2)",
          }}>
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="11" r="5.5" stroke="white" strokeWidth="2" />
              <path d="M5.5 27C5.5 21.75 10.25 17.5 16 17.5C21.75 17.5 26.5 21.75 26.5 27" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: "white", fontSize: 22, fontWeight: 800, margin: "0 0 2px", letterSpacing: "-0.02em" }}>{profile.name}</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 14px", fontWeight: 500 }}>
              ID #{profile.id} · Blood Type: {profile.bloodType || "—"}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Age", value: profile.age ? String(profile.age) : "—" },
                { label: "Height", value: profile.height ? `${profile.height} cm` : "—" },
                { label: "Weight", value: profile.weight ? `${profile.weight} kg` : "—" },
              ].map((s, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "7px 14px" }}>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, margin: "0 0 2px", fontWeight: 500 }}>{s.label}</p>
                  <p style={{ color: "white", fontSize: 15, margin: 0, fontWeight: 700 }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {pageError && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: 14, padding: "12px 16px", marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
          {pageError}
        </div>
      )}
      {/* Edit Form */}
      {isEditing && (
        <div style={{ background: colors.cardBg, borderRadius: 20, padding: "24px", marginBottom: 20, boxShadow: "0 1px 4px rgba(15,31,61,0.05)", border: `1px solid ${colors.border}` }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: colors.textPrimary, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Edit Profile</h2>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: "0 0 20px", fontWeight: 500 }}>Update your personal and health information.</p>
          {/* Name */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginBottom: 16 }}>
            {[
              { label: "First Name", value: draft.firstName, key: "firstName" as const, placeholder: "Ahmad" },
              { label: "Last Name", value: draft.lastName, key: "lastName" as const, placeholder: "Al-Rashidi" },
            ].map((field) => (
              <div key={field.key} style={{ minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>{field.label}</p>
                <div style={{ background: colors.inputBg, border: `1.5px solid ${colors.border}`, borderRadius: 12, padding: "0 14px", height: 48, display: "flex", alignItems: "center" }}>
                  <input
                    value={field.value}
                    onChange={(e) => handleDraftChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    style={{ border: "none", background: "transparent", fontSize: 15, color: colors.textPrimary, outline: "none", width: "100%", fontFamily: "inherit", fontWeight: 500 }}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Email — read-only ✅ */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Email</p>
            <div style={{ background: colors.inputBg, border: `1.5px solid ${colors.border}`, borderRadius: 12, padding: "0 14px", height: 48, display: "flex", alignItems: "center", gap: 8, opacity: 0.7 }}>
              <input
                value={draft.email}
                readOnly
                style={{ border: "none", background: "transparent", fontSize: 15, color: colors.textMuted, outline: "none", width: "100%", fontFamily: "inherit", fontWeight: 500, cursor: "not-allowed" }}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>Read-only</span>
            </div>
          </div>
          {/* Phone */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Phone Number</p>
            <div style={{ display: "grid", gridTemplateColumns: "88px minmax(0, 1fr)", gap: 8 }}>
              <div style={{ background: colors.inputBg, border: `1.5px solid ${colors.border}`, borderRadius: 12, padding: "0 12px", height: 48, display: "flex", alignItems: "center", position: "relative" }}>
                <select
                  value={draft.phoneCountryCode}
                  onChange={(e) => handleDraftChange("phoneCountryCode", e.target.value)}
                  style={{ border: "none", background: "transparent", fontSize: 15, color: colors.textPrimary, outline: "none", width: "100%", fontFamily: "inherit", fontWeight: 600, appearance: "none", WebkitAppearance: "none", MozAppearance: "none", paddingRight: 18 }}
                >
                  {countryCodes.map((code) => <option key={code} value={code}>{code}</option>)}
                </select>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: "absolute", right: 12, pointerEvents: "none" }}>
                  <path d="M3.5 5.5L7 9L10.5 5.5" stroke="#B0C4DE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ background: colors.inputBg, border: `1.5px solid ${colors.border}`, borderRadius: 12, padding: "0 14px", height: 48, display: "flex", alignItems: "center", minWidth: 0 }}>
                <input
                  value={draft.phoneNumber}
                  onChange={(e) => handleDraftChange("phoneNumber", e.target.value)}
                  placeholder="5X XXX XXXX"
                  style={{ border: "none", background: "transparent", fontSize: 15, color: colors.textPrimary, outline: "none", width: "100%", minWidth: 0, fontFamily: "inherit", fontWeight: 500 }}
                />
              </div>
            </div>
          </div>
          {/* Gender */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>Gender</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
              {genderOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleDraftChange("gender", option)}
                  style={{
                    height: 44, borderRadius: 12,
                    border: `1.5px solid ${draft.gender === option ? "#1A6BCC" : colors.border}`,
                    background: draft.gender === option ? colors.navActiveBg : colors.inputBg,
                    color: draft.gender === option ? colors.accentBlue : colors.textSecondary,
                    fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {/* Date of Birth */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Date of Birth</p>
            <div style={{ display: "grid", gridTemplateColumns: "88px minmax(0, 1fr) 96px", gap: 8 }}>
              {[
                { value: draft.dobDay,   key: "dobDay"   as const, placeholder: "Day",   options: days   },
                { value: draft.dobMonth, key: "dobMonth" as const, placeholder: "Month", options: months },
                { value: draft.dobYear,  key: "dobYear"  as const, placeholder: "Year",  options: years  },
              ].map((field) => (
                <div key={field.key} style={{ background: colors.inputBg, border: `1.5px solid ${colors.border}`, borderRadius: 12, padding: "0 12px", height: 48, display: "flex", alignItems: "center", position: "relative", minWidth: 0 }}>
                  <select
                    value={field.value}
                    onChange={(e) => handleDraftChange(field.key, e.target.value)}
                    style={{ border: "none", background: "transparent", fontSize: 15, color: field.value ? colors.textPrimary : colors.textMuted, outline: "none", width: "100%", fontFamily: "inherit", fontWeight: 500, appearance: "none", WebkitAppearance: "none", MozAppearance: "none", paddingRight: 18 }}
                  >
                    <option value="" disabled>{field.placeholder}</option>
                    {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: "absolute", right: 12, pointerEvents: "none" }}>
                    <path d="M3.5 5.5L7 9L10.5 5.5" stroke="#B0C4DE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
          {/* Height / Weight */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Height", unit: "cm", value: String(draft.height || ""), key: "height" as const },
              { label: "Weight", unit: "kg", value: String(draft.weight || ""), key: "weight" as const },
            ].map((field) => (
              <div key={field.key} style={{ minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>{field.label}</p>
                <div style={{ background: colors.inputBg, border: `1.5px solid ${colors.border}`, borderRadius: 12, padding: "0 14px", height: 48, display: "flex", alignItems: "center", gap: 8, width: "100%", boxSizing: "border-box" }}>
                  <input
                    type="number"
                    value={field.value}
                    onChange={(e) => handleDraftChange(field.key, Number(e.target.value))}
                    placeholder="—"
                    style={{ border: "none", background: "transparent", fontSize: 15, color: colors.textPrimary, outline: "none", flex: 1, minWidth: 0, width: "100%", fontFamily: "inherit", fontWeight: 500 }}
                  />
                  <span style={{ fontSize: 13, color: colors.textMuted, fontWeight: 600 }}>{field.unit}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Blood Type */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>Blood Type</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {bloodTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleDraftChange("bloodType", type)}
                  style={{
                    width: 52, height: 42, borderRadius: 10,
                    border: `1.5px solid ${draft.bloodType === type ? "#1A6BCC" : colors.border}`,
                    background: draft.bloodType === type ? colors.navActiveBg : colors.inputBg,
                    color: draft.bloodType === type ? colors.accentBlue : colors.textSecondary,
                    fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          {/* Hospital Name */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Hospital Name</p>
            <div style={{ background: colors.inputBg, border: `1.5px solid ${colors.border}`, borderRadius: 12, padding: "0 14px", height: 48, display: "flex", alignItems: "center" }}>
              <input
                value={draft.hospitalName}
                onChange={(e) => handleDraftChange("hospitalName", e.target.value)}
                placeholder="Enter hospital name"
                style={{ border: "none", background: "transparent", fontSize: 15, color: colors.textPrimary, outline: "none", width: "100%", fontFamily: "inherit", fontWeight: 500 }}
              />
            </div>
          </div>
          {/* Medical Conditions */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>Medical Conditions</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {medicalConditionOptions.map((condition) => {
                const isSelected = draft.medicalConditions.includes(condition);
                return (
                  <button
                    key={condition}
                    type="button"
                    onClick={() => toggleMedicalCondition(condition)}
                    style={{
                      minHeight: 38, padding: "8px 12px", borderRadius: 12,
                      border: `1.5px solid ${isSelected ? "#1A6BCC" : colors.border}`,
                      background: isSelected ? colors.navActiveBg : colors.inputBg,
                      color: isSelected ? colors.accentBlue : colors.textSecondary,
                      fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {condition}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSaving}
              style={{ flex: "1 1 200px", height: 48, borderRadius: 12, border: "none", background: "#0F2A5C", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => { setDraft(profile); setIsEditing(false); }}
              style={{ flex: "1 1 160px", height: 48, borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.cardBg, color: colors.textMuted, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { labelKey: "profile_healthScore" as const, value: String(profile.healthScore), color: "#22C55E", suffix: "/100" },
          { labelKey: "profile_daysActive"   as const, value: String(profile.daysActive),      color: "#1A6BCC", suffix: "" },
          { labelKey: "profile_alertsMonth"  as const, value: String(profile.alertsThisMonth), color: "#F59E0B", suffix: "" },
        ].map((s, i) => (
          <div key={i} style={{ background: colors.cardBg, borderRadius: 14, padding: "16px", textAlign: "center", boxShadow: "0 1px 4px rgba(15,31,61,0.05)", transition: "background 0.3s" }}>
            <p style={{ fontSize: 28, fontWeight: 900, color: s.color, margin: "0 0 4px", letterSpacing: "-0.03em" }}>
              {s.value}<span style={{ fontSize: 14, fontWeight: 600 }}>{s.suffix}</span>
            </p>
            <p style={{ fontSize: 12, color: colors.textMuted, margin: 0, fontWeight: 600 }}>{t(s.labelKey)}</p>
          </div>
        ))}
      </div>
      {/* Conditions */}
      <div style={{ background: colors.cardBg, borderRadius: 18, padding: "18px", marginBottom: 16, boxShadow: "0 1px 4px rgba(15,31,61,0.05)", transition: "background 0.3s" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: colors.textMuted, margin: "0 0 12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t("profile_conditions")}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {profile.medicalConditions.map((condition) => {
            const style = getConditionStyle(condition);
            return (
              <div key={condition} style={{ padding: "7px 16px", borderRadius: 20, background: style.bg, fontSize: 13, fontWeight: 700, color: style.color }}>
                {condition}
              </div>
            );
          })}
        </div>
      </div>
      {/* Personal Details */}
      <div style={{ background: colors.cardBg, borderRadius: 18, padding: "4px 18px", marginBottom: 14, boxShadow: "0 1px 4px rgba(15,31,61,0.05)", transition: "background 0.3s" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: colors.textMuted, margin: "14px 0 0", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t("profile_personalDetails")}</p>
        <div style={{ borderBottom: `1px solid ${colors.divider}` }}>
          <Row
            icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="12" rx="2" stroke="#1A6BCC" strokeWidth="1.4" /><path d="M5.5 2V5M12.5 2V5M2 7.5H16" stroke="#1A6BCC" strokeWidth="1.4" strokeLinecap="round" /></svg>}
            label={t("profile_dob")}
            value={profile.dateOfBirth || "—"}
          />
        </div>
        <Row
          icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 5.5C3 4.67 3.67 4 4.5 4H13.5C14.33 4 15 4.67 15 5.5V12.5C15 13.33 14.33 14 13.5 14H4.5C3.67 14 3 13.33 3 12.5V5.5Z" stroke="#1A6BCC" strokeWidth="1.4" /><path d="M6 7H12M6 10H10" stroke="#1A6BCC" strokeWidth="1.4" strokeLinecap="round" /></svg>}
          label={t("profile_doctor")}
          value={profile.hospitalName || "—"}
        />
      </div>
      {/* App Settings */}
      <div style={{ background: colors.cardBg, borderRadius: 18, padding: "4px 18px", marginBottom: 14, boxShadow: "0 1px 4px rgba(15,31,61,0.05)", transition: "background 0.3s" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: colors.textMuted, margin: "14px 0 0", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t("profile_appSettings")}</p>
        <div style={{ borderBottom: `1px solid ${colors.divider}` }}>
          <Row
            icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2C6.79 2 5 3.79 5 6V11L3.5 13H14.5L13 11V6C13 3.79 11.21 2 9 2Z" stroke="#1A6BCC" strokeWidth="1.4" /><path d="M7.5 14C7.5 14.83 8.17 15.5 9 15.5C9.83 15.5 10.5 14.83 10.5 14" stroke="#1A6BCC" strokeWidth="1.4" /></svg>}
            label="Telegram Alerts"
            value={telegramStatus.connected ? (telegramStatus.telegram_username ? `Connected to @${telegramStatus.telegram_username}` : "Connected") : "Not connected"}
            onClick={() => setTelegramOpen((current) => !current)}
          />
        </div>
        {telegramOpen && (
          <div style={{ borderBottom: `1px solid ${colors.divider}`, padding: "0 0 16px" }}>
            <div style={{ background: colors.inputBg, borderRadius: 16, border: `1px solid ${colors.border}`, padding: 16, marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>Connection Status</p>
                  <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>
                    {telegramStatus.connected
                      ? (telegramStatus.telegram_username ? `Connected to @${telegramStatus.telegram_username}` : "Connected")
                      : "Not connected"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConnectTelegram}
                  disabled={telegramBusy === "connect"}
                  style={{ height: 40, borderRadius: 10, border: "none", background: "#0F2A5C", color: "white", padding: "0 14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  {telegramBusy === "connect" ? "Opening..." : "Connect Telegram"}
                </button>
              </div>
              <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
                {[
                  { key: "critical_alerts",  label: "Critical alerts" },
                  { key: "recommendations",  label: "Recommendations after new readings" },
                  { key: "daily_summary",    label: "Daily summary" },
                ].map((preference) => (
                  <label key={preference.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, fontSize: 14, color: colors.textPrimary, fontWeight: 600 }}>
                    <span>{preference.label}</span>
                    <input
                      type="checkbox"
                      checked={telegramStatus.preferences[preference.key as keyof typeof telegramStatus.preferences]}
                      onChange={(event) => handleTelegramPreferenceChange(preference.key as "critical_alerts" | "recommendations" | "daily_summary", event.target.checked)}
                      disabled={Boolean(telegramBusy)}
                    />
                  </label>
                ))}
              </div>
              {telegramNotice && (
                <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#047857", borderRadius: 12, padding: "10px 12px", marginBottom: 12, fontSize: 13, fontWeight: 600 }}>
                  {telegramNotice}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleTelegramTestMessage}
                  disabled={!telegramStatus.connected || telegramBusy === "test"}
                  style={{ height: 40, borderRadius: 10, border: `1.5px solid ${colors.border}`, background: colors.cardBg, color: colors.textPrimary, padding: "0 14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  {telegramBusy === "test" ? "Sending..." : "Send Test Message"}
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectTelegram}
                  disabled={!telegramStatus.connected || telegramBusy === "disconnect"}
                  style={{ height: 40, borderRadius: 10, border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", padding: "0 14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  {telegramBusy === "disconnect" ? "Disconnecting..." : "Disconnect Telegram"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Language */}
        <div style={{ borderBottom: `1px solid ${colors.divider}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: colors.inputBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" stroke="#1A6BCC" strokeWidth="1.4" />
                <path d="M9 2C9 2 6.5 5.5 6.5 9C6.5 12.5 9 16 9 16" stroke="#1A6BCC" strokeWidth="1.4" />
                <path d="M9 2C9 2 11.5 5.5 11.5 9C11.5 12.5 9 16 9 16" stroke="#1A6BCC" strokeWidth="1.4" />
                <path d="M2 9H16" stroke="#1A6BCC" strokeWidth="1.4" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary, margin: "0 0 6px" }}>{t("profile_language")}</p>
              <div style={{ display: "flex", gap: 6 }}>
                {(["EN", "AR"] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    style={{
                      padding: "5px 14px", borderRadius: 8,
                      border: `1.5px solid ${language === lang ? colors.accentBlue : colors.border}`,
                      background: language === lang ? colors.navActiveBg : colors.cardBg,
                      color: language === lang ? colors.accentBlue : colors.textSecondary,
                      fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s ease",
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Privacy — no arrow (no onClick) ✅ */}
        <Row
          icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3.5" y="8" width="11" height="8" rx="1.5" stroke="#1A6BCC" strokeWidth="1.4" /><path d="M5.5 8V5.5C5.5 3.57 7.07 2 9 2C10.93 2 12.5 3.57 12.5 5.5V8" stroke="#1A6BCC" strokeWidth="1.4" strokeLinecap="round" /><circle cx="9" cy="12.5" r="1.2" fill="#1A6BCC" /></svg>}
          label={t("profile_privacy")}
        />
      </div>
      {/* Sign Out */}
      <Link
        to="/login"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          width: "100%", height: 50, borderRadius: 14,
          border: "1.5px solid #FEE2E2", background: "#FFF5F5", color: "#EF4444",
          fontSize: 15, fontWeight: 700, cursor: "pointer", textDecoration: "none", marginTop: 8,
        }}
        onClick={() => {
          clearAuthToken();
          clearStoredProfile();
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M10.5 3H13C13.55 3 14 3.45 14 4V14C14 14.55 13.55 15 13 15H10.5M7 12L4 9L7 6M4 9H12" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t("profile_signOut")}
      </Link>
    </div>
  );
}