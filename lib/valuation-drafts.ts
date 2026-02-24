import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ValuationFormValues } from "../constants/form-schema";
import { normalizeDocumentsForForm } from "./schema";

const DRAFT_KEY = "valuation_draft_v1";

export type ValuationDraft = {
  version: 1;
  values: ValuationFormValues;
  currentStep: number;
  updatedAt: string;
  valuationId?: string | null;
};

export async function saveDraft(
  values: ValuationFormValues,
  currentStep: number,
  valuationId?: string | null,
): Promise<void> {
  const payload: ValuationDraft = {
    version: 1,
    values,
    currentStep,
    updatedAt: new Date().toISOString(),
    valuationId: valuationId ?? undefined,
  };
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
}

export async function loadDraft(): Promise<ValuationDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ValuationDraft;
    if (parsed.version !== 1 || !parsed.values) {
      return null;
    }
    // Normalize documents so old keys (bptm, nirmal_*, nirmarn_*) map to current form shape
    if (parsed.values.documents) {
      parsed.values = {
        ...parsed.values,
        documents: normalizeDocumentsForForm(parsed.values.documents),
      };
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearDraft(): Promise<void> {
  await AsyncStorage.removeItem(DRAFT_KEY);
}
