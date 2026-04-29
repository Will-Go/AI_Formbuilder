import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/services/supabase/server";
import {
  createChatSession,
  getOrCreateChatSessionWithList,
} from "@/shared/daos/aiChatDao";
import {
  CreateAiChatSessionSchema,
  GetAiChatSessionsSchema,
} from "@/shared/schemas/aiChat";
import { withAuth } from "@/shared/utils/with-is-auth";
import type {
  CreateSessionResponse,
  GetOrCreateSessionResponse,
} from "@/shared/types/aiChat";

/**
 * GET /api/ai-chat/sessions?formId=...
 * Returns the latest active chat session and session history for this form+user.
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = GetAiChatSessionsSchema.safeParse(
      Object.fromEntries(searchParams),
    );

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: GetOrCreateSessionResponse =
      await getOrCreateChatSessionWithList({ ...parsed.data, userId: user.id });
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

/**
 * POST /api/ai-chat/sessions
 * Creates a new active chat session for a form.
 */
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = CreateAiChatSessionSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const session = await createChatSession(parsed.data.formId, user.id);
    const payload: CreateSessionResponse = { session };
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
