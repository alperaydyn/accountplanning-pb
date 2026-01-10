-- Add preferred_agenda_view column to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN preferred_agenda_view text NOT NULL DEFAULT 'weekly';