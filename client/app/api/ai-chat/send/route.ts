import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/shared/services/supabase/server";
import { getOrCreateChatSession, saveMessage } from "@/shared/daos/aiChatDao";
import { sendWithContext } from "@/shared/services/openrouter/client";
import { withAuth } from "@/shared/utils/with-is-auth";
import type {
  SendMessageRequest,
  SendMessageResponse,
} from "@/shared/types/aiChat";
import type { Form } from "@/shared/types/forms";

/**
 * POST /api/ai-chat/send
 * Body: { formId, message, formContext }
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

    const body: SendMessageRequest = await req.json();
    const { formId, message, formContext } = body;

    if (!formId || !message) {
      return NextResponse.json(
        { error: "formId and message are required" },
        { status: 400 },
      );
    }

    // Ensure a session exists
    const session = await getOrCreateChatSession(formId, user.id);

    // Persist the user message
    const userMessage = await saveMessage(session.id, "user", message);

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
    return NextResponse.json({ userMessage });
  } catch (error) {
    console.error("[ai-chat/send] error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
