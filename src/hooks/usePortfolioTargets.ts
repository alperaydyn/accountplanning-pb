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

      // Delete existing records for this date first (upsert behavior)
      await supabase
        .from("portfolio_targets")
        .delete()
        .eq("portfolio_manager_id", manager.id)
        .eq("record_date", recordDate);

      // Get all products
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name");

      if (productsError) throw productsError;

      // Generate realistic sample data for each product
      const targets = products.map((product) => {
        // Random realistic values
        const stockCount = Math.floor(Math.random() * 80) + 20; // 20-100
        const stockTarget = Math.floor(Math.random() * 40) + 80; // 80-120
        const stockTar = Math.floor((stockCount / stockTarget) * 100); // HGO %
        
        const flowCount = Math.floor(Math.random() * 30) + 5; // 5-35
        const flowTarget = Math.floor(Math.random() * 20) + 25; // 25-45
        const flowTar = Math.floor((flowCount / flowTarget) * 100);
        
        const stockVolume = (Math.random() * 50 + 10).toFixed(2); // 10-60M
        const stockVolumeTarget = (Math.random() * 30 + 40).toFixed(2); // 40-70M
        const stockVolumeTar = Math.floor((parseFloat(stockVolume) / parseFloat(stockVolumeTarget)) * 100);
        
        const flowVolume = (Math.random() * 15 + 2).toFixed(2); // 2-17M
        const flowVolumeTarget = (Math.random() * 10 + 10).toFixed(2); // 10-20M
        const flowVolumeTar = Math.floor((parseFloat(flowVolume) / parseFloat(flowVolumeTarget)) * 100);

        return {
          portfolio_manager_id: manager.id,
          product_id: product.id,
          record_date: recordDate,
          measure_date: new Date().toISOString().split("T")[0],
          stock_count: stockCount,
          stock_count_target: stockTarget,
          stock_count_tar: stockTar,
          stock_count_delta_ytd: Math.floor(Math.random() * 20) - 5,
          stock_count_delta_mtd: Math.floor(Math.random() * 10) - 3,
          stock_volume: parseFloat(stockVolume),
          stock_volume_target: parseFloat(stockVolumeTarget),
          stock_volume_tar: stockVolumeTar,
          stock_volume_delta_ytd: parseFloat((Math.random() * 10 - 3).toFixed(1)),
          stock_volume_delta_mtd: parseFloat((Math.random() * 5 - 2).toFixed(1)),
          flow_count: flowCount,
          flow_count_target: flowTarget,
          flow_count_tar: flowTar,
          flow_count_delta_ytd: Math.floor(Math.random() * 15) - 5,
          flow_count_delta_mtd: Math.floor(Math.random() * 8) - 3,
          flow_volume: parseFloat(flowVolume),
          flow_volume_target: parseFloat(flowVolumeTarget),
          flow_volume_tar: flowVolumeTar,
          flow_volume_delta_ytd: parseFloat((Math.random() * 5 - 2).toFixed(1)),
          flow_volume_delta_mtd: parseFloat((Math.random() * 3 - 1).toFixed(1)),
        };
      });

      const { error } = await supabase.from("portfolio_targets").insert(targets);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio-targets"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-targets-dates"] });
    },
  });
}
