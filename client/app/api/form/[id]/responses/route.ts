import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/shared/utils/with-is-auth";
import { toPositiveInteger } from "@/shared/utils/number";
import { submitResponse, getResponses } from "@/shared/daos/responsesDao";
import { getFormDetails } from "@/shared/daos/formsDao";
import { createClient } from "@/shared/services/supabase/server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const AnswerSchema = z.object({
  question_id: z.string().uuid(),
  value: z.any(),
});

const SubmitResponseSchema = z.object({
  answers: z.array(AnswerSchema),
});

export const GET = withAuth(
  async (request: Request, { params }: RouteParams) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { id: formId } = await params;
      const { searchParams } = new URL(request.url);

      const rawLimit = searchParams.get("limit") ?? "10";
      const rawPageNumber = searchParams.get("page") ?? "1";
      const limit = toPositiveInteger(rawLimit) ?? 10;
      const page = toPositiveInteger(rawPageNumber) ?? 1;

      // Verify form ownership using formsDao equivalent logic or direct query
      // (Using direct query to quickly check owner without fetching full form)
      const { data: form, error: formError } = await supabase
        .from("forms")
        .select("id")
        .eq("id", formId)
        .eq("owner_id", user.id)
        .single();

      if (formError || !form) {
        return NextResponse.json(
          { error: "Form not found or access denied" },
          { status: 404 },
        );
      }

      // Delegate to DAO
      const result = await getResponses({
        formId,
        limit,
        pageNumber: page,
      });

      // To keep backward compatibility with the frontend structure:
      const formattedResponses = result.responses.map(
        (r: {
          response_id: string;
          form_id: string;
          submitted_at: string;
          ip: string | null;
          device: string | null;
          metadata: Record<string, unknown>;
          answers: { question_id: string; answer_value: unknown }[];
        }) => ({
          id: r.response_id,
          form_id: r.form_id,
          submitted_at: r.submitted_at,
          ip: r.ip,
          device: r.device,
          metadata: r.metadata,
          answers: r.answers.map(
            (a: { question_id: string; answer_value: unknown }) => ({
              question_id: a.question_id,
              value: a.answer_value,
            }),
          ),
        }),
      );

      return NextResponse.json({
        responses: formattedResponses,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error fetching responses:", error);
      return NextResponse.json(
        { error: "Unexpected server error" },
        { status: 500 },
      );
    }
  },
);

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id: formId } = await params;

    // We can also extract respondent_id if the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const parsed = SubmitResponseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.issues },
        { status: 400 },
      );
    }

    // Extract basic device/IP metadata from request headers
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "";
    const device = request.headers.get("user-agent") || "";

    // Delegate to DAO
    const responseId = await submitResponse({
      formId,
      respondentId: user?.id,
      ip,
      device,
      metadata: { user_agent: device },
      answers: parsed.data.answers,
    });

    return NextResponse.json({
      ok: true,
      responseId,
    });
  } catch (error) {
    console.error("Error submitting response:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 500 },
    );
  }
}
