import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ProductThreshold = Database['public']['Tables']['product_thresholds']['Row'];
type ProductThresholdInsert = Database['public']['Tables']['product_thresholds']['Insert'];
type ProductThresholdUpdate = Database['public']['Tables']['product_thresholds']['Update'];

export interface ProductThresholdWithProduct extends ProductThreshold {
  products?: {
    name: string;
    category: Database['public']['Enums']['product_category'];
  };
}

export interface ThresholdFilters {
  sector?: Database['public']['Enums']['customer_sector'];
  segment?: Database['public']['Enums']['customer_segment'];
  productId?: string;
  isActive?: boolean;
  versionNum?: number;
}

export function useProductThresholds(filters: ThresholdFilters = {}) {
  return useQuery({
    queryKey: ['product-thresholds', filters],
    queryFn: async () => {
      let query = supabase
        .from('product_thresholds')
        .select(`
          *,
          products (
            name,
            category
          )
        `)
        .order('sector')
        .order('segment')
        .order('product_id');

      if (filters.sector) {
        query = query.eq('sector', filters.sector);
      }
      if (filters.segment) {
        query = query.eq('segment', filters.segment);
      }
      if (filters.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters.versionNum !== undefined) {
        query = query.eq('version_num', filters.versionNum);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ProductThresholdWithProduct[];
    },
  });
}

export function useCreateProductThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threshold: ProductThresholdInsert) => {
      const { data, error } = await supabase
        .from('product_thresholds')
        .insert(threshold)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-thresholds'] });
    },
  });
}

export function useUpdateProductThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & ProductThresholdUpdate) => {
      const { data, error } = await supabase
        .from('product_thresholds')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-thresholds'] });
    },
  });
}

export function useDeleteProductThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_thresholds')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-thresholds'] });
    },
  });
}

export function useBulkCreateProductThresholds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (thresholds: ProductThresholdInsert[]) => {
      const { data, error } = await supabase
        .from('product_thresholds')
        .insert(thresholds)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-thresholds'] });
    },
  });
}

export function useThresholdVersions() {
  return useQuery({
    queryKey: ['product-threshold-versions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_thresholds')
        .select('version_num, calculation_date, is_active')
        .order('version_num', { ascending: false });

      if (error) throw error;
      
      // Get unique versions
      const uniqueVersions = data.reduce((acc, curr) => {
        if (!acc.find(v => v.version_num === curr.version_num)) {
          acc.push(curr);
        }
        return acc;
      }, [] as typeof data);

      return uniqueVersions;
    },
  });
}
