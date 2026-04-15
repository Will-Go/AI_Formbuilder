import type { Response } from "@/shared/types/responses";

const STORAGE_KEY = "ai_form:responses:v1";

type PersistedResponses = {
  version: 1;
  responses: Response[];
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadResponses(): Response[] {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "version" in parsed &&
      "responses" in parsed
    ) {
      const data = parsed as PersistedResponses;
      if (data.version === 1 && Array.isArray(data.responses)) return data.responses;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveResponses(responses: Response[]): void {
  if (!canUseStorage()) return;
  const payload: PersistedResponses = { version: 1, responses };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearResponses(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

