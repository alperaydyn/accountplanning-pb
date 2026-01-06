import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CustomerProduct {
  id: string;
  customer_id: string;
  product_id: string;
  current_value: number;
  threshold: number;
  external_data: number | null;
  created_at: string;
  updated_at: string;
  // Computed
  gap?: number;
  // Joined data
  products?: {
    id: string;
    name: string;
    category: string;
    is_external: boolean;
  };
}

export const useCustomerProducts = (customerId: string | undefined) => {
  return useQuery({
    queryKey: ['customer-products', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const { data, error } = await supabase
        .from('customer_products')
        .select(`
          *,
          products (
            id,
            name,
            category,
            is_external
          )
        `)
        .eq('customer_id', customerId);

      if (error) throw error;
      
      // Add computed gap field
      return (data as CustomerProduct[]).map(cp => ({
        ...cp,
        gap: cp.threshold - cp.current_value,
      }));
    },
    enabled: !!customerId,
  });
};

export interface CreateCustomerProductInput {
  customer_id: string;
  product_id: string;
  current_value?: number;
  threshold?: number;
  external_data?: number | null;
}

export const useCreateCustomerProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCustomerProductInput) => {
      const { data, error } = await supabase
        .from('customer_products')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer-products', variables.customer_id] });
    },
  });
};

export const useUpdateCustomerProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, customer_id, ...updates }: Partial<CustomerProduct> & { id: string; customer_id: string }) => {
      const { data, error } = await supabase
        .from('customer_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer-products', variables.customer_id] });
    },
  });
};

export const useDeleteCustomerProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, customer_id }: { id: string; customer_id: string }) => {
      const { error } = await supabase
        .from('customer_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer-products', variables.customer_id] });
    },
  });
};
