import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePortfolioManager } from './usePortfolioManager';
import { Database } from '@/integrations/supabase/types';

type ActionStatus = Database['public']['Enums']['action_status'];
type ActionType = Database['public']['Enums']['action_type'];
type ActionPriority = Database['public']['Enums']['action_priority'];

// Updated Action interface matching the new schema
export interface Action {
  id: string;
  customer_id: string;
  product_id: string;
  name: string;
  description: string | null;
  creator_name: string;
  creation_reason: string | null;
  customer_hints: string | null;
  source_data_date: string;
  action_target_date: string;
  type: ActionType;
  priority: ActionPriority;
  target_value: number | null;
  // Current state (denormalized)
  current_status: ActionStatus;
  current_owner_id: string | null;
  current_owner_type: string | null;
  current_planned_date: string | null;
  current_value: number | null;
  created_at: string;
  updated_at: string;
  // Joined data
  customers?: {
    id: string;
    name: string;
  };
  products?: {
    id: string;
    name: string;
    category: string;
  };
}

export interface ActionFilters {
  status?: ActionStatus | 'all';
  priority?: ActionPriority | 'all';
  customerId?: string;
  productId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const useActions = (filters?: ActionFilters) => {
  const { data: portfolioManager } = usePortfolioManager();

  return useQuery({
    queryKey: ['actions', portfolioManager?.id, filters],
    queryFn: async () => {
      if (!portfolioManager) return [];
      
      // First get customer IDs for this portfolio manager
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id')
        .eq('portfolio_manager_id', portfolioManager.id);

      if (customersError) throw customersError;
      
      const customerIds = customers?.map(c => c.id) || [];
      if (customerIds.length === 0) return [];

      let query = supabase
        .from('actions')
        .select(`
          *,
          customers (
            id,
            name
          ),
          products (
            id,
            name,
            category
          )
        `)
        .in('customer_id', customerIds)
        .order('action_target_date', { ascending: true, nullsFirst: false });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('current_status', filters.status);
      }
      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters?.dateFrom) {
        query = query.gte('action_target_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('action_target_date', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Action[];
    },
    enabled: !!portfolioManager,
  });
};

export const useActionsByCustomer = (customerId: string | undefined) => {
  return useQuery({
    queryKey: ['actions', 'customer', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const { data, error } = await supabase
        .from('actions')
        .select(`
          *,
          products (
            id,
            name,
            category
          )
        `)
        .eq('customer_id', customerId)
        .order('action_target_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as Action[];
    },
    enabled: !!customerId,
  });
};

export const useActionsByProduct = (customerId: string | undefined, productId: string | undefined) => {
  return useQuery({
    queryKey: ['actions', 'customer', customerId, 'product', productId],
    queryFn: async () => {
      if (!customerId || !productId) return [];
      
      const { data, error } = await supabase
        .from('actions')
        .select('*')
        .eq('customer_id', customerId)
        .eq('product_id', productId)
        .order('action_target_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as Action[];
    },
    enabled: !!customerId && !!productId,
  });
};

export interface CreateActionInput {
  customer_id: string;
  product_id: string;
  name: string;
  description?: string;
  creator_name: string;
  creation_reason?: string;
  customer_hints?: string;
  source_data_date: string;
  action_target_date: string;
  type: ActionType;
  priority: ActionPriority;
  target_value?: number;
  current_status?: ActionStatus;
  current_planned_date?: string;
}

export const useCreateAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateActionInput) => {
      const { data, error } = await supabase
        .from('actions')
        .insert({
          ...input,
          current_status: input.current_status || 'Beklemede',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      queryClient.invalidateQueries({ queryKey: ['actions', 'customer', variables.customer_id] });
    },
  });
};

export const useUpdateAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, customer_id, ...updates }: Partial<Action> & { id: string; customer_id: string }) => {
      const { data, error } = await supabase
        .from('actions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      queryClient.invalidateQueries({ queryKey: ['actions', 'customer', variables.customer_id] });
    },
  });
};

export const useDeleteAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, customer_id }: { id: string; customer_id: string }) => {
      const { error } = await supabase
        .from('actions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      queryClient.invalidateQueries({ queryKey: ['actions', 'customer', variables.customer_id] });
    },
  });
};

// Export enum values
export const ACTION_STATUSES: ActionStatus[] = [
  'Beklemede', 'Planlandı', 'Tamamlandı', 'Ertelendi', 'İlgilenmiyor', 'Uygun Değil'
];

export const ACTION_TYPES: ActionType[] = ['model_based', 'ad_hoc'];

export const ACTION_PRIORITIES: ActionPriority[] = ['high', 'medium', 'low'];