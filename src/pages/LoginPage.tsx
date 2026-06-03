import { Link, useNavigate } from "react-router-dom";
import React from "react";
import { getApiErrorMessage, login, setAuthToken } from "../lib/api";
import { mergeBackendProfile } from "../lib/health-data";
import { saveStoredProfile } from "../lib/profile-storage";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await login(email, password);
      setAuthToken(response.access_token);
      saveStoredProfile(mergeBackendProfile(response.user));
      navigate("/dashboard");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to sign in."));
    } finally {
      setLoading(false);
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
      <div style={{ width: "100%", maxWidth: 480 }}>
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

        <div style={{
          background: "white",
          borderRadius: 24,
          padding: "40px",
          boxShadow: "0 8px 40px rgba(15,31,61,0.08)",
          border: "1px solid #E4EBF5",
        }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0F1F3D", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
            Good to see you again.
          </h1>
          <p style={{ fontSize: 15, color: "#8BA3C0", margin: "0 0 32px", fontWeight: 500 }}>
            Sign in to your HealthSync account.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#8BA3C0", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Email</p>
              <div style={{
                background: "#F8FAFD",
                border: "1.5px solid #E4EBF5",
                borderRadius: 12,
                padding: "0 14px",
                height: 50,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2.5 4.5H15.5C15.78 4.5 16 4.72 16 5V13C16 13.28 15.78 13.5 15.5 13.5H2.5C2.22 13.5 2 13.28 2 13V5C2 4.72 2.22 4.5 2.5 4.5Z" stroke="#B0C4DE" strokeWidth="1.4"/>
                  <path d="M2 5.5L9 10L16 5.5" stroke="#B0C4DE" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="your@email.com"
                  type="email"
                  required
                  style={{ border: "none", background: "transparent", fontSize: 15, color: "#0F1F3D", outline: "none", flex: 1, fontFamily: "inherit", fontWeight: 500 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#8BA3C0", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Password</p>
              <div style={{
                background: "#EBF3FF",
                border: "1.5px solid #C3DAFE",
                borderRadius: 12,
                padding: "0 14px",
                height: 50,
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
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••••"
                  required
                  style={{ border: "none", background: "transparent", fontSize: 15, color: "#0F1F3D", outline: "none", flex: 1, fontFamily: "inherit", fontWeight: 500 }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
              <Link to="/reset-password" style={{ fontSize: 13, color: "#1A6BCC", fontWeight: 600, textDecoration: "none" }}>
                Forgot password?
              </Link>
            </div>

            {error && <p style={{ color: "#DC2626", fontSize: 13, margin: "0 0 16px" }}>{error}</p>}

            <button type="submit" disabled={loading} style={{
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
              cursor: loading ? "wait" : "pointer",
              letterSpacing: "-0.01em",
              marginBottom: 16,
              border: "none",
              fontFamily: "inherit",
            }}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "#E4EBF5" }} />
            <span style={{ fontSize: 12, color: "#B0C4DE", fontWeight: 600, letterSpacing: "0.04em" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "#E4EBF5" }} />
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            {["Google", "Apple ID"].map((label) => (
              <button key={label} style={{
                flex: 1,
                height: 46,
                borderRadius: 12,
                border: "1.5px solid #E4EBF5",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "not-allowed",
                fontSize: 13,
                fontWeight: 600,
                color: "#0F1F3D",
                boxShadow: "0 1px 4px rgba(15,31,61,0.04)",
              }}>
                {label}
              </button>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: 14, color: "#8BA3C0", margin: 0, fontWeight: 500 }}>
            New to HealthSync?{" "}
            <Link to="/signup" style={{ color: "#1A6BCC", fontWeight: 700, textDecoration: "none" }}>Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
