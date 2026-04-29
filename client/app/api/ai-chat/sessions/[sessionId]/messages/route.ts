import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/services/supabase/server";
import {
  getActiveChatSession,
  getSessionMessages,
  saveMessage,
} from "@/shared/daos/aiChatDao";
import { SaveAiChatMessageSchema } from "@/shared/schemas/aiChat";
import { withAuth } from "@/shared/utils/with-is-auth";
import type { GetMessagesResponse, StagedChange } from "@/shared/types/aiChat";

type RouteContext = { params: Promise<{ sessionId: string }> };

const DEFAULT_LIMIT = 25;

/**
 * GET /api/ai-chat/sessions/[sessionId]/messages
 * Returns paginated messages for a session (newest first).
 * Query params: cursor (optional ISO timestamp), limit (optional, default 25)
 */
export const GET = withAuth(async (req: NextRequest, context: RouteContext) => {
  try {
    const { sessionId } = await context.params;
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor") || undefined;
    const limit = Number(url.searchParams.get("limit")) || DEFAULT_LIMIT;

    const result = await getSessionMessages(sessionId, user.id, limit, cursor);
    const payload: GetMessagesResponse = {
      messages: result.messages,
      hasMore: result.hasMore,
    };
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

/**
 * POST /api/ai-chat/sessions/[sessionId]/messages
 * Body: { role, content, stagedChanges? }
 * Saves a single message to the session.
 */
export const POST = withAuth(
  async (req: NextRequest, context: RouteContext) => {
    try {
      const { sessionId } = await context.params;
      if (!sessionId) {
        return NextResponse.json(
          { error: "sessionId is required" },
          { status: 400 },
        );
      }

      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const parsed = SaveAiChatMessageSchema.safeParse(await req.json());

      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      }

      const { role, content, stagedChanges } = parsed.data;
      await getActiveChatSession(sessionId, user.id);
      const msg = await saveMessage(
        sessionId,
        role,
        content,
        stagedChanges as StagedChange[] | undefined,
      );
      return NextResponse.json({ message: msg });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  },
);
