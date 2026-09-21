import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/providers/AppPreferences";

type Tab = "home" | "history" | "report" | "settings";

const items: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap; route: "/" | "/history" | "/report" | "/settings" }[] = [
  { key: "home", label: "Home", icon: "home-outline", route: "/" },
  { key: "history", label: "History", icon: "time-outline", route: "/history" },
  { key: "report", label: "Report", icon: "shield-checkmark-outline", route: "/report" },
  { key: "settings", label: "Settings", icon: "settings-outline", route: "/settings" }
];

export function BottomNav({ active }: { active: Tab }) {
  const { colors: c } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          paddingBottom: Math.max(insets.bottom, 8)
        }
      ]}
    >
      {items.map((item) => {
        const selected = item.key === active;
        return (
          <Pressable key={item.key} onPress={() => router.replace(item.route)} style={styles.item}>
            <Ionicons
              name={selected ? (item.icon.replace("-outline", "") as keyof typeof Ionicons.glyphMap) : item.icon}
              size={22}
              color={selected ? c.text : c.textMuted}
            />
            <Text style={[styles.label, { color: selected ? c.text : c.textMuted, fontWeight: selected ? "800" : "500" }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10
  },
  item: { flex: 1, minHeight: 46, alignItems: "center", justifyContent: "center", gap: 4 },
  label: { fontSize: 11 }
});
