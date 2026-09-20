import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { colors } from "@/theme";

export type AppearanceMode = "light" | "dark" | "system";
export type UploadRetention = "immediate" | "24h" | "7d";

export type AppPreferences = {
  appearance: AppearanceMode;
  language: string;
  improvePheleCheck: boolean;
  memoryEnabled: boolean;
  saveHistory: boolean;
  notifications: boolean;
  safetyReminders: boolean;
  uploadRetention: UploadRetention;
};

const STORAGE_KEY = "phelecheck.preferences.v1";

export const defaultPreferences: AppPreferences = {
  appearance: "light",
  language: "en",
  improvePheleCheck: true,
  memoryEnabled: true,
  saveHistory: true,
  notifications: true,
  safetyReminders: true,
  uploadRetention: "24h"
};

type PreferencesContextValue = {
  preferences: AppPreferences;
  setPreference: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => void;
  resetPreferences: () => void;
  ready: boolean;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function AppPreferencesProvider({ children }: PropsWithChildren) {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved) setPreferences({ ...defaultPreferences, ...JSON.parse(saved) });
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<PreferencesContextValue>(() => ({
    preferences,
    ready,
    setPreference: (key, value) => {
      setPreferences((current) => {
        const next = { ...current, [key]: value };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
        return next;
      });
    },
    resetPreferences: () => {
      setPreferences(defaultPreferences);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPreferences)).catch(() => undefined);
    }
  }), [preferences, ready]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useAppPreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("useAppPreferences must be used inside AppPreferencesProvider");
  return value;
}

export function useAppTheme() {
  const { preferences } = useAppPreferences();
  const system = useColorScheme() === "dark" ? "dark" : "light";
  const scheme = preferences.appearance === "system" ? system : preferences.appearance;
  return { scheme, colors: colors[scheme] };
}
