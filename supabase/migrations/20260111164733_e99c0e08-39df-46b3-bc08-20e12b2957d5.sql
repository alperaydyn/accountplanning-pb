-- Add ElevenLabs voice settings to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS elevenlabs_voice_id text DEFAULT 'S85IPTaQ0TGGMhJkucvb',
ADD COLUMN IF NOT EXISTS elevenlabs_voice_name text DEFAULT 'Thomas';