import type { Form } from "@/shared/types/forms";

const STORAGE_KEY = "ai_form:forms:v1";

type PersistedForms = {
  version: 1;
  forms: Form[];
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadForms(): Form[] {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "version" in parsed &&
      "forms" in parsed
    ) {
      const data = parsed as PersistedForms;
      if (data.version === 1 && Array.isArray(data.forms)) return data.forms;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveForms(forms: Form[]): void {
  if (!canUseStorage()) return;
  const payload: PersistedForms = { version: 1, forms };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearForms(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

