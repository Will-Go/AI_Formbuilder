import { NextResponse } from "next/server";
import { createClient } from "@/shared/services/supabase/server";
import { withAuth } from "@/shared/utils/with-is-auth";

interface RouteParams {
  params: Promise<{
    id: string;
    email: string;
  }>;
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

      const { id: formId, email } = await params;
      const ownsForm = await ensureOwnedForm(supabase, formId, user.id);

      if (!ownsForm) {
        return NextResponse.json(
          { error: "Form not found or access denied" },
          { status: 404 },
        );
      }

      const decodedEmail = decodeURIComponent(email);

      const { error } = await supabase
        .from("form_shared_list")
        .delete()
        .eq("form_id", formId)
        .eq("email", decodedEmail);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Server error" },
        { status: 500 },
      );
    }
  },
);
