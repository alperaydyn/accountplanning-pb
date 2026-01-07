-- Create table for AI assistant chat sessions
CREATE TABLE public.ai_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_manager_id UUID NOT NULL REFERENCES public.portfolio_managers(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Yeni Sohbet',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for chat messages
CREATE TABLE public.ai_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  customer_mapping JSONB,
  usage JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for sessions
CREATE POLICY "Users can view their own sessions"
ON public.ai_chat_sessions FOR SELECT
USING (portfolio_manager_id = public.get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can create their own sessions"
ON public.ai_chat_sessions FOR INSERT
WITH CHECK (portfolio_manager_id = public.get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can update their own sessions"
ON public.ai_chat_sessions FOR UPDATE
USING (portfolio_manager_id = public.get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can delete their own sessions"
ON public.ai_chat_sessions FOR DELETE
USING (portfolio_manager_id = public.get_portfolio_manager_id(auth.uid()));

-- RLS policies for messages (via session ownership)
CREATE POLICY "Users can view messages from their sessions"
ON public.ai_chat_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.ai_chat_sessions
  WHERE id = ai_chat_messages.session_id
  AND portfolio_manager_id = public.get_portfolio_manager_id(auth.uid())
));

CREATE POLICY "Users can create messages in their sessions"
ON public.ai_chat_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.ai_chat_sessions
  WHERE id = ai_chat_messages.session_id
  AND portfolio_manager_id = public.get_portfolio_manager_id(auth.uid())
));

-- Trigger for updated_at on sessions
CREATE TRIGGER update_ai_chat_sessions_updated_at
BEFORE UPDATE ON public.ai_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_ai_chat_sessions_portfolio_manager ON public.ai_chat_sessions(portfolio_manager_id);
CREATE INDEX idx_ai_chat_messages_session ON public.ai_chat_messages(session_id);