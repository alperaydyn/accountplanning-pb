-- Add status column to prompt_versions for soft delete
ALTER TABLE public.prompt_versions 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Add check constraint for valid status values
ALTER TABLE public.prompt_versions 
ADD CONSTRAINT prompt_versions_status_check 
CHECK (status IN ('active', 'deleted'));

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_prompt_versions_status 
ON public.prompt_versions(status);