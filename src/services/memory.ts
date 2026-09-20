import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RiskAnalysis } from "@/services/riskEngine";

const KEY = "phelecheck.memory.v1";

export type MemoryState = {
  recurringRiskTopics: Record<string, number>;
  preferredLanguage: string;
  lastUpdatedAt?: string;
};

const empty: MemoryState = { recurringRiskTopics: {}, preferredLanguage: "en" };

export async function getMemory(): Promise<MemoryState> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return empty;
  try { return { ...empty, ...JSON.parse(raw) }; } catch { return empty; }
}

export async function rememberAnalysis(analysis: RiskAnalysis, language: string) {
  const memory = await getMemory();
  for (const signal of analysis.signals) {
    memory.recurringRiskTopics[signal.title] = (memory.recurringRiskTopics[signal.title] ?? 0) + 1;
  }
  memory.preferredLanguage = language;
  memory.lastUpdatedAt = new Date().toISOString();
  await AsyncStorage.setItem(KEY, JSON.stringify(memory));
}

export async function clearMemory() {
  await AsyncStorage.removeItem(KEY);
}
