import { z } from "zod";
import type { Form, Question } from "@/shared/types/forms";

export type PreviewFormValues = Record<string, unknown>;

function numberField(required: boolean, rules?: { min?: number; max?: number }) {
  let inner = z.number();
  if (rules?.min !== undefined) inner = inner.min(rules.min);
  if (rules?.max !== undefined) inner = inner.max(rules.max);

  const base = z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    if (typeof val === "number") return Number.isFinite(val) ? val : undefined;
    const n = Number(val);
    return Number.isFinite(n) ? n : undefined;
  }, inner);

  return required ? base : base.optional();
}

function stringField(required: boolean, rules?: { minLength?: number; maxLength?: number; pattern?: string }) {
  let schema = z.string();
  if (rules?.minLength !== undefined) schema = schema.min(rules.minLength);
  if (rules?.maxLength !== undefined) schema = schema.max(rules.maxLength);
  if (rules?.pattern) schema = schema.regex(new RegExp(rules.pattern));
  if (required) schema = schema.min(1);
  return required ? schema : schema.optional();
}

function emailField(required: boolean) {
  const email = z.string().email("Invalid email");
  if (required) return email;
  return z.union([email, z.literal("")]).optional();
}

function checkboxField(required: boolean) {
  const base = z.array(z.string());
  return required ? base.min(1) : base.optional();
}

function choiceField(required: boolean) {
  const base = z.string();
  return required ? base.min(1) : base.optional();
}

function yesNoField(required: boolean) {
  const base = z.enum(["yes", "no"]);
  return required ? base : base.optional();
}

function dateField(required: boolean) {
  const base = z.string();
  return required ? base.min(1) : base.optional();
}

export function buildResponseSchema(form: Form) {
  const shape: Record<string, z.ZodTypeAny> = {};
  const defaults: Record<string, unknown> = {};

  const ordered = form.questions.slice().sort((a, b) => a.order - b.order);

  for (const q of ordered) {
    if (q.type === "section_divider" || q.type === "paragraph") continue;

    defaults[q.id] =
      q.type === "checkbox"
        ? (("defaultValue" in q && Array.isArray(q.defaultValue) ? q.defaultValue : []) as string[])
        : "defaultValue" in q
          ? q.defaultValue ?? ""
          : "";

    shape[q.id] = schemaForQuestion(q);
  }

  return {
    schema: z.object(shape),
    defaultValues: defaults,
  };
}

function schemaForQuestion(q: Question): z.ZodTypeAny {
  if (q.type === "short_text" || q.type === "long_text") {
    return stringField(q.required, q.validation);
  }
  if (q.type === "multiple_choice" || q.type === "dropdown") {
    return choiceField(q.required);
  }
  if (q.type === "checkbox") {
    return checkboxField(q.required);
  }
  if (q.type === "email") {
    return emailField(q.required);
  }
  if (q.type === "phone") {
    return stringField(q.required, q.validation);
  }
  if (q.type === "number") {
    return numberField(q.required, q.validation);
  }
  if (q.type === "date") {
    return dateField(q.required);
  }
  if (q.type === "rating") {
    return numberField(q.required, { min: 1, max: q.max });
  }
  if (q.type === "linear_scale") {
    return numberField(q.required, { min: q.min, max: q.max });
  }
  if (q.type === "yes_no") {
    return yesNoField(q.required);
  }
  return z.unknown();
}
