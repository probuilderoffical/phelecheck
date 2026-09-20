import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { colors } from "@/theme";
import { supabase } from "@/lib/supabase";

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

function fromProfile(profile: any): Partial<AppPreferences> {
  if (!profile) return {};
  return {
    appearance: profile.appearance,
    language: profile.language,
    improvePheleCheck: profile.improve_phelecheck,
    memoryEnabled: profile.memory_enabled,
    saveHistory: profile.save_history,
    notifications: profile.notifications,
    safetyReminders: profile.safety_reminders,
    uploadRetention: profile.upload_retention
  };
}

function toProfile(p: AppPreferences) {
  return {
    appearance: p.appearance,
    language: p.language,
    improve_phelecheck: p.improvePheleCheck,
    memory_enabled: p.memoryEnabled,
    save_history: p.saveHistory,
    notifications: p.notifications,
    safety_reminders: p.safetyReminders,
    upload_retention: p.uploadRetention,
    updated_at: new Date().toISOString()
  };
}

export function AppPreferencesProvider({ children }: PropsWithChildren) {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      let local = saved ? { ...defaultPreferences, ...JSON.parse(saved) } : defaultPreferences;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();
        if (profile) local = { ...local, ...fromProfile(profile) };
      }

      if (mounted) {
        setPreferences(local);
        setReady(true);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(local));
      }
    })();

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) return;
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      if (profile) {
        setPreferences((current) => {
          const next = { ...current, ...fromProfile(profile) } as AppPreferences;
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
          return next;
        });
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function syncToCloud(next: AppPreferences) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from("profiles").upsert({
      id: session.user.id,
      email: session.user.email ?? null,
      ...toProfile(next)
    });
  }

  const value = useMemo<PreferencesContextValue>(() => ({
    preferences,
    ready,
    setPreference: (key, value) => {
      setPreferences((current) => {
        const next = { ...current, [key]: value };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
        syncToCloud(next).catch(() => undefined);
        return next;
      });
    },
    resetPreferences: () => {
      setPreferences(defaultPreferences);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPreferences)).catch(() => undefined);
      syncToCloud(defaultPreferences).catch(() => undefined);
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
