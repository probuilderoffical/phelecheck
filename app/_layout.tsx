import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppPreferencesProvider, useAppTheme } from "@/providers/AppPreferences";
import { AuthProvider } from "@/providers/AuthProvider";

function AppShell() {
  const { scheme } = useAppTheme();
  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppPreferencesProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </AppPreferencesProvider>
  );
}
