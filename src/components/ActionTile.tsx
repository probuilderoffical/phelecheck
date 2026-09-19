import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/theme";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

export function ActionTile({ icon, label, onPress }: Props) {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const c = colors[scheme];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.7 : 1 }
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: c.surfaceMuted }]}>
        <Ionicons name={icon} size={22} color={c.text} />
      </View>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "48%",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 116,
    justifyContent: "space-between"
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  label: {
    fontSize: 16,
    fontWeight: "600"
  }
});
