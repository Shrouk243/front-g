import React from "react";
import { createVital } from "../lib/api";
import { useApp } from "../contexts/AppContext";
type VitalType = "blood_pressure" | "heart_rate" | "oxygen" | "blood_sugar";
interface ManualReadingDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
  initialType?: VitalType;
  allowTypeSelection?: boolean;
}
const vitalOptions: Array<{ value: VitalType; label: string }> = [
  { value: "blood_pressure", label: "Blood Pressure" },
  { value: "heart_rate",     label: "Heart Rate" },
  { value: "oxygen",         label: "Blood Oxygen" },
  { value: "blood_sugar",    label: "Blood Glucose" },
];
function getInitialDateTime() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString();
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}
export function ManualReadingDialog({
  open, onClose, onSaved,
  initialType = "blood_pressure",
  allowTypeSelection = true,
}: ManualReadingDialogProps) {
  const { colors } = useApp();
  const [type, setType]               = React.useState<VitalType>(initialType);
  const [dateTime, setDateTime]       = React.useState(getInitialDateTime);
  const [value, setValue]             = React.useState("");
  const [systolic, setSystolic]       = React.useState("");
  const [diastolic, setDiastolic]     = React.useState("");
  const [glucoseType, setGlucoseType] = React.useState<"fasting" | "random">("fasting");
  const [saving, setSaving]           = React.useState(false);
  const [error, setError]             = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!open) return;
    setType(initialType);
    setDateTime(getInitialDateTime());
    setValue(""); setSystolic(""); setDiastolic("");
    setGlucoseType("fasting");
    setError(null);
  }, [initialType, open]);
  if (!open) return null;
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    // ✅ Blood Pressure
    if (type === "blood_pressure") {
      const sysNum = Number(systolic);
      const diaNum = Number(diastolic);
      if (!systolic || !diastolic || Number.isNaN(sysNum) || Number.isNaN(diaNum)) {
        setError("Please enter both systolic and diastolic values.");
        setSaving(false); return;
      }
      if (sysNum < 50 || sysNum > 300) {
        setError("⚠️ Systolic value must be between 50 and 300 mmHg. Please check your reading.");
        setSaving(false); return;
      }
      if (diaNum < 30 || diaNum > 200) {
        setError("⚠️ Diastolic value must be between 30 and 200 mmHg. Please check your reading.");
        setSaving(false); return;
      }
      if (diaNum >= sysNum) {
        setError("⚠️ Diastolic must be lower than Systolic. Please check your reading.");
        setSaving(false); return;
      }
    }
    // ✅ Oxygen
    if (type === "oxygen") {
      const numVal = Number(value);
      if (!value || Number.isNaN(numVal)) {
        setError("Please enter an oxygen saturation value.");
        setSaving(false); return;
      }
      if (numVal < 50 || numVal > 100) {
        setError("⚠️ SpO₂ must be between 50% and 100%. Please check your reading.");
        setSaving(false); return;
      }
    }
    // ✅ Heart Rate
    if (type === "heart_rate") {
      const numVal = Number(value);
      if (!value || Number.isNaN(numVal)) {
        setError("Please enter a heart rate value.");
        setSaving(false); return;
      }
      if (numVal < 50) {
        setError("⚠️ Heart rate is too low. Minimum allowed value is 50 bpm. Please check your reading.");
        setSaving(false); return;
      }
      if (numVal > 170) {
        setError("⚠️ Heart rate is too high. Maximum allowed value is 170 bpm. Please check your reading.");
        setSaving(false); return;
      }
    }
    // ✅ Blood Glucose
    if (type === "blood_sugar") {
      const numVal = Number(value);
      if (!value || Number.isNaN(numVal)) {
        setError("Please enter a blood glucose value.");
        setSaving(false); return;
      }
      if (numVal < 20 || numVal > 600) {
        setError("⚠️ Blood glucose must be between 20 and 600 mg/dL. Please check your reading.");
        setSaving(false); return;
      }
    }
    try {
      const measuredAt = new Date(`${dateTime.date}T${dateTime.time}`).toISOString();
      const payload = type === "blood_pressure"
        ? { type, measured_at: measuredAt, systolic: Number(systolic), diastolic: Number(diastolic), source: "manual" as const }
        : { type, measured_at: measuredAt, value: Number(value), source: "manual" as const };
      await createVital(payload);
      await onSaved?.();
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save the reading.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,31,61,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, background: colors.cardBg, borderRadius: 20, border: `1px solid ${colors.border}`, boxShadow: "0 20px 40px rgba(15,31,61,0.18)", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, margin: "0 0 4px" }}>Add Manual Reading</h2>
            <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>Save a new reading to your HealthSync history.</p>
          </div>
          <button type="button" onClick={onClose} style={{ border: "none", background: "transparent", color: colors.textMuted, fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Vital Type Selector */}
          {allowTypeSelection && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Vital Type</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                {vitalOptions.map((option) => (
                  <button key={option.value} type="button" onClick={() => setType(option.value)}
                    style={{ height: 42, borderRadius: 10, border: `1.5px solid ${type === option.value ? colors.accentBlue : colors.border}`, background: type === option.value ? colors.navActiveBg : colors.inputBg, color: type === option.value ? colors.accentBlue : colors.textSecondary, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Date & Time */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Date</p>
              <input type="date" value={dateTime.date} onChange={(e) => setDateTime((c) => ({ ...c, date: e.target.value }))} required
                style={{ width: "100%", height: 44, borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.inputBg, color: colors.textPrimary, padding: "0 14px", fontFamily: "inherit" }} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Time</p>
              <input type="time" value={dateTime.time} onChange={(e) => setDateTime((c) => ({ ...c, time: e.target.value }))} required
                style={{ width: "100%", height: 44, borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.inputBg, color: colors.textPrimary, padding: "0 14px", fontFamily: "inherit" }} />
            </div>
          </div>
          {/* ✅ Info Banner — Blood Pressure */}
          {type === "blood_pressure" && (
            <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
              <div style={{ fontSize: 13, color: "#92400E", fontWeight: 600, lineHeight: 1.6 }}>
                <div>Systolic (SYS): <strong>50 – 300 mmHg</strong></div>
                <div>Diastolic (DIA): <strong>30 – 200 mmHg</strong></div>
                <div style={{ fontWeight: 400, marginTop: 2 }}>Normal range: 90–119 / 60–79 mmHg</div>
              </div>
            </div>
          )}
          {/* ✅ Info Banner — Oxygen */}
          {type === "oxygen" && (
            <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
              <div style={{ fontSize: 13, color: "#92400E", fontWeight: 600, lineHeight: 1.7 }}>
                <div>🟢 Normal: <strong>95% – 100%</strong></div>
                <div>🟡 Slightly Low: <strong>90% – 94%</strong></div>
                <div>🔴 Low — Concerning: <strong>below 90%</strong></div>
                <div style={{ fontWeight: 400, marginTop: 4, fontSize: 12 }}>⚠️ This reading is approximate and not for medical diagnosis.</div>
              </div>
            </div>
          )}
          {/* ✅ Info Banner — Heart Rate */}
          {type === "heart_rate" && (
            <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
              <p style={{ fontSize: 13, color: "#92400E", margin: 0, fontWeight: 600 }}>
                Valid heart rate range: <strong>50 – 170 bpm</strong>
              </p>
            </div>
          )}
          {/* ✅ Blood Glucose — Type Toggle + Info Banner */}
          {type === "blood_sugar" && (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 10, background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 3 }}>
                {(["fasting", "random"] as const).map((opt) => (
                  <button key={opt} type="button" onClick={() => setGlucoseType(opt)}
                    style={{ flex: 1, height: 32, borderRadius: 8, border: "none", background: glucoseType === opt ? "#0F2A5C" : "transparent", color: glucoseType === opt ? "white" : colors.textMuted, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
                    {opt === "fasting" ? "Fasting" : "Random"}
                  </button>
                ))}
              </div>
              {glucoseType === "fasting" ? (
                <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
                  <div style={{ fontSize: 13, color: "#92400E", fontWeight: 600, lineHeight: 1.7 }}>
                    <div style={{ marginBottom: 2 }}>Fasting Blood Glucose</div>
                    <div>🟢 Normal: <strong>70 – 99 mg/dL</strong></div>
                    <div>🟡 Pre-Diabetic: <strong>100 – 125 mg/dL</strong></div>
                    <div>🔴 High: <strong>≥ 126 mg/dL</strong></div>
                    <div>🔴 Low: <strong>&lt; 70 mg/dL</strong></div>
                  </div>
                </div>
              ) : (
                <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
                  <div style={{ fontSize: 13, color: "#92400E", fontWeight: 600, lineHeight: 1.7 }}>
                    <div style={{ marginBottom: 2 }}>Random Blood Glucose</div>
                    <div>🟢 Normal: <strong>&lt; 140 mg/dL</strong></div>
                    <div>🟡 Elevated: <strong>140 – 199 mg/dL</strong></div>
                    <div>🔴 Very High: <strong>≥ 200 mg/dL</strong></div>
                    <div>🔴 Low: <strong>&lt; 70 mg/dL</strong></div>
                  </div>
                </div>
              )}
            </>
          )}
          {/* Value Input */}
          {type === "blood_pressure" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 14 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Systolic</p>
                <input type="number" min={40} max={260} value={systolic} onChange={(e) => setSystolic(e.target.value)} required
                  style={{ width: "100%", height: 44, borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.inputBg, color: colors.textPrimary, padding: "0 14px", fontFamily: "inherit" }} />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Diastolic</p>
                <input type="number" min={20} max={180} value={diastolic} onChange={(e) => setDiastolic(e.target.value)} required
                  style={{ width: "100%", height: 44, borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.inputBg, color: colors.textPrimary, padding: "0 14px", fontFamily: "inherit" }} />
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                {type === "heart_rate" ? "BPM" : type === "oxygen" ? "SpO₂ %" : "mg/dL"}
              </p>
              <input type="number" value={value} onChange={(e) => setValue(e.target.value)} required
                min={type === "heart_rate" ? 50 : undefined}
                max={type === "heart_rate" ? 170 : undefined}
                placeholder={type === "heart_rate" ? "50 – 170 bpm" : undefined}
                style={{
                  width: "100%", height: 44, borderRadius: 12,
                  border: `1.5px solid ${type === "heart_rate" && value ? (Number(value) < 50 || Number(value) > 170 ? "#EF4444" : colors.border) : colors.border}`,
                  background: colors.inputBg, color: colors.textPrimary,
                  padding: "0 14px", fontFamily: "inherit", boxSizing: "border-box",
                }} />
            </div>
          )}
          {/* ✅ Error Banner */}
          {error && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M9 2L16.5 15H1.5L9 2Z" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 7V10M9 13H9.01" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p style={{ color: "#DC2626", fontSize: 13, margin: 0, fontWeight: 600, lineHeight: 1.4 }}>{error}</p>
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" disabled={saving}
              style={{ flex: 1, height: 46, borderRadius: 12, border: "none", background: "#0F2A5C", color: "white", fontWeight: 700, cursor: saving ? "wait" : "pointer", fontFamily: "inherit" }}>
              {saving ? "Saving..." : "Save Reading"}
            </button>
            <button type="button" onClick={onClose}
              style={{ width: 120, height: 46, borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.cardBg, color: colors.textSecondary, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}