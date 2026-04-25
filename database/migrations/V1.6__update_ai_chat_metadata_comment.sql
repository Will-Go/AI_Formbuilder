-- Update comment for metadata in ai_chat_messages to include 'past' field in stagedChanges
COMMENT ON COLUMN public.ai_chat_messages.metadata IS 'Stores staged changes array. Shape: Array<{ id, type, questionId?, payload, accepted, past? }>';
