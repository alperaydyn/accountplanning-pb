import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, TrendingDown, Lightbulb, ChevronRight, ExternalLink, Loader2, RefreshCw, Sparkles, ThumbsUp, ThumbsDown, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInsights, Insight, StoredInsights } from "@/hooks/useInsights";
import { usePortfolioTargets } from "@/hooks/usePortfolioTargets";

interface InsightsPanelProps {
  recordDate?: string;
}

const statusColors: Record<string, string> = {
  on_track: "bg-success/10 text-success border-success/20",
  at_risk: "bg-warning/10 text-warning border-warning/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  melting: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  growing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  ticket_size: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  diversity: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
};

const statusLabels: Record<string, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  critical: "Critical",
  melting: "Melting",
  growing: "Growing",
  ticket_size: "Ticket Size ⚠",
  diversity: "Diversity ⚠",
};

export function InsightsPanel({ recordDate }: InsightsPanelProps) {
  const navigate = useNavigate();
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  
  const { 
    data: storedInsights, 
    isLoading, 
    error, 
    refreshInsights, 
    isRefreshing, 
    submitFeedback, 
    isSubmittingFeedback,
    versions,
    selectVersion,
    isSelectingVersion,
  } = useInsights(recordDate);
  const { data: targets } = usePortfolioTargets(recordDate);

  const insights = storedInsights?.insights || [];

  const getIconForType = (type: "critical" | "warning" | "info") => {
    switch (type) {
      case "critical": return AlertTriangle;
      case "warning": return TrendingDown;
      case "info": return Lightbulb;
    }
  };

  const getIconColor = (type: "critical" | "warning" | "info") => {
    switch (type) {
      case "critical": return "text-destructive";
      case "warning": return "text-warning";
      case "info": return "text-info";
    }
  };

  const getBgColor = (type: "critical" | "warning" | "info") => {
    switch (type) {
      case "critical": return "bg-destructive/5 border-destructive/20";
      case "warning": return "bg-warning/5 border-warning/20";
      case "info": return "bg-info/5 border-info/20";
    }
  };

  const handleProductClick = (productId: string) => {
    setSelectedInsight(null);
    navigate(`/customers?product=${productId}`);
  };

  const handleRefresh = () => {
    refreshInsights();
  };

  const handleFeedback = (feedback: "like" | "dislike") => {
    if (!storedInsights?.id) return;
    const newFeedback = storedInsights.feedback === feedback ? null : feedback;
    submitFeedback({ insightId: storedInsights.id, feedback: newFeedback });
  };

  const calculateStatus = (t: typeof targets extends (infer U)[] | undefined ? U : never) => {
    const stockCountTar = Number(t.stock_count_tar) || 0;
    const stockVolumeTar = Number(t.stock_volume_tar) || 0;
    const flowCountTar = Number(t.flow_count_tar) || 0;
    const flowVolumeTar = Number(t.flow_volume_tar) || 0;

    const stockAvg = (stockCountTar + stockVolumeTar) / 2;
    const flowAvg = (flowCountTar + flowVolumeTar) / 2;
    const countAvg = (stockCountTar + flowCountTar) / 2;
    const volumeAvg = (stockVolumeTar + flowVolumeTar) / 2;

    const stockOk = stockAvg >= 80;
    const flowOk = flowAvg >= 80;
    const countOk = countAvg >= 80;
    const volumeOk = volumeAvg >= 80;

    const overallAvg = (stockCountTar + stockVolumeTar + flowCountTar + flowVolumeTar) / 4;

    if (stockOk && !flowOk) return "melting";
    if (!stockOk && flowOk) return "growing";
    if (countOk && !volumeOk) return "ticket_size";
    if (!countOk && volumeOk) return "diversity";

    if (overallAvg < 50) return "critical";
    if (overallAvg < 80) return "at_risk";
    return "on_track";
  };

  const formatVersionTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("tr-TR", { 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (!recordDate) {
    return null;
  }

  if (isLoading || isRefreshing || isSelectingVersion) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>AI is analyzing product performance for {recordDate}...</span>
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load insights. Please try again later.</p>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Insights
            </CardTitle>
            {storedInsights && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs font-normal">
                  {storedInsights.model_name}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {recordDate}
                </span>
                {versions.length > 1 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-5 px-1.5 text-xs gap-0.5">
                        v{storedInsights.version}
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[140px]">
                      {versions.map((v) => (
                        <DropdownMenuItem
                          key={v.version}
                          onClick={() => selectVersion(v.version)}
                          className={v.version === storedInsights.version ? "bg-muted" : ""}
                        >
                          <span className="font-medium">v{v.version}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {formatVersionTime(v.created_at)}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className="text-xs text-muted-foreground">v{storedInsights.version}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleFeedback("like")}
              disabled={isSubmittingFeedback || !storedInsights?.id}
              className={`h-8 w-8 ${storedInsights?.feedback === "like" ? "text-success bg-success/10" : ""}`}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleFeedback("dislike")}
              disabled={isSubmittingFeedback || !storedInsights?.id}
              className={`h-8 w-8 ${storedInsights?.feedback === "dislike" ? "text-destructive bg-destructive/10" : ""}`}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.map((insight, index) => {
            const Icon = getIconForType(insight.type);
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getBgColor(insight.type)} cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md`}
                onClick={() => setSelectedInsight(insight)}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 ${getIconColor(insight.type)}`} />
                  <div className="flex-1">
                    <h4 className="font-medium text-card-foreground">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={!!selectedInsight} onOpenChange={() => setSelectedInsight(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedInsight && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = getIconForType(selectedInsight.type);
                    return <Icon className={`h-5 w-5 ${getIconColor(selectedInsight.type)}`} />;
                  })()}
                  {selectedInsight.title}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {selectedInsight.detailedDescription}
                </DialogDescription>
              </DialogHeader>

              {selectedInsight.products.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-foreground mb-3">İlgili Ürünler</h4>
                  <div className="space-y-2">
                    {selectedInsight.products.map((product, idx) => {
                      if (!product.id) {
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card"
                          >
                            <p className="font-medium text-foreground">{product.name}</p>
                          </div>
                        );
                      }
                      
                      const target = targets?.find((t) => t.product_id === product.id);
                      const status = target ? calculateStatus(target) : "at_risk";
                      
                      return (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleProductClick(product.id!)}
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium text-foreground">{product.name}</p>
                              {target && (
                                <p className="text-sm text-muted-foreground">
                                  Stock: {target.stock_count} • HGO: {Math.round((Number(target.stock_count_tar) + Number(target.stock_volume_tar) + Number(target.flow_count_tar) + Number(target.flow_volume_tar)) / 4)}%
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={statusColors[status]}>
                              {statusLabels[status]}
                            </Badge>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <ExternalLink className="h-4 w-4" />
                              Müşterileri Gör
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
