-- Add elevenlabs_model column to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS elevenlabs_model TEXT DEFAULT 'eleven_multilingual_v2';