import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CustomerProduct {
  id: string;
  customer_id: string;
  product_id: string;
  current_value: number;
  external_data: number | null;
  created_at: string;
  updated_at: string;
  // Computed from product_thresholds
  threshold?: number;
  gap?: number;
  // Joined data
  products?: {
    id: string;
    name: string;
    category: string;
    is_external: boolean;
  };
}

interface CustomerWithSectorSegment {
  sector: string;
  segment: string;
}

export const useCustomerProducts = (customerId: string | undefined) => {
  return useQuery({
    queryKey: ['customer-products', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      // Fetch customer to get sector and segment
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('sector, segment')
        .eq('id', customerId)
        .maybeSingle();

      if (customerError) throw customerError;
      if (!customer) return [];

      // Fetch customer products with product info
      const { data: customerProducts, error: cpError } = await supabase
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

      if (cpError) throw cpError;
      if (!customerProducts || customerProducts.length === 0) return [];

      // Fetch active thresholds for this customer's sector/segment
      const { data: thresholds, error: thresholdsError } = await supabase
        .from('product_thresholds')
        .select('product_id, threshold_value')
        .eq('sector', customer.sector)
        .eq('segment', customer.segment)
        .eq('is_active', true);

      if (thresholdsError) throw thresholdsError;

      // Create a map of product_id to threshold_value
      const thresholdMap = new Map<string, number>();
      thresholds?.forEach(t => {
        thresholdMap.set(t.product_id, Number(t.threshold_value));
      });

      // Add computed threshold and gap fields
      return customerProducts.map(cp => {
        const threshold = thresholdMap.get(cp.product_id) || 0;
        return {
          ...cp,
          threshold,
          gap: threshold - Number(cp.current_value),
        };
      });
    },
    enabled: !!customerId,
  });
};

export interface CreateCustomerProductInput {
  customer_id: string;
  product_id: string;
  current_value?: number;
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
