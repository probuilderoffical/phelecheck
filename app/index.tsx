import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ActionTile } from "@/components/ActionTile";
import { BottomNav } from "@/components/BottomNav";
import { radius, spacing } from "@/theme";
import { useAppTheme } from "@/providers/AppPreferences";

export default function HomeScreen() {
  const { scheme, colors: c } = useAppTheme();
  const [value, setValue] = useState("");

  const go = (type: string) => router.push({ pathname: "/check", params: { type } });
  const quickCheck = () => {
    if (!value.trim()) return;
    router.push({ pathname: "/result", params: { type: "message", sample: value.slice(0, 220) } });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.brandWrap}>
          <View style={[styles.logo, { backgroundColor: c.text }]}>
            <Ionicons name="shield-checkmark" size={18} color={scheme === "dark" ? "#111" : "#fff"} />
          </View>
          <Text style={[styles.brand, { color: c.text }]}>PheleCheck</Text>
        </View>
        <Pressable onPress={() => router.push("/settings")} style={[styles.headerButton, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Ionicons name="person-outline" size={19} color={c.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={[styles.title, { color: c.text }]}>Check before you trust.</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>Messages, links, screenshots and payment details — all in one place.</Text>
        </View>

        <View style={[styles.composer, { backgroundColor: c.surface, borderColor: c.border }]}>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="Paste a suspicious message or link"
            placeholderTextColor={c.textMuted}
            multiline
            style={[styles.input, { color: c.text }]}
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
              <Text style={[styles.checkText, { color: value.trim() ? (scheme === "dark" ? "#111" : "#fff") : c.textMuted }]}>Check</Text>
              <Ionicons name="arrow-forward" size={17} color={value.trim() ? (scheme === "dark" ? "#111" : "#fff") : c.textMuted} />
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Quick checks</Text>
          <Text style={[styles.sectionMeta, { color: c.textMuted }]}>Choose a type</Text>
        </View>

        <View style={styles.list}>
          <ActionTile icon="chatbubble-ellipses-outline" label="Message" subtitle="Chat, email or SMS" onPress={() => go("message")} />
          <ActionTile icon="image-outline" label="Screenshot" subtitle="Upload an image" onPress={() => go("screenshot")} />
          <ActionTile icon="link-outline" label="Website or link" subtitle="Phishing and fake stores" onPress={() => go("link")} />
          <ActionTile icon="card-outline" label="Payment details" subtitle="Account or wallet details" onPress={() => go("payment")} />
          <ActionTile icon="call-outline" label="Phone number" subtitle="Check reputation signals" onPress={() => go("phone")} />
          <ActionTile icon="qr-code-outline" label="QR code" subtitle="Inspect QR destination" onPress={() => go("qr")} />
        </View>

        <View style={[styles.trustCard, { backgroundColor: c.surfaceMuted }]}>
          <Ionicons name="lock-closed-outline" size={20} color={c.text} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.trustTitle, { color: c.text }]}>Private by design</Text>
            <Text style={[styles.trustText, { color: c.textMuted }]}>Never share passwords, PINs, OTPs or full card numbers.</Text>
          </View>
        </View>
      </ScrollView>

      <BottomNav active="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { height: 64, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 20, fontWeight: "800", letterSpacing: -0.6 },
  headerButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 28 },
  hero: { paddingTop: 22, paddingBottom: 20 },
  title: { fontSize: 32, fontWeight: "800", letterSpacing: -1.1 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 8, maxWidth: 340 },
  composer: { borderWidth: 1, borderRadius: radius.lg, padding: 15, minHeight: 154 },
  input: { minHeight: 68, fontSize: 16, lineHeight: 23, textAlignVertical: "top" },
  composerFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  attachments: { flexDirection: "row", gap: 8 },
  circle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  checkButton: { height: 42, borderRadius: 21, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 7 },
  checkText: { fontWeight: "700", fontSize: 14 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 28, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  sectionMeta: { fontSize: 12 },
  list: { gap: 10 },
  trustCard: { marginTop: 18, borderRadius: radius.md, padding: 16, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  trustTitle: { fontSize: 14, fontWeight: "700" },
  trustText: { fontSize: 12, lineHeight: 18, marginTop: 3 }
});
