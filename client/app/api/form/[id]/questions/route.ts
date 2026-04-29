import { NextResponse } from "next/server";

import {
  bulkUpdateQuestions,
  createQuestion,
  getQuestions,
  QuestionsDaoError,
  reorderQuestions,
} from "@/shared/daos/questionsDao";
import { withAuth } from "@/shared/utils/with-is-auth";
import {
  CreateQuestionSchema,
  ReorderQuestionsSchema,
  BulkUpdateSchema,
} from "@/shared/schemas";
import type { FormErrorResponse } from "@/shared/types/forms";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export const GET = withAuth(
  async (request: Request, { params }: RouteParams) => {
    try {
      const { id: formId } = await params;

      if (!formId) {
        return NextResponse.json(
          { error: "Form ID is required" } satisfies FormErrorResponse,
          { status: 400 },
        );
      }

      const { questions, count } = await getQuestions(formId);

      return NextResponse.json({ questions, count });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected server error";
      const status = error instanceof QuestionsDaoError ? error.status : 500;

      return NextResponse.json({ error: message } satisfies FormErrorResponse, {
        status,
      });
    }
  },
);

export const POST = withAuth(
  async (request: Request, { params }: RouteParams) => {
    try {
      const { id: formId } = await params;

      if (!formId) {
        return NextResponse.json(
          { error: "Form ID is required" } satisfies FormErrorResponse,
          { status: 400 },
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

      const { question, questions } = await createQuestion(formId, parsed.data);

      return NextResponse.json(
        {
          ok: true,
          question,
          questions,
        },
        { status: 201 },
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected server error";
      const status = error instanceof QuestionsDaoError ? error.status : 500;

      return NextResponse.json({ error: message } satisfies FormErrorResponse, {
        status,
      });
    }
  },
);

export const PUT = withAuth(
  async (request: Request, { params }: RouteParams) => {
    try {
      const { id: formId } = await params;

      if (!formId) {
        return NextResponse.json(
          { error: "Form ID is required" } satisfies FormErrorResponse,
          { status: 400 },
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

      const { questions } = await reorderQuestions(formId, parsed.data);

      return NextResponse.json({ ok: true, questions });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected server error";
      const status = error instanceof QuestionsDaoError ? error.status : 500;

      return NextResponse.json({ error: message } satisfies FormErrorResponse, {
        status,
      });
    }
  },
);

export const PATCH = withAuth(
  async (request: Request, { params }: RouteParams) => {
    try {
      const { id: formId } = await params;

      if (!formId) {
        return NextResponse.json(
          { error: "Form ID is required" } satisfies FormErrorResponse,
          { status: 400 },
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

      const { questions, updatedCount } = await bulkUpdateQuestions(
        formId,
        parsed.data,
      );

      return NextResponse.json({
        ok: true,
        questions,
        updatedCount,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected server error";
      const status = error instanceof QuestionsDaoError ? error.status : 500;

      return NextResponse.json({ error: message } satisfies FormErrorResponse, {
        status,
      });
    }
  },
);
