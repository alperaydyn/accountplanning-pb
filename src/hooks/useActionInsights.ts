import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePortfolioTargets } from "./usePortfolioTargets";
import { useActions } from "./useActions";
import { useCustomers } from "./useCustomers";
import { usePortfolioManager } from "./usePortfolioManager";
import { toast } from "sonner";

export interface ActionInsight {
  type: "critical" | "warning" | "info";
  title: string;
  message: string;
  detailedDescription: string;
  category: "sufficiency" | "alignment" | "balance" | "quality";
}

export interface StoredActionInsights {
  id: string;
  record_date: string;
  version: number;
  model_name: string;
  insights: ActionInsight[];
  feedback: "like" | "dislike" | null;
  created_at: string;
}

const MODEL_NAME = "gpt-5-mini";
const GOOD_THRESHOLD = 80;
const BAD_THRESHOLD = 50;

function calculateProductStatus(
  stockCountTar: number,
  stockVolumeTar: number,
  flowCountTar: number,
  flowVolumeTar: number
): string {
  const overallAvg = (stockCountTar + stockVolumeTar + flowCountTar + flowVolumeTar) / 4;
  if (overallAvg < BAD_THRESHOLD) return "critical";
  if (overallAvg < GOOD_THRESHOLD) return "at_risk";
  return "on_track";
}

