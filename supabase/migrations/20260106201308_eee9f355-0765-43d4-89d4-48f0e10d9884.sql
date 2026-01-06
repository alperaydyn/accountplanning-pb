-- Create portfolio_targets table
CREATE TABLE public.portfolio_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_manager_id UUID NOT NULL REFERENCES public.portfolio_managers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  record_date TEXT NOT NULL, -- e.g., '2025-12', '2025-09', '2024-12'
  measure_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Stock counts
  stock_count INTEGER NOT NULL DEFAULT 0,
  stock_count_target INTEGER NOT NULL DEFAULT 0,
  stock_count_tar NUMERIC NOT NULL DEFAULT 0, -- Target Achievement Rate (percentage)
  stock_count_delta_ytd INTEGER NOT NULL DEFAULT 0,
  stock_count_delta_mtd INTEGER NOT NULL DEFAULT 0,
  
  -- Stock volumes
  stock_volume NUMERIC NOT NULL DEFAULT 0,
  stock_volume_target NUMERIC NOT NULL DEFAULT 0,
  stock_volume_tar NUMERIC NOT NULL DEFAULT 0,
  stock_volume_delta_ytd NUMERIC NOT NULL DEFAULT 0,
  stock_volume_delta_mtd NUMERIC NOT NULL DEFAULT 0,
  
  -- Flow counts
  flow_count INTEGER NOT NULL DEFAULT 0,
  flow_count_target INTEGER NOT NULL DEFAULT 0,
  flow_count_tar NUMERIC NOT NULL DEFAULT 0,
  flow_count_delta_ytd INTEGER NOT NULL DEFAULT 0,
  flow_count_delta_mtd INTEGER NOT NULL DEFAULT 0,
  
  -- Flow volumes
  flow_volume NUMERIC NOT NULL DEFAULT 0,
  flow_volume_target NUMERIC NOT NULL DEFAULT 0,
  flow_volume_tar NUMERIC NOT NULL DEFAULT 0,
  flow_volume_delta_ytd NUMERIC NOT NULL DEFAULT 0,
  flow_volume_delta_mtd NUMERIC NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint for portfolio_manager + product + record_date
  UNIQUE(portfolio_manager_id, product_id, record_date)
);

-- Enable RLS
ALTER TABLE public.portfolio_targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their portfolio targets"
ON public.portfolio_targets
FOR SELECT
USING (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can create their portfolio targets"
ON public.portfolio_targets
FOR INSERT
WITH CHECK (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can update their portfolio targets"
ON public.portfolio_targets
FOR UPDATE
USING (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can delete their portfolio targets"
ON public.portfolio_targets
FOR DELETE
USING (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_portfolio_targets_updated_at
BEFORE UPDATE ON public.portfolio_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();