-- Create table to store AI insights
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_manager_id UUID NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  version INTEGER NOT NULL DEFAULT 1,
  model_name TEXT NOT NULL DEFAULT 'gpt-5-mini',
  insights JSONB NOT NULL DEFAULT '[]',
  feedback TEXT CHECK (feedback IN ('like', 'dislike', NULL)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index for portfolio manager, date, and version
CREATE UNIQUE INDEX idx_ai_insights_pm_date_version ON public.ai_insights(portfolio_manager_id, record_date, version);

-- Enable RLS
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own insights"
ON public.ai_insights FOR SELECT
USING (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can create their own insights"
ON public.ai_insights FOR INSERT
WITH CHECK (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can update their own insights"
ON public.ai_insights FOR UPDATE
USING (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can delete their own insights"
ON public.ai_insights FOR DELETE
USING (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_ai_insights_updated_at
BEFORE UPDATE ON public.ai_insights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();