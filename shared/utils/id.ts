export function createId(prefix: string): string {
  const cryptoObj: Crypto | undefined =
    typeof crypto !== "undefined" ? crypto : undefined;
  const suffix =
    cryptoObj?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${suffix}`;
}

