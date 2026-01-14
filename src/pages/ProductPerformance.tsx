import { useState, useMemo } from "react";
import { Calendar, TrendingUp, BarChart3, Target, AlertTriangle, CheckCircle, Zap, Users, Receipt, X } from "lucide-react";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { ProductPerformanceTable } from "@/components/dashboard";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePortfolioTargets } from "@/hooks/usePortfolioTargets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Generate fixed date options
const generateDateOptions = (currentLabel: string) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const dateSet = new Set<string>();
  const options: { value: string; label: string }[] = [];
  
  const addDate = (year: number, month: number, labelSuffix?: string) => {
    const value = `${year}-${String(month).padStart(2, '0')}`;
    if (!dateSet.has(value)) {
      dateSet.add(value);
      const label = labelSuffix ? `${value} ${labelSuffix}` : value;
      options.push({ value, label });
    }
  };
  
  addDate(currentYear, currentMonth, `(${currentLabel})`);
  
  for (let i = 1; i <= 3; i++) {
    const date = new Date(currentYear, currentMonth - 1 - i, 1);
    addDate(date.getFullYear(), date.getMonth() + 1);
  }
  
  const currentQuarter = Math.ceil(currentMonth / 3);
  for (let i = 1; i <= 4; i++) {
    let q = currentQuarter - i;
    let year = currentYear;
    while (q <= 0) {
      q += 4;
      year -= 1;
    }
    const quarterEndMonth = q * 3;
    addDate(year, quarterEndMonth);
  }
  
  addDate(currentYear - 1, 12);
  addDate(currentYear - 2, 12);
  
  return options;
};

type ProductStatus = 'on_track' | 'at_risk' | 'critical' | 'melting' | 'growing' | 'ticket_size' | 'diversity';
type BaseStatus = 'on_track' | 'at_risk' | 'critical';

// Status to base category mapping
// Yolunda: {Yolunda, Büyüyen, Çeşitlilik}
// Riskli: {Riskli, Eriyen, Bilet Büyüklüğü}
// Kritik: {Kritik}
const statusToBaseCategory: Record<ProductStatus, BaseStatus> = {
  on_track: 'on_track',
  growing: 'on_track',
  diversity: 'on_track',
  at_risk: 'at_risk',
  melting: 'at_risk',
  ticket_size: 'at_risk',
  critical: 'critical',
};

// Detail statuses under each base category
const baseToDetailStatuses: Record<BaseStatus, ProductStatus[]> = {
  on_track: ['on_track', 'growing', 'diversity'],
  at_risk: ['at_risk', 'melting', 'ticket_size'],
  critical: ['critical'],
};

// Same logic as ProductPerformanceTable
const getProductStatus = (target: { 
  stock_count_tar: number; 
  stock_volume_tar: number; 
  flow_count_tar: number; 
  flow_volume_tar: number; 
}): ProductStatus => {
  const stockCountTar = Number(target.stock_count_tar) || 0;
  const stockVolumeTar = Number(target.stock_volume_tar) || 0;
  const flowCountTar = Number(target.flow_count_tar) || 0;
  const flowVolumeTar = Number(target.flow_volume_tar) || 0;
  
  const GOOD_THRESHOLD = 80;
  const BAD_THRESHOLD = 50;
  
  const stockAvg = (stockCountTar + stockVolumeTar) / 2;
  const flowAvg = (flowCountTar + flowVolumeTar) / 2;
  const countAvg = (stockCountTar + flowCountTar) / 2;
  const volumeAvg = (stockVolumeTar + flowVolumeTar) / 2;
  
  const stockOk = stockAvg >= GOOD_THRESHOLD;
  const flowOk = flowAvg >= GOOD_THRESHOLD;
  const countOk = countAvg >= GOOD_THRESHOLD;
  const volumeOk = volumeAvg >= GOOD_THRESHOLD;
  
  const overallAvg = (stockCountTar + stockVolumeTar + flowCountTar + flowVolumeTar) / 4;
  
  if (stockOk && !flowOk) return 'melting';
  if (!stockOk && flowOk) return 'growing';
  if (countOk && !volumeOk) return 'ticket_size';
  if (!countOk && volumeOk) return 'diversity';
  
  if (overallAvg < BAD_THRESHOLD) return 'critical';
  if (overallAvg < GOOD_THRESHOLD) return 'at_risk';
  return 'on_track';
};

