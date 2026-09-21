import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { radius, spacing } from "@/theme";
import { useAppTheme } from "@/providers/AppPreferences";
import { savePendingInput } from "@/services/pendingCheck";

function titleFor(type?: string) {
  switch (type) {
    case "screenshot": return "Screenshot";
    case "link": return "Website or link";
    case "qr": return "QR code";
    case "payment": return "Payment details";
    case "phone": return "Phone number";
    default: return "Message";
  }
}

export default function CheckScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const { scheme, colors: c } = useAppTheme();
  const [text, setText] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const isImage = type === "screenshot" || type === "qr";
  const title = useMemo(() => titleFor(type), [type]);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.65, base64: true });
    if (!result.canceled) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? null);
      setImageMimeType(asset.mimeType ?? "image/jpeg");
      Haptics.selectionAsync();
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.65, base64: true });
    if (!result.canceled) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? null);
      setImageMimeType(asset.mimeType ?? "image/jpeg");
    }
  }

  async function analyze() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isImage) {
      if (!imageBase64) return;
      const pendingKey = await savePendingInput({
        inputType: type ?? "screenshot",
        imageBase64,
        mimeType: imageMimeType ?? "image/jpeg",
        text: type === "qr"
          ? "Inspect this QR code. If its destination or encoded value is readable, assess that evidence too. Do not invent a destination if it cannot be read."
          : "Inspect this screenshot for fraud, phishing, impersonation, payment pressure, suspicious links, credential requests, or other scam signals."
      });
      router.push({ pathname: "/result", params: { type: type ?? "screenshot", pendingKey } });
      return;
    }

    router.push({ pathname: "/result", params: { type: type ?? "message", sample: text.trim().slice(0, 4000) } });
  }

  const canContinue = isImage ? !!imageBase64 : text.trim().length > 2;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerIcon}><Ionicons name="arrow-back" size={23} color={c.text} /></Pressable>
          <Text style={[styles.headerTitle, { color: c.text }]}>{title}</Text>
          <View style={styles.headerIcon} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: c.text }]}>What should we check?</Text>
          <Text style={[styles.help, { color: c.textMuted }]}>Only add the information needed for this check. Keep passwords, PINs and OTPs private.</Text>

          {isImage ? (
            <>
              <View style={[styles.upload, { backgroundColor: c.surface, borderColor: c.border }]}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.preview} />
                ) : (
                  <>
                    <View style={[styles.uploadIcon, { backgroundColor: c.surfaceMuted }]}>
                      <Ionicons name={type === "qr" ? "qr-code-outline" : "image-outline"} size={28} color={c.text} />
                    </View>
                    <Text style={[styles.uploadTitle, { color: c.text }]}>Add an image</Text>
                    <Text style={[styles.uploadText, { color: c.textMuted }]}>Choose from your gallery or take a new photo.</Text>
                  </>
                )}
              </View>
              <View style={styles.imageActions}>
                <Pressable onPress={pickImage} style={[styles.secondary, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <Ionicons name="images-outline" size={19} color={c.text} /><Text style={[styles.secondaryText, { color: c.text }]}>Gallery</Text>
                </Pressable>
                <Pressable onPress={takePhoto} style={[styles.secondary, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <Ionicons name="camera-outline" size={19} color={c.text} /><Text style={[styles.secondaryText, { color: c.text }]}>Camera</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={[styles.inputCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={
                  type === "phone" ? "Enter phone number" :
                  type === "payment" ? "Enter account, wallet or payment details" :
                  type === "link" ? "Paste website or link" :
                  "Paste the suspicious message"
                }
                placeholderTextColor={c.textMuted}
                multiline
                autoCapitalize="none"
                style={[styles.input, { color: c.text }]}
              />
              <View style={[styles.inputHint, { borderTopColor: c.border }]}>
                <Ionicons name="shield-checkmark-outline" size={16} color={c.textMuted} />
                <Text style={[styles.inputHintText, { color: c.textMuted }]}>Sensitive data will be protected before analysis.</Text>
              </View>
            </View>
          )}

          <Pressable
            disabled={!canContinue}
            onPress={analyze}
            style={[styles.primary, { backgroundColor: canContinue ? c.text : c.surfaceMuted }]}
          >
            <Ionicons name="sparkles-outline" size={18} color={canContinue ? (scheme === "dark" ? "#111" : "#fff") : c.textMuted} />
            <Text style={[styles.primaryText, { color: canContinue ? (scheme === "dark" ? "#111" : "#fff") : c.textMuted }]}>Analyze risk</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { height: 60, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800" },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 34 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.8, marginTop: 18 },
  help: { fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 22 },
  inputCard: { borderWidth: 1, borderRadius: radius.lg, overflow: "hidden" },
  input: { minHeight: 210, padding: 18, textAlignVertical: "top", fontSize: 16, lineHeight: 24 },
  inputHint: { borderTopWidth: StyleSheet.hairlineWidth, minHeight: 48, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8 },
  inputHintText: { fontSize: 12, flex: 1 },
  upload: { minHeight: 300, borderWidth: 1, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 24 },
  uploadIcon: { width: 58, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  uploadTitle: { fontSize: 17, fontWeight: "800", marginTop: 14 },
  uploadText: { fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 5 },
  preview: { width: "100%", height: 330, resizeMode: "contain" },
  imageActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  secondary: { flex: 1, height: 50, borderWidth: 1, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  secondaryText: { fontSize: 14, fontWeight: "700" },
  primary: { height: 56, borderRadius: 28, marginTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryText: { fontSize: 15, fontWeight: "800" }
});