export function useActionInsights(recordDate?: string) {
  const queryClient = useQueryClient();
  const { data: targets, isLoading: targetsLoading } = usePortfolioTargets(recordDate);
  const { data: actions, isLoading: actionsLoading } = useActions();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: portfolioManager, isLoading: pmLoading } = usePortfolioManager();

  // Fetch all versions for the selected record date
  const versionsQuery = useQuery({
    queryKey: ["action-insight-versions", portfolioManager?.id, recordDate],
    queryFn: async () => {
      if (!portfolioManager || !recordDate) return [];
      
      const { data, error } = await supabase
        .from("ai_action_insights")
        .select("version, created_at")
        .eq("portfolio_manager_id", portfolioManager.id)
        .eq("record_date", recordDate)
        .order("version", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!portfolioManager && !!recordDate,
  });

  const fetchOrGenerateInsights = async (selectedVersion?: number): Promise<StoredActionInsights | null> => {
    if (!actions || !portfolioManager || !recordDate) return null;

    // Fetch existing insights for this date
    let query = supabase
      .from("ai_action_insights")
      .select("*")
      .eq("portfolio_manager_id", portfolioManager.id)
      .eq("record_date", recordDate);
    
    if (selectedVersion !== undefined) {
      query = query.eq("version", selectedVersion);
    } else {
      query = query.order("version", { ascending: false }).limit(1);
    }

    const { data: existingInsights, error: fetchError } = await query.single();

    if (existingInsights && !fetchError) {
      return {
        ...existingInsights,
        insights: existingInsights.insights as unknown as ActionInsight[],
        feedback: existingInsights.feedback as "like" | "dislike" | null,
      };
    }

    // No existing insights, generate new ones
    return await generateNewInsights(1);
  };

  const generateNewInsights = async (version: number): Promise<StoredActionInsights | null> => {
    if (!actions || !portfolioManager || !recordDate) return null;

    // Filter actions for the selected month
    const monthActions = actions.filter(action => {
      const actionDate = action.action_target_date;
      if (!actionDate) return false;
      const actionMonth = actionDate.substring(0, 7); // YYYY-MM
      return actionMonth === recordDate;
    });

    // Calculate product statuses from targets
    const productStatusMap = new Map<string, string>();
    const criticalProducts = new Set<string>();
    
    targets?.forEach(t => {
      const status = calculateProductStatus(
        Number(t.stock_count_tar) || 0,
        Number(t.stock_volume_tar) || 0,
        Number(t.flow_count_tar) || 0,
        Number(t.flow_volume_tar) || 0
      );
      productStatusMap.set(t.product_id, status);
      if (status === "critical" || status === "at_risk") {
        criticalProducts.add(t.product_id);
      }
    });

    // Build action summary
    const actionsByProduct = new Map<string, { productName: string; count: number; status: string }>();
    const actionsByCustomerStatus = new Map<string, number>();
    let nonPrimaryCustomerActions = 0;
    const criticalProductActions = new Map<string, { productName: string; count: number }>();

    monthActions.forEach(action => {
      // By product
      const productName = action.products?.name || "Unknown";
      const productStatus = productStatusMap.get(action.product_id) || "on_track";
      const existing = actionsByProduct.get(action.product_id);
      if (existing) {
        existing.count++;
      } else {
        actionsByProduct.set(action.product_id, { productName, count: 1, status: productStatus });
      }

      // Critical products
      if (criticalProducts.has(action.product_id)) {
        const cp = criticalProductActions.get(action.product_id);
        if (cp) {
          cp.count++;
        } else {
          criticalProductActions.set(action.product_id, { productName, count: 1 });
        }
      }

      // By customer status
      const customer = customers?.find(c => c.id === action.customer_id);
      if (customer) {
        const status = customer.status;
        actionsByCustomerStatus.set(status, (actionsByCustomerStatus.get(status) || 0) + 1);
        
        if (status !== "Ana Banka") {
          nonPrimaryCustomerActions++;
        }
      }
    });

    const actionSummary = {
      totalActions: monthActions.length,
      plannedActions: monthActions.filter(a => a.current_status === "Planlandı").length,
      pendingActions: monthActions.filter(a => a.current_status === "Beklemede").length,
      completedActions: monthActions.filter(a => a.current_status === "Tamamlandı").length,
      actionsByProduct: Array.from(actionsByProduct.values()),
      actionsByCustomerStatus: Array.from(actionsByCustomerStatus.entries()).map(([status, count]) => ({ status, count })),
      criticalProductActions: Array.from(criticalProductActions.values()),
      nonPrimaryCustomerActions,
      recordMonth: recordDate,
    };

    let insights: ActionInsight[];

    // If no actions at all, return a local insight
    if (monthActions.length === 0) {
      insights = [
        {
          type: "warning" as const,
          title: "Aksiyon Planlanmamış",
          message: "Seçilen dönem için henüz aksiyon planlanmamış.",
          detailedDescription: "Bu dönem için herhangi bir aksiyon oluşturulmamış. Portföy hedeflerine ulaşmak için aksiyon planlaması yapmanız önerilir.",
          category: "sufficiency" as const,
        },
      ];
    } else {
      const { data, error } = await supabase.functions.invoke("generate-action-insights", {
        body: { actionSummary },
      });

      if (error) {
        console.error("Error generating action insights:", error);
        throw error;
      }

      insights = (data?.insights || []) as ActionInsight[];
    }

    // Save to database
    const { data: savedInsights, error: saveError } = await supabase
      .from("ai_action_insights")
      .insert([{
        portfolio_manager_id: portfolioManager.id,
        record_date: recordDate,
        version,
        model_name: MODEL_NAME,
        insights: JSON.parse(JSON.stringify(insights)),
      }])
      .select()
      .single();

    if (saveError) {
      console.error("Error saving action insights:", saveError);
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

    // Invalidate versions query
    queryClient.invalidateQueries({ queryKey: ["action-insight-versions", portfolioManager.id, recordDate] });

    return {
      ...savedInsights,
      insights: savedInsights.insights as unknown as ActionInsight[],
      feedback: savedInsights.feedback as "like" | "dislike" | null,
    };
  };

  const query = useQuery({
    queryKey: ["action-insights", portfolioManager?.id, recordDate],
    queryFn: () => fetchOrGenerateInsights(),
    enabled: !targetsLoading && !actionsLoading && !customersLoading && !pmLoading && !!portfolioManager && !!recordDate,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const selectVersionMutation = useMutation({
    mutationFn: async (version: number) => {
      return fetchOrGenerateInsights(version);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["action-insights", portfolioManager?.id, recordDate], data);
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (!portfolioManager || !recordDate) {
        throw new Error("No data available");
      }

      const { data: latestInsights } = await supabase
        .from("ai_action_insights")
        .select("version")
        .eq("portfolio_manager_id", portfolioManager.id)
        .eq("record_date", recordDate)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      const newVersion = (latestInsights?.version || 0) + 1;

      return generateNewInsights(newVersion);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["action-insights", portfolioManager?.id, recordDate], data);
      toast.success("Action insights regenerated");
    },
    onError: (error) => {
      console.error("Error refreshing action insights:", error);
      toast.error("Failed to refresh action insights");
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async ({ insightId, feedback }: { insightId: string; feedback: "like" | "dislike" | null }) => {
      const { error } = await supabase
        .from("ai_action_insights")
        .update({ feedback })
        .eq("id", insightId);

      if (error) throw error;
      return feedback;
    },
    onSuccess: (feedback, { insightId }) => {
      queryClient.setQueryData(
        ["action-insights", portfolioManager?.id, recordDate],
        (old: StoredActionInsights | null) => {
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
    versions: versionsQuery.data || [],
    isLoadingVersions: versionsQuery.isLoading,
    selectVersion: selectVersionMutation.mutate,
    isSelectingVersion: selectVersionMutation.isPending,
    refreshInsights: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
    submitFeedback: feedbackMutation.mutate,
    isSubmittingFeedback: feedbackMutation.isPending,
  };
}
