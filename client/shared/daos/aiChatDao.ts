import { createClient } from '@/shared/services/supabase/server';
import type {
  ChatSession,
  ChatMessage,
  StagedChange,
} from '@/shared/types/aiChat';

export interface GetSessionMessagesOptions {
  sessionId: string;
  userId: string;
  limit?: number;
  cursor?: string;
}

export interface GetSessionMessagesResult {
  messages: ChatMessage[];
  hasMore: boolean;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function mapDbSession(row: Record<string, unknown>): ChatSession {
  return {
    id: row.id as string,
    formId: row.form_id as string,
    userId: row.user_id as string,
    name: (row.name as string | null) ?? 'New chat',
    isDeleted: Boolean(row.is_deleted),
    lastUsedAt:
      (row.last_used_at as string | null) ??
      (row.updated_at as string | null) ??
      (row.created_at as string),
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
 * Fetch active sessions for a form+user pair.
 */
export async function listChatSessions(options: {
  formId: string;
  userId: string;
  search?: string;
  orderBy?: string;
  order?: 'asc' | 'desc';
}): Promise<ChatSession[]> {
  const { formId, userId, search, orderBy, order } = options;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('list_ai_chat_sessions', {
    p_form_id: formId,
    p_user_id: userId,
    p_search: search,
    p_order_by: orderBy,
    p_order: order,
  });

  if (error) {
    throw new Error(`Failed to fetch chat sessions: ${error.message}`);
  }

  return ((data ?? []) as Record<string, unknown>[]).map(mapDbSession);
}

/**
 * Fetch latest active session for a form+user pair, or create one if absent.
 */
export async function getOrCreateChatSession(
  formId: string,
  userId: string,
): Promise<ChatSession> {
  const sessions = await listChatSessions({ formId, userId });

  if (sessions.length > 0) {
    return sessions[0];
  }

  return createChatSession(formId, userId);
}

export async function getOrCreateChatSessionWithList(options: {
  formId: string;
  userId: string;
  search?: string;
  orderBy?: string;
  order?: 'asc' | 'desc';
}): Promise<{ session: ChatSession; sessions: ChatSession[] }> {
  const { formId, userId } = options;
  const sessions = await listChatSessions(options);

  if (sessions.length > 0) {
    return { session: sessions[0], sessions };
  }

  const session = await createChatSession(formId, userId);
  return { session, sessions: [session] };
}

export async function createChatSession(
  formId: string,
  userId: string,
): Promise<ChatSession> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('create_ai_chat_session', {
    p_form_id: formId,
    p_user_id: userId,
  });

  if (error || !data) {
    throw new Error(`Failed to create chat session: ${error?.message}`);
  }

  return mapDbSession(data as Record<string, unknown>);
}

export async function selectChatSession(
  sessionId: string,
  userId: string,
): Promise<ChatSession> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('select_ai_chat_session', {
    p_session_id: sessionId,
    p_user_id: userId,
  });

  if (error || !data) {
    throw new Error(`Failed to select chat session: ${error?.message}`);
  }

  return mapDbSession(data as Record<string, unknown>);
}

export async function softDeleteChatSession(
  sessionId: string,
  userId: string,
): Promise<{ session: ChatSession; sessions: ChatSession[] }> {
  const supabase = await createClient();

  const { data: formId, error } = await supabase.rpc(
    'soft_delete_ai_chat_session',
    {
      p_session_id: sessionId,
      p_user_id: userId,
    },
  );

  if (error || !formId) {
    throw new Error(`Failed to delete chat session: ${error?.message}`);
  }

  const sessions = await listChatSessions({ formId: formId as string, userId });

  if (sessions.length > 0) {
    const session = await selectChatSession(sessions[0].id, userId);
    return {
      session,
      sessions: sessions.map((item, index) =>
        index === 0 ? session : item,
      ),
    };
  }

  const session = await createChatSession(formId as string, userId);
  return { session, sessions: [session] };
}

export async function renameChatSession(
  sessionId: string,
  userId: string,
  name: string,
): Promise<ChatSession> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('rename_ai_chat_session', {
    p_session_id: sessionId,
    p_user_id: userId,
    p_name: name,
  });

  if (error || !data) {
    throw new Error(`Failed to rename chat session: ${error?.message}`);
  }

  return mapDbSession(data as Record<string, unknown>);
}

export async function getActiveChatSession(
  sessionId: string,
  userId: string,
): Promise<ChatSession> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ai_chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .single();

  if (error || !data) {
    throw new Error(`Failed to fetch chat session: ${error?.message}`);
  }

  return mapDbSession(data as Record<string, unknown>);
}

export async function getSessionMessageCount(
  sessionId: string,
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('ai_chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  if (error) {
    throw new Error(`Failed to count messages: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Retrieve messages for a session with cursor-based pagination.
 * Returns newest messages first (descending order).
 */
export async function getSessionMessages(
  sessionId: string,
  userId: string,
  limit = 25,
  cursor?: string,
): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
  await getActiveChatSession(sessionId, userId);

  const supabase = await createClient();

  let query = supabase
    .from('ai_chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;

  const messages = rows
    .slice(0, limit)
    .map((row) => mapDbMessage(row as Record<string, unknown>))
    .reverse();

  return { messages, hasMore };
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
  sessionId: string,
  messageId: string,
  userId: string,
  stagedChanges: StagedChange[],
): Promise<void> {
  await getActiveChatSession(sessionId, userId);

  const supabase = await createClient();

  const { error } = await supabase
    .from('ai_chat_messages')
    .update({ metadata: { stagedChanges } })
    .eq('id', messageId)
    .eq('session_id', sessionId);

  if (error) {
    throw new Error(`Failed to update staged changes: ${error.message}`);
  }
}
