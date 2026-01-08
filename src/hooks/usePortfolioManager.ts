import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PortfolioManager {
  id: string;
  user_id: string;
  name: string;
  email: string;
  portfolio_name: string;
  created_at: string;
  updated_at: string;
}

export const usePortfolioManager = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['portfolio-manager', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('portfolio_managers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as PortfolioManager | null;
    },
    enabled: !!user,
  });
};

export const useUpdatePortfolioManager = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Pick<PortfolioManager, 'name' | 'portfolio_name'>>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('portfolio_managers')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-manager'] });
    },
  });
};
