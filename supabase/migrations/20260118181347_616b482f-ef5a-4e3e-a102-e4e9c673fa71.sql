-- RAG Documentation Chunks table
CREATE TABLE public.rag_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chunk_id TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  audience TEXT[] NOT NULL DEFAULT '{"business", "technical"}',
  title TEXT NOT NULL,
  business_description TEXT,
  technical_description TEXT,
  route TEXT,
  related_files TEXT[],
  keywords TEXT[],
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- RAG Q&A Feedback table
CREATE TABLE public.rag_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  chunk_ids_used TEXT[],
  feedback_score INTEGER CHECK (feedback_score IN (-1, 1)),
  query_type TEXT CHECK (query_type IN ('business', 'technical', 'out_of_context', 'unanswered')),
  needs_investigation BOOLEAN NOT NULL DEFAULT false,
  admin_notes TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User rate limiting for out-of-context queries
CREATE TABLE public.rag_user_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  out_of_context_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_user_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rag_chunks
CREATE POLICY "Anyone can read active chunks" 
ON public.rag_chunks 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage chunks" 
ON public.rag_chunks 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for rag_feedback
CREATE POLICY "Users can view own feedback" 
ON public.rag_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" 
ON public.rag_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback score" 
ON public.rag_feedback 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" 
ON public.rag_feedback 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all feedback" 
ON public.rag_feedback 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for rag_user_limits
CREATE POLICY "Users can view own limits" 
ON public.rag_user_limits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage limits" 
ON public.rag_user_limits 
FOR ALL 
USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_rag_chunks_updated_at
BEFORE UPDATE ON public.rag_chunks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rag_feedback_updated_at
BEFORE UPDATE ON public.rag_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rag_user_limits_updated_at
BEFORE UPDATE ON public.rag_user_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_rag_chunks_category ON public.rag_chunks(category);
CREATE INDEX idx_rag_chunks_route ON public.rag_chunks(route);
CREATE INDEX idx_rag_feedback_user_id ON public.rag_feedback(user_id);
CREATE INDEX idx_rag_feedback_needs_investigation ON public.rag_feedback(needs_investigation) WHERE needs_investigation = true;
CREATE INDEX idx_rag_user_limits_user_id ON public.rag_user_limits(user_id);