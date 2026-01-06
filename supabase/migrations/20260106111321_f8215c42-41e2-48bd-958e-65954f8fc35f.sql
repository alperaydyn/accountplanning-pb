-- Phase 1: Core Database Schema for Account Planning System

-- 1. Create ENUM types for constrained values
CREATE TYPE public.customer_sector AS ENUM (
  'Turizm', 'Ulaşım', 'Perakende', 'Gayrimenkul', 'Tarım Hayvancılık', 'Sağlık', 'Enerji'
);

CREATE TYPE public.customer_segment AS ENUM (
  'MİKRO', 'Kİ', 'OBİ', 'TİCARİ'
);

CREATE TYPE public.customer_status AS ENUM (
  'Yeni Müşteri', 'Aktif', 'Target', 'Strong Target', 'Ana Banka'
);

CREATE TYPE public.product_category AS ENUM (
  'TL Nakdi Kredi', 'TL Gayrinakdi Kredi', 'YP Nakdi Kredi', 'YP Gayrinakdi Kredi',
  'TL Vadeli', 'TL Vadesiz', 'YP Vadeli', 'YP Vadesiz',
  'TL Yatırım Fonu', 'YP Yatırım Fonu',
  'Ticari Kart', 'Üye İşyeri', 'Maaş',
  'Sigorta-Hayat', 'Sigorta-Elementer', 'Sigorta-BES',
  'Faktoring', 'Leasing',
  'Ödeme Çeki', 'Tahsil Çeki',
  'DTS', 'Garantili Ödeme', 'Garanti Filo Kiralama'
);

CREATE TYPE public.action_status AS ENUM (
  'Beklemede', 'Planlandı', 'Tamamlandı', 'Ertelendi', 'İlgilenmiyor', 'Uygun Değil'
);

CREATE TYPE public.action_type AS ENUM (
  'model_based', 'ad_hoc'
);

CREATE TYPE public.action_priority AS ENUM (
  'high', 'medium', 'low'
);

-- 2. Portfolio Managers Table
CREATE TABLE public.portfolio_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  portfolio_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.portfolio_managers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.portfolio_managers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.portfolio_managers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Customer Groups Table
CREATE TABLE public.customer_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  portfolio_manager_id uuid REFERENCES public.portfolio_managers(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_groups ENABLE ROW LEVEL SECURITY;

-- Security definer function to get portfolio manager id
CREATE OR REPLACE FUNCTION public.get_portfolio_manager_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.portfolio_managers WHERE user_id = _user_id LIMIT 1
$$;

CREATE POLICY "Users can view their own groups"
  ON public.customer_groups FOR SELECT
  USING (portfolio_manager_id = public.get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can create their own groups"
  ON public.customer_groups FOR INSERT
  WITH CHECK (portfolio_manager_id = public.get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can update their own groups"
  ON public.customer_groups FOR UPDATE
  USING (portfolio_manager_id = public.get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can delete their own groups"
  ON public.customer_groups FOR DELETE
  USING (portfolio_manager_id = public.get_portfolio_manager_id(auth.uid()));

-- 4. Customers Table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sector public.customer_sector NOT NULL,
  segment public.customer_segment NOT NULL,
  status public.customer_status NOT NULL,
  principality_score integer CHECK (principality_score >= 0 AND principality_score <= 100) DEFAULT 0,
  last_activity_date date,
  portfolio_manager_id uuid REFERENCES public.portfolio_managers(id) ON DELETE CASCADE NOT NULL,
  group_id uuid REFERENCES public.customer_groups(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own customers"
  ON public.customers FOR SELECT
  USING (portfolio_manager_id = public.get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can create their own customers"
  ON public.customers FOR INSERT
  WITH CHECK (portfolio_manager_id = public.get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can update their own customers"
  ON public.customers FOR UPDATE
  USING (portfolio_manager_id = public.get_portfolio_manager_id(auth.uid()));

CREATE POLICY "Users can delete their own customers"
  ON public.customers FOR DELETE
  USING (portfolio_manager_id = public.get_portfolio_manager_id(auth.uid()));

-- 5. Products Table (Shared Catalog)
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category public.product_category NOT NULL,
  is_external boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by all authenticated users"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

-- 6. Customer Products Table
CREATE TABLE public.customer_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  current_value numeric NOT NULL DEFAULT 0,
  threshold numeric NOT NULL DEFAULT 0,
  external_data numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_id, product_id)
);

ALTER TABLE public.customer_products ENABLE ROW LEVEL SECURITY;

-- Function to check if user owns the customer
CREATE OR REPLACE FUNCTION public.user_owns_customer(_customer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = _customer_id
    AND portfolio_manager_id = public.get_portfolio_manager_id(auth.uid())
  )
$$;

CREATE POLICY "Users can view their customer products"
  ON public.customer_products FOR SELECT
  USING (public.user_owns_customer(customer_id));

CREATE POLICY "Users can create their customer products"
  ON public.customer_products FOR INSERT
  WITH CHECK (public.user_owns_customer(customer_id));

CREATE POLICY "Users can update their customer products"
  ON public.customer_products FOR UPDATE
  USING (public.user_owns_customer(customer_id));

CREATE POLICY "Users can delete their customer products"
  ON public.customer_products FOR DELETE
  USING (public.user_owns_customer(customer_id));

-- 7. Actions Table
CREATE TABLE public.actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  type public.action_type NOT NULL,
  priority public.action_priority NOT NULL,
  status public.action_status NOT NULL DEFAULT 'Beklemede',
  target_value numeric,
  planned_date date,
  completed_date date,
  explanation text,
  time_to_ready integer NOT NULL DEFAULT 0,
  action_response text,
  estimated_action_time integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their actions"
  ON public.actions FOR SELECT
  USING (public.user_owns_customer(customer_id));

CREATE POLICY "Users can create their actions"
  ON public.actions FOR INSERT
  WITH CHECK (public.user_owns_customer(customer_id));

CREATE POLICY "Users can update their actions"
  ON public.actions FOR UPDATE
  USING (public.user_owns_customer(customer_id));

CREATE POLICY "Users can delete their actions"
  ON public.actions FOR DELETE
  USING (public.user_owns_customer(customer_id));

-- 8. Updated_at Trigger Function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 9. Apply updated_at triggers to relevant tables
CREATE TRIGGER update_portfolio_managers_updated_at
  BEFORE UPDATE ON public.portfolio_managers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_products_updated_at
  BEFORE UPDATE ON public.customer_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_actions_updated_at
  BEFORE UPDATE ON public.actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Auto-create portfolio_manager on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.portfolio_managers (user_id, name, email, portfolio_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    'My Portfolio'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Indexes for better performance
CREATE INDEX idx_customers_portfolio_manager ON public.customers(portfolio_manager_id);
CREATE INDEX idx_customers_group ON public.customers(group_id);
CREATE INDEX idx_customers_status ON public.customers(status);
CREATE INDEX idx_customer_products_customer ON public.customer_products(customer_id);
CREATE INDEX idx_customer_products_product ON public.customer_products(product_id);
CREATE INDEX idx_actions_customer ON public.actions(customer_id);
CREATE INDEX idx_actions_product ON public.actions(product_id);
CREATE INDEX idx_actions_status ON public.actions(status);
CREATE INDEX idx_actions_planned_date ON public.actions(planned_date);