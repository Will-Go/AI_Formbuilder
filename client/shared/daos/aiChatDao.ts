import { createClient } from '@/shared/services/supabase/server';
import type {
  ChatSession,
  ChatMessage,
  StagedChange,
} from '@/shared/types/aiChat';

// ── helpers ──────────────────────────────────────────────────────────────────

function mapDbSession(row: Record<string, unknown>): ChatSession {
  return {
    id: row.id as string,
    formId: row.form_id as string,
    userId: row.user_id as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapDbMessage(row: Record<string, unknown>): ChatMessage {
  const meta = (row.metadata as Record<string, unknown>) ?? {};
  const stagedChanges = Array.isArray(meta.stagedChanges)
    ? (meta.stagedChanges as StagedChange[])
    : undefined;

  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    role: row.role as 'user' | 'assistant',
    content: row.content as string,
    stagedChanges,
    createdAt: row.created_at as string,
  };
}

// ── public API ───────────────────────────────────────────────────────────────

/**
 * Fetch existing session for a form+user pair, or create one if absent.
 */
export async function getOrCreateChatSession(
  formId: string,
  userId: string,
): Promise<ChatSession> {
  const supabase = await createClient();

  // Try to find existing session
  const { data: existing, error: fetchErr } = await supabase
    .from('ai_chat_sessions')
    .select('*')
    .eq('form_id', formId)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchErr) {
    throw new Error(`Failed to fetch chat session: ${fetchErr.message}`);
  }

  if (existing) {
    return mapDbSession(existing as Record<string, unknown>);
  }

  // Create new session
  const { data: created, error: createErr } = await supabase
    .from('ai_chat_sessions')
    .insert({ form_id: formId, user_id: userId })
    .select('*')
    .single();

  if (createErr || !created) {
    throw new Error(`Failed to create chat session: ${createErr?.message}`);
  }

  return mapDbSession(created as Record<string, unknown>);
}

/**
 * Retrieve all messages for a session ordered by creation time.
 */
export async function getSessionMessages(
  sessionId: string,
  limit = 100,
): Promise<ChatMessage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ai_chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  return (data ?? []).map((row) =>
    mapDbMessage(row as Record<string, unknown>),
  );
}

/**
 * Persist a single message to the database.
 */
export async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  stagedChanges?: StagedChange[],
): Promise<ChatMessage> {
  const supabase = await createClient();

  const metadata = stagedChanges ? { stagedChanges } : {};

  const { data, error } = await supabase
    .from('ai_chat_messages')
    .insert({ session_id: sessionId, role, content, metadata })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to save message: ${error?.message}`);
  }

  return mapDbMessage(data as Record<string, unknown>);
}

/**
 * Overwrite the stagedChanges array on an existing assistant message.
 * Called when user accepts / rejects individual changes.
 */
export async function updateMessageStages(
  messageId: string,
  stagedChanges: StagedChange[],
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('ai_chat_messages')
    .update({ metadata: { stagedChanges } })
    .eq('id', messageId);

  if (error) {
    throw new Error(`Failed to update staged changes: ${error.message}`);
  }
}
