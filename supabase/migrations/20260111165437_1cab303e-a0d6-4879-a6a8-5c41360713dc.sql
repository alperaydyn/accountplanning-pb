-- Create voice history table
CREATE TABLE public.elevenlabs_voice_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_id TEXT NOT NULL,
  voice_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint on user_id + voice_id
CREATE UNIQUE INDEX idx_elevenlabs_voice_history_user_voice ON public.elevenlabs_voice_history(user_id, voice_id);

-- Enable RLS
ALTER TABLE public.elevenlabs_voice_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own voice history
CREATE POLICY "Users can view their own voice history"
ON public.elevenlabs_voice_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own voice history
CREATE POLICY "Users can insert their own voice history"
ON public.elevenlabs_voice_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own voice history
CREATE POLICY "Users can update their own voice history"
ON public.elevenlabs_voice_history
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own voice history
CREATE POLICY "Users can delete their own voice history"
ON public.elevenlabs_voice_history
FOR DELETE
USING (auth.uid() = user_id);