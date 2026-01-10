-- Primary Bank Loan Summary (customer works with multiple banks)
CREATE TABLE public.primary_bank_loan_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_month TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  bank_code TEXT NOT NULL, -- A-Z
  our_bank_flag BOOLEAN NOT NULL DEFAULT false,
  cash_loan NUMERIC(18,2) DEFAULT 0,
  non_cash_loan NUMERIC(18,2) DEFAULT 0,
  last_approval_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(record_month, customer_id, bank_code)
);

-- Primary Bank Loan Detail (account-level loan data)
CREATE TABLE public.primary_bank_loan_detail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_month TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  bank_code TEXT NOT NULL,
  account_id TEXT NOT NULL,
  our_bank_flag BOOLEAN NOT NULL DEFAULT false,
  loan_type TEXT NOT NULL,
  loan_status TEXT NOT NULL,
  open_date DATE NOT NULL,
  open_amount NUMERIC(18,2) NOT NULL,
  current_amount NUMERIC(18,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(record_month, customer_id, bank_code, account_id)
);

-- Primary Bank POS
CREATE TABLE public.primary_bank_pos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_month TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  total_pos_volume NUMERIC(18,2) DEFAULT 0,
  our_bank_pos_volume NUMERIC(18,2) DEFAULT 0,
  number_of_banks INTEGER DEFAULT 1,
  pos_share NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(record_month, customer_id)
);

-- Primary Bank Cheque
CREATE TABLE public.primary_bank_cheque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_month TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  cheque_volume_1m NUMERIC(18,2) DEFAULT 0,
  cheque_volume_3m NUMERIC(18,2) DEFAULT 0,
  cheque_volume_12m NUMERIC(18,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(record_month, customer_id)
);

-- Primary Bank Collateral
CREATE TABLE public.primary_bank_collateral (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_month TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  bank_code TEXT NOT NULL,
  our_bank_flag BOOLEAN NOT NULL DEFAULT false,
  group1_amount NUMERIC(18,2) DEFAULT 0,
  group2_amount NUMERIC(18,2) DEFAULT 0,
  group3_amount NUMERIC(18,2) DEFAULT 0,
  group4_amount NUMERIC(18,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(record_month, customer_id, bank_code)
);

-- Enable RLS
ALTER TABLE public.primary_bank_loan_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.primary_bank_loan_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.primary_bank_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.primary_bank_cheque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.primary_bank_collateral ENABLE ROW LEVEL SECURITY;

-- RLS Policies (user owns customer check)
CREATE POLICY "Users can view their customers loan summary"
ON public.primary_bank_loan_summary FOR SELECT
USING (public.user_owns_customer(customer_id));

CREATE POLICY "Users can insert their customers loan summary"
ON public.primary_bank_loan_summary FOR INSERT
WITH CHECK (public.user_owns_customer(customer_id));

CREATE POLICY "Users can delete their customers loan summary"
ON public.primary_bank_loan_summary FOR DELETE
USING (public.user_owns_customer(customer_id));

CREATE POLICY "Users can view their customers loan detail"
ON public.primary_bank_loan_detail FOR SELECT
USING (public.user_owns_customer(customer_id));

CREATE POLICY "Users can insert their customers loan detail"
ON public.primary_bank_loan_detail FOR INSERT
WITH CHECK (public.user_owns_customer(customer_id));

CREATE POLICY "Users can delete their customers loan detail"
ON public.primary_bank_loan_detail FOR DELETE
USING (public.user_owns_customer(customer_id));

CREATE POLICY "Users can view their customers pos"
ON public.primary_bank_pos FOR SELECT
USING (public.user_owns_customer(customer_id));

CREATE POLICY "Users can insert their customers pos"
ON public.primary_bank_pos FOR INSERT
WITH CHECK (public.user_owns_customer(customer_id));

CREATE POLICY "Users can delete their customers pos"
ON public.primary_bank_pos FOR DELETE
USING (public.user_owns_customer(customer_id));

CREATE POLICY "Users can view their customers cheque"
ON public.primary_bank_cheque FOR SELECT
USING (public.user_owns_customer(customer_id));

CREATE POLICY "Users can insert their customers cheque"
ON public.primary_bank_cheque FOR INSERT
WITH CHECK (public.user_owns_customer(customer_id));

CREATE POLICY "Users can delete their customers cheque"
ON public.primary_bank_cheque FOR DELETE
USING (public.user_owns_customer(customer_id));

CREATE POLICY "Users can view their customers collateral"
ON public.primary_bank_collateral FOR SELECT
USING (public.user_owns_customer(customer_id));

CREATE POLICY "Users can insert their customers collateral"
ON public.primary_bank_collateral FOR INSERT
WITH CHECK (public.user_owns_customer(customer_id));

CREATE POLICY "Users can delete their customers collateral"
ON public.primary_bank_collateral FOR DELETE
USING (public.user_owns_customer(customer_id));

-- Indexes for performance
CREATE INDEX idx_loan_summary_customer ON public.primary_bank_loan_summary(customer_id);
CREATE INDEX idx_loan_detail_customer ON public.primary_bank_loan_detail(customer_id);
CREATE INDEX idx_pos_customer ON public.primary_bank_pos(customer_id);
CREATE INDEX idx_cheque_customer ON public.primary_bank_cheque(customer_id);
CREATE INDEX idx_collateral_customer ON public.primary_bank_collateral(customer_id);