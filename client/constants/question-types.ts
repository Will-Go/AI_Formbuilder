import type { QuestionType } from "@/shared/types/forms";

export type QuestionTypeGroup = "Text" | "Selection" | "Structured" | "Advanced" | "Layout";

export type QuestionTypeMeta = {
  type: QuestionType;
  label: string;
  group: QuestionTypeGroup;
};

export const QUESTION_TYPE_META: readonly QuestionTypeMeta[] = [
  { type: "short_text", label: "Short answer", group: "Text" },
  { type: "long_text", label: "Paragraph", group: "Text" },
  { type: "multiple_choice", label: "Multiple choice", group: "Selection" },
  { type: "checkbox", label: "Checkboxes", group: "Selection" },
  { type: "dropdown", label: "Dropdown", group: "Selection" },
  { type: "email", label: "Email", group: "Structured" },
  { type: "phone", label: "Phone", group: "Structured" },
  { type: "number", label: "Number", group: "Structured" },
  { type: "date", label: "Date", group: "Structured" },
  { type: "rating", label: "Rating", group: "Advanced" },
  { type: "linear_scale", label: "Linear scale", group: "Advanced" },
  { type: "yes_no", label: "Yes / No", group: "Advanced" },
  { type: "section_divider", label: "Section divider", group: "Layout" },
  { type: "paragraph", label: "Text", group: "Layout" },
] as const;

