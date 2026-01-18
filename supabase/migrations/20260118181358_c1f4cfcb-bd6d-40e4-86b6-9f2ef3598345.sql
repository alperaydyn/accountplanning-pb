-- Drop the overly permissive policy
DROP POLICY "System can manage limits" ON public.rag_user_limits;

-- Create proper policies for rag_user_limits
CREATE POLICY "Users can insert own limits" 
ON public.rag_user_limits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own limits" 
ON public.rag_user_limits 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all limits" 
ON public.rag_user_limits 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));