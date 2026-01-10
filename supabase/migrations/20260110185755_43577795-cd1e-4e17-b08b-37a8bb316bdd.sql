-- Add AI provider settings to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS ai_provider text DEFAULT 'lovable',
ADD COLUMN IF NOT EXISTS ai_model text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_api_key_encrypted text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_base_url text DEFAULT NULL;

-- Add provider column to ai_insights for tracking which provider generated it
ALTER TABLE public.ai_insights
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'lovable';

-- Add provider column to ai_action_insights for tracking which provider generated it
ALTER TABLE public.ai_action_insights
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'lovable';

-- Add provider column to ai_chat_sessions for tracking which provider was used
ALTER TABLE public.ai_chat_sessions
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'lovable';

-- Add model column to ai_chat_messages to track specific model used per message
ALTER TABLE public.ai_chat_messages
ADD COLUMN IF NOT EXISTS model_name text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.user_settings.ai_provider IS 'AI provider: lovable, openai, openrouter, local';
COMMENT ON COLUMN public.user_settings.ai_model IS 'Selected AI model name';
COMMENT ON COLUMN public.user_settings.ai_api_key_encrypted IS 'Encrypted API key for external providers';
COMMENT ON COLUMN public.user_settings.ai_base_url IS 'Base URL for local/custom AI endpoints';