import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/shared/services/supabase/server";
import { withAuth } from "@/shared/utils/with-is-auth";
import {
  FormDetailsSchema,
  CreateQuestionSchema,
  ReorderQuestionsSchema,
  BulkUpdateSchema,
  BulkUpdateQuestionSchema,
} from "@/shared/schemas";
import type { FormErrorResponse, QuestionType } from "@/shared/types/forms";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const isOptionBasedType = (type: string): boolean => {
  return (
    type === "multiple_choice" || type === "checkbox" || type === "dropdown"
  );
};

function sanitizeText(value: string | undefined): string {
  return value?.trim() ?? "";
}

function sanitizeNullableText(
  value: string | null | undefined,
): string | null | undefined {
  if (value === null) {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function ensureOwnedForm(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("forms")
    .select("id")
    .eq("id", formId)
    .eq("owner_id", userId)
    .single();

  return !error && !!data;
}

async function getFormQuestions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formId: string,
) {
  const { data, error } = await supabase.rpc("get_form_details", {
    p_form_id: formId,
  });

  if (error || !data) {
    return {
      error: error?.message ?? "Form not found",
      questions: null as null,
    };
  }

  const parsed = FormDetailsSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "Invalid form data structure", questions: null as null };
  }

  return { error: null, questions: parsed.data.questions };
}

async function replaceQuestionOptions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  questionId: string,
  options: Array<{ value: string; label: string; order?: number }>,
) {
  const { error: deleteError } = await supabase
    .from("options")
    .delete()
    .eq("question_id", questionId);

  if (deleteError) {
    return deleteError.message;
  }

  if (options.length === 0) {
    return null;
  }

  const normalized = options.map((option, index) => ({
    question_id: questionId,
    value: option.value.trim(),
    label: option.label.trim(),
    order: option.order ?? index,
  }));

  const { error: insertError } = await supabase
    .from("options")
    .insert(normalized);
  return insertError ? insertError.message : null;
}

async function reorderQuestions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formId: string,
  questionIds: string[],
) {
  const { data: existingQuestions, error: fetchError } = await supabase
    .from("questions")
    .select("id")
    .eq("form_id", formId);

  if (fetchError || !existingQuestions) {
    return fetchError?.message ?? "Failed to fetch questions";
  }

  if (existingQuestions.length !== questionIds.length) {
    return "questionIds must contain all form questions";
  }

  const existingIds = new Set(existingQuestions.map((question) => question.id));

  if (questionIds.some((questionId) => !existingIds.has(questionId))) {
    return "questionIds contains unknown question IDs";
  }

  for (let index = 0; index < questionIds.length; index += 1) {
    const questionId = questionIds[index];
    const { error } = await supabase
      .from("questions")
      .update({ order: 10000 + index })
      .eq("id", questionId)
      .eq("form_id", formId);

    if (error) {
      return error.message;
    }
  }

  for (let index = 0; index < questionIds.length; index += 1) {
    const questionId = questionIds[index];
    const { error } = await supabase
      .from("questions")
      .update({ order: index + 1 })
      .eq("id", questionId)
      .eq("form_id", formId);

    if (error) {
      return error.message;
    }
  }

  return null;
}

async function applyQuestionUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formId: string,
  update: z.infer<typeof BulkUpdateQuestionSchema>,
) {
  const { id, options, config: inputConfig, ...rest } = update;

  const { data: existingQuestion, error: existingError } = await supabase
    .from("questions")
    .select("id, config")
    .eq("id", id)
    .eq("form_id", formId)
    .single();

  if (existingError || !existingQuestion) {
    return { error: "Question not found", code: 404 };
  }

  const columnPayload: {
    type?: QuestionType;
    label?: string;
    description?: string | null;
    required?: boolean;
    order?: number;
    config?: Record<string, unknown>;
  } = {};

  if (rest.type !== undefined) {
    columnPayload.type = rest.type;
  }

  if (rest.label !== undefined) {
    columnPayload.label = sanitizeText(rest.label);
  }

  if (rest.description !== undefined) {
    columnPayload.description = sanitizeNullableText(rest.description) ?? null;
  }

  if (rest.required !== undefined) {
    columnPayload.required = rest.required;
  }

  if (rest.order !== undefined) {
    columnPayload.order = rest.order;
  }

  const dynamicConfig = Object.fromEntries(
    Object.entries(update).filter(([key]) => {
      return ![
        "id",
        "type",
        "label",
        "description",
        "required",
        "order",
        "config",
        "options",
      ].includes(key);
    }),
  );

  if (
    (inputConfig && Object.keys(inputConfig).length > 0) ||
    Object.keys(dynamicConfig).length > 0
  ) {
    const currentConfig =
      existingQuestion.config && typeof existingQuestion.config === "object"
        ? (existingQuestion.config as Record<string, unknown>)
        : {};

    columnPayload.config = {
      ...currentConfig,
      ...(inputConfig ?? {}),
      ...dynamicConfig,
    };
  }

  if (Object.keys(columnPayload).length > 0) {
    const { error: updateError } = await supabase
      .from("questions")
      .update(columnPayload)
      .eq("id", id)
      .eq("form_id", formId);

    if (updateError) {
      return { error: updateError.message, code: 500 };
    }
  }

  if (options) {
    const optionsError = await replaceQuestionOptions(supabase, id, options);
    if (optionsError) {
      return { error: optionsError, code: 500 };
    }
  }

  return { error: null, code: 200 };
}

