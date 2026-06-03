import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { buildFullName, calculateAge, formatDateOfBirth, saveStoredProfile } from "../lib/profile-storage";
import { profileConditionsToBackend, profileGenderToBackend } from "../lib/health-data";
import { getApiErrorMessage, register, setAuthToken } from "../lib/api";

export function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+966");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
  const [error, setError] = useState<string | null>(null);

  const bloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const countryCodes = ["+966", "+20", "+971", "+965", "+973", "+974"];
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

  function validateStepOne(): string | null {
    if (!firstName.trim() || !lastName.trim()) {
      return "Please enter your first and last name.";
    }

    if (!email.trim()) {
      return "Please enter your email address.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      return "Please enter a valid email address.";
    }

    if (!phoneNumber.trim()) {
      return "Please enter your phone number.";
    }

    if (!/^\d{6,15}$/.test(phoneNumber.trim())) {
      return "Please enter a valid phone number using digits only.";
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return null;
  }

  function handleContinue() {
    const validationError = validateStepOne();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
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
    const stepOneError = validateStepOne();

    if (stepOneError) {
      setError(stepOneError);
      setStep(1);
      return;
    }

    const normalizedHeight = Number(height);
    const normalizedWeight = Number(weight);
    const name = buildFullName(firstName, lastName) || "New User";

    setSubmitting(true);
    setError(null);

    try {
      const response = await register({
        name,
        email,
        password,
        password_confirmation: confirmPassword,
        phone_country_code: phoneCountryCode,
        phone_number: phoneNumber.trim(),
        date_of_birth: dobDay && dobMonth && dobYear ? new Date(`${dobMonth} ${dobDay}, ${dobYear}`).toISOString().slice(0, 10) : undefined,
        gender: profileGenderToBackend(gender) ?? undefined,
        chronic_conditions: profileConditionsToBackend(medicalConditions),
      });

      setAuthToken(response.access_token);

      saveStoredProfile({
        id: `HS-${response.user.id}`,
      firstName,
      lastName,
        name,
      email,
      phoneCountryCode,
      phoneNumber,
      gender,
      bloodType: blood || "",
      dobDay,
      dobMonth,
      dobYear,
      age: calculateAge(dobDay, dobMonth, dobYear),
      height: Number.isFinite(normalizedHeight) ? normalizedHeight : 0,
      weight: Number.isFinite(normalizedWeight) ? normalizedWeight : 0,
      hospitalName,
      healthScore: 0,
      daysActive: 0,
      alertsThisMonth: 0,
      dateOfBirth: formatDateOfBirth(dobDay, dobMonth, dobYear),
      medicalConditions,
      });

      navigate("/dashboard");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to create the account."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FAFBFE",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif",
      padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: 500 }}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg, #0F2A5C, #1A6BCC)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
              <path d="M5 10H9V6H11V10H15" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="1.4" opacity="0.4"/>
            </svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#0F1F3D", letterSpacing: "-0.02em" }}>HealthSync</span>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: s <= step ? "#1A6BCC" : "#E4EBF5",
              transition: "background 0.3s",
            }} />
          ))}
        </div>
        <p style={{ fontSize: 12, color: "#B0C4DE", fontWeight: 600, margin: "0 0 20px", letterSpacing: "0.05em" }}>
          STEP {step} OF 2
        </p>

        {/* Card */}
        <div style={{
          background: "white",
          borderRadius: 24,
          padding: "36px 40px",
          boxShadow: "0 8px 40px rgba(15,31,61,0.08)",
          border: "1px solid #E4EBF5",
        }}>

          {step === 1 ? (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F1F3D", margin: "0 0 4px", letterSpacing: "-0.03em" }}>
                Create your account
              </h1>
              <p style={{ fontSize: 15, color: "#8BA3C0", margin: "0 0 28px", fontWeight: 500 }}>
                Start your health journey today.
              </p>

              {/* Name row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {["First name", "Last name"].map((label, i) => (
                  <div key={i}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#8BA3C0", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>{label}</p>
                    <div style={{
                      background: "#F8FAFD",
                      border: "1.5px solid #E4EBF5",
                      borderRadius: 12,
                      padding: "0 14px",
                      height: 48,
                      display: "flex",
                      alignItems: "center",
                    }}>
                      <input
                        value={i === 0 ? firstName : lastName}
                        onChange={(e) => (i === 0 ? setFirstName(e.target.value) : setLastName(e.target.value))}
                        placeholder={i === 0 ? "Ahmad" : "Al-Rashidi"}
                        style={{ border: "none", background: "transparent", fontSize: 15, color: "#0F1F3D", outline: "none", width: "100%", fontFamily: "inherit", fontWeight: 500 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#8BA3C0", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Email</p>
                <div style={{
                  background: "#F8FAFD",
                  border: "1.5px solid #E4EBF5",
                  borderRadius: 12,
                  padding: "0 14px",
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M2.5 4.5H15.5C15.78 4.5 16 4.72 16 5V13C16 13.28 15.78 13.5 15.5 13.5H2.5C2.22 13.5 2 13.28 2 13V5C2 4.72 2.22 4.5 2.5 4.5Z" stroke="#B0C4DE" strokeWidth="1.4"/>
                    <path d="M2 5.5L9 10L16 5.5" stroke="#B0C4DE" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={{ border: "none", background: "transparent", fontSize: 15, color: "#0F1F3D", outline: "none", flex: 1, fontFamily: "inherit", fontWeight: 500 }}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#8BA3C0", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Phone Number</p>
                <div style={{ display: "grid", gridTemplateColumns: "88px 1fr", gap: 8 }}>
                  <div style={{
                    background: "#F8FAFD",
                    border: "1.5px solid #E4EBF5",
                    borderRadius: 12,
                    padding: "0 12px",
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    position: "relative",
                  }}>
                    <select
                      value={phoneCountryCode}
                      onChange={e => setPhoneCountryCode(e.target.value)}
                      style={{
                        border: "none",
                        background: "transparent",
                        fontSize: 15,
                        color: "#0F1F3D",
                        outline: "none",
                        width: "100%",
                        fontFamily: "inherit",
                        fontWeight: 600,
                        appearance: "none",
                        WebkitAppearance: "none",
                        MozAppearance: "none",
                        paddingRight: 18,
                        cursor: "pointer",
                      }}
                    >
                      {countryCodes.map(code => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </select>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: "absolute", right: 12, pointerEvents: "none" }}>
                      <path d="M3.5 5.5L7 9L10.5 5.5" stroke="#B0C4DE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div style={{
                    background: "#F8FAFD",
                    border: "1.5px solid #E4EBF5",
                    borderRadius: 12,
                    padding: "0 14px",
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                  }}>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="5X XXX XXXX"
                      style={{ border: "none", background: "transparent", fontSize: 15, color: "#0F1F3D", outline: "none", width: "100%", fontFamily: "inherit", fontWeight: 500 }}
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#8BA3C0", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Password</p>
                <div style={{
                  background: "#EBF3FF",
                  border: "1.5px solid #C3DAFE",
                  borderRadius: 12,
                  padding: "0 14px",
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="3.5" y="8.5" width="11" height="8" rx="1.5" stroke="#1A6BCC" strokeWidth="1.4"/>
                    <path d="M6 8.5V5.5C6 3.84 7.34 2.5 9 2.5C10.66 2.5 12 3.84 12 5.5V8.5" stroke="#1A6BCC" strokeWidth="1.4" strokeLinecap="round"/>
                    <circle cx="9" cy="13" r="1.2" fill="#1A6BCC"/>
                  </svg>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    style={{ border: "none", background: "transparent", fontSize: 15, color: "#0F1F3D", outline: "none", flex: 1, fontFamily: "inherit", fontWeight: 500 }}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#8BA3C0", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Confirm Password</p>
                <div style={{
                  background: "#F8FAFD",
                  border: "1.5px solid #E4EBF5",
                  borderRadius: 12,
                  padding: "0 14px",
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="3.5" y="8.5" width="11" height="8" rx="1.5" stroke="#B0C4DE" strokeWidth="1.4"/>
                    <path d="M6 8.5V5.5C6 3.84 7.34 2.5 9 2.5C10.66 2.5 12 3.84 12 5.5V8.5" stroke="#B0C4DE" strokeWidth="1.4" strokeLinecap="round"/>
                    <circle cx="9" cy="13" r="1.2" fill="#B0C4DE"/>
                  </svg>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    style={{ border: "none", background: "transparent", fontSize: 15, color: "#0F1F3D", outline: "none", flex: 1, fontFamily: "inherit", fontWeight: 500 }}
                  />
                </div>
              </div>

              {error && <p style={{ color: "#DC2626", fontSize: 13, margin: "0 0 16px" }}>{error}</p>}

              <button
                onClick={handleContinue}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: 52,
                  borderRadius: 14,
                  background: "#0F2A5C",
                  color: "white",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "-0.01em",
                  marginBottom: 20,
                  border: "none",
                  fontFamily: "inherit",
                }}
              >
                Continue
              </button>

              <p style={{ textAlign: "center", fontSize: 14, color: "#8BA3C0", margin: 0, fontWeight: 500 }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "#1A6BCC", fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F1F3D", margin: "0 0 4px", letterSpacing: "-0.03em" }}>
                Health profile
              </h1>
              <p style={{ fontSize: 15, color: "#8BA3C0", margin: "0 0 24px", fontWeight: 500 }}>
                Help us personalize your experience.
              </p>

              {/* Gender */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#8BA3C0", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>Gender</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {genderOptions.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setGender(option)}
                      style={{
                        height: 44,
                        borderRadius: 12,
                        border: `1.5px solid ${gender === option ? "#1A6BCC" : "#E4EBF5"}`,
                        background: gender === option ? "#EBF3FF" : "#F8FAFD",
                        color: gender === option ? "#1A6BCC" : "#4A6080",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date of birth */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#8BA3C0", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Date of Birth</p>
                <div style={{ display: "grid", gridTemplateColumns: "88px 1fr 96px", gap: 8 }}>
                  {[
                    { value: dobDay, setter: setDobDay, placeholder: "Day", options: days },
                    { value: dobMonth, setter: setDobMonth, placeholder: "Month", options: months },
                    { value: dobYear, setter: setDobYear, placeholder: "Year", options: years },
                  ].map(field => (
                    <div
                      key={field.placeholder}
                      style={{
                        background: "#F8FAFD",
                        border: "1.5px solid #E4EBF5",
                        borderRadius: 12,
                        padding: "0 12px",
                        height: 48,
                        display: "flex",
                        alignItems: "center",
                        position: "relative",
                      }}
                    >
                      <select
                        value={field.value}
                        onChange={e => field.setter(e.target.value)}
                        style={{
                          border: "none",
                          background: "transparent",
                          fontSize: 15,
                          color: field.value ? "#0F1F3D" : "#8BA3C0",
                          outline: "none",
                          width: "100%",
                          fontFamily: "inherit",
                          fontWeight: 500,
                          appearance: "none",
                          WebkitAppearance: "none",
                          MozAppearance: "none",
                          paddingRight: 18,
                          cursor: "pointer",
                        }}
                      >
                        <option value="" disabled>{field.placeholder}</option>
                        {field.options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
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
                  { label: "Height", placeholder: "cm", value: height, setter: setHeight },
                  { label: "Weight", placeholder: "kg", value: weight, setter: setWeight },
                ].map((f, i) => (
                  <div key={i} style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#8BA3C0", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>{f.label}</p>
                    <div style={{
                      background: "#F8FAFD",
                      border: "1.5px solid #E4EBF5",
                      borderRadius: 12,
                      padding: "0 14px",
                      height: 48,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      boxSizing: "border-box",
                    }}>
                      <input
                        type="number"
                        placeholder="—"
                        value={f.value}
                        onChange={e => f.setter(e.target.value)}
                        style={{ border: "none", background: "transparent", fontSize: 15, color: "#0F1F3D", outline: "none", flex: 1, minWidth: 0, width: "100%", fontFamily: "inherit", fontWeight: 500 }}
                      />
                      <span style={{ fontSize: 13, color: "#B0C4DE", fontWeight: 600 }}>{f.placeholder}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Blood type */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#8BA3C0", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>Blood Type</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {bloodTypes.map(bt => (
                    <button
                      key={bt}
                      onClick={() => setBlood(bt)}
                      style={{
                        width: 52,
                        height: 42,
                        borderRadius: 10,
                        border: `1.5px solid ${blood === bt ? "#1A6BCC" : "#E4EBF5"}`,
                        background: blood === bt ? "#EBF3FF" : "#F8FAFD",
                        color: blood === bt ? "#1A6BCC" : "#4A6080",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s",
                      }}
                    >
                      {bt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hospital name */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#8BA3C0", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Hospital Name</p>
                <div style={{
                  background: "#F8FAFD",
                  border: "1.5px solid #E4EBF5",
                  borderRadius: 12,
                  padding: "0 14px",
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                }}>
                  <input
                    value={hospitalName}
                    onChange={e => setHospitalName(e.target.value)}
                    placeholder="Enter hospital name"
                    style={{ border: "none", background: "transparent", fontSize: 15, color: "#0F1F3D", outline: "none", width: "100%", fontFamily: "inherit", fontWeight: 500 }}
                  />
                </div>
              </div>

              {/* Medical conditions */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#8BA3C0", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>Medical Conditions</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {medicalConditionOptions.map((condition) => {
                    const isSelected = medicalConditions.includes(condition);
                    return (
                      <button
                        key={condition}
                        type="button"
                        onClick={() => toggleMedicalCondition(condition)}
                        style={{
                          minHeight: 38,
                          padding: "8px 12px",
                          borderRadius: 12,
                          border: `1.5px solid ${isSelected ? "#1A6BCC" : "#E4EBF5"}`,
                          background: isSelected ? "#EBF3FF" : "#F8FAFD",
                          color: isSelected ? "#1A6BCC" : "#4A6080",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          textAlign: "left",
                        }}
                      >
                        {condition}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Skip note */}
              <p style={{ fontSize: 12, color: "#B0C4DE", margin: "0 0 20px", fontWeight: 500 }}>
                These fields are optional and can be updated in your profile anytime.
              </p>

              {/* CTA */}
              {error && <p style={{ color: "#DC2626", fontSize: 13, margin: "0 0 12px" }}>{error}</p>}

              <button style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: 52,
                borderRadius: 14,
                background: "linear-gradient(135deg, #0F2A5C, #1A6BCC)",
                color: "white",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "-0.01em",
                marginBottom: 12,
                textDecoration: "none",
                border: "none",
                fontFamily: "inherit",
              }}
                onClick={handleCreateAccount}
                disabled={submitting}
                type="button"
              >
                {submitting ? "Creating Account..." : "Create Account"}
              </button>

              <button
                onClick={() => setStep(1)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: 44,
                  borderRadius: 12,
                  background: "none",
                  border: "1.5px solid #E4EBF5",
                  color: "#8BA3C0",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
