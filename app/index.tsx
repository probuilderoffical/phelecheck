import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActionTile } from "@/components/ActionTile";
import { colors, spacing } from "@/theme";
import { copy } from "@/i18n";

export default function HomeScreen() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const c = colors[scheme];
  const t = copy.en;

  const go = (type: string) => router.push({ pathname: "/check", params: { type } });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <Text style={[styles.brand, { color: c.text }]}>PheleCheck</Text>
          <Text style={[styles.tagline, { color: c.textMuted }]}>{t.tagline}</Text>
        </View>

        <View style={styles.hero}>
          <Text style={[styles.title, { color: c.text }]}>{t.title}</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>{t.subtitle}</Text>
        </View>

        <View style={styles.grid}>
          <ActionTile icon="chatbubble-ellipses-outline" label={t.message} onPress={() => go("message")} />
          <ActionTile icon="image-outline" label={t.screenshot} onPress={() => go("screenshot")} />
          <ActionTile icon="link-outline" label={t.link} onPress={() => go("link")} />
          <ActionTile icon="qr-code-outline" label={t.qr} onPress={() => go("qr")} />
          <ActionTile icon="card-outline" label={t.payment} onPress={() => go("payment")} />
          <ActionTile icon="call-outline" label={t.phone} onPress={() => go("phone")} />
        </View>

        <View style={[styles.notice, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.noticeTitle, { color: c.text }]}>Built for evidence, not guesses.</Text>
          <Text style={[styles.noticeText, { color: c.textMuted }]}>
            PheleCheck will explain risk signals and uncertainty instead of claiming something is 100% safe.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 48 },
  brandRow: { gap: 2 },
  brand: { fontSize: 24, fontWeight: "700", letterSpacing: -0.7 },
  tagline: { fontSize: 13 },
  hero: { marginTop: 54, marginBottom: 26 },
  title: { fontSize: 34, fontWeight: "700", letterSpacing: -1.2, maxWidth: 320 },
  subtitle: { fontSize: 16, lineHeight: 23, marginTop: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  notice: { borderWidth: 1, borderRadius: 20, padding: 18, marginTop: 24 },
  noticeTitle: { fontSize: 15, fontWeight: "700" },
  noticeText: { fontSize: 14, lineHeight: 20, marginTop: 6 }
});
