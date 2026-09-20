import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/theme";

function Bullet({ icon, title, text, color, muted }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string; color: string; muted: string }) {
  return (
    <View style={styles.bullet}>
      <View style={[styles.bulletIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.bulletTitle, { color }]}>{title}</Text>
        <Text style={[styles.bulletText, { color: muted }]}>{text}</Text>
      </View>
    </View>
  );
}

export default function ResultScreen() {
  const { sample } = useLocalSearchParams<{ sample?: string }>();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const c = colors[scheme];
  const lower = (sample ?? "").toLowerCase();
  const risky = /return|profit|investment|send|pay|urgent|guarantee|double|10k|money/.test(lower);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={23} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>Analysis</Text>
        <Pressable style={styles.headerIcon}>
          <Ionicons name="share-outline" size={21} color={c.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.summary, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.summaryTop}>
            <View style={[styles.riskIcon, { backgroundColor: risky ? c.danger + "18" : c.warning + "18" }]}>
              <Ionicons name={risky ? "warning" : "alert-circle"} size={25} color={risky ? c.danger : c.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.kicker, { color: c.textMuted }]}>RISK LEVEL</Text>
              <Text style={[styles.riskTitle, { color: c.text }]}>{risky ? "High risk signals" : "Needs verification"}</Text>
            </View>
            <View style={[styles.score, { backgroundColor: c.surfaceMuted }]}>
              <Text style={[styles.scoreValue, { color: c.text }]}>{risky ? "82" : "64"}</Text>
              <Text style={[styles.scoreLabel, { color: c.textMuted }]}>/100</Text>
            </View>
          </View>
          <Text style={[styles.summaryText, { color: c.textMuted }]}>
            {risky
              ? "Several patterns commonly used in payment and investment scams were detected."
              : "There is not enough verified evidence to treat this as low risk yet."}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: c.text }]}>Why PheleCheck flagged this</Text>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Bullet icon="cash-outline" title="Money-related request" text="The message appears to involve sending money or receiving a financial return." color={c.danger} muted={c.textMuted} />
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <Bullet icon="trending-up-outline" title="Return or profit language" text="Promises of returns should be independently verified before any payment." color={c.warning} muted={c.textMuted} />
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <Bullet icon="person-circle-outline" title="Identity not verified" text="PheleCheck does not yet have independent proof of who is behind this request." color={c.warning} muted={c.textMuted} />
        </View>

        <Text style={[styles.sectionTitle, { color: c.text }]}>Recommended next steps</Text>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          {[
            "Do not send money yet",
            "Verify the person through an independent channel",
            "Check the payment account and website separately",
            "Never share OTP, PIN or passwords"
          ].map((item, i) => (
            <View key={item} style={[styles.step, i > 0 && { borderTopColor: c.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <View style={[styles.stepNumber, { backgroundColor: c.surfaceMuted }]}>
                <Text style={[styles.stepNumberText, { color: c.text }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: c.text }]}>{item}</Text>
            </View>
          ))}
        </View>

        {sample ? (
          <>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Checked content</Text>
            <View style={[styles.quote, { backgroundColor: c.surfaceMuted }]}>
              <Text numberOfLines={5} style={[styles.quoteText, { color: c.text }]}>{sample}</Text>
            </View>
          </>
        ) : null}

        <View style={[styles.note, { borderColor: c.border }]}>
          <Ionicons name="information-circle-outline" size={19} color={c.textMuted} />
          <Text style={[styles.noteText, { color: c.textMuted }]}>
            Risk scores are guidance, not a guarantee. Always verify independently before paying.
          </Text>
        </View>

        <Pressable onPress={() => router.replace("/")} style={[styles.primary, { backgroundColor: c.text }]}>
          <Text style={[styles.primaryText, { color: scheme === "dark" ? "#111" : "#fff" }]}>Check something else</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { height: 60, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800" },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 34 },
  summary: { marginTop: 10, borderWidth: 1, borderRadius: radius.lg, padding: 18 },
  summaryTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  riskIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  riskTitle: { fontSize: 20, fontWeight: "800", marginTop: 3 },
  score: { minWidth: 58, height: 58, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  scoreValue: { fontSize: 20, fontWeight: "800" },
  scoreLabel: { fontSize: 10, marginTop: -2 },
  summaryText: { fontSize: 14, lineHeight: 20, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginTop: 24, marginBottom: 10 },
  card: { borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: 16 },
  bullet: { flexDirection: "row", gap: 12, paddingVertical: 16 },
  bulletIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  bulletTitle: { fontSize: 14, fontWeight: "800" },
  bulletText: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 50 },
  step: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 12 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stepNumberText: { fontSize: 12, fontWeight: "800" },
  stepText: { flex: 1, fontSize: 14, fontWeight: "600" },
  quote: { borderRadius: radius.md, padding: 16 },
  quoteText: { fontSize: 14, lineHeight: 21 },
  note: { marginTop: 22, paddingTop: 18, borderTopWidth: 1, flexDirection: "row", gap: 10 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  primary: { height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", marginTop: 24 },
  primaryText: { fontSize: 15, fontWeight: "800" }
});
