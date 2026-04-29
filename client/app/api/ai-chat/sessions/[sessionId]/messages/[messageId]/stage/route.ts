import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/shared/services/supabase/server';
import { updateMessageStages } from '@/shared/daos/aiChatDao';
import { UpdateAiChatStagesSchema } from '@/shared/schemas/aiChat';
import { withAuth } from '@/shared/utils/with-is-auth';
import type { StagedChange, UpdateStagesResponse } from '@/shared/types/aiChat';

type RouteContext = { params: Promise<{ sessionId: string; messageId: string }> };

/**
 * PATCH /api/ai-chat/sessions/[sessionId]/messages/[messageId]/stage
 * Body: { stagedChanges: StagedChange[] }
 * Updates the accepted/rejected status of staged changes on a message.
 */
export const PATCH = withAuth(async (req: NextRequest, context: RouteContext) => {
  try {
    const { sessionId, messageId } = await context.params;
    if (!sessionId || !messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
    }

    const parsed = UpdateAiChatStagesSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await updateMessageStages(
      sessionId,
      messageId,
      user.id,
      parsed.data.stagedChanges as StagedChange[],
    );
    const payload: UpdateStagesResponse = { ok: true };
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
