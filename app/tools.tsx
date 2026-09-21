import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { radius, spacing } from "@/theme";
import { useAppTheme } from "@/providers/AppPreferences";

const tools = [
  { type: "message", icon: "chatbubble-ellipses-outline", title: "Message", text: "SMS, WhatsApp, email or marketplace chat" },
  { type: "link", icon: "link-outline", title: "Website or link", text: "Suspicious URLs, stores and login pages" },
  { type: "screenshot", icon: "image-outline", title: "Screenshot", text: "Upload visual evidence from a conversation or page" },
  { type: "payment", icon: "card-outline", title: "Payment details", text: "Account, wallet or payment instructions" },
  { type: "phone", icon: "call-outline", title: "Phone number", text: "Check number-related context and warning signs" },
  { type: "qr", icon: "qr-code-outline", title: "QR code", text: "Inspect a QR code before opening or paying" }
] as const;

export default function ToolsScreen() {
  const { colors: c } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={23} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>Verification tools</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: c.textMuted }]}>CHOOSE WHAT YOU HAVE</Text>
        <Text style={[styles.title, { color: c.text }]}>Check it the right way.</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>
          Pick the closest type so PheleCheck can apply the right checks and explain the evidence clearly.
        </Text>

        <View style={styles.list}>
          {tools.map((item) => (
            <Pressable
              key={item.type}
              onPress={() => router.push({ pathname: "/check", params: { type: item.type } })}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.76 : 1 }
              ]}
            >
              <View style={[styles.icon, { backgroundColor: c.surfaceMuted }]}>
                <Ionicons name={item.icon} size={22} color={c.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: c.text }]}>{item.title}</Text>
                <Text style={[styles.cardText, { color: c.textMuted }]}>{item.text}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
            </Pressable>
          ))}
        </View>

        <View style={[styles.note, { backgroundColor: c.surfaceMuted }]}>
          <Ionicons name="shield-checkmark-outline" size={19} color={c.text} />
          <Text style={[styles.noteText, { color: c.textMuted }]}>
            PheleCheck gives risk guidance, not a guarantee. Verify important payments or identities independently.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { minHeight: 62, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800" },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 28 },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1, marginTop: 18 },
  title: { fontSize: 30, lineHeight: 35, fontWeight: "800", letterSpacing: -1, marginTop: 5 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 20 },
  list: { gap: 10 },
  card: { minHeight: 84, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontWeight: "800" },
  cardText: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  note: { marginTop: 18, borderRadius: radius.md, padding: 15, flexDirection: "row", gap: 10, alignItems: "flex-start" },
  noteText: { flex: 1, fontSize: 11, lineHeight: 17 }
});
