"use client";

export type DiffTokenKind = "unchanged" | "added" | "removed";

export type DiffToken = {
  kind: DiffTokenKind;
  value: string;
};

export type QuestionDiffField = {
  key: string;
  label: string;
  original: string;
  modified: string;
  changeType: "unchanged" | "added" | "removed" | "modified";
  originalTokens: DiffToken[];
  modifiedTokens: DiffToken[];
};

export type QuestionDiffSnapshot = {
  label?: string;
  description?: string;
  placeholder?: string;
  text?: string;
};

const FIELD_CONFIG: Array<{ key: keyof QuestionDiffSnapshot; label: string }> = [
  { key: "label", label: "Question" },
  { key: "description", label: "Description" },
  { key: "placeholder", label: "Placeholder" },
  { key: "text", label: "Text" },
];

const MAX_DIFF_TOKENS = 300;
const MAX_DIFF_MATRIX = 35000;

function tokenize(value: string): string[] {
  const normalized = value ?? "";
  if (!normalized) return [];
  return normalized.match(/\S+|\s+/g) ?? [];
}

function toChunks(tokens: string[], kind: DiffTokenKind): DiffToken[] {
  if (tokens.length === 0) return [];
  return [{ kind, value: tokens.join("") }];
}

function compact(tokens: DiffToken[]): DiffToken[] {
  if (tokens.length === 0) return [];
  const compacted: DiffToken[] = [tokens[0]];
  for (let i = 1; i < tokens.length; i++) {
    const current = tokens[i];
    const last = compacted[compacted.length - 1];
    if (last.kind === current.kind) {
      last.value += current.value;
      continue;
    }
    compacted.push({ ...current });
  }
  return compacted;
}

function buildLcsDiff(originalTokens: string[], modifiedTokens: string[]): DiffToken[] {
  const rows = originalTokens.length;
  const cols = modifiedTokens.length;
  const matrix = Array.from({ length: rows + 1 }, () => new Uint16Array(cols + 1));

  for (let r = rows - 1; r >= 0; r--) {
    for (let c = cols - 1; c >= 0; c--) {
      if (originalTokens[r] === modifiedTokens[c]) {
        matrix[r][c] = matrix[r + 1][c + 1] + 1;
      } else {
        matrix[r][c] = Math.max(matrix[r + 1][c], matrix[r][c + 1]);
      }
    }
  }

  const result: DiffToken[] = [];
  let r = 0;
  let c = 0;

  while (r < rows && c < cols) {
    if (originalTokens[r] === modifiedTokens[c]) {
      result.push({ kind: "unchanged", value: originalTokens[r] });
      r++;
      c++;
      continue;
    }

    if (matrix[r + 1][c] >= matrix[r][c + 1]) {
      result.push({ kind: "removed", value: originalTokens[r] });
      r++;
      continue;
    }

    result.push({ kind: "added", value: modifiedTokens[c] });
    c++;
  }

  while (r < rows) {
    result.push({ kind: "removed", value: originalTokens[r] });
    r++;
  }

  while (c < cols) {
    result.push({ kind: "added", value: modifiedTokens[c] });
    c++;
  }

  return compact(result);
}

export function diffText(original: string, modified: string): DiffToken[] {
  if (original === modified) {
    return original ? [{ kind: "unchanged", value: original }] : [];
  }

  const originalTokens = tokenize(original);
  const modifiedTokens = tokenize(modified);

  if (originalTokens.length === 0) {
    return toChunks(modifiedTokens, "added");
  }

  if (modifiedTokens.length === 0) {
    return toChunks(originalTokens, "removed");
  }

  if (
    originalTokens.length > MAX_DIFF_TOKENS ||
    modifiedTokens.length > MAX_DIFF_TOKENS ||
    originalTokens.length * modifiedTokens.length > MAX_DIFF_MATRIX
  ) {
    return [
      { kind: "removed", value: original },
      { kind: "added", value: modified },
    ];
  }

  return buildLcsDiff(originalTokens, modifiedTokens);
}

export function buildQuestionDiffFields(
  original: QuestionDiffSnapshot,
  modified: QuestionDiffSnapshot,
): QuestionDiffField[] {
  return FIELD_CONFIG.map(({ key, label }) => {
    const originalValue = String(original[key] ?? "");
    const modifiedValue = String(modified[key] ?? "");
    const tokens = diffText(originalValue, modifiedValue);

    let changeType: QuestionDiffField["changeType"] = "unchanged";
    if (!originalValue && modifiedValue) changeType = "added";
    else if (originalValue && !modifiedValue) changeType = "removed";
    else if (originalValue !== modifiedValue) changeType = "modified";

    return {
      key,
      label,
      original: originalValue,
      modified: modifiedValue,
      changeType,
      originalTokens: tokens.filter((token) => token.kind !== "added"),
      modifiedTokens: tokens.filter((token) => token.kind !== "removed"),
    };
  }).filter((field) => field.changeType !== "unchanged");
}
