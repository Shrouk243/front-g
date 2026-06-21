import type { ThemeColors, ThemeMode } from "../types";

export const lightColors: ThemeColors = {
  pageBg: "#F2F6FC",
  cardBg: "white",
  sidebarBg: "white",
  border: "#E4EBF5",
  borderLight: "#F2F6FC",
  textPrimary: "#0F1F3D",
  textSecondary: "#4A6080",
  textMuted: "#8BA3C0",
  navActive: "#1A6BCC",
  navActiveBg: "#EBF3FF",
  navInactive: "#4A6080",
  headerBg: "white",
  accentBlue: "#1A6BCC",
  divider: "#F2F6FC",
  inputBg: "#F2F6FC",
  rowHover: "#F8FAFD",
};

export const darkColors: ThemeColors = {
  pageBg: "#0D1117",
  cardBg: "#161B22",
  sidebarBg: "#161B22",
  border: "#30363D",
  borderLight: "#21262D",
  textPrimary: "#E6EDF3",
  textSecondary: "#8BA3C0",
  textMuted: "#6E7681",
  navActive: "#58A6FF",
  navActiveBg: "#1C2733",
  navInactive: "#8BA3C0",
  headerBg: "#161B22",
  accentBlue: "#58A6FF",
  divider: "#21262D",
  inputBg: "#21262D",
  rowHover: "#1C2128",
};

export function getColors(theme: ThemeMode): ThemeColors {
  return theme === "dark" ? darkColors : lightColors;
}
