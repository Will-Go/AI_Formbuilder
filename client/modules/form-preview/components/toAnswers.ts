import type { Answer } from "@/shared/types/responses";
import type { Question } from "@/shared/types/forms";

export function toAnswers(
  questions: Question[],
  values: Record<string, unknown>,
): Answer[] {
  const answers: Answer[] = [];

  for (const q of questions) {
    if (q.type === "section_divider" || q.type === "paragraph") continue;
    const v = values[q.id];
    if (q.type === "yes_no") {
      if (v === "yes") answers.push({ questionId: q.id, value: true });
      else if (v === "no") answers.push({ questionId: q.id, value: false });
      else answers.push({ questionId: q.id, value: null });
      continue;
    }
    if (q.type === "checkbox") {
      answers.push({
        questionId: q.id,
        value: Array.isArray(v) ? (v as string[]) : [],
      });
      continue;
    }
    if (
      q.type === "number" ||
      q.type === "rating" ||
      q.type === "linear_scale"
    ) {
      answers.push({
        questionId: q.id,
        value: typeof v === "number" ? v : null,
      });
      continue;
    }
    answers.push({ questionId: q.id, value: typeof v === "string" ? v : "" });
  }

  return answers;
}
