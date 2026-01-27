-- Add priority scoring columns to actions table
-- Each criterion has a score (0-1) and explanation

ALTER TABLE public.actions
ADD COLUMN priority_portfolio_score numeric DEFAULT NULL,
ADD COLUMN priority_portfolio_reason text DEFAULT NULL,
ADD COLUMN priority_adhoc_score numeric DEFAULT NULL,
ADD COLUMN priority_adhoc_reason text DEFAULT NULL,
ADD COLUMN priority_customer_score numeric DEFAULT NULL,
ADD COLUMN priority_customer_reason text DEFAULT NULL,
ADD COLUMN priority_profitability_score numeric DEFAULT NULL,
ADD COLUMN priority_profitability_reason text DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.actions.priority_portfolio_score IS 'Score (0-1) for portfolio target alignment prioritization';
COMMENT ON COLUMN public.actions.priority_portfolio_reason IS 'Explanation for portfolio target alignment score';
COMMENT ON COLUMN public.actions.priority_adhoc_score IS 'Score (0-1) for ad-hoc bank priorities alignment';
COMMENT ON COLUMN public.actions.priority_adhoc_reason IS 'Explanation for ad-hoc priorities score';
COMMENT ON COLUMN public.actions.priority_customer_score IS 'Score (0-1) for customer satisfaction/retention impact';
COMMENT ON COLUMN public.actions.priority_customer_reason IS 'Explanation for customer satisfaction score';
COMMENT ON COLUMN public.actions.priority_profitability_score IS 'Score (0-1) for profitability impact';
COMMENT ON COLUMN public.actions.priority_profitability_reason IS 'Explanation for profitability score';