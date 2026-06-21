import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { buildFullName, calculateAge, formatDateOfBirth, saveStoredProfile } from "../lib/profile-storage";
import { profileConditionsToBackend, profileGenderToBackend } from "../lib/health-data";
import { getApiErrorMessage, register, setAuthToken } from "../lib/api";
// ─── Country phone rules ───────────────────────────────────────────────────────
const COUNTRY_PHONE_RULES: Record<string, { min: number; max: number }> = {
  "+966": { min: 9, max: 9 },
  "+20":  { min: 11, max: 11 },
  "+971": { min: 9, max: 9 },
  "+965": { min: 8, max: 8 },
  "+973": { min: 8, max: 8 },
  "+974": { min: 8, max: 8 },
};
// ─── Zod Schema ────────────────────────────────────────────────────────────────
const namePattern = /^[\p{L}\s'\-]+$/u;
const step1Schema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required.")
      .min(2, "First name must be at least 2 characters.")
      .max(49, "First name must not exceed 49 characters.")
      .regex(namePattern, "Name may only contain letters, spaces, hyphens, and apostrophes."),
    lastName: z
      .string()
      .trim()
      .min(1, "Last name is required.")
      .min(2, "Last name must be at least 2 characters.")
      .max(49, "Last name must not exceed 49 characters.")
      .regex(namePattern, "Name may only contain letters, spaces, hyphens, and apostrophes."),
    email: z
      .string()
      .trim()
      .min(1, "Email address is required.")
      .email("Please enter a valid email address."),
    phoneCountryCode: z.string().min(1),
    phoneNumber: z
      .string()
      .trim()
      .min(1, "Phone number is required.")
      .regex(/^\d+$/, "Phone number must contain digits only."),
    password: z
      .string()
      .min(1, "Password is required.")
      .min(8, "Password must be at least 8 characters."),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password."),
  })
  .superRefine((data, ctx) => {
    const rule = COUNTRY_PHONE_RULES[data.phoneCountryCode];
    if (rule && data.phoneNumber.length > 0) {
      if (data.phoneNumber.length < rule.min || data.phoneNumber.length > rule.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: rule.min === rule.max
            ? `Phone number must be exactly ${rule.min} digits for ${data.phoneCountryCode}.`
            : `Phone number must be between ${rule.min} and ${rule.max} digits for ${data.phoneCountryCode}.`,
          path: ["phoneNumber"],
        });
      } else if (/^(.)\1+$/.test(data.phoneNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Phone number cannot be all repeated digits.",
          path: ["phoneNumber"],
        });
      }
    }
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => data.firstName.trim().length + data.lastName.trim().length + 1 <= 100,
    {
      message: "Full name must not exceed 100 characters.",
      path: ["lastName"],
    }
  );
