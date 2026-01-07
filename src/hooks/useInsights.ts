import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePortfolioTargets } from "./usePortfolioTargets";
import { useActions } from "./useActions";

export interface Insight {
  type: "critical" | "warning" | "info";
  title: string;
  message: string;
  detailedDescription: string;
  productIds: string[];
}

type ProductStatus = "on_track" | "at_risk" | "critical" | "melting" | "growing" | "ticket_size" | "diversity";

const GOOD_THRESHOLD = 80;
const BAD_THRESHOLD = 50;

function calculateStatus(
  stockCountTar: number,
  stockVolumeTar: number,
  flowCountTar: number,
  flowVolumeTar: number
): ProductStatus {
  const stockAvg = (stockCountTar + stockVolumeTar) / 2;
  const flowAvg = (flowCountTar + flowVolumeTar) / 2;
  const countAvg = (stockCountTar + flowCountTar) / 2;
  const volumeAvg = (stockVolumeTar + flowVolumeTar) / 2;

  const stockOk = stockAvg >= GOOD_THRESHOLD;
  const flowOk = flowAvg >= GOOD_THRESHOLD;
  const countOk = countAvg >= GOOD_THRESHOLD;
  const volumeOk = volumeAvg >= GOOD_THRESHOLD;

  const overallAvg = (stockCountTar + stockVolumeTar + flowCountTar + flowVolumeTar) / 4;

  if (stockOk && !flowOk) return "melting";
  if (!stockOk && flowOk) return "growing";
  if (countOk && !volumeOk) return "ticket_size";
  if (!countOk && volumeOk) return "diversity";

  if (overallAvg < BAD_THRESHOLD) return "critical";
  if (overallAvg < GOOD_THRESHOLD) return "at_risk";
  return "on_track";
}

export function useInsights() {
  const { data: targets, isLoading: targetsLoading } = usePortfolioTargets();
  const { data: actions, isLoading: actionsLoading } = useActions();

  return useQuery({
    queryKey: ["insights", targets?.length, actions?.length],
    queryFn: async () => {
      if (!targets || targets.length === 0) return [];

      // Calculate pending actions per product
      const pendingActionsPerProduct = new Map<string, number>();
      actions?.forEach((action) => {
        if (action.current_status === "Beklemede") {
          const count = pendingActionsPerProduct.get(action.product_id) || 0;
          pendingActionsPerProduct.set(action.product_id, count + 1);
        }
      });

      // Build compact product summaries for LLM
      const productSummaries = targets.map((t) => {
        const stockCountTar = Number(t.stock_count_tar) || 0;
        const stockVolumeTar = Number(t.stock_volume_tar) || 0;
        const flowCountTar = Number(t.flow_count_tar) || 0;
        const flowVolumeTar = Number(t.flow_volume_tar) || 0;

        const status = calculateStatus(stockCountTar, stockVolumeTar, flowCountTar, flowVolumeTar);

        return {
          id: t.product_id,
          name: t.products?.name || "Unknown",
          status,
          stockTar: Math.round((stockCountTar + stockVolumeTar) / 2),
          flowTar: Math.round((flowCountTar + flowVolumeTar) / 2),
          countTar: Math.round((stockCountTar + flowCountTar) / 2),
          volumeTar: Math.round((stockVolumeTar + flowVolumeTar) / 2),
          pendingActions: pendingActionsPerProduct.get(t.product_id) || 0,
        };
      });

      // Filter to only include products needing attention (reduce tokens)
      const relevantProducts = productSummaries.filter(
        (p) =>
          p.status !== "on_track" ||
          p.pendingActions > 3 ||
          p.stockTar < GOOD_THRESHOLD ||
          p.flowTar < GOOD_THRESHOLD
      );

      // If all products are healthy, return a positive insight locally
      if (relevantProducts.length === 0) {
        return [
          {
            type: "info" as const,
            title: "Portfolio Healthy",
            message: "All products are performing on track with no urgent actions needed.",
            detailedDescription:
              "Tüm ürünler hedeflerini karşılamaktadır. Portföy sağlıklı bir durumda devam etmektedir. Mevcut stratejileri sürdürmeniz ve fırsatları değerlendirmeniz önerilir.",
            productIds: [],
          },
        ];
      }

      const { data, error } = await supabase.functions.invoke("generate-insights", {
        body: { products: relevantProducts },
      });

      if (error) {
        console.error("Error generating insights:", error);
        throw error;
      }

      return (data?.insights || []) as Insight[];
    },
    enabled: !targetsLoading && !actionsLoading && !!targets && targets.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}
