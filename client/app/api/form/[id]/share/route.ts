import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/shared/services/supabase/server";
import { withAuth } from "@/shared/utils/with-is-auth";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const ShareEmailSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
});

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
      const ownsForm = await ensureOwnedForm(supabase, formId, user.id);

      if (!ownsForm) {
        return NextResponse.json(
          { error: "Form not found or access denied" },
          { status: 404 },
        );
      }

      const { data, error } = await supabase
        .from("form_shared_list")
        .select("id, email, created_at")
        .eq("form_id", formId)
        .order("created_at", { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ sharedList: data });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Server error" },
        { status: 500 },
      );
    }
  },
);

export const POST = withAuth(
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
      const ownsForm = await ensureOwnedForm(supabase, formId, user.id);

      if (!ownsForm) {
        return NextResponse.json(
          { error: "Form not found or access denied" },
          { status: 404 },
        );
      }

      const body = await request.json();
      const parsed = ShareEmailSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.message },
          { status: 400 },
        );
      }

      const { email } = parsed.data;

      const { data, error } = await supabase
        .from("form_shared_list")
        .insert({ form_id: formId, email })
        .select("id, email, created_at")
        .single();

      if (error) {
        if (error.code === "23505") {
          return NextResponse.json(
            { error: "Email is already shared" },
            { status: 400 },
          );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ sharedUser: data });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Server error" },
        { status: 500 },
      );
    }
  },
);