type Step1FormValues = z.infer<typeof step1Schema>;
// ─── Component ─────────────────────────────────────────────────────────────────
export function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState("Male");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [blood, setBlood] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [medicalConditions, setMedicalConditions] = useState<string[]>(["No Known Condition"]);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register: field,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneCountryCode: "+966",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });
  const phoneCountryCode = watch("phoneCountryCode");
  const bloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const countryCodes = ["+966", "+20", "+971", "+965", "+973", "+974"];
  const genderOptions = ["Male", "Female", "Other"];
  const medicalConditionOptions = [
    "No Known Condition", "Hypertension", "Hypotension",
    "Type 1 Diabetes", "Type 2 Diabetes", "Coronary Artery Disease",
    "Heart Failure", "Arrhythmia", "Asthma", "COPD",
    "Sleep Apnea", "Chronic Hypoxemia",
  ];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const years = Array.from({ length: 80 }, (_, i) => String(new Date().getFullYear() - 18 - i));
  function onStep1Valid() {
    setApiError(null);
    setStep(2);
  }
  function toggleMedicalCondition(condition: string) {
    setMedicalConditions((current) => {
      if (condition === "No Known Condition") return ["No Known Condition"];
      const withoutNone = current.filter((item) => item !== "No Known Condition");
      if (withoutNone.includes(condition)) {
        const next = withoutNone.filter((item) => item !== condition);
        return next.length ? next : ["No Known Condition"];
      }
      return [...withoutNone, condition];
    });
  }
  async function handleCreateAccount() {
    const values = getValues();
    const parsed = step1Schema.safeParse(values);
    if (!parsed.success) {
      setApiError("Please go back and fix the errors in Step 1.");
      setStep(1);
      return;
    }
    const { firstName, lastName, email, phoneNumber, password, confirmPassword } = parsed.data;
    const normalizedHeight = Number(height);
    const normalizedWeight = Number(weight);
    const name = buildFullName(firstName, lastName) || "New User";
    setSubmitting(true);
    setApiError(null);
    try {
      const response = await register({
        name,
        email,
        password,
        password_confirmation: confirmPassword,
        phone_country_code: phoneCountryCode,
        phone_number: phoneNumber.trim(),
        date_of_birth: dobDay && dobMonth && dobYear
          ? new Date(`${dobMonth} ${dobDay}, ${dobYear}`).toISOString().slice(0, 10)
          : undefined,
        gender: profileGenderToBackend(gender) ?? undefined,
        chronic_conditions: profileConditionsToBackend(medicalConditions),
      });
      setAuthToken(response.access_token);
      saveStoredProfile({
        id: `HS-${response.user.id}`,
        firstName, lastName, name, email,
        phoneCountryCode, phoneNumber, gender,
        bloodType: blood || "",
        dobDay, dobMonth, dobYear,
        age: calculateAge(dobDay, dobMonth, dobYear),
        height: Number.isFinite(normalizedHeight) ? normalizedHeight : 0,
        weight: Number.isFinite(normalizedWeight) ? normalizedWeight : 0,
        hospitalName,
        healthScore: 0, daysActive: 0, alertsThisMonth: 0,
        dateOfBirth: formatDateOfBirth(dobDay, dobMonth, dobYear),
        medicalConditions,
      });
      navigate("/dashboard");
    } catch (requestError) {
      setApiError(getApiErrorMessage(requestError, "Unable to create the account."));
    } finally {
      setSubmitting(false);
    }
  }
  const inputWrap = (hasError?: boolean): React.CSSProperties => ({
    background: hasError ? "#FFF5F5" : "#F8FAFD",
    border: `1.5px solid ${hasError ? "#FCA5A5" : "#E4EBF5"}`,
    borderRadius: 12, padding: "0 14px", height: 48,
    display: "flex", alignItems: "center",
  });
  const inputStyle: React.CSSProperties = {
    border: "none", background: "transparent", fontSize: 15,
    color: "#0F1F3D", outline: "none", width: "100%",
    fontFamily: "inherit", fontWeight: 500,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: "#8BA3C0",
    letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px",
  };
  const fieldErrorStyle: React.CSSProperties = {
    color: "#DC2626", fontSize: 12, margin: "5px 0 0", fontWeight: 500,
  };
  return (
    <div style={{
      minHeight: "100vh", background: "#FAFBFE",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif", padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: 500 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg, #0F2A5C, #1A6BCC)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
              <path d="M5 10H9V6H11V10H15" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="1.4" opacity="0.4"/>
            </svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#0F1F3D", letterSpacing: "-0.02em" }}>HealthSync</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: s <= step ? "#1A6BCC" : "#E4EBF5", transition: "background 0.3s",
            }} />
          ))}
        </div>
        <p style={{ fontSize: 12, color: "#B0C4DE", fontWeight: 600, margin: "0 0 20px", letterSpacing: "0.05em" }}>
          STEP {step} OF 2
        </p>
        <div style={{
          background: "white", borderRadius: 24, padding: "36px 40px",
          boxShadow: "0 8px 40px rgba(15,31,61,0.08)", border: "1px solid #E4EBF5",
        }}>
          {step === 1 && (
            <form onSubmit={handleSubmit(onStep1Valid)} noValidate>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F1F3D", margin: "0 0 4px", letterSpacing: "-0.03em" }}>
                Create your account
              </h1>
              <p style={{ fontSize: 15, color: "#8BA3C0", margin: "0 0 28px", fontWeight: 500 }}>
                Start your health journey today.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {(["firstName", "lastName"] as const).map((fieldName, i) => (
                  <div key={fieldName}>
                    <p style={labelStyle}>{i === 0 ? "First name" : "Last name"}</p>
                    <div style={inputWrap(!!errors[fieldName])}>
                      <input {...field(fieldName)} style={inputStyle} />
                    </div>
                    {errors[fieldName] && (
                      <p style={fieldErrorStyle}>{errors[fieldName]?.message}</p>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={labelStyle}>Email</p>
                <div style={{ ...inputWrap(!!errors.email), gap: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M2.5 4.5H15.5C15.78 4.5 16 4.72 16 5V13C16 13.28 15.78 13.5 15.5 13.5H2.5C2.22 13.5 2 13.28 2 13V5C2 4.72 2.22 4.5 2.5 4.5Z" stroke="#B0C4DE" strokeWidth="1.4"/>
                    <path d="M2 5.5L9 10L16 5.5" stroke="#B0C4DE" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  <input type="email" {...field("email")} style={{ ...inputStyle, flex: 1 }} />
                </div>
                {errors.email && <p style={fieldErrorStyle}>{errors.email.message}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={labelStyle}>Phone Number</p>
                <div style={{ display: "grid", gridTemplateColumns: "88px 1fr", gap: 8 }}>
                  <div style={{
                    background: "#F8FAFD", border: "1.5px solid #E4EBF5",
                    borderRadius: 12, padding: "0 12px", height: 48,
                    display: "flex", alignItems: "center", position: "relative",
                  }}>
                    <select value={phoneCountryCode} onChange={e => setValue("phoneCountryCode", e.target.value)}
                      style={{
                        border: "none", background: "transparent", fontSize: 15, color: "#0F1F3D",
                        outline: "none", width: "100%", fontFamily: "inherit", fontWeight: 600,
                        appearance: "none", WebkitAppearance: "none", paddingRight: 18, cursor: "pointer",
                      }}>
                      {countryCodes.map(code => <option key={code} value={code}>{code}</option>)}
                    </select>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                      style={{ position: "absolute", right: 12, pointerEvents: "none" }}>
                      <path d="M3.5 5.5L7 9L10.5 5.5" stroke="#B0C4DE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div style={inputWrap(!!errors.phoneNumber)}>
                    <input type="tel" inputMode="numeric"
                      {...field("phoneNumber", { onChange: (e) => { e.target.value = e.target.value.replace(/\D/g, ""); } })}
                      style={inputStyle} />
                  </div>
                </div>
                {errors.phoneNumber && <p style={fieldErrorStyle}>{errors.phoneNumber.message}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={labelStyle}>Password</p>
                <div style={{
                  background: errors.password ? "#FFF5F5" : "#EBF3FF",
                  border: `1.5px solid ${errors.password ? "#FCA5A5" : "#C3DAFE"}`,
                  borderRadius: 12, padding: "0 14px", height: 48,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="3.5" y="8.5" width="11" height="8" rx="1.5" stroke="#1A6BCC" strokeWidth="1.4"/>
                    <path d="M6 8.5V5.5C6 3.84 7.34 2.5 9 2.5C10.66 2.5 12 3.84 12 5.5V8.5" stroke="#1A6BCC" strokeWidth="1.4" strokeLinecap="round"/>
                    <circle cx="9" cy="13" r="1.2" fill="#1A6BCC"/>
                  </svg>
                  <input type="password" {...field("password")} style={{ ...inputStyle, flex: 1 }} />
                </div>
                {errors.password && <p style={fieldErrorStyle}>{errors.password.message}</p>}
              </div>
              <div style={{ marginBottom: 24 }}>
                <p style={labelStyle}>Confirm Password</p>
                <div style={{ ...inputWrap(!!errors.confirmPassword), gap: 10 }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="3.5" y="8.5" width="11" height="8" rx="1.5" stroke="#B0C4DE" strokeWidth="1.4"/>
                    <path d="M6 8.5V5.5C6 3.84 7.34 2.5 9 2.5C10.66 2.5 12 3.84 12 5.5V8.5" stroke="#B0C4DE" strokeWidth="1.4" strokeLinecap="round"/>
                    <circle cx="9" cy="13" r="1.2" fill="#B0C4DE"/>
                  </svg>
                  <input type="password" {...field("confirmPassword")} style={{ ...inputStyle, flex: 1 }} />
                </div>
                {errors.confirmPassword && <p style={fieldErrorStyle}>{errors.confirmPassword.message}</p>}
              </div>
              <button type="submit" style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", height: 52, borderRadius: 14, background: "#0F2A5C",
                color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer",
                letterSpacing: "-0.01em", marginBottom: 20, border: "none", fontFamily: "inherit",
              }}>
                Continue
              </button>
              <p style={{ textAlign: "center", fontSize: 14, color: "#8BA3C0", margin: 0, fontWeight: 500 }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "#1A6BCC", fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
              </p>
            </form>
          )}
          {step === 2 && (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F1F3D", margin: "0 0 4px", letterSpacing: "-0.03em" }}>
                Health profile
              </h1>
              <p style={{ fontSize: 15, color: "#8BA3C0", margin: "0 0 24px", fontWeight: 500 }}>
                Help us personalize your experience.
              </p>
              <div style={{ marginBottom: 16 }}>
                <p style={labelStyle}>Gender</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {genderOptions.map(option => (
                    <button key={option} type="button" onClick={() => setGender(option)} style={{
                      height: 44, borderRadius: 12,
                      border: `1.5px solid ${gender === option ? "#1A6BCC" : "#E4EBF5"}`,
                      background: gender === option ? "#EBF3FF" : "#F8FAFD",
                      color: gender === option ? "#1A6BCC" : "#4A6080",
                      fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    }}>{option}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={labelStyle}>Date of Birth</p>
                <div style={{ display: "grid", gridTemplateColumns: "88px 1fr 96px", gap: 8 }}>
                  {[
                    { value: dobDay,   setter: setDobDay,   placeholder: "Day",   options: days   },
                    { value: dobMonth, setter: setDobMonth, placeholder: "Month", options: months },
                    { value: dobYear,  setter: setDobYear,  placeholder: "Year",  options: years  },
                  ].map(f => (
                    <div key={f.placeholder} style={{
                      background: "#F8FAFD", border: "1.5px solid #E4EBF5",
                      borderRadius: 12, padding: "0 12px", height: 48,
                      display: "flex", alignItems: "center", position: "relative",
                    }}>
                      <select value={f.value} onChange={e => f.setter(e.target.value)} style={{
                        border: "none", background: "transparent", fontSize: 15,
                        color: f.value ? "#0F1F3D" : "#8BA3C0", outline: "none",
                        width: "100%", fontFamily: "inherit", fontWeight: 500,
                        appearance: "none", WebkitAppearance: "none", paddingRight: 18, cursor: "pointer",
                      }}>
                        <option value="" disabled>{f.placeholder}</option>
                        {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                        style={{ position: "absolute", right: 12, pointerEvents: "none" }}>
                        <path d="M3.5 5.5L7 9L10.5 5.5" stroke="#B0C4DE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "Height", unit: "cm", value: height, setter: setHeight },
                  { label: "Weight", unit: "kg", value: weight, setter: setWeight },
                ].map((f, i) => (
                  <div key={i} style={{ minWidth: 0 }}>
                    <p style={labelStyle}>{f.label}</p>
                    <div style={{ ...inputWrap(), gap: 8, width: "100%", boxSizing: "border-box" }}>
                      <input type="number" value={f.value}
                        onChange={e => f.setter(e.target.value)}
                        style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
                      <span style={{ fontSize: 13, color: "#B0C4DE", fontWeight: 600 }}>{f.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={labelStyle}>Blood Type</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {bloodTypes.map(bt => (
                    <button key={bt} type="button" onClick={() => setBlood(bt)} style={{
                      width: 52, height: 42, borderRadius: 10,
                      border: `1.5px solid ${blood === bt ? "#1A6BCC" : "#E4EBF5"}`,
                      background: blood === bt ? "#EBF3FF" : "#F8FAFD",
                      color: blood === bt ? "#1A6BCC" : "#4A6080",
                      fontSize: 13, fontWeight: 700, cursor: "pointer",
                      fontFamily: "inherit", transition: "all 0.15s",
                    }}>{bt}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <p style={labelStyle}>Hospital Name</p>
                <div style={inputWrap()}>
                  <input value={hospitalName} onChange={e => setHospitalName(e.target.value)}
                    style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <p style={labelStyle}>Medical Conditions</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {medicalConditionOptions.map(condition => {
                    const isSelected = medicalConditions.includes(condition);
                    return (
                      <button key={condition} type="button" onClick={() => toggleMedicalCondition(condition)} style={{
                        minHeight: 38, padding: "8px 12px", borderRadius: 12,
                        border: `1.5px solid ${isSelected ? "#1A6BCC" : "#E4EBF5"}`,
                        background: isSelected ? "#EBF3FF" : "#F8FAFD",
                        color: isSelected ? "#1A6BCC" : "#4A6080",
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                        fontFamily: "inherit", textAlign: "left",
                      }}>{condition}</button>
                    );
                  })}
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#B0C4DE", margin: "0 0 20px", fontWeight: 500 }}>
                These fields are optional and can be updated in your profile anytime.
              </p>
              {apiError && <p style={{ color: "#DC2626", fontSize: 13, margin: "0 0 12px" }}>{apiError}</p>}
              <button type="button" onClick={handleCreateAccount} disabled={submitting} style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", height: 52, borderRadius: 14,
                background: "linear-gradient(135deg, #0F2A5C, #1A6BCC)",
                color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer",
                letterSpacing: "-0.01em", marginBottom: 12, border: "none",
                fontFamily: "inherit", opacity: submitting ? 0.7 : 1,
              }}>
                {submitting ? "Creating Account..." : "Create Account"}
              </button>
              <button type="button" onClick={() => setStep(1)} style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", height: 44, borderRadius: 12, background: "none",
                border: "1.5px solid #E4EBF5", color: "#8BA3C0",
                fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
                Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}