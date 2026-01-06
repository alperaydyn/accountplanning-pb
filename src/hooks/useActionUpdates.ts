import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type ActionStatus = Database['public']['Enums']['action_status'];

export type UpdateType = 'assigned' | 'status_change' | 'value_update' | 'date_change' | 'response' | 'closed';

export interface ActionUpdate {
  id: string;
  action_id: string;
  update_type: UpdateType;
  previous_status: ActionStatus | null;
  new_status: ActionStatus | null;
  previous_value: number | null;
  new_value: number | null;
  previous_date: string | null;
  new_date: string | null;
  previous_owner_id: string | null;
  new_owner_id: string | null;
  previous_owner_type: string | null;
  new_owner_type: string | null;
  response_text: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

// Get all updates for a specific action
export const useActionUpdates = (actionId: string | undefined) => {
  return useQuery({
    queryKey: ['action-updates', actionId],
    queryFn: async () => {
      if (!actionId) return [];
      
      const { data, error } = await supabase
        .from('action_updates')
        .select('*')
        .eq('action_id', actionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ActionUpdate[];
    },
    enabled: !!actionId,
  });
};

// Get recent updates for a customer's actions (for display in product cards)
export const useRecentActionUpdates = (customerId: string | undefined, limit: number = 5) => {
  return useQuery({
    queryKey: ['action-updates', 'customer', customerId, 'recent', limit],
    queryFn: async () => {
      if (!customerId) return [];
      
      // First get action IDs for this customer
      const { data: actions, error: actionsError } = await supabase
        .from('actions')
        .select('id')
        .eq('customer_id', customerId);

      if (actionsError) throw actionsError;
      
      const actionIds = actions?.map(a => a.id) || [];
      if (actionIds.length === 0) return [];

      const { data, error } = await supabase
        .from('action_updates')
        .select('*')
        .in('action_id', actionIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ActionUpdate[];
    },
    enabled: !!customerId,
  });
};

// Get updates for a specific product's actions
export const useActionUpdatesByProduct = (customerId: string | undefined, productId: string | undefined) => {
  return useQuery({
    queryKey: ['action-updates', 'customer', customerId, 'product', productId],
    queryFn: async () => {
      if (!customerId || !productId) return [];
      
      // First get action IDs for this customer and product
      const { data: actions, error: actionsError } = await supabase
        .from('actions')
        .select('id')
        .eq('customer_id', customerId)
        .eq('product_id', productId);

      if (actionsError) throw actionsError;
      
      const actionIds = actions?.map(a => a.id) || [];
      if (actionIds.length === 0) return [];

      const { data, error } = await supabase
        .from('action_updates')
        .select('*')
        .in('action_id', actionIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ActionUpdate[];
    },
    enabled: !!customerId && !!productId,
  });
};

export interface CreateActionUpdateInput {
  action_id: string;
  update_type: UpdateType;
  previous_status?: ActionStatus;
  new_status?: ActionStatus;
  previous_value?: number;
  new_value?: number;
  previous_date?: string;
  new_date?: string;
  previous_owner_id?: string;
  new_owner_id?: string;
  previous_owner_type?: string;
  new_owner_type?: string;
  response_text?: string;
  notes?: string;
  created_by?: string;
}

export const useCreateActionUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateActionUpdateInput) => {
      const { data, error } = await supabase
        .from('action_updates')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['action-updates', variables.action_id] });
      queryClient.invalidateQueries({ queryKey: ['action-updates'] });
      // Also invalidate actions since the trigger updates the parent action
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });
};

// Helper hook to add a status change update
export const useChangeActionStatus = () => {
  const createUpdate = useCreateActionUpdate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      actionId, 
      previousStatus, 
      newStatus, 
      notes 
    }: { 
      actionId: string; 
      previousStatus: ActionStatus; 
      newStatus: ActionStatus; 
      notes?: string;
    }) => {
      return createUpdate.mutateAsync({
        action_id: actionId,
        update_type: 'status_change',
        previous_status: previousStatus,
        new_status: newStatus,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });
};

// Helper hook to add a customer response
export const useAddActionResponse = () => {
  const createUpdate = useCreateActionUpdate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      actionId, 
      responseText, 
      newStatus,
      previousStatus,
    }: { 
      actionId: string; 
      responseText: string; 
      newStatus?: ActionStatus;
      previousStatus?: ActionStatus;
    }) => {
      return createUpdate.mutateAsync({
        action_id: actionId,
        update_type: 'response',
        response_text: responseText,
        previous_status: previousStatus,
        new_status: newStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });
};

// Helper hook to update action value
export const useUpdateActionValue = () => {
  const createUpdate = useCreateActionUpdate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      actionId, 
      previousValue, 
      newValue, 
      notes 
    }: { 
      actionId: string; 
      previousValue: number | null; 
      newValue: number; 
      notes?: string;
    }) => {
      return createUpdate.mutateAsync({
        action_id: actionId,
        update_type: 'value_update',
        previous_value: previousValue ?? undefined,
        new_value: newValue,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });
};

// Helper hook to postpone action
export const usePostponeAction = () => {
  const createUpdate = useCreateActionUpdate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      actionId, 
      previousDate, 
      newDate, 
      previousStatus,
      notes 
    }: { 
      actionId: string; 
      previousDate: string | null; 
      newDate: string; 
      previousStatus: ActionStatus;
      notes?: string;
    }) => {
      return createUpdate.mutateAsync({
        action_id: actionId,
        update_type: 'date_change',
        previous_date: previousDate ?? undefined,
        new_date: newDate,
        previous_status: previousStatus,
        new_status: 'Ertelendi',
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });
};