import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePortfolioTargets } from "./usePortfolioTargets";
import { useActions } from "./useActions";
import { usePortfolioManager } from "./usePortfolioManager";
import { toast } from "sonner";

export interface InsightProduct {
  name: string;
  id: string | null;
}

export interface Insight {
  type: "critical" | "warning" | "info";
  title: string;
  message: string;
  detailedDescription: string;
  products: InsightProduct[];
}

export interface StoredInsights {
  id: string;
  record_date: string;
  version: number;
  model_name: string;
  insights: Insight[];
  feedback: "like" | "dislike" | null;
  created_at: string;
}

type ProductStatus = "on_track" | "at_risk" | "critical" | "melting" | "growing" | "ticket_size" | "diversity";

const GOOD_THRESHOLD = 80;
const BAD_THRESHOLD = 50;
const MODEL_NAME = "gpt-5-mini";

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

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function useInsights() {
  const queryClient = useQueryClient();
  const { data: targets, isLoading: targetsLoading } = usePortfolioTargets();
  const { data: actions, isLoading: actionsLoading } = useActions();
  const { data: portfolioManager, isLoading: pmLoading } = usePortfolioManager();

  const fetchOrGenerateInsights = async (): Promise<StoredInsights | null> => {
    if (!targets || targets.length === 0 || !portfolioManager) return null;

    const recordDate = getCurrentMonth();

    // First, try to fetch existing insights for this month
    const { data: existingInsights, error: fetchError } = await supabase
      .from("ai_insights")
      .select("*")
      .eq("portfolio_manager_id", portfolioManager.id)
      .eq("record_date", recordDate)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    if (existingInsights && !fetchError) {
      return {
        ...existingInsights,
        insights: existingInsights.insights as unknown as Insight[],
        feedback: existingInsights.feedback as "like" | "dislike" | null,
      };
    }

    // No existing insights, generate new ones
    return await generateNewInsights(targets, actions, portfolioManager.id, recordDate, 1);
  };

  const generateNewInsights = async (
    targetsData: typeof targets,
    actionsData: typeof actions,
    portfolioManagerId: string,
    recordDate: string,
    version: number
  ): Promise<StoredInsights | null> => {
    if (!targetsData || targetsData.length === 0) return null;

    // Calculate pending actions per product
    const pendingActionsPerProduct = new Map<string, number>();
    actionsData?.forEach((action) => {
      if (action.current_status === "Beklemede") {
        const count = pendingActionsPerProduct.get(action.product_id) || 0;
        pendingActionsPerProduct.set(action.product_id, count + 1);
      }
    });

    // Build compact product summaries for LLM
    const productSummaries = targetsData.map((t) => {
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

    let insights: Insight[];

    // If all products are healthy, return a positive insight locally
    if (relevantProducts.length === 0) {
      insights = [
        {
          type: "info" as const,
          title: "Portföy Sağlıklı",
          message: "Tüm ürünler hedeflerini karşılamakta, acil aksiyon gerekmiyor.",
          detailedDescription:
            "Tüm ürünler hedeflerini karşılamaktadır. Portföy sağlıklı bir durumda devam etmektedir. Mevcut stratejileri sürdürmeniz ve fırsatları değerlendirmeniz önerilir.",
          products: [],
        },
      ];
    } else {
      const { data, error } = await supabase.functions.invoke("generate-insights", {
        body: { products: relevantProducts },
      });

      if (error) {
        console.error("Error generating insights:", error);
        throw error;
      }

      insights = (data?.insights || []) as Insight[];
    }

    // Save to database
    const { data: savedInsights, error: saveError } = await supabase
      .from("ai_insights")
      .insert([{
        portfolio_manager_id: portfolioManagerId,
        record_date: recordDate,
        version,
        model_name: MODEL_NAME,
        insights: JSON.parse(JSON.stringify(insights)),
      }])
      .select()
      .single();

    if (saveError) {
      console.error("Error saving insights:", saveError);
      // Return insights even if save fails
      return {
        id: "",
        record_date: recordDate,
        version,
        model_name: MODEL_NAME,
        insights,
        feedback: null,
        created_at: new Date().toISOString(),
      };
    }

    return {
      ...savedInsights,
      insights: savedInsights.insights as unknown as Insight[],
      feedback: savedInsights.feedback as "like" | "dislike" | null,
    };
  };

  const query = useQuery({
    queryKey: ["insights", portfolioManager?.id, targets?.length, actions?.length],
    queryFn: fetchOrGenerateInsights,
    enabled: !targetsLoading && !actionsLoading && !pmLoading && !!targets && targets.length > 0 && !!portfolioManager,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (!targets || targets.length === 0 || !portfolioManager) {
        throw new Error("No data available");
      }

      const recordDate = getCurrentMonth();

      // Get the latest version for this month
      const { data: latestInsights } = await supabase
        .from("ai_insights")
        .select("version")
        .eq("portfolio_manager_id", portfolioManager.id)
        .eq("record_date", recordDate)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      const newVersion = (latestInsights?.version || 0) + 1;

      return generateNewInsights(targets, actions, portfolioManager.id, recordDate, newVersion);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["insights", portfolioManager?.id, targets?.length, actions?.length], data);
      toast.success("Insights regenerated");
    },
    onError: (error) => {
      console.error("Error refreshing insights:", error);
      toast.error("Failed to refresh insights");
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async ({ insightId, feedback }: { insightId: string; feedback: "like" | "dislike" | null }) => {
      const { error } = await supabase
        .from("ai_insights")
        .update({ feedback })
        .eq("id", insightId);

      if (error) throw error;
      return feedback;
    },
    onSuccess: (feedback, { insightId }) => {
      // Update the cached data
      queryClient.setQueryData(
        ["insights", portfolioManager?.id, targets?.length, actions?.length],
        (old: StoredInsights | null) => {
          if (!old || old.id !== insightId) return old;
          return { ...old, feedback };
        }
      );
      toast.success(feedback === "like" ? "Thanks for your feedback!" : feedback === "dislike" ? "Thanks, we'll improve!" : "Feedback removed");
    },
    onError: () => {
      toast.error("Failed to save feedback");
    },
  });

  return {
    ...query,
    refreshInsights: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
    submitFeedback: feedbackMutation.mutate,
    isSubmittingFeedback: feedbackMutation.isPending,
  };
}
