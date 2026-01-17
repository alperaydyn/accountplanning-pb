-- Create prompt templates table (metadata about each prompt)
CREATE TABLE public.prompt_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  where_used TEXT NOT NULL,
  input_description TEXT NOT NULL,
  output_description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prompt versions table (versioned prompts, never overwritten)
CREATE TABLE public.prompt_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_template_id UUID NOT NULL REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  prompt_text TEXT NOT NULL,
  reason TEXT NOT NULL,
  explanation TEXT,
  creator_id UUID REFERENCES auth.users(id),
  creator_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(prompt_template_id, version_number)
);

-- Create prompt test cases table
CREATE TABLE public.prompt_test_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_template_id UUID NOT NULL REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  input_data JSONB NOT NULL,
  expected_output JSONB NOT NULL,
  is_regression_test BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create prompt test results table
CREATE TABLE public.prompt_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_version_id UUID NOT NULL REFERENCES public.prompt_versions(id) ON DELETE CASCADE,
  test_case_id UUID NOT NULL REFERENCES public.prompt_test_cases(id) ON DELETE CASCADE,
  actual_output JSONB,
  passed BOOLEAN,
  evaluation_notes TEXT,
  execution_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_test_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for prompt_templates (readable by all authenticated, writable by admins)
CREATE POLICY "Authenticated users can view prompt templates"
  ON public.prompt_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert prompt templates"
  ON public.prompt_templates FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update prompt templates"
  ON public.prompt_templates FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete prompt templates"
  ON public.prompt_templates FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS policies for prompt_versions
CREATE POLICY "Authenticated users can view prompt versions"
  ON public.prompt_versions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert prompt versions"
  ON public.prompt_versions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update prompt versions"
  ON public.prompt_versions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- RLS policies for prompt_test_cases
CREATE POLICY "Authenticated users can view test cases"
  ON public.prompt_test_cases FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert test cases"
  ON public.prompt_test_cases FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update test cases"
  ON public.prompt_test_cases FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete test cases"
  ON public.prompt_test_cases FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS policies for prompt_test_results
CREATE POLICY "Authenticated users can view test results"
  ON public.prompt_test_results FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert test results"
  ON public.prompt_test_results FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Function to get active prompt for a template
CREATE OR REPLACE FUNCTION public.get_active_prompt(template_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prompt_result TEXT;
BEGIN
  SELECT pv.prompt_text INTO prompt_result
  FROM prompt_versions pv
  JOIN prompt_templates pt ON pt.id = pv.prompt_template_id
  WHERE pt.name = template_name AND pv.is_active = true
  LIMIT 1;
  
  RETURN prompt_result;
END;
$$;

-- Function to set a version as active (deactivates others)
CREATE OR REPLACE FUNCTION public.set_active_prompt_version(version_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  template_id UUID;
BEGIN
  -- Get the template id for this version
  SELECT prompt_template_id INTO template_id
  FROM prompt_versions
  WHERE id = version_id;
  
  IF template_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Deactivate all versions for this template
  UPDATE prompt_versions
  SET is_active = false
  WHERE prompt_template_id = template_id;
  
  -- Activate the specified version
  UPDATE prompt_versions
  SET is_active = true
  WHERE id = version_id;
  
  RETURN true;
END;
$$;

-- Trigger to update prompt_templates.updated_at
CREATE TRIGGER update_prompt_templates_updated_at
  BEFORE UPDATE ON public.prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();