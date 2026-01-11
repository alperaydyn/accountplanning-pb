-- Add ElevenLabs voice settings columns to user_settings table
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS elevenlabs_stability numeric DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS elevenlabs_similarity_boost numeric DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS elevenlabs_style numeric DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS elevenlabs_speed numeric DEFAULT 1.1,
ADD COLUMN IF NOT EXISTS elevenlabs_speaker_boost boolean DEFAULT false;