import type { Form, Question } from "@/shared/types/forms";

export type AiFormContext = {
  id: string;
  title: string;
  description?: string;
  questions: Array<{
    id: string;
    type: Question["type"];
    label: string;
    order: number;
  }>;
};

export function serializeFormForAi(form: Form): string {
  const context: AiFormContext = {
    id: form.id,
    title: form.title,
    description: form.description,
    questions: form.questions
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((q) => ({
        id: q.id,
        type: q.type,
        label: q.label,
        order: q.order,
      })),
  };

  return JSON.stringify(context);
}