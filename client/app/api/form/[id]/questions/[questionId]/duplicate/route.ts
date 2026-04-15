import { NextResponse } from "next/server";
import { createClient } from "@/shared/services/supabase/server";
import { withAuth } from "@/shared/utils/with-is-auth";
import { duplicateQuestion } from "@/daos/formsDao";
import type { FormErrorResponse } from "@/shared/types/forms";

interface RouteParams {
  params: Promise<{
    id: string; // formId
    questionId: string;
  }>;
}

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

      const { id: formId, questionId } = await params;

      if (!formId) {
        return NextResponse.json(
          { error: "Form ID is required" } satisfies FormErrorResponse,
          { status: 400 },
        );
      }
      if (!questionId) {
        return NextResponse.json(
          { error: "Question ID is required" } satisfies FormErrorResponse,
          { status: 400 },
        );
      }

      // The DAO function handles ownership check internally
      const updatedForm = await duplicateQuestion(formId, questionId);

      // Return the full updated form details
      return NextResponse.json(updatedForm);
    } catch (error) {
      console.error("Error duplicating question:", error);
      const message =
        error instanceof Error ? error.message : "Unexpected server error";
      return NextResponse.json({ error: message } satisfies FormErrorResponse, {
        status: 500,
      });
    }
  },
);
