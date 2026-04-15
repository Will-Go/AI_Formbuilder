import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/shared/services/supabase/server";
import { withAuth } from "@/shared/utils/with-is-auth";
import { FormDetailsSchema, UpdateQuestionSchema } from "@/shared/schemas";
import type { FormErrorResponse, QuestionType } from "@/shared/types/forms";

interface RouteParams {
  params: Promise<{
    id: string;
    questionId: string;
  }>;
}

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
  options: Array<{ id?: string; value: string; label: string; order?: number }>,
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
    ...(option.id ? { id: option.id } : {}),
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

async function reorderRemainingQuestions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formId: string,
) {
  const { data: remaining, error: fetchError } = await supabase
    .from("questions")
    .select("id")
    .eq("form_id", formId)
    .order("order", { ascending: true });

  if (fetchError || !remaining) {
    return fetchError?.message ?? "Failed to reorder questions";
  }

  for (let index = 0; index < remaining.length; index += 1) {
    const questionId = remaining[index].id;
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

async function applySingleQuestionUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formId: string,
  questionId: string,
  update: z.infer<typeof UpdateQuestionSchema>,
) {
  const { options, config: inputConfig, ...rest } = update;

  const { data: existingQuestion, error: existingError } = await supabase
    .from("questions")
    .select("id, config")
    .eq("id", questionId)
    .eq("form_id", formId)
    .single();

  if (existingError || !existingQuestion) {
    return { error: "Question not found", status: 404 };
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
      .eq("id", questionId)
      .eq("form_id", formId);

    if (updateError) {
      return { error: updateError.message, status: 500 };
    }
  }

  if (options) {
    const optionsError = await replaceQuestionOptions(
      supabase,
      questionId,
      options,
    );
    if (optionsError) {
      return { error: optionsError, status: 500 };
    }
  }

  return { error: null, status: 200 };
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

      const { id: formId, questionId } = await params;

      if (!formId || !questionId) {
        return NextResponse.json(
          {
            error: "Form ID and Question ID are required",
          } satisfies FormErrorResponse,
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

      const question = questions.find((item) => item.id === questionId);

      if (!question) {
        return NextResponse.json(
          { error: "Question not found" } satisfies FormErrorResponse,
          { status: 404 },
        );
      }

      return NextResponse.json({ question });
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

      const { id: formId, questionId } = await params;

      if (!formId || !questionId) {
        return NextResponse.json(
          {
            error: "Form ID and Question ID are required",
          } satisfies FormErrorResponse,
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
      const parsed = UpdateQuestionSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          {
            error: "Invalid payload",
            details: parsed.error.message,
          } satisfies FormErrorResponse,
          { status: 400 },
        );
      }

      const result = await applySingleQuestionUpdate(
        supabase,
        formId,
        questionId,
        parsed.data,
      );

      if (result.error) {
        return NextResponse.json(
          { error: result.error } satisfies FormErrorResponse,
          { status: result.status },
        );
      }

      const { questions, error } = await getFormQuestions(supabase, formId);

      if (error || !questions) {
        return NextResponse.json(
          {
            error: error ?? "Failed to fetch updated question",
          } satisfies FormErrorResponse,
          { status: 500 },
        );
      }

      const updatedQuestion = questions.find((item) => item.id === questionId);

      if (!updatedQuestion) {
        return NextResponse.json(
          {
            error: "Question not found after update",
          } satisfies FormErrorResponse,
          { status: 404 },
        );
      }

      return NextResponse.json({ ok: true, question: updatedQuestion });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected server error";
      return NextResponse.json({ error: message } satisfies FormErrorResponse, {
        status: 500,
      });
    }
  },
);

export const PUT = PATCH;

export const DELETE = withAuth(
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

      const { id: formId, questionId } = await params;

      if (!formId || !questionId) {
        return NextResponse.json(
          {
            error: "Form ID and Question ID are required",
          } satisfies FormErrorResponse,
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

      const { data: deletedRows, error: deleteError } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId)
        .eq("form_id", formId)
        .select("id");

      if (deleteError) {
        return NextResponse.json(
          { error: deleteError.message } satisfies FormErrorResponse,
          { status: 500 },
        );
      }

      if (!deletedRows || deletedRows.length === 0) {
        return NextResponse.json(
          { error: "Question not found" } satisfies FormErrorResponse,
          { status: 404 },
        );
      }

      const reorderError = await reorderRemainingQuestions(supabase, formId);

      if (reorderError) {
        return NextResponse.json(
          { error: reorderError } satisfies FormErrorResponse,
          { status: 500 },
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
