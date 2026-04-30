import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/shared/services/supabase/server';
import { applyAllStagedChanges } from '@/shared/daos/aiChatDao';
import { ApplyAllStagedChangesSchema } from '@/shared/schemas/aiChat';
import { withAuth } from '@/shared/utils/with-is-auth';

type RouteContext = { params: Promise<{ sessionId: string; messageId: string }> };

/**
 * POST /api/ai-chat/sessions/[sessionId]/messages/[messageId]/apply-all
 * Body: { action: 'accept' | 'reject' }
 * Atomically accepts or rejects every pending staged change on the message.
 */
export const POST = withAuth(async (req: NextRequest, context: RouteContext) => {
  try {
    const { sessionId, messageId } = await context.params;
    if (!sessionId || !messageId) {
      return NextResponse.json(
        { error: 'sessionId and messageId are required' },
        { status: 400 },
      );
    }

    const parsed = ApplyAllStagedChangesSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await applyAllStagedChanges(
      sessionId,
      messageId,
      user.id,
      parsed.data.action,
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
