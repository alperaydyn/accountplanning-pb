import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, TrendingDown, Lightbulb, ChevronRight, ExternalLink, Loader2, RefreshCw, Sparkles, ThumbsUp, ThumbsDown, ChevronDown, ClipboardList, Target, Users, CheckCircle } from "lucide-react";
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
import { useActionInsights, ActionInsight, StoredActionInsights } from "@/hooks/useActionInsights";
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

const categoryIcons: Record<string, React.ElementType> = {
  sufficiency: Target,
  alignment: ClipboardList,
  balance: Users,
  quality: CheckCircle,
};

const categoryLabels: Record<string, string> = {
  sufficiency: "Yeterlilik",
  alignment: "Uyum",
  balance: "Denge",
  quality: "Kalite",
};

export function InsightsPanel({ recordDate }: InsightsPanelProps) {
  const navigate = useNavigate();
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [selectedActionInsight, setSelectedActionInsight] = useState<ActionInsight | null>(null);
  
  // Product Insights
  const { 
    data: storedInsights, 
    isLoading: isLoadingProduct, 
    error: productError, 
    refreshInsights: refreshProductInsights, 
    isRefreshing: isRefreshingProduct, 
    submitFeedback: submitProductFeedback, 
    isSubmittingFeedback: isSubmittingProductFeedback,
    versions: productVersions,
    selectVersion: selectProductVersion,
    isSelectingVersion: isSelectingProductVersion,
  } = useInsights(recordDate);

  // Action Insights
  const {
    data: storedActionInsights,
    isLoading: isLoadingAction,
    error: actionError,
    refreshInsights: refreshActionInsights,
    isRefreshing: isRefreshingAction,
    submitFeedback: submitActionFeedback,
    isSubmittingFeedback: isSubmittingActionFeedback,
    versions: actionVersions,
    selectVersion: selectActionVersion,
    isSelectingVersion: isSelectingActionVersion,
  } = useActionInsights(recordDate);

  const { data: targets } = usePortfolioTargets(recordDate);

  const insights = storedInsights?.insights || [];
  const actionInsights = storedActionInsights?.insights || [];

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

  const handleProductFeedback = (feedback: "like" | "dislike") => {
    if (!storedInsights?.id) return;
    const newFeedback = storedInsights.feedback === feedback ? null : feedback;
    submitProductFeedback({ insightId: storedInsights.id, feedback: newFeedback });
  };

  const handleActionFeedback = (feedback: "like" | "dislike") => {
    if (!storedActionInsights?.id) return;
    const newFeedback = storedActionInsights.feedback === feedback ? null : feedback;
    submitActionFeedback({ insightId: storedActionInsights.id, feedback: newFeedback });
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

  // Render loading skeleton for a panel
  const renderLoadingSkeleton = (title: string, icon: React.ReactNode) => (
    <Card className="bg-card border-border flex-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>AI is analyzing...</span>
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );

  // Render error state for a panel
  const renderError = (title: string, icon: React.ReactNode, onRetry: () => void) => (
    <Card className="bg-card border-border flex-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Failed to load insights.</p>
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );

  // Render version dropdown
  const renderVersionDropdown = (
    versions: { version: number; created_at: string }[],
    currentVersion: number,
    onSelect: (version: number) => void
  ) => {
    if (versions.length <= 1) {
      return <span className="text-xs text-muted-foreground">v{currentVersion}</span>;
    }
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-5 px-1.5 text-xs gap-0.5">
            v{currentVersion}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[140px]">
          {versions.map((v) => (
            <DropdownMenuItem
              key={v.version}
              onClick={() => onSelect(v.version)}
              className={v.version === currentVersion ? "bg-muted" : ""}
            >
              <span className="font-medium">v{v.version}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {formatVersionTime(v.created_at)}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Render action buttons (feedback + refresh)
  const renderActionButtons = (
    storedData: { id: string; feedback: "like" | "dislike" | null } | null | undefined,
    isSubmitting: boolean,
    isRefreshing: boolean,
    onFeedback: (feedback: "like" | "dislike") => void,
    onRefresh: () => void
  ) => (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onFeedback("like")}
        disabled={isSubmitting || !storedData?.id}
        className={`h-8 w-8 ${storedData?.feedback === "like" ? "text-success bg-success/10" : ""}`}
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onFeedback("dislike")}
        disabled={isSubmitting || !storedData?.id}
        className={`h-8 w-8 ${storedData?.feedback === "dislike" ? "text-destructive bg-destructive/10" : ""}`}
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="h-8 w-8"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product Insights - Left Side */}
        {(isLoadingProduct || isRefreshingProduct || isSelectingProductVersion) ? (
          renderLoadingSkeleton("Ürün Performansı", <Sparkles className="h-5 w-5 text-primary animate-pulse" />)
        ) : productError ? (
          renderError("Ürün Performansı", <Sparkles className="h-5 w-5 text-primary" />, refreshProductInsights)
        ) : insights.length === 0 ? (
          <Card className="bg-card border-border flex-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Ürün Performansı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Henüz içgörü yok.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border flex-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Ürün Performansı
                </CardTitle>
                {storedInsights && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs font-normal">
                      {storedInsights.model_name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{recordDate}</span>
                    {renderVersionDropdown(productVersions, storedInsights.version, selectProductVersion)}
                  </div>
                )}
              </div>
              {renderActionButtons(storedInsights, isSubmittingProductFeedback, isRefreshingProduct, handleProductFeedback, refreshProductInsights)}
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
        )}

        {/* Action Insights - Right Side */}
        {(isLoadingAction || isRefreshingAction || isSelectingActionVersion) ? (
          renderLoadingSkeleton("Aksiyon Kalitesi", <ClipboardList className="h-5 w-5 text-primary animate-pulse" />)
        ) : actionError ? (
          renderError("Aksiyon Kalitesi", <ClipboardList className="h-5 w-5 text-primary" />, refreshActionInsights)
        ) : actionInsights.length === 0 ? (
          <Card className="bg-card border-border flex-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Aksiyon Kalitesi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Henüz içgörü yok.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border flex-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Aksiyon Kalitesi
                </CardTitle>
                {storedActionInsights && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs font-normal">
                      {storedActionInsights.model_name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{recordDate}</span>
                    {renderVersionDropdown(actionVersions, storedActionInsights.version, selectActionVersion)}
                  </div>
                )}
              </div>
              {renderActionButtons(storedActionInsights, isSubmittingActionFeedback, isRefreshingAction, handleActionFeedback, refreshActionInsights)}
            </CardHeader>
            <CardContent className="space-y-3">
              {actionInsights.map((insight, index) => {
                const Icon = getIconForType(insight.type);
                const CategoryIcon = categoryIcons[insight.category] || Target;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getBgColor(insight.type)} cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md`}
                    onClick={() => setSelectedActionInsight(insight)}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${getIconColor(insight.type)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-card-foreground">{insight.title}</h4>
                          <Badge variant="outline" className="text-xs gap-1">
                            <CategoryIcon className="h-3 w-3" />
                            {categoryLabels[insight.category] || insight.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Product Insight Detail Dialog */}
      <Dialog open={!!selectedInsight} onOpenChange={() => setSelectedInsight(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-0">
          {selectedInsight && (() => {
            const Icon = getIconForType(selectedInsight.type);
            const gradientClass = selectedInsight.type === "critical" 
              ? "from-destructive/20 via-destructive/10 to-transparent" 
              : selectedInsight.type === "warning" 
                ? "from-warning/20 via-warning/10 to-transparent" 
                : "from-info/20 via-info/10 to-transparent";
            const borderClass = selectedInsight.type === "critical" 
              ? "border-l-destructive" 
              : selectedInsight.type === "warning" 
                ? "border-l-warning" 
                : "border-l-info";
            
            return (
              <>
                {/* Gradient Header */}
                <div className={`bg-gradient-to-b ${gradientClass} px-6 pt-6 pb-4`}>
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${getBgColor(selectedInsight.type)} border`}>
                        <Icon className={`h-5 w-5 ${getIconColor(selectedInsight.type)}`} />
                      </div>
                      <div className="flex-1">
                        <DialogTitle className="text-lg font-semibold text-foreground">
                          {selectedInsight.title}
                        </DialogTitle>
                        <Badge 
                          variant="outline" 
                          className={`mt-1.5 ${getBgColor(selectedInsight.type)} border font-medium`}
                        >
                          {selectedInsight.type === "critical" ? "Kritik" : selectedInsight.type === "warning" ? "Uyarı" : "Bilgi"}
                        </Badge>
                      </div>
                    </div>
                  </DialogHeader>
                </div>

                {/* Description Card */}
                <div className="px-6 py-4">
                  <DialogDescription asChild>
                    <div className={`p-4 rounded-lg bg-muted/30 border-l-4 ${borderClass}`}>
                      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                        {selectedInsight.detailedDescription}
                      </p>
                    </div>
                  </DialogDescription>
                </div>

                {/* Products Section */}
                {selectedInsight.products.length > 0 && (
                  <div className="px-6 pb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px flex-1 bg-border" />
                      <h4 className="text-sm font-medium text-muted-foreground px-2">İlgili Ürünler</h4>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="space-y-2">
                      {selectedInsight.products.map((product, idx) => {
                        if (!product.id) {
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3.5 rounded-xl border bg-card/50"
                            >
                              <p className="font-medium text-foreground">{product.name}</p>
                            </div>
                          );
                        }
                        
                        const target = targets?.find((t) => t.product_id === product.id);
                        const status = target ? calculateStatus(target) : "at_risk";
                        const hgoValue = target ? Math.round((Number(target.stock_count_tar) + Number(target.stock_volume_tar) + Number(target.flow_count_tar) + Number(target.flow_volume_tar)) / 4) : 0;
                        
                        return (
                          <div
                            key={product.id}
                            className="group flex items-center justify-between p-3.5 rounded-xl border bg-card/50 hover:bg-card hover:shadow-md cursor-pointer transition-all duration-200"
                            onClick={() => handleProductClick(product.id!)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-1.5 h-10 rounded-full ${
                                status === "on_track" ? "bg-success" : 
                                status === "critical" ? "bg-destructive" : 
                                "bg-warning"
                              }`} />
                              <div>
                                <p className="font-medium text-foreground">{product.name}</p>
                                {target && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">
                                      Stock: {target.stock_count}
                                    </span>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <span className={`text-xs font-medium ${
                                      hgoValue >= 80 ? "text-success" : 
                                      hgoValue >= 50 ? "text-warning" : 
                                      "text-destructive"
                                    }`}>
                                      HGO: {hgoValue}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`${statusColors[status]} text-xs`}>
                                {statusLabels[status]}
                              </Badge>
                              <Button variant="ghost" size="sm" className="gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span className="text-xs">Görüntüle</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Action Insight Detail Dialog */}
      <Dialog open={!!selectedActionInsight} onOpenChange={() => setSelectedActionInsight(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-0">
          {selectedActionInsight && (() => {
            const Icon = getIconForType(selectedActionInsight.type);
            const CategoryIcon = categoryIcons[selectedActionInsight.category] || Target;
            const gradientClass = selectedActionInsight.type === "critical" 
              ? "from-destructive/20 via-destructive/10 to-transparent" 
              : selectedActionInsight.type === "warning" 
                ? "from-warning/20 via-warning/10 to-transparent" 
                : "from-info/20 via-info/10 to-transparent";
            const borderClass = selectedActionInsight.type === "critical" 
              ? "border-l-destructive" 
              : selectedActionInsight.type === "warning" 
                ? "border-l-warning" 
                : "border-l-info";
            const categoryDescriptions: Record<string, string> = {
              sufficiency: "Planlanan aksiyonların hedeflere ulaşmak için yeterli olup olmadığını değerlendirir.",
              alignment: "Aksiyonların kritik ürünlerle uyumunu analiz eder.",
              balance: "Aksiyonların müşteri segmentleri arasındaki dağılımını inceler.",
              quality: "Aksiyon planlamasının genel kalitesini değerlendirir.",
            };
            
            return (
              <>
                {/* Gradient Header */}
                <div className={`bg-gradient-to-b ${gradientClass} px-6 pt-6 pb-4`}>
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${getBgColor(selectedActionInsight.type)} border`}>
                        <Icon className={`h-5 w-5 ${getIconColor(selectedActionInsight.type)}`} />
                      </div>
                      <div className="flex-1">
                        <DialogTitle className="text-lg font-semibold text-foreground">
                          {selectedActionInsight.title}
                        </DialogTitle>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge 
                            variant="outline" 
                            className={`${getBgColor(selectedActionInsight.type)} border font-medium`}
                          >
                            {selectedActionInsight.type === "critical" ? "Kritik" : selectedActionInsight.type === "warning" ? "Uyarı" : "Bilgi"}
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            <CategoryIcon className="h-3 w-3" />
                            {categoryLabels[selectedActionInsight.category] || selectedActionInsight.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </DialogHeader>
                </div>

                {/* Category Info Card */}
                <div className="px-6 pt-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CategoryIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {categoryLabels[selectedActionInsight.category] || selectedActionInsight.category} Analizi
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {categoryDescriptions[selectedActionInsight.category] || "Aksiyon kalitesi değerlendirmesi."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description Card */}
                <div className="px-6 py-4">
                  <DialogDescription asChild>
                    <div className={`p-4 rounded-lg bg-muted/30 border-l-4 ${borderClass}`}>
                      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                        {selectedActionInsight.detailedDescription}
                      </p>
                    </div>
                  </DialogDescription>
                </div>

                {/* Action Button */}
                <div className="px-6 pb-6">
                  <div className="h-px bg-border mb-4" />
                  <Button 
                    onClick={() => navigate("/agenda")}
                    className="w-full gap-2"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Aksiyon Ajandası'na Git
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
