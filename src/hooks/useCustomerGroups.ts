import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePortfolioManager } from './usePortfolioManager';

export interface CustomerGroup {
  id: string;
  name: string;
  portfolio_manager_id: string;
  created_at: string;
}

export const useCustomerGroups = () => {
  const { data: portfolioManager } = usePortfolioManager();

  return useQuery({
    queryKey: ['customer-groups', portfolioManager?.id],
    queryFn: async () => {
      if (!portfolioManager) return [];
      
      const { data, error } = await supabase
        .from('customer_groups')
        .select('*')
        .eq('portfolio_manager_id', portfolioManager.id)
        .order('name');

      if (error) throw error;
      return data as CustomerGroup[];
    },
    enabled: !!portfolioManager,
  });
};

export const useCreateCustomerGroup = () => {
  const queryClient = useQueryClient();
  const { data: portfolioManager } = usePortfolioManager();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!portfolioManager) throw new Error('Portfolio manager not found');
      
      const { data, error } = await supabase
        .from('customer_groups')
        .insert({
          name,
          portfolio_manager_id: portfolioManager.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-groups'] });
    },
  });
};

export const useDeleteCustomerGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('customer_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-groups'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};