export const GET = withAuth(
  async (request: Request, { params }: RouteParams) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return NextResponse.json(
          { error: "Unauthorized" } satisfies FormErrorResponse,
          { status: 401 },
        );
      }

      const { id: formId } = await params;

      if (!formId) {
        return NextResponse.json(
          { error: "Form ID is required" } satisfies FormErrorResponse,
          { status: 400 },
        );
      }

      const ownsForm = await ensureOwnedForm(supabase, formId, user.id);

      if (!ownsForm) {
        return NextResponse.json(
          {
            error: "Form not found or access denied",
          } satisfies FormErrorResponse,
          { status: 404 },
        );
      }

      const { questions, error } = await getFormQuestions(supabase, formId);

      if (error || !questions) {
        return NextResponse.json(
          {
            error: error ?? "Failed to fetch questions",
          } satisfies FormErrorResponse,
          { status: 500 },
        );
      }

      return NextResponse.json({ questions, count: questions.length });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected server error";
      return NextResponse.json({ error: message } satisfies FormErrorResponse, {
        status: 500,
      });
    }
  },
);

export const POST = withAuth(
  async (request: Request, { params }: RouteParams) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return NextResponse.json(
          { error: "Unauthorized" } satisfies FormErrorResponse,
          { status: 401 },
        );
      }

      const { id: formId } = await params;

      if (!formId) {
        return NextResponse.json(
          { error: "Form ID is required" } satisfies FormErrorResponse,
          { status: 400 },
        );
      }

      const ownsForm = await ensureOwnedForm(supabase, formId, user.id);

      if (!ownsForm) {
        return NextResponse.json(
          {
            error: "Form not found or access denied",
          } satisfies FormErrorResponse,
          { status: 404 },
        );
      }

      const body = await request.json();
      const parsed = CreateQuestionSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          {
            error: "Invalid payload",
            details: parsed.error.message,
          } satisfies FormErrorResponse,
          { status: 400 },
        );
      }

      const payload = parsed.data;

      const { data: orderedQuestions, error: orderedError } = await supabase
        .from("questions")
        .select("id")
        .eq("form_id", formId)
        .order("order", { ascending: true });

      if (orderedError || !orderedQuestions) {
        return NextResponse.json(
          {
            error:
              orderedError?.message ?? "Failed to prepare question creation",
          } satisfies FormErrorResponse,
          { status: 500 },
        );
      }

      const { data: createdQuestion, error: createError } = await supabase
        .from("questions")
        .insert({
          ...(payload.id ? { id: payload.id } : {}),
          form_id: formId,
          type: payload.type,
          label: sanitizeText(payload.label),
          description: sanitizeNullableText(payload.description) ?? null,
          required: payload.required ?? false,
          order: orderedQuestions.length + 1,
          config: payload.config ?? {},
        })
        .select("id")
        .single();

      if (createError || !createdQuestion) {
        return NextResponse.json(
          {
            error: createError?.message ?? "Failed to create question",
          } satisfies FormErrorResponse,
          { status: 500 },
        );
      }

      const normalizedOptions =
        payload.options ??
        (isOptionBasedType(payload.type)
          ? [{ value: "Option 1", label: "Option 1", order: 0 }]
          : []);

      if (normalizedOptions.length > 0) {
        const optionsError = await replaceQuestionOptions(
          supabase,
          createdQuestion.id,
          normalizedOptions,
        );

        if (optionsError) {
          return NextResponse.json(
            { error: optionsError } satisfies FormErrorResponse,
            { status: 500 },
          );
        }
      }

      if (
        payload.index !== undefined &&
        payload.index >= 0 &&
        payload.index < orderedQuestions.length
      ) {
        const targetOrder = [
          ...orderedQuestions.map((question) => question.id),
        ];
        targetOrder.splice(payload.index, 0, createdQuestion.id);
        const reorderError = await reorderQuestions(
          supabase,
          formId,
          targetOrder,
        );

        if (reorderError) {
          return NextResponse.json(
            { error: reorderError } satisfies FormErrorResponse,
            { status: 500 },
          );
        }
      }

      const { questions, error } = await getFormQuestions(supabase, formId);

      if (error || !questions) {
        return NextResponse.json(
          {
            error: error ?? "Failed to fetch updated questions",
          } satisfies FormErrorResponse,
          { status: 500 },
        );
      }

      const created = questions.find(
        (question) => question.id === createdQuestion.id,
      );

      return NextResponse.json(
        {
          ok: true,
          question: created ?? null,
          questions,
        },
        { status: 201 },
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected server error";
      return NextResponse.json({ error: message } satisfies FormErrorResponse, {
        status: 500,
      });
    }
  },
);

