import type { Form, Question, QuestionType } from './forms';

export type ChatRole = 'user' | 'assistant';

/**
 * A single AI-suggested change to the form.
 * `accepted` is null while pending user decision.
 */
export type StagedChange = {
  /** Unique change ID (client-generated UUID) */
  id: string;
  type: 'add' | 'update' | 'delete' | 'update_form';
  /** Existing question ID targeted by update/delete operations */
  questionId?: string;
  /** New question type for add operations – helps UI preview */
  questionType?: QuestionType;
  /** Full or partial question payload, or form metadata */
  payload: Partial<Question> | { title?: string; description?: string };
  /** null = pending, true = accepted, false = rejected */
  accepted: boolean | null;
  /** Stores the previous state (e.g. label/description) if accepted */
  past?: string;
};

export type ChatMessage = {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  /** Populated only on assistant messages that proposed changes */
  stagedChanges?: StagedChange[];
  createdAt: string;
};

export type ChatSession = {
  id: string;
  formId: string;
  userId: string;
  name: string;
  isDeleted: boolean;
  lastUsedAt: string;
  createdAt: string;
  updatedAt: string;
  sessionBrief?: string | null;
};

// ── API shapes ──────────────────────────────────────────────────────────────

export type GetOrCreateSessionResponse = {
  session: ChatSession;
  sessions: ChatSession[];
};

export type CreateSessionRequest = {
  formId: string;
};

export type CreateSessionResponse = {
  session: ChatSession;
};

export type SelectSessionRequest = {
  action: 'select';
};

export type SelectSessionResponse = {
  session: ChatSession;
};

export type DeleteSessionResponse = {
  session: ChatSession;
  sessions: ChatSession[];
};

export type GetMessagesResponse = {
  messages: ChatMessage[];
  hasMore: boolean;
};

export type SendMessageRequest = {
  formId: string;
  sessionId?: string;
  message: string;
  /** Full current form JSON so AI has latest context */
  formContext: string;
};

export type SendMessageResponse = {
  userMessage: ChatMessage;
  session: ChatSession;
};

export type UpdateStagesRequest = {
  stagedChanges: StagedChange[];
};

export type UpdateStagesResponse = {
  ok: boolean;
};

export type ApplyAllStagedChangesRequest = {
  action: 'accept' | 'reject';
};

export type ApplyAllStagedChangesResponse = {
  stagedChanges: StagedChange[];
  form: Form;
};

/** Shape the AI must return (parsed from JSON in the assistant message) */
export type AiDiffResponse = {
  reply: string;
  changes: Array<{
    type: 'add' | 'update' | 'delete' | 'update_form';
    questionId?: string;
    payload: Partial<Question> | { title?: string; description?: string };
  }>;
};
