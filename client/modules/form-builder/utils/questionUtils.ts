import { Question } from "@/shared/types/forms";

export function isOptionsQuestion(question: Question) {
  return ["multiple_choice", "checkbox", "dropdown"].includes(question.type);
}

export function hasRequiredQuestion(question: Question) {
  return !["paragraph", "section_divider"].includes(question.type);
}
