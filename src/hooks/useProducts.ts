import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type ProductCategory = Database['public']['Enums']['product_category'];

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  is_external: boolean;
  description: string | null;
  created_at: string;
}

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Product[];
    },
  });
};

export const useProductById = (productId: string | undefined) => {
  return useQuery({
    queryKey: ['products', productId],
    queryFn: async () => {
      if (!productId) return null;
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!productId,
  });
};

export const useProductsByCategory = (category: ProductCategory | undefined) => {
  return useQuery({
    queryKey: ['products', 'category', category],
    queryFn: async () => {
      if (!category) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .order('name');

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!category,
  });
};
