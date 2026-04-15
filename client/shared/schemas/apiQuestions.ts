import { z } from "zod";
import type { QuestionType } from "@/shared/types/forms";

export const QUESTION_TYPES: [QuestionType, ...QuestionType[]] = [
  "short_text",
  "long_text",
  "multiple_choice",
  "checkbox",
  "dropdown",
  "email",
  "phone",
  "number",
  "date",
  "rating",
  "linear_scale",
  "yes_no",
  "section_divider",
  "paragraph",
];

export const OptionInputSchema = z.object({
  value: z.string().trim().min(1).max(255),
  label: z.string().trim().max(255),
  order: z.number().int().min(0).optional(),
});

export const CreateQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(QUESTION_TYPES),
  index: z.number().int().min(0).optional(),
  label: z.string().max(500).optional(),
  description: z.string().max(2000).nullable().optional(),
  required: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  options: z.array(OptionInputSchema).optional(),
});

export const ReorderQuestionsSchema = z.object({
  questionIds: z.array(z.string().uuid()).min(1),
});

export const BulkUpdateQuestionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(QUESTION_TYPES).optional(),
  label: z.string().max(500).optional(),
  description: z.string().max(2000).nullable().optional(),
  required: z.boolean().optional(),
  order: z.number().int().min(1).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  options: z.array(OptionInputSchema).optional(),
});

export const BulkUpdateSchema = z.object({
  updates: z.array(BulkUpdateQuestionSchema).min(1),
});

export const UpdateQuestionSchema = z.object({
  type: z.enum(QUESTION_TYPES).optional(),
  label: z.string().max(500).optional(),
  description: z.string().max(2000).nullable().optional(),
  required: z.boolean().optional(),
  order: z.number().int().min(1).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  options: z.array(OptionInputSchema).optional(),
});

export type OptionInputType = z.infer<typeof OptionInputSchema>;
export type CreateQuestionType = z.infer<typeof CreateQuestionSchema>;
export type ReorderQuestionsType = z.infer<typeof ReorderQuestionsSchema>;
export type BulkUpdateQuestionType = z.infer<typeof BulkUpdateQuestionSchema>;
export type BulkUpdateType = z.infer<typeof BulkUpdateSchema>;
export type UpdateQuestionType = z.infer<typeof UpdateQuestionSchema>;
