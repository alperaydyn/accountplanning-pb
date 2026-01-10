-- Add provider column to ai_chat_messages
ALTER TABLE public.ai_chat_messages 
ADD COLUMN IF NOT EXISTS provider text;

-- Add comment for clarity
COMMENT ON COLUMN public.ai_chat_messages.provider IS 'AI provider used for this message (lovable, openai, openrouter, local)';