import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePortfolioManager } from './usePortfolioManager';

export interface CustomerExperienceAction {
  id: string;
  portfolio_manager_id: string;
  customer_id: string;
  key_moment: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  ai_reasoning: string | null;
  record_month: string;
  created_at: string;
  updated_at: string;
  // Joined data
  customer?: {
    id: string;
    name: string;
    sector: string;
    segment: string;
    status: string;
  };
}

export const useCustomerExperienceActions = (recordMonth?: string) => {
  const { data: portfolioManager } = usePortfolioManager();

  return useQuery({
    queryKey: ['customer-experience-actions', portfolioManager?.id, recordMonth],
    queryFn: async () => {
      if (!portfolioManager?.id) return [];

      const query = supabase
        .from('customer_experience_actions')
        .select(`
          *,
          customer:customers (
            id,
            name,
            sector,
            segment,
            status
          )
        `)
        .eq('portfolio_manager_id', portfolioManager.id)
        .order('created_at', { ascending: false });

      if (recordMonth) {
        query.eq('record_month', recordMonth);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CustomerExperienceAction[];
    },
    enabled: !!portfolioManager?.id,
  });
};

export const useCreateCustomerExperienceAction = () => {
  const queryClient = useQueryClient();
  const { data: portfolioManager } = usePortfolioManager();

  return useMutation({
    mutationFn: async (input: Omit<CustomerExperienceAction, 'id' | 'portfolio_manager_id' | 'created_at' | 'updated_at' | 'customer'>) => {
      if (!portfolioManager?.id) throw new Error('No portfolio manager');

      const { data, error } = await supabase
        .from('customer_experience_actions')
        .insert({
          ...input,
          portfolio_manager_id: portfolioManager.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-experience-actions'] });
    },
  });
};

export const useUpdateCustomerExperienceAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CustomerExperienceAction> & { id: string }) => {
      const { data, error } = await supabase
        .from('customer_experience_actions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-experience-actions'] });
    },
  });
};

export const useDeleteCustomerExperienceAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customer_experience_actions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-experience-actions'] });
    },
  });
};
