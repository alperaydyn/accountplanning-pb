-- First, drop the existing actions table and start fresh
DROP TABLE IF EXISTS public.actions CASCADE;

-- Create the refactored actions table (core imported data)
CREATE TABLE public.actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  product_id UUID NOT NULL,
  
  -- Import metadata
  name TEXT NOT NULL,
  description TEXT,
  creator_name TEXT NOT NULL, -- Who/what created this action
  creation_reason TEXT, -- Why this action was generated
  customer_hints TEXT, -- Hints for offering to customer
  
  -- Import dates
  source_data_date DATE NOT NULL, -- Date of source data used for action
  action_target_date DATE NOT NULL, -- Validity/target date (usually end of month)
  
  -- Action properties
  type action_type NOT NULL,
  priority action_priority NOT NULL,
  target_value NUMERIC,
  
  -- Current state (denormalized for fast queries)
  current_status action_status NOT NULL DEFAULT 'Beklemede',
  current_owner_id UUID, -- Current owner (portfolio_manager_id)
  current_owner_type TEXT DEFAULT 'system', -- 'system' or 'user'
  current_planned_date DATE,
  current_value NUMERIC,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create the action_updates table for all changes/responses
CREATE TABLE public.action_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_id UUID NOT NULL REFERENCES public.actions(id) ON DELETE CASCADE,
  
  -- Update type
  update_type TEXT NOT NULL CHECK (update_type IN (
    'assigned',      -- Action assigned to owner
    'status_change', -- Status changed
    'value_update',  -- Value updated
    'date_change',   -- Planned date changed
    'response',      -- Customer response
    'closed'         -- Action closed (successful or refused)
  )),
  
  -- Status tracking
  previous_status action_status,
  new_status action_status,
  
  -- Value tracking
  previous_value NUMERIC,
  new_value NUMERIC,
  
  -- Date tracking
  previous_date DATE,
  new_date DATE,
  
  -- Ownership tracking
  previous_owner_id UUID,
  new_owner_id UUID,
  previous_owner_type TEXT,
  new_owner_type TEXT,
  
  -- Response content
  response_text TEXT, -- Customer response or notes
  notes TEXT, -- Additional notes
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID -- Portfolio manager who made the update
);

-- Create indexes for performance
CREATE INDEX idx_actions_customer_id ON public.actions(customer_id);
CREATE INDEX idx_actions_product_id ON public.actions(product_id);
CREATE INDEX idx_actions_current_status ON public.actions(current_status);
CREATE INDEX idx_actions_action_target_date ON public.actions(action_target_date);
CREATE INDEX idx_action_updates_action_id ON public.action_updates(action_id);
CREATE INDEX idx_action_updates_created_at ON public.action_updates(created_at DESC);

-- Enable RLS on both tables
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_updates ENABLE ROW LEVEL SECURITY;

-- RLS policies for actions table
CREATE POLICY "Users can view their actions" 
ON public.actions 
FOR SELECT 
USING (user_owns_customer(customer_id));

CREATE POLICY "Users can create their actions" 
ON public.actions 
FOR INSERT 
WITH CHECK (user_owns_customer(customer_id));

CREATE POLICY "Users can update their actions" 
ON public.actions 
FOR UPDATE 
USING (user_owns_customer(customer_id));

CREATE POLICY "Users can delete their actions" 
ON public.actions 
FOR DELETE 
USING (user_owns_customer(customer_id));

-- RLS policies for action_updates table (based on parent action ownership)
CREATE POLICY "Users can view their action updates" 
ON public.action_updates 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.actions 
    WHERE actions.id = action_updates.action_id 
    AND user_owns_customer(actions.customer_id)
  )
);

CREATE POLICY "Users can create their action updates" 
ON public.action_updates 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.actions 
    WHERE actions.id = action_updates.action_id 
    AND user_owns_customer(actions.customer_id)
  )
);

CREATE POLICY "Users can update their action updates" 
ON public.action_updates 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.actions 
    WHERE actions.id = action_updates.action_id 
    AND user_owns_customer(actions.customer_id)
  )
);

CREATE POLICY "Users can delete their action updates" 
ON public.action_updates 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.actions 
    WHERE actions.id = action_updates.action_id 
    AND user_owns_customer(actions.customer_id)
  )
);

-- Trigger to auto-update updated_at on actions
CREATE TRIGGER update_actions_updated_at
BEFORE UPDATE ON public.actions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically update denormalized fields on actions when an update is inserted
CREATE OR REPLACE FUNCTION public.apply_action_update()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the parent action based on the update type
  UPDATE public.actions
  SET
    current_status = COALESCE(NEW.new_status, current_status),
    current_value = COALESCE(NEW.new_value, current_value),
    current_planned_date = COALESCE(NEW.new_date, current_planned_date),
    current_owner_id = COALESCE(NEW.new_owner_id, current_owner_id),
    current_owner_type = COALESCE(NEW.new_owner_type, current_owner_type),
    updated_at = now()
  WHERE id = NEW.action_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to apply updates to parent action
CREATE TRIGGER apply_action_update_trigger
AFTER INSERT ON public.action_updates
FOR EACH ROW
EXECUTE FUNCTION public.apply_action_update();