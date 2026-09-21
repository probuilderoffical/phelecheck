import AsyncStorage from "@react-native-async-storage/async-storage";

export type PendingCheckInput = {
  text?: string;
  imageBase64?: string;
  mimeType?: string;
  inputType: string;
};

const PREFIX = "phelecheck.pending.";

export async function savePendingInput(input: PendingCheckInput) {
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  await AsyncStorage.setItem(PREFIX + key, JSON.stringify(input));
  return key;
}

export async function takePendingInput(key: string) {
  const storageKey = PREFIX + key;
  const raw = await AsyncStorage.getItem(storageKey);
  await AsyncStorage.removeItem(storageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingCheckInput;
  } catch {
    return null;
  }
}
