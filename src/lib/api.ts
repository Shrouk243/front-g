import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import type {
  BackendNotification,
  BackendUser,
  BackendVital,
  DashboardResponse,
  TelegramConnectData,
  TelegramPreferences,
  TelegramStatus,
} from "../types";

const AUTH_TOKEN_KEY = "auth_token";
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

interface AuthPayload {
  access_token: string;
  token_type: string;
  user: BackendUser;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone_country_code?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  chronic_conditions?: string[];
}

interface UpdateProfilePayload {
  name?: string;
  date_of_birth?: string | null;
  gender?: "male" | "female" | "other" | null;
  chronic_conditions?: string[];
  height_cm?: number | null;
  weight_kg?: number | null;
}

interface CreateVitalPayload {
  type: string;
  measured_at: string;
  source?: "manual" | "device";
  status?: "normal" | "elevated" | "critical";
  value?: number;
  systolic?: number;
  diastolic?: number;
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function login(email: string, password: string): Promise<AuthPayload> {
  const response = await apiClient.post<AuthPayload>("/login", { email, password });
  return response.data;
}

export async function register(payload: RegisterPayload): Promise<AuthPayload> {
  const response = await apiClient.post<AuthPayload>("/register", payload);
  return response.data;
}

type BackendErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (axios.isAxiosError<BackendErrorPayload>(error)) {
    const responseData = error.response?.data;
    const validationMessage = responseData?.errors
      ? Object.values(responseData.errors).flat().find(Boolean)
      : undefined;

    if (validationMessage) {
      return validationMessage;
    }

    if (responseData?.message) {
      return responseData.message;
    }

    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return "The request timed out. Please try again.";
      }

      return "Unable to reach the server. Please check your connection and try again.";
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const response = await apiClient.get<DashboardResponse>("/dashboard");
  return response.data;
}

export async function fetchProfile(): Promise<{ user: BackendUser }> {
  const response = await apiClient.get<{ user: BackendUser }>("/profile");
  return response.data;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<{ message: string; user: BackendUser }> {
  const response = await apiClient.patch<{ message: string; user: BackendUser }>("/profile", payload);
  return response.data;
}

export async function fetchAlerts(): Promise<{ items: BackendNotification[] }> {
  const response = await apiClient.get<{ items: BackendNotification[] }>("/alerts");
  return response.data;
}

export async function markAlertRead(id: number): Promise<void> {
  await apiClient.post(`/notifications/${id}/read`);
}

export async function fetchVitals(type?: string): Promise<{ items: BackendVital[]; current: BackendVital[] }> {
  const response = await apiClient.get<{ items: BackendVital[]; current: BackendVital[] }>("/vitals", {
    params: type ? { type } : undefined,
  });
  return response.data;
}

export async function createVital(payload: CreateVitalPayload): Promise<{ data: BackendVital; recommendation: string; alert_created: boolean }> {
  const response = await apiClient.post<{ data: BackendVital; recommendation: string; alert_created: boolean }>("/vitals", payload);
  return response.data;
}

export async function fetchTodaySummary(): Promise<{
  data: {
    date: string;
    readings_count: number;
    alerts_count: number;
    latest_readings: Array<{ type: string; label: string; value: string; status: string; measured_at: string | null }>;
    summary: string;
  };
}> {
  const response = await apiClient.get("/summary/today");
  return response.data;
}

export async function fetchLatestRecommendation(): Promise<{ data: { recommendation: string | null; connected_to_telegram: boolean } }> {
  const response = await apiClient.get("/recommendations/latest");
  return response.data;
}

export async function fetchTelegramStatus(): Promise<TelegramStatus> {
  const response = await apiClient.get<TelegramStatus>("/telegram/status");
  return response.data;
}

export async function createTelegramConnectToken(): Promise<{ message: string; data: TelegramConnectData }> {
  const response = await apiClient.post<{ message: string; data: TelegramConnectData }>("/telegram/connect-token");
  return response.data;
}

export async function updateTelegramPreferences(preferences: TelegramPreferences): Promise<{ message: string }> {
  const response = await apiClient.patch<{ message: string }>("/telegram/preferences", preferences);
  return response.data;
}

export async function sendTelegramTestMessage(): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>("/telegram/test-message");
  return response.data;
}

export async function disconnectTelegram(): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>("/telegram/disconnect");
  return response.data;
}

export { apiClient, API_BASE_URL };
