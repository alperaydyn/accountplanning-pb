import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePortfolioManager } from "./usePortfolioManager";

export interface PortfolioTarget {
  id: string;
  portfolio_manager_id: string;
  product_id: string;
  record_date: string;
  measure_date: string;
  stock_count: number;
  stock_count_target: number;
  stock_count_tar: number;
  stock_count_delta_ytd: number;
  stock_count_delta_mtd: number;
  stock_volume: number;
  stock_volume_target: number;
  stock_volume_tar: number;
  stock_volume_delta_ytd: number;
  stock_volume_delta_mtd: number;
  flow_count: number;
  flow_count_target: number;
  flow_count_tar: number;
  flow_count_delta_ytd: number;
  flow_count_delta_mtd: number;
  flow_volume: number;
  flow_volume_target: number;
  flow_volume_tar: number;
  flow_volume_delta_ytd: number;
  flow_volume_delta_mtd: number;
  products?: {
    id: string;
    name: string;
    category: string;
    display_order: number;
  };
}

export function usePortfolioTargets(recordDate?: string) {
  const { data: manager } = usePortfolioManager();

  return useQuery({
    queryKey: ["portfolio-targets", manager?.id, recordDate],
    queryFn: async () => {
      let query = supabase
        .from("portfolio_targets")
        .select(`
          *,
          products (id, name, category, display_order)
        `);

      if (recordDate) {
        query = query.eq("record_date", recordDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Sort by product display_order
      const sorted = (data as PortfolioTarget[]).sort((a, b) => {
        const orderA = a.products?.display_order ?? 999;
        const orderB = b.products?.display_order ?? 999;
        return orderA - orderB;
      });
      
      return sorted;
    },
    enabled: !!manager?.id,
  });
}

export function useRecordDates() {
  const { data: manager } = usePortfolioManager();

  return useQuery({
    queryKey: ["portfolio-targets-dates", manager?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_targets")
        .select("record_date")
        .order("record_date", { ascending: false });

      if (error) throw error;

      // Get unique record dates
      const uniqueDates = [...new Set(data?.map((d) => d.record_date) || [])];
      return uniqueDates;
    },
    enabled: !!manager?.id,
  });
}

export function useCreatePortfolioTargets() {
  const queryClient = useQueryClient();
  const { data: manager } = usePortfolioManager();

  return useMutation({
    mutationFn: async (recordDate: string) => {
      if (!manager?.id) throw new Error("No portfolio manager found");

      // Get all products
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id");

      if (productsError) throw productsError;

      // Create targets for each product
      const targets = products.map((product) => ({
        portfolio_manager_id: manager.id,
        product_id: product.id,
        record_date: recordDate,
        measure_date: new Date().toISOString().split("T")[0],
        stock_count: 0,
        stock_count_target: 0,
        stock_count_tar: 0,
        stock_count_delta_ytd: 0,
        stock_count_delta_mtd: 0,
        stock_volume: 0,
        stock_volume_target: 0,
        stock_volume_tar: 0,
        stock_volume_delta_ytd: 0,
        stock_volume_delta_mtd: 0,
        flow_count: 0,
        flow_count_target: 0,
        flow_count_tar: 0,
        flow_count_delta_ytd: 0,
        flow_count_delta_mtd: 0,
        flow_volume: 0,
        flow_volume_target: 0,
        flow_volume_tar: 0,
        flow_volume_delta_ytd: 0,
        flow_volume_delta_mtd: 0,
      }));

      const { error } = await supabase.from("portfolio_targets").insert(targets);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-targets"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-targets-dates"] });
    },
  });
}
