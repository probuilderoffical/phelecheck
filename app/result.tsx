import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/theme";

export default function ResultScreen() {
  const { sample } = useLocalSearchParams<{ sample?: string }>();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const c = colors[scheme];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>

        <Text style={[styles.eyebrow, { color: c.textMuted }]}>EARLY LOCAL PREVIEW</Text>
        <Text style={[styles.title, { color: c.text }]}>Risk analysis</Text>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: c.warning }]} />
            <Text style={[styles.risk, { color: c.text }]}>Needs verification</Text>
          </View>

          <Text style={[styles.body, { color: c.textMuted }]}>
            The AI engine is not connected yet. This screen is the final result layout that will receive evidence,
            risk signals, confidence and next steps from PheleCheck AI.
          </Text>

          {sample ? (
            <View style={[styles.sample, { backgroundColor: c.surfaceMuted }]}>
              <Text style={[styles.sampleText, { color: c.text }]} numberOfLines={4}>
                {sample}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.info, { borderColor: c.border }]}>
          <Text style={[styles.infoTitle, { color: c.text }]}>Why this design?</Text>
          <Text style={[styles.infoText, { color: c.textMuted }]}>
            PheleCheck will never promise “100% safe.” It will show evidence, uncertainty and verification steps.
          </Text>
        </View>

        <View style={styles.spacer} />

        <Pressable onPress={() => router.replace("/")} style={[styles.button, { backgroundColor: c.accent }]}>
          <Text style={[styles.buttonText, { color: scheme === "dark" ? "#111" : "#FFF" }]}>Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  back: { width: 40, height: 40, justifyContent: "center" },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginTop: 28 },
  title: { fontSize: 32, fontWeight: "700", letterSpacing: -1, marginTop: 6, marginBottom: 24 },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  risk: { fontSize: 18, fontWeight: "700" },
  body: { fontSize: 14, lineHeight: 21, marginTop: 14 },
  sample: { marginTop: 16, borderRadius: radius.md, padding: 14 },
  sampleText: { fontSize: 14, lineHeight: 20 },
  info: { borderTopWidth: 1, marginTop: 24, paddingTop: 20 },
  infoTitle: { fontSize: 15, fontWeight: "700" },
  infoText: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  spacer: { flex: 1 },
  button: { minHeight: 56, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  buttonText: { fontSize: 16, fontWeight: "700" }
});
