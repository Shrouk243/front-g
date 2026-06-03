import type { TranslationKey } from "../lib/translations";

export type Language = "EN" | "AR";
export type ThemeMode = "light" | "dark";
export type { TranslationKey };

export interface ThemeColors {
  pageBg: string;
  cardBg: string;
  sidebarBg: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  navActive: string;
  navActiveBg: string;
  navInactive: string;
  headerBg: string;
  accentBlue: string;
  divider: string;
  inputBg: string;
  rowHover: string;
}

export interface AppContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  colors: ThemeColors;
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  t: (key: TranslationKey) => string;
}

export interface VitalReading {
  date: string;
  time: string;
  bp: string;
  hr: string;
  spo2: string;
  glucose: string;
  status: "normal" | "elevated" | "critical";
}

export interface VitalCardData {
  label: string;
  value: string;
  unit: string;
  trend: string;
  trendDir: "up" | "down" | "flat";
  status: string;
  statusColor: string;
  statusBg: string;
  accentColor: string;
  chartData: Array<{ time: string; fullTime: string; value: number }>;
  linkTo: string;
}

export interface AnalysisCard {
  title: string;
  level: string;
  levelColor: string;
  levelBg: string;
  pct: number;
  pctColor: string;
  icon: React.ReactNode;
  insights: string[];
}

export interface AlertItem {
  severity: "critical" | "elevated" | "normal" | "info";
  title: string;
  body: string;
  meta: string;
  time: string;
  unread: boolean;
  action?: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface BackendUser {
  id: number;
  name: string;
  email: string;
  date_of_birth: string | null;
  gender: string | null;
  chronic_conditions: string[] | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  telegram_chat_id?: string | null;
  telegram_username?: string | null;
  telegram_connected_at?: string | null;
  telegram_alerts_enabled?: boolean;
  telegram_recommendations_enabled?: boolean;
  telegram_daily_summary_enabled?: boolean;
  latest_recommendation?: string | null;
}

export interface BackendVital {
  id: number;
  type: string;
  display_type: string;
  value: string;
  numeric_value: number | null;
  systolic: number | null;
  diastolic: number | null;
  status: "normal" | "elevated" | "critical";
  source: "manual" | "device";
  measured_at: string | null;
  created_at: string | null;
}

export interface BackendNotification {
  id: number;
  type: "critical" | "ai" | "reminder" | "system";
  title: string;
  message: string;
  read: boolean;
  action_required: boolean;
  created_at: string;
}

export interface TelegramPreferences {
  critical_alerts: boolean;
  recommendations: boolean;
  daily_summary: boolean;
}

export interface TelegramStatus {
  connected: boolean;
  telegram_username: string | null;
  telegram_connected_at: string | null;
  preferences: TelegramPreferences;
  bot_username: string | null;
}

export interface TelegramConnectData {
  token: string;
  connect_url: string | null;
  expires_at: string | null;
  bot_username: string | null;
}

export interface DashboardResponse {
  user: BackendUser;
  current_vitals: BackendVital[];
  recent_vitals: BackendVital[];
  latest_analysis?: {
    health_score?: number;
    summary?: string;
    risk_level?: string;
  } | null;
  analysis_preview?: {
    health_score?: number;
    summary?: string;
    risk_level?: string;
  } | null;
  notifications_count: number;
  recent_notifications: BackendNotification[];
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  gender: string;
  bloodType: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  age: number;
  height: number;
  weight: number;
  hospitalName: string;
  healthScore: number;
  daysActive: number;
  alertsThisMonth: number;
  dateOfBirth: string;
  medicalConditions: string[];
}

export interface NavItem {
  id: string;
  labelKey: TranslationKey;
  path: string;
  icon: React.ReactNode;
}

export interface VitalItem {
  labelKey: TranslationKey;
  path: string;
  color: string;
}
