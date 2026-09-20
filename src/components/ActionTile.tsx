import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@/theme";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
};

export function ActionTile({ icon, label, subtitle, onPress }: Props) {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const c = colors[scheme];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.72 : 1 }
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: c.surfaceMuted }]}>
        <Ionicons name={icon} size={21} color={c.text} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.label, { color: c.text }]}>{label}</Text>
        {subtitle ? <Text numberOfLines={1} style={[styles.subtitle, { color: c.textMuted }]}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    minHeight: 74
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  copy: { flex: 1, marginLeft: 12 },
  label: { fontSize: 15, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 3 },
});
