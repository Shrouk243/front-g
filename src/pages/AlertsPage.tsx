import React from "react";
import { useApp } from "../contexts/AppContext";
import { fetchAlerts, markAlertRead } from "../lib/api";
import { notificationToAlert } from "../lib/health-data";
import type { AlertItem } from "../types";

type Severity = AlertItem["severity"];

interface SeverityStyle {
  dot: string;
  left: string;
  bg: string;
  border: string;
  tag: string;
  tagText: string;
  tagLabel: string;
}

const SEVERITY_STYLES: Record<Severity, SeverityStyle> = {
  critical: { dot: "#EF4444", left: "#EF4444", bg: "#FFFBFB", border: "#FECACA", tag: "#FEE2E2", tagText: "#DC2626", tagLabel: "Critical" },
  elevated: { dot: "#F59E0B", left: "#F59E0B", bg: "#FFFDF5", border: "#FDE68A", tag: "#FEF3C7", tagText: "#B45309", tagLabel: "Elevated" },
  normal: { dot: "#22C55E", left: "#22C55E", bg: "#FAFFFE", border: "#BBF7D0", tag: "#DCFCE7", tagText: "#16A34A", tagLabel: "Resolved" },
  info: { dot: "#1A6BCC", left: "#1A6BCC", bg: "#FAFBFE", border: "#BFDBFE", tag: "#EBF3FF", tagText: "#1A6BCC", tagLabel: "Info" },
};

function AlertCard({ alert, onRead }: { alert: AlertItem & { id: number }; onRead: (id: number) => void }) {
  const { colors } = useApp();
  const s = SEVERITY_STYLES[alert.severity];

  return (
    <div style={{
      background: alert.unread ? s.bg : colors.cardBg,
      border: `1.5px solid ${alert.unread ? s.border : colors.border}`,
      borderRadius: 16,
      marginBottom: 10,
      position: "relative",
      overflow: "hidden",
      boxShadow: alert.unread ? "0 2px 12px rgba(15,31,61,0.07)" : "0 1px 4px rgba(15,31,61,0.04)",
      transition: "background 0.3s",
    }}>
      {alert.unread && (
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: s.left }} />
      )}
      <div style={{ padding: "14px 16px 14px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, marginRight: 10 }}>
            {alert.unread && (
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.3 }}>{alert.title}</span>
          </div>
          <div style={{ padding: "4px 10px", borderRadius: 6, background: s.tag, flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: s.tagText, letterSpacing: "0.03em" }}>{s.tagLabel}</span>
          </div>
        </div>
        <p style={{ fontSize: 14, color: colors.textSecondary, margin: "0 0 10px", lineHeight: 1.55 }}>{alert.body}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>{alert.meta} · {alert.time}</span>
          {alert.unread && (
            <button
              type="button"
              onClick={() => onRead(alert.id)}
              style={{ fontSize: 13, color: colors.accentBlue, fontWeight: 700, cursor: "pointer", background: "transparent", border: "none", fontFamily: "inherit" }}
            >
              Mark read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AlertsPage() {
  const { colors, t } = useApp();
  const [filter, setFilter] = React.useState<string>("all");
  const [alerts, setAlerts] = React.useState<Array<AlertItem & { id: number }>>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    async function loadAlerts() {
      try {
        const response = await fetchAlerts();
        if (!active) return;
        setAlerts(response.items.map(notificationToAlert));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAlerts();

    return () => {
      active = false;
    };
  }, []);

  const filterOptions = [
    { key: "all", label: t("alerts_all") },
    { key: "critical", label: t("alerts_critical") },
    { key: "elevated", label: t("alerts_elevated") },
    { key: "info", label: t("alerts_info") },
  ];

  const filtered = filter === "all" ? alerts : alerts.filter((alert) => alert.severity === filter);

  async function handleMarkRead(id: number) {
    await markAlertRead(id);
    setAlerts((current) => current.map((alert) => alert.id === id ? { ...alert, unread: false } : alert));
  }

  async function handleMarkAllRead() {
    const unreadAlerts = alerts.filter((alert) => alert.unread);
    await Promise.all(unreadAlerts.map((alert) => markAlertRead(alert.id)));
    setAlerts((current) => current.map((alert) => ({ ...alert, unread: false })));
  }

  return (
    <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: colors.textPrimary, margin: "0 0 4px", letterSpacing: "-0.03em" }}>{t("alerts_title")}</h1>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: 0, fontWeight: 500 }}>
            <span style={{ color: "#EF4444", fontWeight: 700 }}>{`${alerts.filter((alert) => alert.unread).length} unread`}</span> · backend synced
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          style={{
            background: "none",
            border: `1.5px solid ${colors.border}`,
            borderRadius: 10,
            fontSize: 13,
            color: colors.textMuted,
            fontWeight: 600,
            cursor: "pointer",
            padding: "8px 14px",
            fontFamily: "inherit",
          }}
        >
          {t("alerts_markRead")}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {filterOptions.map((opt) => (
          <button key={opt.key} onClick={() => setFilter(opt.key)} style={{
            padding: "8px 18px",
            borderRadius: 24,
            background: filter === opt.key ? "#0F2A5C" : colors.cardBg,
            border: `1.5px solid ${filter === opt.key ? "#0F2A5C" : colors.border}`,
            fontSize: 13,
            fontWeight: 700,
            color: filter === opt.key ? "white" : colors.textSecondary,
            cursor: "pointer",
            boxShadow: filter !== opt.key ? "0 1px 3px rgba(15,31,61,0.04)" : "none",
            fontFamily: "inherit",
          }}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: colors.textMuted, fontSize: 14 }}>Loading alerts...</p>}

      {!loading && filtered.map((alert) => (
        <AlertCard key={alert.id} alert={alert} onRead={handleMarkRead} />
      ))}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: colors.textMuted }}>
          <p style={{ fontSize: 16, fontWeight: 500 }}>{t("alerts_noAlerts")}</p>
        </div>
      )}
    </div>
  );
}
