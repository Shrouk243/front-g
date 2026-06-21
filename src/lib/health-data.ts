import { format } from "date-fns";
import type { AlertItem, BackendNotification, BackendUser, BackendVital, UserProfile } from "../types";
import { buildFullName, calculateAge, formatDateOfBirth, getStoredProfile } from "./profile-storage";

const conditionLabelToCode: Record<string, string> = {
  "No Known Condition": "none",
  Hypertension: "hypertension",
  "Type 1 Diabetes": "diabetes",
  "Type 2 Diabetes": "diabetes",
  Asthma: "asthma",
  "Coronary Artery Disease": "heart",
  "Heart Failure": "heart",
  Arrhythmia: "heart",
};

const conditionCodeToLabel: Record<string, string> = {
  none: "No Known Condition",
  hypertension: "Hypertension",
  diabetes: "Type 2 Diabetes",
  asthma: "Asthma",
  heart: "Coronary Artery Disease",
};

export function backendGenderToProfile(gender: string | null | undefined): string {
  return gender ? gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase() : "";
}

export function profileGenderToBackend(gender: string): "male" | "female" | "other" | null {
  const normalized = gender.trim().toLowerCase();
  if (normalized === "male" || normalized === "female" || normalized === "other") {
    return normalized;
  }
  return null;
}

export function backendConditionsToProfile(conditions: string[] | null | undefined): string[] {
  if (!conditions || !conditions.length) {
    return ["No Known Condition"];
  }

  return conditions
    .map((condition) => conditionCodeToLabel[condition] ?? condition)
    .filter((condition, index, array) => array.indexOf(condition) === index);
}

export function profileConditionsToBackend(conditions: string[]): string[] {
  const mapped = conditions
    .map((condition) => conditionLabelToCode[condition])
    .filter((condition): condition is string => Boolean(condition));

  return mapped.length ? [...new Set(mapped)] : ["none"];
}

export function mergeBackendProfile(user: BackendUser): UserProfile {
  const stored = getStoredProfile();
  const [firstName = stored.firstName, ...rest] = user.name.split(" ");
  const lastName = rest.join(" ") || stored.lastName;
  const date = user.date_of_birth ? new Date(user.date_of_birth) : null;
  const dobDay = date ? String(date.getDate()) : stored.dobDay;
  const dobMonth = date ? format(date, "MMMM") : stored.dobMonth;
  const dobYear = date ? String(date.getFullYear()) : stored.dobYear;

  return {
    ...stored,
    id: stored.id || `HS-${user.id}`,
    firstName,
    lastName,
    name: buildFullName(firstName, lastName) || user.name,
    email: user.email || stored.email,
    gender: backendGenderToProfile(user.gender) || stored.gender,
    dobDay,
    dobMonth,
    dobYear,
    dateOfBirth: user.date_of_birth ? formatDateOfBirth(dobDay, dobMonth, dobYear) : stored.dateOfBirth,
    age: user.date_of_birth ? calculateAge(dobDay, dobMonth, dobYear) : stored.age,
    height: typeof user.height_cm === "number" ? user.height_cm : stored.height,
    weight: typeof user.weight_kg === "number" ? user.weight_kg : stored.weight,
    medicalConditions: backendConditionsToProfile(user.chronic_conditions),
  };
}

export function formatAlertTime(timestamp: string): { time: string; meta: string } {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return { time: "Unknown", meta: "Unknown time" };
  }

  return {
    time: format(date, "MMM d, h:mm a"),
    meta: format(date, "h:mm a"),
  };
}

export function notificationToAlert(notification: BackendNotification): AlertItem & { id: number } {
  const severity = notification.type === "critical"
    ? "critical"
    : notification.type === "reminder"
      ? "elevated"
      : "info";
  const formatted = formatAlertTime(notification.created_at);

  return {
    id: notification.id,
    severity,
    title: notification.title,
    body: notification.message,
    meta: formatted.meta,
    time: formatted.time,
    unread: !notification.read,
    action: notification.action_required ? "Review" : undefined,
  };
}

export function getVitalNumericValue(vital: BackendVital): number {
  if (vital.type === "blood_pressure") {
    return vital.systolic ?? 0;
  }

  return vital.numeric_value ?? Number(vital.value) ?? 0;
}

export function getVitalUnit(type: string): string {
  return type === "blood_pressure"
    ? "mmHg"
    : type === "heart_rate"
      ? "bpm"
      : type === "oxygen"
        ? "%"
        : "mg/dL";
}

export function getVitalLabel(type: string): string {
  return type === "blood_pressure"
    ? "Blood Pressure"
    : type === "heart_rate"
      ? "Heart Rate"
      : type === "oxygen"
        ? "Blood Oxygen"
        : "Blood Glucose";
}

export function formatVitalTimestamp(timestamp: string | null): string {
  if (!timestamp) return "Unknown";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return format(date, "MMM d, h:mm a");
}

export function groupHistoryRows(items: BackendVital[]) {
  const grouped = new Map<string, {
    date: string;
    time: string;
    bp: string;
    hr: string;
    spo2: string;
    glucose: string;
    status: "normal" | "elevated" | "critical";
    sortKey: number;
  }>();

  items.forEach((item) => {
    const measuredAt = item.measured_at ?? item.created_at ?? new Date().toISOString();
    const date = new Date(measuredAt);
    const key = Number.isNaN(date.getTime()) ? String(item.id) : format(date, "yyyy-MM-dd HH:mm");
    const existing = grouped.get(key) ?? {
      date: Number.isNaN(date.getTime()) ? "Unknown" : format(date, "MMM d"),
      time: Number.isNaN(date.getTime()) ? "Unknown" : format(date, "h:mm a"),
      bp: "—",
      hr: "—",
      spo2: "—",
      glucose: "—",
      status: "normal" as const,
      sortKey: Number.isNaN(date.getTime()) ? 0 : date.getTime(),
    };

    if (item.type === "blood_pressure") existing.bp = item.value;
    if (item.type === "heart_rate") existing.hr = item.value;
    if (item.type === "oxygen") existing.spo2 = `${item.value}%`;
    if (item.type === "blood_sugar") existing.glucose = item.value;

    if (item.status === "critical" || (item.status === "elevated" && existing.status === "normal")) {
      existing.status = item.status;
    }

    grouped.set(key, existing);
  });

  return Array.from(grouped.values()).sort((a, b) => b.sortKey - a.sortKey);
}
