import { Link } from "react-router-dom";
import { useState } from "react";

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

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
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
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

        {/* Card */}
        <div style={{
          background: "white",
          borderRadius: 24,
          padding: "40px",
          boxShadow: "0 8px 40px rgba(15,31,61,0.08)",
          border: "1px solid #E4EBF5",
        }}>
          {!sent ? (
            <>
              {/* Lock icon */}
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: "#EBF3FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="4.5" y="13" width="19" height="13" rx="3" stroke="#1A6BCC" strokeWidth="1.8"/>
                  <path d="M9 13V9C9 6.24 11.24 4 14 4C16.76 4 19 6.24 19 9V13" stroke="#1A6BCC" strokeWidth="1.8" strokeLinecap="round"/>
                  <circle cx="14" cy="19.5" r="2" fill="#1A6BCC"/>
                </svg>
              </div>

              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F1F3D", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
                Forgot your password?
              </h1>
              <p style={{ fontSize: 15, color: "#8BA3C0", margin: "0 0 28px", fontWeight: 500, lineHeight: 1.55 }}>
                Enter your email address and we'll send you a reset link.
              </p>

              <p style={{ fontSize: 11, fontWeight: 700, color: "#8BA3C0", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Email</p>
              <div style={{
                background: "#EBF3FF",
                border: "1.5px solid #C3DAFE",
                borderRadius: 12,
                padding: "0 14px",
                height: 50,
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 24,
              }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2.5 4.5H15.5C15.78 4.5 16 4.72 16 5V13C16 13.28 15.78 13.5 15.5 13.5H2.5C2.22 13.5 2 13.28 2 13V5C2 4.72 2.22 4.5 2.5 4.5Z" stroke="#1A6BCC" strokeWidth="1.4"/>
                  <path d="M2 5.5L9 10L16 5.5" stroke="#1A6BCC" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                <input
                  type="email"
                  placeholder="your@email.com"
                  style={{ border: "none", background: "transparent", fontSize: 15, color: "#0F1F3D", outline: "none", flex: 1, fontFamily: "inherit", fontWeight: 500 }}
                />
              </div>

              <button
                onClick={() => setSent(true)}
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
                Send Reset Link
              </button>

              <p style={{ textAlign: "center", fontSize: 14, color: "#8BA3C0", margin: 0, fontWeight: 500 }}>
                Remember it?{" "}
                <Link to="/login" style={{ color: "#1A6BCC", fontWeight: 700, textDecoration: "none" }}>
                  Back to sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              {/* Success state */}
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: "#DCFCE7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}>
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                  <circle cx="15" cy="15" r="12" fill="#22C55E" opacity="0.2"/>
                  <path d="M9 15L13 19L21 11" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F1F3D", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
                Check your inbox
              </h1>
              <p style={{ fontSize: 15, color: "#8BA3C0", margin: "0 0 28px", fontWeight: 500, lineHeight: 1.6 }}>
                We've sent a password reset link to your email address. It expires in 30 minutes.
              </p>

              <div style={{
                background: "#F8FAFD",
                border: "1.5px solid #E4EBF5",
                borderRadius: 14,
                padding: "16px",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                marginBottom: 24,
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
                  <circle cx="10" cy="10" r="8" stroke="#8BA3C0" strokeWidth="1.4"/>
                  <path d="M10 9V13" stroke="#8BA3C0" strokeWidth="1.6" strokeLinecap="round"/>
                  <circle cx="10" cy="7" r="0.8" fill="#8BA3C0"/>
                </svg>
                <p style={{ fontSize: 13, color: "#4A6080", margin: 0, lineHeight: 1.55, fontWeight: 500 }}>
                  If you don't see it in a few minutes, check your spam or junk folder.
                </p>
              </div>

              <Link to="/login" style={{
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
                marginBottom: 16,
                textDecoration: "none",
              }}>
                Back to Sign In
              </Link>

              <button
                onClick={() => setSent(false)}
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
                Resend email
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
