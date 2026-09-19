import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/theme";

function titleFor(type?: string) {
  switch (type) {
    case "screenshot": return "Check screenshot";
    case "link": return "Check link";
    case "qr": return "Check QR code";
    case "payment": return "Check payment details";
    case "phone": return "Check phone number";
    default: return "Check message";
  }
}

export default function CheckScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const c = colors[scheme];
  const [text, setText] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const isImage = type === "screenshot" || type === "qr";
  const title = useMemo(() => titleFor(type), [type]);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      Haptics.selectionAsync();
    }
  }

  function continueToResult() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/result",
      params: { type: type ?? "message", sample: text.slice(0, 160) }
    });
  }

  const canContinue = isImage ? !!imageUri : text.trim().length > 2;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={c.text} />
          </Pressable>

          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
          <Text style={[styles.help, { color: c.textMuted }]}>
            Share only what you want checked. Avoid passwords, PINs and full card numbers.
          </Text>

          {isImage ? (
            <Pressable
              onPress={pickImage}
              style={[styles.upload, { backgroundColor: c.surface, borderColor: c.border }]}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.preview} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={32} color={c.text} />
                  <Text style={[styles.uploadTitle, { color: c.text }]}>Choose an image</Text>
                  <Text style={[styles.uploadText, { color: c.textMuted }]}>
                    Screenshot or QR image from your phone
                  </Text>
                </>
              )}
            </Pressable>
          ) : (
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={
                type === "phone"
                  ? "Enter phone number..."
                  : type === "payment"
                  ? "Enter payment/account details..."
                  : type === "link"
                  ? "Paste a suspicious link..."
                  : "Paste a suspicious message..."
              }
              placeholderTextColor={c.textMuted}
              multiline
              autoCapitalize="none"
              style={[
                styles.input,
                { color: c.text, backgroundColor: c.surface, borderColor: c.border }
              ]}
            />
          )}

          <View style={styles.spacer} />

          <Pressable
            disabled={!canContinue}
            onPress={continueToResult}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: canContinue ? c.accent : c.surfaceMuted,
                opacity: pressed ? 0.8 : 1
              }
            ]}
          >
            <Text style={[styles.buttonText, { color: scheme === "dark" ? "#111" : "#FFF" }]}>
              Check risk
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  back: { width: 40, height: 40, justifyContent: "center" },
  title: { fontSize: 30, fontWeight: "700", letterSpacing: -1, marginTop: 26 },
  help: { fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 24 },
  input: {
    minHeight: 210,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 18,
    textAlignVertical: "top",
    fontSize: 16,
    lineHeight: 24
  },
  upload: {
    minHeight: 260,
    borderWidth: 1,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  preview: { width: "100%", height: 330, resizeMode: "cover" },
  uploadTitle: { marginTop: 12, fontSize: 16, fontWeight: "700" },
  uploadText: { marginTop: 4, fontSize: 13 },
  spacer: { flex: 1, minHeight: 24 },
  button: { minHeight: 56, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  buttonText: { fontSize: 16, fontWeight: "700" }
});
