import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePortfolioManager } from './usePortfolioManager';

export interface PortfolioSummary {
  totalCustomers: number;
  primaryBankCustomers: number;
  nonPrimaryCustomers: number;
  primaryBankScore: number;
  totalActionsPlanned: number;
  totalActionsCompleted: number;
  totalActionsPending: number;
}

export const usePortfolioSummary = () => {
  const { data: portfolioManager } = usePortfolioManager();

  return useQuery({
    queryKey: ['portfolio-summary', portfolioManager?.id],
    queryFn: async (): Promise<PortfolioSummary> => {
      if (!portfolioManager) {
        return {
          totalCustomers: 0,
          primaryBankCustomers: 0,
          nonPrimaryCustomers: 0,
          primaryBankScore: 0,
          totalActionsPlanned: 0,
          totalActionsCompleted: 0,
          totalActionsPending: 0,
        };
      }

      // Get customers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, status, principality_score')
        .eq('portfolio_manager_id', portfolioManager.id);

      if (customersError) throw customersError;

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

      // Get actions
      const { data: actions, error: actionsError } = await supabase
        .from('actions')
        .select('status')
        .in('customer_id', customerIds);

      if (actionsError) throw actionsError;

      const totalActionsPlanned = actions?.filter(a => a.status === 'Planlandı').length || 0;
      const totalActionsCompleted = actions?.filter(a => a.status === 'Tamamlandı').length || 0;
      const totalActionsPending = actions?.filter(a => a.status === 'Beklemede').length || 0;

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
    enabled: !!portfolioManager,
  });
};
