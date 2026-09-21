import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BottomNav } from "@/components/BottomNav";
import { radius, spacing } from "@/theme";
import { useAppTheme } from "@/providers/AppPreferences";

type ToolCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  onPress: () => void;
};

function ToolCard({ icon, label, subtitle, onPress }: ToolCardProps) {
  const { colors: c } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolCard,
        { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.76 : 1 }
      ]}
    >
      <View style={[styles.toolIcon, { backgroundColor: c.surfaceMuted }]}>
        <Ionicons name={icon} size={21} color={c.text} />
      </View>
      <Text style={[styles.toolLabel, { color: c.text }]}>{label}</Text>
      <Text numberOfLines={2} style={[styles.toolSubtitle, { color: c.textMuted }]}>{subtitle}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { scheme, colors: c } = useAppTheme();
  const [value, setValue] = useState("");

  const go = (type: string) => router.push({ pathname: "/check", params: { type } });
  const quickCheck = () => {
    if (!value.trim()) return;
    router.push({ pathname: "/result", params: { type: "message", sample: value.trim().slice(0, 4000) } });
  };

  const primaryColor = scheme === "dark" ? "#111" : "#fff";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.brandWrap}>
          <View style={[styles.logo, { backgroundColor: c.text }]}>
            <Ionicons name="shield-checkmark" size={18} color={primaryColor} />
          </View>
          <View>
            <Text style={[styles.brand, { color: c.text }]}>PheleCheck</Text>
            <Text style={[styles.brandMeta, { color: c.textMuted }]}>Verify before you pay</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/settings")}
          style={[styles.headerButton, { backgroundColor: c.surface, borderColor: c.border }]}
        >
          <Ionicons name="person-outline" size={19} color={c.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={[styles.statusPill, { backgroundColor: c.surfaceMuted }]}>
            <View style={[styles.statusDot, { backgroundColor: c.success }]} />
            <Text style={[styles.statusText, { color: c.textMuted }]}>Sentinel-1 online</Text>
          </View>
          <Text style={[styles.title, { color: c.text }]}>Verify before you act.</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>
            Paste a message, link or suspicious offer. PheleCheck looks for fraud signals and explains what to verify.
          </Text>
        </View>

        <View style={[styles.composer, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.composerHead}>
            <View>
              <Text style={[styles.composerKicker, { color: c.textMuted }]}>ASK PHELECHECK</Text>
              <Text style={[styles.composerTitle, { color: c.text }]}>What do you want to check?</Text>
            </View>
            <Ionicons name="sparkles-outline" size={21} color={c.textMuted} />
          </View>

          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="Paste a message, link or offer here…"
            placeholderTextColor={c.textMuted}
            multiline
            maxLength={4000}
            style={[styles.input, { color: c.text, backgroundColor: c.surfaceMuted }]}
          />

          <View style={styles.composerFooter}>
            <View style={styles.attachments}>
              <Pressable onPress={() => go("screenshot")} style={[styles.circle, { backgroundColor: c.surfaceMuted }]}>
                <Ionicons name="image-outline" size={20} color={c.text} />
              </Pressable>
              <Pressable onPress={() => go("qr")} style={[styles.circle, { backgroundColor: c.surfaceMuted }]}>
                <Ionicons name="qr-code-outline" size={19} color={c.text} />
              </Pressable>
            </View>

            <Pressable
              disabled={!value.trim()}
              onPress={quickCheck}
              style={[styles.checkButton, { backgroundColor: value.trim() ? c.text : c.surfaceMuted }]}
            >
              <Text style={[styles.checkText, { color: value.trim() ? primaryColor : c.textMuted }]}>Check now</Text>
              <Ionicons name="arrow-forward" size={17} color={value.trim() ? primaryColor : c.textMuted} />
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: c.textMuted }]}>QUICK CHECKS</Text>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Start with a type</Text>
          </View>
          <Pressable onPress={() => router.push("/tools")} style={styles.seeAll}>
            <Text style={[styles.seeAllText, { color: c.text }]}>All tools</Text>
            <Ionicons name="arrow-forward" size={15} color={c.text} />
          </Pressable>
        </View>

        <View style={styles.grid}>
          <ToolCard icon="chatbubble-ellipses-outline" label="Message" subtitle="SMS, chat or email" onPress={() => go("message")} />
          <ToolCard icon="link-outline" label="Link" subtitle="Website or URL" onPress={() => go("link")} />
          <ToolCard icon="image-outline" label="Screenshot" subtitle="Image evidence" onPress={() => go("screenshot")} />
          <ToolCard icon="card-outline" label="Payment" subtitle="Account or wallet" onPress={() => go("payment")} />
        </View>

        <Pressable
          onPress={() => router.push("/tools")}
          style={({ pressed }) => [
            styles.moreCard,
            { backgroundColor: c.surfaceMuted, opacity: pressed ? 0.8 : 1 }
          ]}
        >
          <View style={[styles.moreIcon, { backgroundColor: c.surface }]}>
            <Ionicons name="grid-outline" size={20} color={c.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.moreTitle, { color: c.text }]}>More verification tools</Text>
            <Text style={[styles.moreText, { color: c.textMuted }]}>Phone numbers, QR codes, reports and more.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
        </Pressable>

        <View style={[styles.safetyCard, { borderColor: c.border }]}>
          <Ionicons name="lock-closed-outline" size={19} color={c.textMuted} />
          <Text style={[styles.safetyText, { color: c.textMuted }]}>
            Never paste passwords, PINs, OTPs, seed phrases or full card numbers.
          </Text>
        </View>
      </ScrollView>

      <BottomNav active="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    minHeight: 68,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  brandWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  brandMeta: { fontSize: 10, marginTop: 1 },
  headerButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 28 },
  hero: { paddingTop: 20, paddingBottom: 18 },
  statusPill: { alignSelf: "flex-start", height: 28, borderRadius: 14, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: "700" },
  title: { fontSize: 34, lineHeight: 39, fontWeight: "800", letterSpacing: -1.2, marginTop: 14 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 390 },
  composer: { borderWidth: 1, borderRadius: radius.lg, padding: 16 },
  composerHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  composerKicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  composerTitle: { fontSize: 16, fontWeight: "800", marginTop: 3 },
  input: { minHeight: 112, maxHeight: 190, borderRadius: 18, padding: 14, fontSize: 15, lineHeight: 22, textAlignVertical: "top" },
  composerFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  attachments: { flexDirection: "row", gap: 8 },
  circle: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  checkButton: { minHeight: 44, borderRadius: 22, paddingHorizontal: 17, flexDirection: "row", alignItems: "center", gap: 7 },
  checkText: { fontWeight: "800", fontSize: 13 },
  sectionHead: { marginTop: 28, marginBottom: 12, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  sectionEyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  sectionTitle: { fontSize: 19, fontWeight: "800", marginTop: 3 },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6 },
  seeAllText: { fontSize: 12, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  toolCard: { width: "48.4%", minHeight: 132, borderWidth: 1, borderRadius: 20, padding: 14 },
  toolIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  toolLabel: { fontSize: 15, fontWeight: "800", marginTop: 13 },
  toolSubtitle: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  moreCard: { marginTop: 12, minHeight: 76, borderRadius: 20, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  moreIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  moreTitle: { fontSize: 14, fontWeight: "800" },
  moreText: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  safetyCard: { marginTop: 18, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 9, alignItems: "flex-start" },
  safetyText: { flex: 1, fontSize: 11, lineHeight: 17 }
});
