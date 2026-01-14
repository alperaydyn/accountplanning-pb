-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Action templates are viewable by all authenticated users" ON public.action_templates;

-- Create a new policy that requires authentication
CREATE POLICY "Action templates are viewable by authenticated users only"
ON public.action_templates
FOR SELECT
TO authenticated
USING (true);