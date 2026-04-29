import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/shared/services/supabase/server';
import {
  selectChatSession,
  softDeleteChatSession,
} from '@/shared/daos/aiChatDao';
import { SelectAiChatSessionSchema } from '@/shared/schemas/aiChat';
import { withAuth } from '@/shared/utils/with-is-auth';
import type {
  DeleteSessionResponse,
  SelectSessionResponse,
} from '@/shared/types/aiChat';

type RouteContext = { params: Promise<{ sessionId: string }> };

export const PATCH = withAuth(async (req: NextRequest, context: RouteContext) => {
  try {
    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const parsed = SelectAiChatSessionSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await selectChatSession(sessionId, user.id);
    const payload: SelectSessionResponse = { session };
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

export const DELETE = withAuth(
  async (_req: NextRequest, context: RouteContext) => {
    try {
      const { sessionId } = await context.params;

      if (!sessionId) {
        return NextResponse.json(
          { error: 'sessionId is required' },
          { status: 400 },
        );
      }

      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const payload: DeleteSessionResponse = await softDeleteChatSession(
        sessionId,
        user.id,
      );
      return NextResponse.json(payload);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unexpected error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  },
);
