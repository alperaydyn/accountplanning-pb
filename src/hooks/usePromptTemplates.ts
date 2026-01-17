import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  where_used: string;
  input_description: string;
  output_description: string;
  created_at: string;
  updated_at: string;
}

export interface PromptVersion {
  id: string;
  prompt_template_id: string;
  version_number: number;
  prompt_text: string;
  reason: string;
  explanation: string | null;
  creator_id: string | null;
  creator_name: string;
  is_active: boolean;
  status: 'active' | 'deleted';
  created_at: string;
}

export interface PromptTestCase {
  id: string;
  prompt_template_id: string;
  name: string;
  input_data: Record<string, unknown>;
  expected_output: Record<string, unknown>;
  is_regression_test: boolean;
  created_at: string;
  created_by: string | null;
}

export interface PromptTestResult {
  id: string;
  prompt_version_id: string;
  test_case_id: string;
  actual_output: Record<string, unknown> | null;
  passed: boolean | null;
  evaluation_notes: string | null;
  execution_time_ms: number | null;
  error_message: string | null;
  created_at: string;
}

export function usePromptTemplates() {
  return useQuery({
    queryKey: ['prompt-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as PromptTemplate[];
    },
  });
}

export function usePromptVersions(templateId: string | null) {
  return useQuery({
    queryKey: ['prompt-versions', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      const { data, error } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_template_id', templateId)
        .eq('status', 'active')
        .order('version_number', { ascending: false });
      
      if (error) throw error;
      return data as PromptVersion[];
    },
    enabled: !!templateId,
  });
}

export function useSoftDeleteVersion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ versionId, templateId }: { versionId: string; templateId: string }) => {
      const { error } = await supabase
        .from('prompt_versions')
        .update({ status: 'deleted' })
        .eq('id', versionId);
      
      if (error) throw error;
      return { templateId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['prompt-versions', result.templateId] });
    },
  });
}

export function usePromptTestCases(templateId: string | null) {
  return useQuery({
    queryKey: ['prompt-test-cases', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      const { data, error } = await supabase
        .from('prompt_test_cases')
        .select('*')
        .eq('prompt_template_id', templateId)
        .order('created_at');
      
      if (error) throw error;
      return data as PromptTestCase[];
    },
    enabled: !!templateId,
  });
}

export function usePromptTestResults(versionId: string | null) {
  return useQuery({
    queryKey: ['prompt-test-results', versionId],
    queryFn: async () => {
      if (!versionId) return [];
      
      const { data, error } = await supabase
        .from('prompt_test_results')
        .select('*, prompt_test_cases(name)')
        .eq('prompt_version_id', versionId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (PromptTestResult & { prompt_test_cases: { name: string } })[];
    },
    enabled: !!versionId,
  });
}

export function useCreatePromptTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('prompt_templates')
        .insert(template)
        .select()
        .single();
      
      if (error) throw error;
      return data as PromptTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
    },
  });
}

export function useUpdatePromptTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PromptTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('prompt_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as PromptTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
    },
  });
}

export function useCreatePromptVersion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (version: Omit<PromptVersion, 'id' | 'created_at' | 'creator_id'>) => {
      const { data, error } = await supabase
        .from('prompt_versions')
        .insert({
          ...version,
          creator_id: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as PromptVersion;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prompt-versions', variables.prompt_template_id] });
    },
  });
}

export function useSetActiveVersion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ versionId, templateId }: { versionId: string; templateId: string }) => {
      const { data, error } = await supabase.rpc('set_active_prompt_version', {
        version_id: versionId,
      });
      
      if (error) throw error;
      return { success: data, templateId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['prompt-versions', result.templateId] });
    },
  });
}

export function useCreateTestCase() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (testCase: Omit<PromptTestCase, 'id' | 'created_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('prompt_test_cases')
        .insert([{
          prompt_template_id: testCase.prompt_template_id,
          name: testCase.name,
          input_data: testCase.input_data as Json,
          expected_output: testCase.expected_output as Json,
          is_regression_test: testCase.is_regression_test,
          created_by: user?.id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data as PromptTestCase;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prompt-test-cases', variables.prompt_template_id] });
    },
  });
}

export function useDeleteTestCase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, templateId }: { id: string; templateId: string }) => {
      const { error } = await supabase
        .from('prompt_test_cases')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { templateId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['prompt-test-cases', result.templateId] });
    },
  });
}

export function useSaveTestResult() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (result: Omit<PromptTestResult, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('prompt_test_results')
        .insert([{
          prompt_version_id: result.prompt_version_id,
          test_case_id: result.test_case_id,
          actual_output: result.actual_output as Json,
          passed: result.passed,
          evaluation_notes: result.evaluation_notes,
          execution_time_ms: result.execution_time_ms,
          error_message: result.error_message,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data as PromptTestResult;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prompt-test-results', variables.prompt_version_id] });
    },
  });
}

// Helper to get active prompt text for a template name
export async function getActivePrompt(templateName: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_active_prompt', {
    template_name: templateName,
  });
  
  if (error) {
    console.error('Error fetching active prompt:', error);
    return null;
  }
  
  return data;
}
