-- Create table for Customer Experience Index metrics
CREATE TABLE public.customer_experience_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_manager_id UUID NOT NULL,
  record_month TEXT NOT NULL,
  
  -- Key Moment 1: Müşteri Ziyareti (Customer Visit)
  visit_count INTEGER NOT NULL DEFAULT 0,
  active_customers INTEGER NOT NULL DEFAULT 0,
  
  -- Key Moment 2: Acil Finansal Destek (Urgent Financial Support)
  customers_with_open_limit INTEGER NOT NULL DEFAULT 0,
  
  -- Key Moment 3: Dijital Kanal (Digital Channel)
  successful_logins INTEGER NOT NULL DEFAULT 0,
  total_logins INTEGER NOT NULL DEFAULT 0,
  help_desk_tickets INTEGER NOT NULL DEFAULT 0,
  branch_help_tickets INTEGER NOT NULL DEFAULT 0,
  
  -- Key Moment 4: Kritik Ödemeler (Critical Payments)
  digital_salary_payments NUMERIC NOT NULL DEFAULT 0,
  total_salary_payments NUMERIC NOT NULL DEFAULT 0,
  successful_payments INTEGER NOT NULL DEFAULT 0,
  total_payments INTEGER NOT NULL DEFAULT 0,
  
  -- Key Moment 5: Nakit Yönetimi (Cash Management)
  ete_product_score NUMERIC NOT NULL DEFAULT 0,
  
  -- Key Moment 6: Hızlı Destek (Quick Support)
  total_complaints INTEGER NOT NULL DEFAULT 0,
  total_requests INTEGER NOT NULL DEFAULT 0,
  positive_nps INTEGER NOT NULL DEFAULT 0,
  total_surveys INTEGER NOT NULL DEFAULT 0,
  
  -- Computed overall score (can be updated via trigger or application)
  overall_score NUMERIC DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT customer_experience_metrics_portfolio_manager_id_fkey 
    FOREIGN KEY (portfolio_manager_id) REFERENCES public.portfolio_managers(id) ON DELETE CASCADE,
  CONSTRAINT unique_portfolio_month UNIQUE (portfolio_manager_id, record_month)
);

-- Enable RLS
ALTER TABLE public.customer_experience_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own experience metrics"
  ON public.customer_experience_metrics
  FOR SELECT
  USING (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can create their own experience metrics"
  ON public.customer_experience_metrics
  FOR INSERT
  WITH CHECK (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can update their own experience metrics"
  ON public.customer_experience_metrics
  FOR UPDATE
  USING (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can delete their own experience metrics"
  ON public.customer_experience_metrics
  FOR DELETE
  USING (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_customer_experience_metrics_updated_at
  BEFORE UPDATE ON public.customer_experience_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for AI-generated experience action recommendations
CREATE TABLE public.customer_experience_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_manager_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  key_moment TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  ai_reasoning TEXT,
  record_month TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT customer_experience_actions_portfolio_manager_id_fkey 
    FOREIGN KEY (portfolio_manager_id) REFERENCES public.portfolio_managers(id) ON DELETE CASCADE,
  CONSTRAINT customer_experience_actions_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.customer_experience_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own experience actions"
  ON public.customer_experience_actions
  FOR SELECT
  USING (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can create their own experience actions"
  ON public.customer_experience_actions
  FOR INSERT
  WITH CHECK (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can update their own experience actions"
  ON public.customer_experience_actions
  FOR UPDATE
  USING (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can delete their own experience actions"
  ON public.customer_experience_actions
  FOR DELETE
  USING (portfolio_manager_id = get_portfolio_manager_id(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_customer_experience_actions_updated_at
  BEFORE UPDATE ON public.customer_experience_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();