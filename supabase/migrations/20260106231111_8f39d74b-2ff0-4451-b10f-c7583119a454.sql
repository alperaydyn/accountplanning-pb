-- Add recursion/scheduling fields to actions table
ALTER TABLE public.actions
ADD COLUMN is_recursive boolean NOT NULL DEFAULT false,
ADD COLUMN recurrence_pattern text, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
ADD COLUMN recurrence_interval integer DEFAULT 1, -- e.g., every 2 weeks
ADD COLUMN recurrence_end_date date, -- When the recurrence ends (null = forever)
ADD COLUMN parent_action_id uuid REFERENCES public.actions(id), -- Links to the original recurring action
ADD COLUMN next_recurrence_date date; -- When the next occurrence should be created

-- Add comment for documentation
COMMENT ON COLUMN public.actions.is_recursive IS 'Whether this action should recur on a schedule';
COMMENT ON COLUMN public.actions.recurrence_pattern IS 'Pattern: daily, weekly, monthly, quarterly, yearly';
COMMENT ON COLUMN public.actions.recurrence_interval IS 'Interval multiplier for recurrence (e.g., every 2 weeks)';
COMMENT ON COLUMN public.actions.recurrence_end_date IS 'Optional end date for the recurrence';
COMMENT ON COLUMN public.actions.parent_action_id IS 'Reference to parent action for recurring instances';
COMMENT ON COLUMN public.actions.next_recurrence_date IS 'Next scheduled date for creating the recurrence';