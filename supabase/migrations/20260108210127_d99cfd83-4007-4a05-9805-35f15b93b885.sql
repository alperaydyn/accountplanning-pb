-- Create saved_queries table for storing user's saved SQL queries
CREATE TABLE public.saved_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_queries ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved queries
CREATE POLICY "Users can view their own saved queries"
ON public.saved_queries FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own saved queries
CREATE POLICY "Users can create their own saved queries"
ON public.saved_queries FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved queries
CREATE POLICY "Users can delete their own saved queries"
ON public.saved_queries FOR DELETE
USING (auth.uid() = user_id);