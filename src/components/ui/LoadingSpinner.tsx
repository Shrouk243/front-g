import React from "react";
import { useApp } from "../../contexts/AppContext";

interface LoadingSpinnerProps {
  fullscreen?: boolean;
  size?: number;
}

export function LoadingSpinner({ fullscreen = false, size = 44 }: LoadingSpinnerProps) {
  const { colors } = useApp();

  const spinner = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 44 44"
        fill="none"
        style={{ animation: "hs-spin 0.9s linear infinite" }}
      >
        <circle cx="22" cy="22" r="18" stroke={colors.border} strokeWidth="4" />
        <path
          d="M22 4 a18 18 0 0 1 18 18"
          stroke="url(#hs-grad)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="hs-grad" x1="22" y1="4" x2="40" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1A6BCC" />
            <stop offset="100%" stopColor="#0DC9B1" />
          </linearGradient>
        </defs>
      </svg>
      <style>{`
        @keyframes hs-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (!fullscreen) return spinner;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: colors.pageBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        transition: "background 0.3s ease",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "linear-gradient(135deg, #0F2A5C, #1A6BCC)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}>
          <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
            <path d="M5 10H9V6H11V10H15" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="1.4" opacity="0.4" />
          </svg>
        </div>
        {spinner}
        <p style={{ fontSize: 14, color: colors.textMuted, fontWeight: 500, margin: 0 }}>Loading HealthSync…</p>
      </div>
    </div>
  );
}
