import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/shared/services/supabase/server";
import {
  getActiveChatSession,
  getOrCreateChatSession,
  getSessionMessageCount,
  renameChatSession,
  saveMessage,
  selectChatSession,
} from "@/shared/daos/aiChatDao";
import {
  generateSessionName,
  sendWithContext,
} from "@/shared/services/openrouter/client";
import { SendAiChatMessageSchema } from "@/shared/schemas/aiChat";
import { withAuth } from "@/shared/utils/with-is-auth";
import type {
  SendMessageResponse,
} from "@/shared/types/aiChat";
import type { Form } from "@/shared/types/forms";

/**
 * POST /api/ai-chat/send
 * Body: { formId, sessionId?, message, formContext }
 *
 * 1. Gets or creates the chat session
 * 2. Persists the user message
 * 3. Calls OpenRouter server-side (key never exposed to client)
 * 4. Persists the assistant message with stagedChanges in metadata
 * 5. Returns both messages
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

    const parsed = SendAiChatMessageSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { formId, sessionId, message, formContext } = parsed.data;

    // Parse form context instantly to catch JSON errors before returning 200
    let form: Form;
    try {
      form = JSON.parse(formContext) as Form;
    } catch {
      return NextResponse.json(
        { error: "Invalid formContext JSON" },
        { status: 400 },
      );
    }

    const baseSession = sessionId
      ? await getActiveChatSession(sessionId, user.id)
      : await getOrCreateChatSession(formId, user.id);

    if (baseSession.formId !== formId) {
      return NextResponse.json(
        { error: "Session does not belong to this form" },
        { status: 400 },
      );
    }

    let session = await selectChatSession(baseSession.id, user.id);
    const isFirstMessage = (await getSessionMessageCount(session.id)) === 0;

    // Persist the user message
    const userMessage = await saveMessage(session.id, "user", message);

    if (isFirstMessage) {
      const sessionName = await generateSessionName(message, form);
      session = await renameChatSession(session.id, user.id, sessionName);
    }

    // Process AI generation in the background so the HTTP request never times out
    after(async () => {
      try {
        console.log(
          `[ai-chat] Background task started for session ${session.id}`,
        );
        const { reply, stagedChanges } = await sendWithContext(message, form);

        await saveMessage(
          session.id,
          "assistant",
          reply,
          stagedChanges.length > 0 ? stagedChanges : undefined,
        );
        console.log(
          `[ai-chat] Background task finished for session ${session.id}`,
        );
      } catch (err) {
        console.error("[ai-chat/after] Background processing failed:", err);
        // We persist an error message so the client knows it failed
        await saveMessage(
          session.id,
          "assistant",
          "Sorry, an error occurred while generating the response. Please try again.",
        );
      }
    });

    // Return immediately to the client to avoid timeouts
    const payload: SendMessageResponse = { userMessage, session };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[ai-chat/send] error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