export const PUT = withAuth(
  async (request: Request, { params }: RouteParams) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return NextResponse.json(
          { error: "Unauthorized" } satisfies FormErrorResponse,
          { status: 401 },
        );
      }

      const { id: formId } = await params;

      if (!formId) {
        return NextResponse.json(
          { error: "Form ID is required" } satisfies FormErrorResponse,
          { status: 400 },
        );
      }

      const ownsForm = await ensureOwnedForm(supabase, formId, user.id);

      if (!ownsForm) {
        return NextResponse.json(
          {
            error: "Form not found or access denied",
          } satisfies FormErrorResponse,
          { status: 404 },
        );
      }

      const body = await request.json();
      const parsed = ReorderQuestionsSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          {
            error: "Invalid payload",
            details: parsed.error.message,
          } satisfies FormErrorResponse,
          { status: 400 },
        );
      }

      const reorderError = await reorderQuestions(
        supabase,
        formId,
        parsed.data.questionIds,
      );

      if (reorderError) {
        return NextResponse.json(
          { error: reorderError } satisfies FormErrorResponse,
          { status: 400 },
        );
      }

      const { questions, error } = await getFormQuestions(supabase, formId);

      if (error || !questions) {
        return NextResponse.json(
          {
            error: error ?? "Failed to fetch updated questions",
          } satisfies FormErrorResponse,
          { status: 500 },
        );
      }

      return NextResponse.json({ ok: true, questions });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected server error";
      return NextResponse.json({ error: message } satisfies FormErrorResponse, {
        status: 500,
      });
    }
  },
);

export const PATCH = withAuth(
  async (request: Request, { params }: RouteParams) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return NextResponse.json(
          { error: "Unauthorized" } satisfies FormErrorResponse,
          { status: 401 },
        );
      }

      const { id: formId } = await params;

      if (!formId) {
        return NextResponse.json(
          { error: "Form ID is required" } satisfies FormErrorResponse,
          { status: 400 },
        );
      }

      const ownsForm = await ensureOwnedForm(supabase, formId, user.id);

      if (!ownsForm) {
        return NextResponse.json(
          {
            error: "Form not found or access denied",
          } satisfies FormErrorResponse,
          { status: 404 },
        );
      }

      const body = await request.json();
      const parsed = BulkUpdateSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          {
            error: "Invalid payload",
            details: parsed.error.message,
          } satisfies FormErrorResponse,
          { status: 400 },
        );
      }

      for (const update of parsed.data.updates) {
        const result = await applyQuestionUpdate(supabase, formId, update);
        if (result.error) {
          return NextResponse.json(
            { error: result.error } satisfies FormErrorResponse,
            { status: result.code },
          );
        }
      }

      const { questions, error } = await getFormQuestions(supabase, formId);

      if (error || !questions) {
        return NextResponse.json(
          {
            error: error ?? "Failed to fetch updated questions",
          } satisfies FormErrorResponse,
          { status: 500 },
        );
      }

      return NextResponse.json({
        ok: true,
        questions,
        updatedCount: parsed.data.updates.length,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected server error";
      return NextResponse.json({ error: message } satisfies FormErrorResponse, {
        status: 500,
      });
    }
  },
);
