import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePortfolioManager } from './usePortfolioManager';

export interface AllCustomerProduct {
  id: string;
  customer_id: string;
  product_id: string;
  current_value: number;
  external_data: number | null;
}

export const useAllCustomerProducts = () => {
  const { data: portfolioManager } = usePortfolioManager();

  return useQuery({
    queryKey: ['all-customer-products', portfolioManager?.id],
    queryFn: async (): Promise<AllCustomerProduct[]> => {
      if (!portfolioManager) return [];

      // First get all customer IDs for this portfolio manager
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id')
        .eq('portfolio_manager_id', portfolioManager.id);

      if (customersError) throw customersError;
      if (!customers || customers.length === 0) return [];

      const customerIds = customers.map(c => c.id);

      // Fetch all customer products for these customers
      const { data: customerProducts, error: cpError } = await supabase
        .from('customer_products')
        .select('id, customer_id, product_id, current_value, external_data')
        .in('customer_id', customerIds);

      if (cpError) throw cpError;
      
      return customerProducts || [];
    },
    enabled: !!portfolioManager,
  });
};
