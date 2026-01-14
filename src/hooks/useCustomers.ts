import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePortfolioManager } from './usePortfolioManager';
import { Database } from '@/integrations/supabase/types';

type CustomerSector = Database['public']['Enums']['customer_sector'];
type CustomerSegment = Database['public']['Enums']['customer_segment'];
type CustomerStatus = Database['public']['Enums']['customer_status'];

export interface Customer {
  id: string;
  name: string;
  sector: CustomerSector;
  segment: CustomerSegment;
  status: CustomerStatus;
  principality_score: number;
  last_activity_date: string | null;
  portfolio_manager_id: string;
  group_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  customer_groups?: {
    id: string;
    name: string;
  } | null;
}

export interface CustomerFilters {
  search?: string;
  sector?: CustomerSector | 'all';
  segment?: CustomerSegment | 'all';
  status?: CustomerStatus | 'all';
  groupId?: string | 'all';
}

export const useCustomers = (filters?: CustomerFilters) => {
  const { data: portfolioManager } = usePortfolioManager();

  // Exclude search from queryKey to prevent refetches - search is client-side only
  const { search, ...serverFilters } = filters || {};

  return useQuery({
    queryKey: ['customers', portfolioManager?.id, serverFilters],
    queryFn: async () => {
      if (!portfolioManager) return [];
      
      let query = supabase
        .from('customers')
        .select(`
          *,
          customer_groups (
            id,
            name
          )
        `)
        .eq('portfolio_manager_id', portfolioManager.id)
        .order('name');

      // Apply server-side filters only
      if (serverFilters?.sector && serverFilters.sector !== 'all') {
        query = query.eq('sector', serverFilters.sector);
      }
      if (serverFilters?.segment && serverFilters.segment !== 'all') {
        query = query.eq('segment', serverFilters.segment);
      }
      if (serverFilters?.status && serverFilters.status !== 'all') {
        query = query.eq('status', serverFilters.status);
      }
      if (serverFilters?.groupId && serverFilters.groupId !== 'all') {
        query = query.eq('group_id', serverFilters.groupId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as Customer[];
    },
    enabled: !!portfolioManager,
    // Keep previous data while fetching to prevent flickering
    placeholderData: keepPreviousData,
    select: (data) => {
      // Apply search filter client-side after data is fetched
      if (!search) return data;
      const searchLower = search.toLowerCase();
      return data.filter(c => c.name.toLowerCase().includes(searchLower));
    },
  });
};

export const useCustomerById = (customerId: string | undefined) => {
  return useQuery({
    queryKey: ['customers', 'detail', customerId],
    queryFn: async () => {
      if (!customerId) return null;
      
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          customer_groups (
            id,
            name
          )
        `)
        .eq('id', customerId)
        .maybeSingle();

      if (error) throw error;
      return data as Customer | null;
    },
    enabled: !!customerId,
  });
};

export interface CreateCustomerInput {
  name: string;
  sector: CustomerSector;
  segment: CustomerSegment;
  status: CustomerStatus;
  principality_score?: number;
  group_id?: string | null;
}

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const { data: portfolioManager } = usePortfolioManager();

  return useMutation({
    mutationFn: async (input: CreateCustomerInput) => {
      if (!portfolioManager) throw new Error('Portfolio manager not found');
      
      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...input,
          portfolio_manager_id: portfolioManager.id,
          last_activity_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update({
          ...updates,
          last_activity_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', 'detail', variables.id] });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

// Export enum values for use in filters
export const SECTORS: CustomerSector[] = [
  'Turizm', 'Ulaşım', 'Perakende', 'Gayrimenkul', 'Tarım Hayvancılık', 'Sağlık', 'Enerji'
];

export const SEGMENTS: CustomerSegment[] = [
  'MİKRO', 'Kİ', 'OBİ', 'TİCARİ'
];

export const STATUSES: CustomerStatus[] = [
  'Yeni Müşteri', 'Aktif', 'Target', 'Strong Target', 'Ana Banka'
];
