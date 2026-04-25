import { NextRequest, NextResponse } from 'next/server';
import { updateMessageStages } from '@/shared/daos/aiChatDao';
import { withAuth } from '@/shared/utils/with-is-auth';
import type { UpdateStagesRequest, UpdateStagesResponse } from '@/shared/types/aiChat';

type RouteContext = { params: Promise<{ sessionId: string; messageId: string }> };

/**
 * PATCH /api/ai-chat/sessions/[sessionId]/messages/[messageId]/stage
 * Body: { stagedChanges: StagedChange[] }
 * Updates the accepted/rejected status of staged changes on a message.
 */
export const PATCH = withAuth(async (req: NextRequest, context: RouteContext) => {
  try {
    const { messageId } = await context.params;
    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
    }

    const body: UpdateStagesRequest = await req.json();
    if (!Array.isArray(body.stagedChanges)) {
      return NextResponse.json(
        { error: 'stagedChanges array is required' },
        { status: 400 },
      );
    }

    await updateMessageStages(messageId, body.stagedChanges);
    const payload: UpdateStagesResponse = { ok: true };
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
