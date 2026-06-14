
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { AppContextValue, Language, ThemeMode, TranslationKey } from "../types";
import { getColors } from "../lib/theme";
import { translations } from "../lib/translations";
import { getStoredProfile, saveStoredProfile } from "../lib/profile-storage";
import { fetchProfile } from "../lib/api";

const AppContext = createContext<AppContextValue | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => readStorage<ThemeMode>("hs_theme", "dark"));
  const [language, setLanguageState] = useState<Language>(() => readStorage<Language>("hs_language", "EN"));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [profile, setProfile] = useState(() => getStoredProfile());

  const isRTL = language === "AR";

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("dir", isRTL ? "rtl" : "ltr");
    root.setAttribute("lang", isRTL ? "ar" : "en");
  }, [theme, isRTL]);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: ThemeMode = prev === "light" ? "dark" : "light";
      localStorage.setItem("hs_theme", JSON.stringify(next));
      return next;
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("hs_language", JSON.stringify(lang));
  }, []);

  const refreshProfileData = useCallback(async () => {
    try {
      const response = await fetchProfile();
      const updatedProfile = response.user; 
      saveStoredProfile(updatedProfile);
      setProfile(updatedProfile);
    } catch (error) {
      console.error("Error refreshing profile data:", error);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      try {
        const translation = translations[language]?.[key];
        if (translation) return translation;
        const fallback = translations["EN"]?.[key];
        if (fallback) return fallback;
        return key;
      } catch (error) {
        return key;
      }
    },
    [language]
  );

  const colors = getColors(theme);

  const value: AppContextValue = {
    theme,
    toggleTheme,
    colors,
    language,
    setLanguage,
    isRTL,
    isLoading,
    setIsLoading,
    t,
    profile,         
    refreshProfileData 
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

