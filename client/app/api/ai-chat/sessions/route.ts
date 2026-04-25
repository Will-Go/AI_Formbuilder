import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/shared/services/supabase/server';
import { getOrCreateChatSession } from '@/shared/daos/aiChatDao';
import { withAuth } from '@/shared/utils/with-is-auth';
import type { GetOrCreateSessionResponse } from '@/shared/types/aiChat';

/**
 * GET /api/ai-chat/sessions?formId=...
 * Returns the existing chat session for this form+user, or creates a new one.
 */
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get('formId');

    if (!formId) {
      return NextResponse.json({ error: 'formId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getOrCreateChatSession(formId, user.id);
    const payload: GetOrCreateSessionResponse = { session };
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
