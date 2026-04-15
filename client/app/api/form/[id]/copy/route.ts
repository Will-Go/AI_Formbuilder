import { NextResponse } from "next/server";
import { copyForm } from "@/shared/daos/formsDao";
import { createClient } from "@/shared/services/supabase/server";
import { withAuth } from "@/shared/utils/with-is-auth";
import type { FormErrorResponse } from "@/shared/types/forms";

interface RouteParams {
  params: Promise<{
    id: string;
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

      const { id } = await params;

      if (!id) {
        return NextResponse.json(
          { error: "Form ID is required" } satisfies FormErrorResponse,
          { status: 400 },
        );
      }

      // Verify the user owns the source form
      const { data: sourceForm, error: sourceError } = await supabase
        .from("forms")
        .select("id")
        .eq("id", id)
        .eq("owner_id", user.id)
        .single();

      if (sourceError || !sourceForm) {
        return NextResponse.json(
          {
            error: "Form not found or access denied",
          } satisfies FormErrorResponse,
          { status: 404 },
        );
      }

      const duplicatedForm = await copyForm(user.id, id);

      return NextResponse.json(duplicatedForm, { status: 201 });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected server error";
      console.error("Error copying form:", message);
      return NextResponse.json({ error: message } satisfies FormErrorResponse, {
        status: 500,
      });
    }
  },
);
