import { z } from "zod";

import { createClient } from "@/shared/services/supabase/server";
import {
  QuestionSchema,
  type BulkUpdateType,
  type CreateQuestionType,
  type QuestionType,
  type ReorderQuestionsType,
} from "@/shared/schemas";

const QuestionsResponseSchema = z.object({
  questions: z.array(QuestionSchema),
  count: z.number().int().min(0),
});

const CreateQuestionResponseSchema = z.object({
  question: QuestionSchema.nullable(),
  questions: z.array(QuestionSchema),
});

const ReorderQuestionsResponseSchema = z.object({
  questions: z.array(QuestionSchema),
});

const BulkUpdateQuestionsResponseSchema = z.object({
  questions: z.array(QuestionSchema),
  updatedCount: z.number().int().min(0),
});

export class QuestionsDaoError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
  ) {
    super(message);
    this.name = "QuestionsDaoError";
  }
}

function getStatusFromRpcMessage(message: string): number {
  if (
    message.includes("Form not found or access denied") ||
    message.includes("Question not found")
  ) {
    return 404;
  }

  if (
    message.includes("parameter is required") ||
    message.includes("payload is required") ||
    message.includes("must contain") ||
    message.includes("contains duplicate") ||
    message.includes("contains unknown") ||
    message.includes("must be")
  ) {
    return 400;
  }

  return 500;
}

export async function getQuestions(formId: string): Promise<{
  questions: QuestionType[];
  count: number;
}> {
  if (!formId) {
    throw new QuestionsDaoError("Form ID is required", 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_questions", {
    p_form_id: formId,
  });

  if (error) {
    throw new QuestionsDaoError(
      error.message,
      getStatusFromRpcMessage(error.message),
    );
  }

  const parsed = QuestionsResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new QuestionsDaoError("Invalid questions data structure");
  }

  return parsed.data;
}

export async function reorderQuestions(
  formId: string,
  input: ReorderQuestionsType,
): Promise<{
  questions: QuestionType[];
}> {
  if (!formId) {
    throw new QuestionsDaoError("Form ID is required", 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reorder_questions", {
    p_form_id: formId,
    p_question_ids: input.questionIds,
  });

  if (error) {
    throw new QuestionsDaoError(
      error.message,
      getStatusFromRpcMessage(error.message),
    );
  }

  const parsed = ReorderQuestionsResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new QuestionsDaoError("Invalid reordered questions data structure");
  }

  return parsed.data;
}

export async function bulkUpdateQuestions(
  formId: string,
  input: BulkUpdateType,
): Promise<{
  questions: QuestionType[];
  updatedCount: number;
}> {
  if (!formId) {
    throw new QuestionsDaoError("Form ID is required", 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("bulk_update_questions", {
    p_form_id: formId,
    p_updates: input.updates,
  });

  if (error) {
    throw new QuestionsDaoError(
      error.message,
      getStatusFromRpcMessage(error.message),
    );
  }

  const parsed = BulkUpdateQuestionsResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new QuestionsDaoError("Invalid updated questions data structure");
  }

  return parsed.data;
}

export async function createQuestion(
  formId: string,
  input: CreateQuestionType,
): Promise<{
  question: QuestionType | null;
  questions: QuestionType[];
}> {
  if (!formId) {
    throw new QuestionsDaoError("Form ID is required", 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_question", {
    p_form_id: formId,
    p_question: input,
  });

  if (error) {
    throw new QuestionsDaoError(
      error.message,
      getStatusFromRpcMessage(error.message),
    );
  }

  const parsed = CreateQuestionResponseSchema.safeParse(data);

  if (!parsed.success) {
    throw new QuestionsDaoError("Invalid created question data structure");
  }

  return parsed.data;
}
