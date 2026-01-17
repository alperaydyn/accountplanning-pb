import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePortfolioManager } from './usePortfolioManager';
import { useAuth } from '@/contexts/AuthContext';

export interface PortfolioSummary {
  totalCustomers: number;
  primaryBankCustomers: number;
  nonPrimaryCustomers: number;
  primaryBankScore: number;
  totalActionsPlanned: number;
  totalActionsCompleted: number;
  totalActionsPending: number;
}

const EMPTY_SUMMARY: PortfolioSummary = {
  totalCustomers: 0,
  primaryBankCustomers: 0,
  nonPrimaryCustomers: 0,
  primaryBankScore: 0,
  totalActionsPlanned: 0,
  totalActionsCompleted: 0,
  totalActionsPending: 0,
};

export const usePortfolioSummary = () => {
  const { data: portfolioManager, isLoading: pmLoading } = usePortfolioManager();
  const { session } = useAuth();

  return useQuery({
    queryKey: ['portfolio-summary', portfolioManager?.id],
    queryFn: async (): Promise<PortfolioSummary> => {
      // Don't attempt to fetch if no portfolio manager or no valid session
      if (!portfolioManager || !session) {
        return EMPTY_SUMMARY;
      }

      // Verify session is still valid
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        if (expiresAt < now) {
          console.warn('Session expired during portfolio summary fetch');
          return EMPTY_SUMMARY;
        }
      }

      // Get customers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, status, principality_score')
        .eq('portfolio_manager_id', portfolioManager.id);

      if (customersError) {
        // Check for auth errors
        if (customersError.message?.includes('JWT') || customersError.code === 'PGRST301') {
          console.warn('Auth error during portfolio summary fetch');
          return EMPTY_SUMMARY;
        }
        throw customersError;
      }

      const totalCustomers = customers?.length || 0;
      const primaryBankCustomers = customers?.filter(c => c.status === 'Ana Banka').length || 0;
      const nonPrimaryCustomers = totalCustomers - primaryBankCustomers;
      
      // Calculate average principality score
      const totalScore = customers?.reduce((sum, c) => sum + (c.principality_score || 0), 0) || 0;
      const primaryBankScore = totalCustomers > 0 ? Math.round(totalScore / totalCustomers) : 0;

      // Get customer IDs for action queries
      const customerIds = customers?.map(c => c.id) || [];
      
      if (customerIds.length === 0) {
        return {
          totalCustomers,
          primaryBankCustomers,
          nonPrimaryCustomers,
          primaryBankScore,
          totalActionsPlanned: 0,
          totalActionsCompleted: 0,
          totalActionsPending: 0,
        };
      }

      // Get actions - use current_status instead of status
      const { data: actions, error: actionsError } = await supabase
        .from('actions')
        .select('current_status')
        .in('customer_id', customerIds);

      if (actionsError) {
        if (actionsError.message?.includes('JWT') || actionsError.code === 'PGRST301') {
          console.warn('Auth error during actions fetch');
          return EMPTY_SUMMARY;
        }
        throw actionsError;
      }

      const totalActionsPlanned = actions?.filter(a => a.current_status === 'Planlandı').length || 0;
      const totalActionsCompleted = actions?.filter(a => a.current_status === 'Tamamlandı').length || 0;
      const totalActionsPending = actions?.filter(a => a.current_status === 'Beklemede').length || 0;

      return {
        totalCustomers,
        primaryBankCustomers,
        nonPrimaryCustomers,
        primaryBankScore,
        totalActionsPlanned,
        totalActionsCompleted,
        totalActionsPending,
      };
    },
    enabled: !!portfolioManager && !!session && !pmLoading,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && 
          (error.message?.includes('JWT') || error.message?.includes('401'))) {
        return false;
      }
      return failureCount < 2;
    },
  });
};