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
  { value: "heart_rate", label: "Heart Rate" },
  { value: "oxygen", label: "Blood Oxygen" },
  { value: "blood_sugar", label: "Blood Glucose" },
];

function getInitialDateTime() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString();
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

export function ManualReadingDialog({
  open,
  onClose,
  onSaved,
  initialType = "blood_pressure",
  allowTypeSelection = true,
}: ManualReadingDialogProps) {
  const { colors } = useApp();
  const [type, setType] = React.useState<VitalType>(initialType);
  const [dateTime, setDateTime] = React.useState(getInitialDateTime);
  const [value, setValue] = React.useState("");
  const [systolic, setSystolic] = React.useState("");
  const [diastolic, setDiastolic] = React.useState("");
  const [glucoseType, setGlucoseType] = React.useState<"fasting" | "random">("fasting");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setType(initialType);
    setDateTime(getInitialDateTime());
    setValue("");
    setSystolic("");
    setDiastolic("");
    setGlucoseType("fasting");
    setError(null);
  }, [initialType, open]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    if (type === "blood_pressure") {
      const sysNum = Number(systolic);
      const diaNum = Number(diastolic);
      if (!systolic || !diastolic || Number.isNaN(sysNum) || Number.isNaN(diaNum)) {
        setError("Please enter both systolic and diastolic values.");
        setSaving(false);
        return;
      }
      if (sysNum < 50 || sysNum > 300) {
        setError("Systolic value must be between 50 and 300 mmHg. Please check your reading.");
        setSaving(false);
        return;
      }
      if (diaNum < 30 || diaNum > 200) {
        setError("Diastolic value must be between 30 and 200 mmHg. Please check your reading.");
        setSaving(false);
        return;
      }
      if (diaNum >= sysNum) {
        setError("Diastolic must be lower than Systolic. Please check your reading.");
        setSaving(false);
        return;
      }
    }

    if (type === "oxygen") {
      const numVal = Number(value);
      if (!value || Number.isNaN(numVal)) {
        setError("Please enter an oxygen saturation value.");
        setSaving(false);
        return;
      }
      if (numVal < 50 || numVal > 100) {
        setError("SpO2 must be between 50% and 100%. Please check your reading.");
        setSaving(false);
        return;
      }
    }

    if (type === "heart_rate") {
      const numVal = Number(value);
      if (!value || Number.isNaN(numVal)) {
        setError("Please enter a heart rate value.");
        setSaving(false);
        return;
      }
      if (numVal < 50) {
        setError("Heart rate is too low. Minimum allowed value is 50 bpm.");
        setSaving(false);
        return;
      }
      if (numVal > 170) {
        setError("Heart rate is too high. Maximum allowed value is 170 bpm.");
        setSaving(false);
        return;
      }
    }

    if (type === "blood_sugar") {
      const numVal = Number(value);
      if (!value || Number.isNaN(numVal)) {
        setError("Please enter a blood glucose value.");
        setSaving(false);
        return;
      }
      if (numVal < 20 || numVal > 600) {
        setError("Blood glucose must be between 20 and 600 mg/dL. Please check your reading.");
        setSaving(false);
        return;
      }
    }

    try {
      const measuredAt = new Date(`${dateTime.date}T${dateTime.time}`).toISOString();
      const payload =
        type === "blood_pressure"
          ? {
              type,
              measured_at: measuredAt,
              systolic: Number(systolic),
              diastolic: Number(diastolic),
              source: "manual" as const,
            }
          : {
              type,
              measured_at: measuredAt,
              value: Number(value),
              source: "manual" as const,
            };

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
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,31,61,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 60,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          background: colors.cardBg,
          borderRadius: 20,
          border: `1px solid ${colors.border}`,
          boxShadow: "0 20px 40px rgba(15,31,61,0.18)",
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, margin: "0 0 4px" }}>
              Add Manual Reading
            </h2>
            <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>
              Save a new reading to your HealthSync history.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: colors.textMuted,
              fontSize: 24,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {allowTypeSelection && (
            <div style={{ marginBottom: 14 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: colors.textMuted,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  margin: "0 0 8px",
                }}
              >
                Vital Type
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                {vitalOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    style={{
                      height: 42,
                      borderRadius: 10,
                      border: `1.5px solid ${type === option.value ? colors.accentBlue : colors.border}`,
                      background: type === option.value ? colors.navActiveBg : colors.inputBg,
                      color: type === option.value ? colors.accentBlue : colors.textSecondary,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 14 }}>
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: colors.textMuted,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  margin: "0 0 8px",
                }}
              >
                Date
              </p>
              <input
                type="date"
                value={dateTime.date}
                onChange={(e) => setDateTime((c) => ({ ...c, date: e.target.value }))}
                required
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 12,
                  border: `1.5px solid ${colors.border}`,
                  background: colors.inputBg,
                  color: colors.textPrimary,
                  padding: "0 14px",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: colors.textMuted,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  margin: "0 0 8px",
                }}
              >
                Time
              </p>
              <input
                type="time"
                value={dateTime.time}
                onChange={(e) => setDateTime((c) => ({ ...c, time: e.target.value }))}
                required
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 12,
                  border: `1.5px solid ${colors.border}`,
                  background: colors.inputBg,
                  color: colors.textPrimary,
                  padding: "0 14px",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {type === "blood_pressure" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 14 }}>
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: colors.textMuted,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    margin: "0 0 8px",
                  }}
                >
                  Systolic
                </p>
                <input
                  type="number"
                  min={40}
                  max={260}
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    height: 44,
                    borderRadius: 12,
                    border: `1.5px solid ${colors.border}`,
                    background: colors.inputBg,
                    color: colors.textPrimary,
                    padding: "0 14px",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: colors.textMuted,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    margin: "0 0 8px",
                  }}
                >
                  Diastolic
                </p>
                <input
                  type="number"
                  min={20}
                  max={180}
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    height: 44,
                    borderRadius: 12,
                    border: `1.5px solid ${colors.border}`,
                    background: colors.inputBg,
                    color: colors.textPrimary,
                    padding: "0 14px",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: colors.textMuted,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  margin: "0 0 8px",
                }}
              >
                {type === "heart_rate" ? "BPM" : type === "oxygen" ? "SpO2 %" : "mg/dL"}
              </p>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                min={type === "heart_rate" ? 50 : undefined}
                max={type === "heart_rate" ? 170 : undefined}
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 12,
                  border: `1.5px solid ${colors.border}`,
                  background: colors.inputBg,
                  color: colors.textPrimary,
                  padding: "0 14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {error && (
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 12,
                padding: "12px 14px",
                marginBottom: 12,
              }}
            >
              <p style={{ color: "#DC2626", fontSize: 13, margin: 0, fontWeight: 600, lineHeight: 1.4 }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 12,
                border: "none",
                background: "#0F2A5C",
                color: "white",
                fontWeight: 700,
                cursor: saving ? "wait" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {saving ? "Saving..." : "Save Reading"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 120,
                height: 46,
                borderRadius: 12,
                border: `1.5px solid ${colors.border}`,
                background: colors.cardBg,
                color: colors.textSecondary,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
