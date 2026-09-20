import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RiskAnalysis } from "@/services/riskEngine";

const KEY = "phelecheck.history.v1";

export type HistoryItem = {
  id: string;
  createdAt: string;
  type: string;
  inputPreview: string;
  analysis: RiskAnalysis;
};

export async function getHistory(): Promise<HistoryItem[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export async function saveHistoryItem(item: HistoryItem) {
  const current = await getHistory();
  const next = [item, ...current].slice(0, 100);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function clearHistory() {
  await AsyncStorage.removeItem(KEY);
}
