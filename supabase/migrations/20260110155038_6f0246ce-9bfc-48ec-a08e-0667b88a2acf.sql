-- Create table for AI Action Insights (separate from product insights)
CREATE TABLE public.ai_action_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_manager_id UUID NOT NULL REFERENCES public.portfolio_managers(id) ON DELETE CASCADE,
  record_date TEXT NOT NULL DEFAULT to_char(CURRENT_DATE::timestamp with time zone, 'YYYY-MM'),
  version INTEGER NOT NULL DEFAULT 1,
  insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_name TEXT NOT NULL DEFAULT 'gpt-5-mini',
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(portfolio_manager_id, record_date, version)
);

-- Enable RLS
ALTER TABLE public.ai_action_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own action insights"
  ON public.ai_action_insights
  FOR SELECT
  USING (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can create their own action insights"
  ON public.ai_action_insights
  FOR INSERT
  WITH CHECK (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can update their own action insights"
  ON public.ai_action_insights
  FOR UPDATE
  USING (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can delete their own action insights"
  ON public.ai_action_insights
  FOR DELETE
  USING (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

-- Add index for faster lookups
CREATE INDEX idx_ai_action_insights_manager_date ON public.ai_action_insights(portfolio_manager_id, record_date);