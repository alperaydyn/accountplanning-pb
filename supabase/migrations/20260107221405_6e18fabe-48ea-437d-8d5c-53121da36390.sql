-- Create an enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table (separate from portfolio_managers as per security best practices)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can manage roles (insert/update/delete)
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing overly permissive policies on product_thresholds
DROP POLICY IF EXISTS "Authenticated users can insert thresholds" ON public.product_thresholds;
DROP POLICY IF EXISTS "Authenticated users can update thresholds" ON public.product_thresholds;
DROP POLICY IF EXISTS "Authenticated users can delete thresholds" ON public.product_thresholds;

-- Create new admin-only policies for product_thresholds modifications
CREATE POLICY "Admins can insert thresholds"
ON public.product_thresholds
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update thresholds"
ON public.product_thresholds
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete thresholds"
ON public.product_thresholds
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Grant the first user (or a specific user) admin role
-- This inserts admin role for existing users who need threshold management access
-- Note: You'll need to manually add admin roles for specific users after this migration