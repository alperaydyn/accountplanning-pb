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
  console.log('[usePortfolioManager] user:', user?.id, 'enabled:', !!user);

  return useQuery({
    queryKey: ['portfolio-manager', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('portfolio_managers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to load portfolio manager profile:', error);
        throw error;
      }

      if (data) return data as PortfolioManager;

      // If the user has no profile yet, create it (required for RLS-scoped data loading).
      const name =
        (user.user_metadata as Record<string, unknown> | null)?.name?.toString() ||
        user.email?.split('@')[0] ||
        'User';
      const email = user.email ?? '';

      const { data: created, error: createError } = await supabase
        .from('portfolio_managers')
        .insert({
          user_id: user.id,
          name,
          email,
          portfolio_name: 'My Portfolio',
        })
        .select('*')
        .single();

      if (createError) {
        console.error('Failed to create portfolio manager profile:', createError);
        throw createError;
      }

      console.info('Created portfolio manager profile for user', user.id);
      return created as PortfolioManager;
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
