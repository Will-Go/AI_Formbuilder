import { z } from "zod";

export const GetAiChatSessionsSchema = z.object({
  formId: z.string().uuid(),
  search: z.string().optional(),
  orderBy: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const CreateAiChatSessionSchema = z.object({
  formId: z.string().uuid(),
});

export const SelectAiChatSessionSchema = z.object({
  action: z.literal("select"),
});

export const SendAiChatMessageSchema = z.object({
  formId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  message: z.string().trim().min(1),
  formContext: z.string().min(1),
});

export const SaveAiChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  stagedChanges: z.array(z.unknown()).optional(),
});

export const UpdateAiChatStagesSchema = z.object({
  stagedChanges: z.array(z.unknown()),
});

export const ApplyAllStagedChangesSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

export type ApplyAllStagedChangesInput = z.infer<
  typeof ApplyAllStagedChangesSchema
>;

export type GetAiChatSessionsInput = z.infer<typeof GetAiChatSessionsSchema>;
export type CreateAiChatSessionInput = z.infer<
  typeof CreateAiChatSessionSchema
>;
export type SelectAiChatSessionInput = z.infer<
  typeof SelectAiChatSessionSchema
>;
export type SendAiChatMessageInput = z.infer<typeof SendAiChatMessageSchema>;
