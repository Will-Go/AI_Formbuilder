import { z } from "zod";

export const OptionSchema = z.object({
  id: z.string().uuid(),
  value: z.string(),
  label: z.string(),
  order: z.number().int(),
});

export const QuestionSchema = z
  .object({
    id: z.string().uuid(),
    type: z.string(),
    label: z.string(),
    description: z.string().nullable().optional(),
    required: z.boolean(),
    order: z.number().int(),
    options: z.array(OptionSchema).optional(),
  })
  .catchall(z.any());

export const FormDetailsSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  author_id: z.string().uuid(),
  author_name: z.string().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["draft", "published", "private", "closed"]),
  created_at: z.string(),
  updated_at: z.string(),
  theme: z.record(z.string(), z.any()).default({}),
  settings: z.record(z.string(), z.any()).default({}),
  questions: z.array(QuestionSchema),
});

export type OptionType = z.infer<typeof OptionSchema>;
export type QuestionType = z.infer<typeof QuestionSchema>;
export type FormDetailsType = z.infer<typeof FormDetailsSchema>;
