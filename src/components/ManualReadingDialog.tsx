

import React from "react";
import { createVital } from "../lib/api";
import { useApp } from "../contexts/AppContext";

type VitalType = "blood_pressure" | "heart_rate" | "oxygen" | "blood_sugar";

interface ManualReadingDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
  initialType?: VitalType;
  allowMulti?: boolean;
}

export function ManualReadingDialog({
  open,
  onClose,
  onSaved,
  initialType = "heart_rate",
  allowMulti = true,
}: ManualReadingDialogProps) {
  const { colors, t, language } = useApp();
  const isAR = language === "AR";

  const [dateTime, setDateTime] = React.useState({ date: "", time: "" });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [readings, setReadings] = React.useState({
    heart_rate: "",
    oxygen: "",
    blood_sugar: "",
    systolic: "",
    diastolic: "",
  });

  React.useEffect(() => {
    if (!open) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    setDateTime({ date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` });
    setError(null);
    setReadings({ heart_rate: "", oxygen: "", blood_sugar: "", systolic: "", diastolic: "" });
  }, [open]);

  const measuredAt = React.useMemo(() => {
    try {
      return new Date(`${dateTime.date}T${dateTime.time}`).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }, [dateTime]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const promises: Promise<any>[] = [];
      if (readings.heart_rate) promises.push(createVital({ type: "heart_rate", measured_at: measuredAt, value: Number(readings.heart_rate), source: "manual" }));
      if (readings.oxygen) promises.push(createVital({ type: "oxygen", measured_at: measuredAt, value: Number(readings.oxygen), source: "manual" }));
      if (readings.blood_sugar) promises.push(createVital({ type: "blood_sugar", measured_at: measuredAt, value: Number(readings.blood_sugar), source: "manual" }));
      if (readings.systolic && readings.diastolic) {
        promises.push(createVital({ type: "blood_pressure", measured_at: measuredAt, systolic: Number(readings.systolic), diastolic: Number(readings.diastolic), source: "manual" }));
      }

      if (promises.length === 0) {
        throw new Error(isAR ? "أدخل على الأقل قراءة واحدة" : "Enter at least one reading");
      }

      await Promise.all(promises);
      setReadings({ heart_rate: "", oxygen: "", blood_sugar: "", systolic: "", diastolic: "" });
      await onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : isAR ? "خطأ في الحفظ" : "Error saving");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,31,61,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100, boxSizing: "border-box" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: allowMulti ? 520 : 460, background: colors.cardBg, borderRadius: 20, border: `1px solid ${colors.border}`, padding: 24, direction: isAR ? "rtl" : "ltr", boxSizing: "border-box" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: colors.textPrimary }}>
            {t(allowMulti ? "dash_logReading" : "vitals_addReading")}
          </h2>
          <button onClick={onClose} style={{ fontSize: 28, background: "none", border: "none", color: colors.textMuted }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>{t("common_date") || (isAR ? "التاريخ" : "Date")}</p>
              <input type="date" value={dateTime.date} onChange={e => setDateTime(c => ({...c, date: e.target.value}))} required style={{ width: "100%", padding: "12px", borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.inputBg, boxSizing: "border-box" }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>{t("common_time") || (isAR ? "الوقت" : "Time")}</p>
              <input type="time" value={dateTime.time} onChange={e => setDateTime(e => ({...e, time: e.target.value}))} required style={{ width: "100%", padding: "12px", borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.inputBg, boxSizing: "border-box" }} />
            </div>
          </div>

          {allowMulti ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>{t("vital_hr")}</p>
                <input type="number" value={readings.heart_rate} onChange={e => setReadings(r => ({...r, heart_rate: e.target.value}))} placeholder="78" style={{width:"100%", padding:"12px", borderRadius:12, border:`1.5px solid ${colors.border}`, background: colors.inputBg, boxSizing: "border-box"}} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>{t("vital_oxygen")}</p>
                <input type="number" value={readings.oxygen} onChange={e => setReadings(r => ({...r, oxygen: e.target.value}))} placeholder="97" style={{width:"100%", padding:"12px", borderRadius:12, border:`1.5px solid ${colors.border}`, background: colors.inputBg, boxSizing: "border-box"}} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>{t("vital_glucose")}</p>
                <input type="number" value={readings.blood_sugar} onChange={e => setReadings(r => ({...r, blood_sugar: e.target.value}))} placeholder="105" style={{width:"100%", padding:"12px", borderRadius:12, border:`1.5px solid ${colors.border}`, background: colors.inputBg, boxSizing: "border-box"}} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>{t("vital_bp")}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <input type="number" value={readings.systolic} onChange={e => setReadings(r => ({...r, systolic: e.target.value}))} placeholder="120" style={{width:"100%", padding:"12px", borderRadius:12, border:`1.5px solid ${colors.border}`, background: colors.inputBg, boxSizing: "border-box"}} />
                  <input type="number" value={readings.diastolic} onChange={e => setReadings(r => ({...r, diastolic: e.target.value}))} placeholder="80" style={{width:"100%", padding:"12px", borderRadius:12, border:`1.5px solid ${colors.border}`, background: colors.inputBg, boxSizing: "border-box"}} />
                </div>
              </div>
            </div>
          ) : (
            <div>
              {initialType === "heart_rate" && (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>{t("vital_hr")}</p>
                  <input type="number" value={readings.heart_rate} onChange={e => setReadings(r => ({...r, heart_rate: e.target.value}))} placeholder="78" required style={{width:"100%", padding:"12px", borderRadius:12, border:`1.5px solid ${colors.border}`, background: colors.inputBg, boxSizing: "border-box"}} />
                </div>
              )}
              {initialType === "oxygen" && (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>{t("vital_oxygen")}</p>
                  <input type="number" value={readings.oxygen} onChange={e => setReadings(r => ({...r, oxygen: e.target.value}))} placeholder="97" required style={{width:"100%", padding:"12px", borderRadius:12, border:`1.5px solid ${colors.border}`, background: colors.inputBg, boxSizing: "border-box"}} />
                </div>
              )}
              {initialType === "blood_sugar" && (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 6 }}>{t("vital_glucose")}</p>
                  <input type="number" value={readings.blood_sugar} onChange={e => setReadings(r => ({...r, blood_sugar: e.target.value}))} placeholder="105" required style={{width:"100%", padding:"12px", borderRadius:12, border:`1.5px solid ${colors.border}`, background: colors.inputBg, boxSizing: "border-box"}} />
                </div>
              )}
              {initialType === "blood_pressure" && (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 8 }}>{t("vital_bp")}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>{t("history_systolic")}</p>
                      <input type="number" value={readings.systolic} onChange={e => setReadings(r => ({...r, systolic: e.target.value}))} placeholder="120" required style={{width:"100%", padding:"12px", borderRadius:12, border:`1.5px solid ${colors.border}`, background: colors.inputBg, boxSizing: "border-box"}} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>{t("history_diastolic")}</p>
                      <input type="number" value={readings.diastolic} onChange={e => setReadings(r => ({...r, diastolic: e.target.value}))} placeholder="80" required style={{width:"100%", padding:"12px", borderRadius:12, border:`1.5px solid ${colors.border}`, background: colors.inputBg, boxSizing: "border-box"}} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <p style={{ color: "#ef4444", textAlign: "center", margin: "12px 0" }}>{error}</p>}

          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "14px", borderRadius: 12, border: `1.5px solid ${colors.border}`, background: colors.cardBg, color: colors.textSecondary }}>
              {t("common_cancel") || "إلغاء"}
            </button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: "14px", borderRadius: 12, background: "#0F2A5C", color: "white", fontWeight: 700, border: "none" }}>
              {saving ? (isAR ? "جاري الحفظ..." : "Saving...") : (t("vitals_addReading") || "حفظ")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}