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
  const { user, session } = useAuth();

  return useQuery({
    queryKey: ['portfolio-manager', user?.id],
    queryFn: async () => {
      // Double-check session is still valid before querying
      if (!user || !session) return null;
      
      // Verify the session token is not expired
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        if (expiresAt < now) {
          console.warn('Session expired during portfolio manager fetch');
          return null;
        }
      }
      
      const { data, error } = await supabase
        .from('portfolio_managers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        // Check if error is auth-related
        if (error.message?.includes('JWT') || error.code === 'PGRST301') {
          console.warn('Auth error during portfolio manager fetch:', error.message);
          return null;
        }
        throw error;
      }
      return data as PortfolioManager | null;
    },
    enabled: !!user && !!session,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && 
          (error.message?.includes('JWT') || error.message?.includes('401'))) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
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
