-- Add priority weight columns to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS priority_weight_portfolio numeric DEFAULT 0.25,
ADD COLUMN IF NOT EXISTS priority_weight_adhoc numeric DEFAULT 0.25,
ADD COLUMN IF NOT EXISTS priority_weight_customer numeric DEFAULT 0.25,
ADD COLUMN IF NOT EXISTS priority_weight_profitability numeric DEFAULT 0.25;

-- Add comment for documentation
COMMENT ON COLUMN public.user_settings.priority_weight_portfolio IS 'Weight for portfolio target alignment priority (0-0.50, default 0.25)';
COMMENT ON COLUMN public.user_settings.priority_weight_adhoc IS 'Weight for ad-hoc bank priorities (0-0.50, default 0.25)';
COMMENT ON COLUMN public.user_settings.priority_weight_customer IS 'Weight for customer satisfaction priority (0-0.50, default 0.25)';
COMMENT ON COLUMN public.user_settings.priority_weight_profitability IS 'Weight for profitability priority (0-0.50, default 0.25)';