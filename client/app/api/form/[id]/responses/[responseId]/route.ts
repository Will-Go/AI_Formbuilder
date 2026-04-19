import { NextResponse } from "next/server";
import { createClient } from "@/shared/services/supabase/server";
import { withAuth } from "@/shared/utils/with-is-auth";
import { getResponse, deleteResponse } from "@/shared/daos/responsesDao";

interface RouteParams {
  params: Promise<{
    id: string;
    responseId: string;
  }>;
}

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

      const { id: formId, responseId } = await params;

      // Verify form ownership using formsDao equivalent logic or direct query
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

      // Fetch single response using DAO
      const formattedResponse = await getResponse(formId, responseId);

      return NextResponse.json(formattedResponse);
    } catch (error) {
      console.error("Error fetching response:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unexpected server error" },
        { status: 500 },
      );
    }
  },
);

export const DELETE = withAuth(
  async (request: Request, { params }: RouteParams) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { id: formId, responseId } = await params;

      // Verify form ownership
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

      // Delete response using DAO
      await deleteResponse(formId, responseId);

      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error("Error deleting response:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unexpected server error" },
        { status: 500 },
      );
    }
  },
);