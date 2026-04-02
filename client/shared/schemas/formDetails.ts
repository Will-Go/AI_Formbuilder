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
  authorId: z.string().uuid(),
  description: z.string().nullable().optional(),
  status: z.enum(["draft", "published", "private", "closed"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  theme: z.record(z.string(), z.any()).default({}),
  settings: z.record(z.string(), z.any()).default({}),
  questions: z.array(QuestionSchema),
});

export type OptionType = z.infer<typeof OptionSchema>;
export type QuestionType = z.infer<typeof QuestionSchema>;
export type FormDetailsType = z.infer<typeof FormDetailsSchema>;
