import { QUESTION_TYPE_META } from "@/constants/question-types";
import type { Question, QuestionType } from "@/shared/types/forms";

export function getQuestionTypeLabel(type: QuestionType): string {
  return QUESTION_TYPE_META.find((m) => m.type === type)?.label ?? type;
}

export function isLayoutQuestion(q: Question): boolean {
  return q.type === "paragraph" || q.type === "section_divider";
}