const ProductPerformance = () => {
  const { t, language } = useLanguage();
  const dateOptions = useMemo(() => generateDateOptions(t.primaryBank.current), [t]);
  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].value);
  const [activeBaseStatus, setActiveBaseStatus] = useState<BaseStatus | null>(null);
  const [selectedDetailStatuses, setSelectedDetailStatuses] = useState<Set<ProductStatus>>(new Set());
  
  const { data: targets = [] } = usePortfolioTargets(selectedDate);
  
  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (targets.length === 0) return null;
    
    const counts: Record<ProductStatus, number> = {
      on_track: 0,
      at_risk: 0,
      critical: 0,
      melting: 0,
      growing: 0,
      ticket_size: 0,
      diversity: 0,
    };
    
    targets.forEach(target => {
      const status = getProductStatus(target);
      counts[status]++;
    });
    
    // Yolunda: on_track + growing + diversity
    const onTrackTotal = counts.on_track + counts.growing + counts.diversity;
    // Riskli: at_risk + melting + ticket_size
    const atRiskTotal = counts.at_risk + counts.melting + counts.ticket_size;
    // Kritik: critical only
    const criticalTotal = counts.critical;
    
    return { 
      counts,
      onTrackTotal,
      atRiskTotal,
      criticalTotal,
      totalProducts: targets.length 
    };
  }, [targets]);

  const statusConfig: Record<ProductStatus, { 
    label: string; 
    icon: React.ElementType;
    colorClass: string;
  }> = {
    on_track: { 
      label: t.dashboard.onTrack, 
      icon: CheckCircle,
      colorClass: "text-emerald-600",
    },
    at_risk: { 
      label: t.dashboard.atRisk, 
      icon: Target,
      colorClass: "text-amber-600",
    },
    critical: { 
      label: t.dashboard.critical, 
      icon: AlertTriangle,
      colorClass: "text-destructive",
    },
    melting: { 
      label: t.dashboard.melting, 
      icon: TrendingUp,
      colorClass: "text-orange-600",
    },
    growing: { 
      label: t.dashboard.growing, 
      icon: Zap,
      colorClass: "text-blue-600",
    },
    ticket_size: { 
      label: t.dashboard.ticketSize, 
      icon: Receipt,
      colorClass: "text-purple-600",
    },
    diversity: { 
      label: t.dashboard.diversity, 
      icon: Users,
      colorClass: "text-cyan-600",
    },
  };

  const handleBaseStatusClick = (baseStatus: BaseStatus) => {
    if (activeBaseStatus === baseStatus) {
      // Toggle off - clear everything
      setActiveBaseStatus(null);
      setSelectedDetailStatuses(new Set());
    } else {
      // Select new base status and auto-select all its detail statuses
      setActiveBaseStatus(baseStatus);
      setSelectedDetailStatuses(new Set(baseToDetailStatuses[baseStatus]));
    }
  };

  const handleClearFilter = () => {
    setActiveBaseStatus(null);
    setSelectedDetailStatuses(new Set());
  };

  const handleDetailStatusToggle = (status: ProductStatus) => {
    setSelectedDetailStatuses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  // Build filter for table - convert to format table expects
  const tableStatusFilter = useMemo(() => {
    if (selectedDetailStatuses.size === 0) return 'all';
    return Array.from(selectedDetailStatuses);
  }, [selectedDetailStatuses]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <PageBreadcrumb items={[{ label: t.nav.productPerformance }]} />
            <h1 className="text-2xl font-bold text-foreground">
              {t.nav.productPerformance}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === "tr" 
                ? "Ürün bazlı performans metrikleri ve hedef gerçekleşme oranları" 
                : "Product-based performance metrics and target achievement rates"}
            </p>
          </div>
          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-[160px] border-0 bg-transparent h-auto p-0 focus:ring-0">
                <SelectValue placeholder={t.dashboard.selectDate} />
              </SelectTrigger>
              <SelectContent>
                {dateOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Hero Panel */}
        <Card className="border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-muted/30 via-background to-muted/50 p-6">
              <div className="grid grid-cols-4 gap-4">
                {/* Total Products */}
                <button
                  onClick={handleClearFilter}
                  className={cn(
                    "relative flex flex-col p-4 rounded-xl border transition-all duration-200",
                    activeBaseStatus === null 
                      ? "bg-primary/10 border-primary shadow-lg shadow-primary/10" 
                      : "bg-card/60 border-border/50 hover:bg-card hover:border-border hover:shadow-md"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-lg transition-colors",
                      activeBaseStatus === null ? "bg-primary/20" : "bg-primary/10"
                    )}>
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-foreground">
                        {summaryStats?.totalProducts || "-"}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {language === "tr" ? "Toplam" : "Total"}
                      </p>
                    </div>
                  </div>
                </button>

                {/* On Track */}
                <div className="flex flex-col">
                  <button
                    onClick={() => handleBaseStatusClick('on_track')}
                    className={cn(
                      "relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-200",
                      activeBaseStatus === 'on_track' 
                        ? "bg-emerald-500/15 border-emerald-500 shadow-lg shadow-emerald-500/10 rounded-b-none" 
                        : "bg-card/60 border-border/50 hover:bg-card hover:border-border hover:shadow-md"
                    )}
                  >
                    <div className={cn(
                      "p-2.5 rounded-lg transition-colors",
                      activeBaseStatus === 'on_track' ? "bg-emerald-500/25" : "bg-emerald-500/10"
                    )}>
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-emerald-500">
                        {summaryStats?.onTrackTotal ?? "-"}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {t.dashboard.onTrack}
                      </p>
                    </div>
                  </button>
                  {activeBaseStatus === 'on_track' && summaryStats && (
                    <div className="bg-emerald-500/10 border border-t-0 border-emerald-500/30 rounded-b-xl px-3 py-2 animate-fade-in">
                      <div className="flex flex-wrap gap-1.5">
                        {baseToDetailStatuses.on_track.map(status => {
                          const count = summaryStats.counts[status];
                          if (count === 0) return null;
                          const isChecked = selectedDetailStatuses.has(status);
                          return (
                            <label
                              key={status}
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-all",
                                isChecked 
                                  ? "bg-emerald-500/30 text-emerald-700" 
                                  : "bg-emerald-500/10 text-emerald-600/70 hover:bg-emerald-500/20"
                              )}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => handleDetailStatusToggle(status)}
                                className="h-3 w-3 border-emerald-500/50"
                              />
                              {statusConfig[status].label} ({count})
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* At Risk */}
                <div className="flex flex-col">
                  <button
                    onClick={() => handleBaseStatusClick('at_risk')}
                    className={cn(
                      "relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-200",
                      activeBaseStatus === 'at_risk' 
                        ? "bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10 rounded-b-none" 
                        : "bg-card/60 border-border/50 hover:bg-card hover:border-border hover:shadow-md"
                    )}
                  >
                    <div className={cn(
                      "p-2.5 rounded-lg transition-colors",
                      activeBaseStatus === 'at_risk' ? "bg-amber-500/25" : "bg-amber-500/10"
                    )}>
                      <Target className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-amber-500">
                        {summaryStats?.atRiskTotal ?? "-"}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {t.dashboard.atRisk}
                      </p>
                    </div>
                  </button>
                  {activeBaseStatus === 'at_risk' && summaryStats && (
                    <div className="bg-amber-500/10 border border-t-0 border-amber-500/30 rounded-b-xl px-3 py-2 animate-fade-in">
                      <div className="flex flex-wrap gap-1.5">
                        {baseToDetailStatuses.at_risk.map(status => {
                          const count = summaryStats.counts[status];
                          if (count === 0) return null;
                          const isChecked = selectedDetailStatuses.has(status);
                          const Icon = statusConfig[status].icon;
                          return (
                            <label
                              key={status}
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-all",
                                isChecked 
                                  ? "bg-amber-500/30 text-amber-700" 
                                  : "bg-amber-500/10 text-amber-600/70 hover:bg-amber-500/20"
                              )}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => handleDetailStatusToggle(status)}
                                className="h-3 w-3 border-amber-500/50"
                              />
                              <Icon className="w-3 h-3" />
                              {statusConfig[status].label} ({count})
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Critical */}
                <div className="flex flex-col">
                  <button
                    onClick={() => handleBaseStatusClick('critical')}
                    className={cn(
                      "relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-200",
                      activeBaseStatus === 'critical' 
                        ? "bg-destructive/15 border-destructive shadow-lg shadow-destructive/10 rounded-b-none" 
                        : "bg-card/60 border-border/50 hover:bg-card hover:border-border hover:shadow-md"
                    )}
                  >
                    <div className={cn(
                      "p-2.5 rounded-lg transition-colors",
                      activeBaseStatus === 'critical' ? "bg-destructive/25" : "bg-destructive/10"
                    )}>
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-destructive">
                        {summaryStats?.criticalTotal ?? "-"}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {t.dashboard.critical}
                      </p>
                    </div>
                  </button>
                  {activeBaseStatus === 'critical' && summaryStats && (
                    <div className="bg-destructive/10 border border-t-0 border-destructive/30 rounded-b-xl px-3 py-2 animate-fade-in">
                      <div className="flex flex-wrap gap-1.5">
                        {baseToDetailStatuses.critical.map(status => {
                          const count = summaryStats.counts[status];
                          if (count === 0) return null;
                          const isChecked = selectedDetailStatuses.has(status);
                          const Icon = statusConfig[status].icon;
                          return (
                            <label
                              key={status}
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-all",
                                isChecked 
                                  ? "bg-destructive/30 text-destructive" 
                                  : "bg-destructive/10 text-destructive/70 hover:bg-destructive/20"
                              )}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => handleDetailStatusToggle(status)}
                                className="h-3 w-3 border-destructive/50"
                              />
                              <Icon className="w-3 h-3" />
                              {statusConfig[status].label} ({count})
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Filter Indicator */}
              {selectedDetailStatuses.size > 0 && (
                <div className="mt-4 flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="gap-1">
                      {language === "tr" ? "Filtre:" : "Filter:"}
                      {Array.from(selectedDetailStatuses).map(s => statusConfig[s].label).join(', ')}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilter}
                    className="text-muted-foreground hover:text-foreground gap-1 h-7"
                  >
                    <X className="w-3 h-3" />
                    {language === "tr" ? "Temizle" : "Clear"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Performance Table */}
        <div data-demo-id="product-table">
          <ProductPerformanceTable 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            statusFilter={tableStatusFilter}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default ProductPerformance;