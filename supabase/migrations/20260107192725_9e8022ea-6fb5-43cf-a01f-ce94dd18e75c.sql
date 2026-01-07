-- Change record_date column from date to text to match portfolio_targets
ALTER TABLE public.ai_insights 
ALTER COLUMN record_date TYPE text USING record_date::text;

-- Update the default value
ALTER TABLE public.ai_insights 
ALTER COLUMN record_date SET DEFAULT to_char(CURRENT_DATE, 'YYYY-MM');