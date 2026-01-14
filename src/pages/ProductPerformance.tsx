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
type StatusFilter = 'all' | ProductStatus;

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  const { data: targets = [] } = usePortfolioTargets(selectedDate);
  
  // Calculate summary stats with correct status logic
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
    
    // Base category counts
    const onTrackTotal = counts.on_track;
    const atRiskTotal = counts.at_risk + counts.melting + counts.growing;
    const criticalTotal = counts.critical + counts.ticket_size + counts.diversity;
    
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
    bgClass: string;
    borderClass: string;
    description: string;
  }> = {
    on_track: { 
      label: t.dashboard.onTrack, 
      icon: CheckCircle,
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-500/10 hover:bg-emerald-500/20",
      borderClass: "border-emerald-500/30",
      description: language === "tr" ? "Hedef gerçekleşme oranı ≥80%" : "Target achievement ≥80%"
    },
    at_risk: { 
      label: t.dashboard.atRisk, 
      icon: Target,
      colorClass: "text-amber-600",
      bgClass: "bg-amber-500/10 hover:bg-amber-500/20",
      borderClass: "border-amber-500/30",
      description: language === "tr" ? "Hedef gerçekleşme oranı 50-79%" : "Target achievement 50-79%"
    },
    critical: { 
      label: t.dashboard.critical, 
      icon: AlertTriangle,
      colorClass: "text-destructive",
      bgClass: "bg-destructive/10 hover:bg-destructive/20",
      borderClass: "border-destructive/30",
      description: language === "tr" ? "Hedef gerçekleşme oranı <50%" : "Target achievement <50%"
    },
    melting: { 
      label: t.dashboard.melting, 
      icon: TrendingUp,
      colorClass: "text-orange-600",
      bgClass: "bg-orange-500/10 hover:bg-orange-500/20",
      borderClass: "border-orange-500/30",
      description: language === "tr" ? "Stok yüksek, akış düşük" : "High stock, low flow"
    },
    growing: { 
      label: t.dashboard.growing, 
      icon: Zap,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-500/10 hover:bg-blue-500/20",
      borderClass: "border-blue-500/30",
      description: language === "tr" ? "Akış yüksek, stok düşük" : "High flow, low stock"
    },
    ticket_size: { 
      label: t.dashboard.ticketSize, 
      icon: Receipt,
      colorClass: "text-purple-600",
      bgClass: "bg-purple-500/10 hover:bg-purple-500/20",
      borderClass: "border-purple-500/30",
      description: language === "tr" ? "Müşteri sayısı yüksek, hacim düşük" : "High count, low volume"
    },
    diversity: { 
      label: t.dashboard.diversity, 
      icon: Users,
      colorClass: "text-cyan-600",
      bgClass: "bg-cyan-500/10 hover:bg-cyan-500/20",
      borderClass: "border-cyan-500/30",
      description: language === "tr" ? "Hacim yüksek, müşteri sayısı düşük" : "High volume, low count"
    },
  };

  const handleFilterClick = (status: StatusFilter) => {
    setStatusFilter(prev => prev === status ? 'all' : status);
  };

  const StatusChip = ({ 
    status, 
    count,
    showIcon = true 
  }: { 
    status: ProductStatus; 
    count: number;
    showIcon?: boolean;
  }) => {
    if (count === 0) return null;
    
    const config = statusConfig[status];
    const Icon = config.icon;
    const isSelected = statusFilter === status;
    
    return (
      <button
        onClick={() => handleFilterClick(status)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
          config.bgClass,
          config.colorClass,
          isSelected ? `ring-2 ring-offset-1 ${config.borderClass} ring-current/30` : config.borderClass
        )}
      >
        {showIcon && <Icon className="w-3.5 h-3.5" />}
        <span>{config.label}</span>
        <span className="font-bold">({count})</span>
      </button>
    );
  };

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

        {/* Hero Panel - Redesigned */}
        <Card className="border-border overflow-hidden">
          <CardContent className="p-0">
            {/* Main Stats Row */}
            <div className="bg-gradient-to-br from-muted/30 via-background to-muted/50 p-6">
              <div className="grid grid-cols-4 gap-4">
                {/* Total Products */}
                <button
                  onClick={() => handleFilterClick('all')}
                  className={cn(
                    "relative flex items-center gap-4 p-5 rounded-xl border transition-all duration-200",
                    statusFilter === 'all' 
                      ? "bg-primary/10 border-primary shadow-lg shadow-primary/10" 
                      : "bg-card/60 border-border/50 hover:bg-card hover:border-border hover:shadow-md"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-xl transition-colors",
                    statusFilter === 'all' ? "bg-primary/20" : "bg-primary/10"
                  )}>
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-3xl font-bold text-foreground">
                      {summaryStats?.totalProducts || "-"}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                      {language === "tr" ? "Toplam Ürün" : "Total Products"}
                    </p>
                  </div>
                </button>

                {/* On Track */}
                <button
                  onClick={() => handleFilterClick('on_track')}
                  className={cn(
                    "relative flex items-center gap-4 p-5 rounded-xl border transition-all duration-200",
                    statusFilter === 'on_track' 
                      ? "bg-emerald-500/15 border-emerald-500 shadow-lg shadow-emerald-500/10" 
                      : "bg-card/60 border-border/50 hover:bg-card hover:border-border hover:shadow-md"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-xl transition-colors",
                    statusFilter === 'on_track' ? "bg-emerald-500/25" : "bg-emerald-500/10"
                  )}>
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-3xl font-bold text-emerald-500">
                      {summaryStats?.onTrackTotal ?? "-"}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                      {t.dashboard.onTrack}
                    </p>
                  </div>
                </button>

                {/* At Risk */}
                <button
                  onClick={() => handleFilterClick('at_risk')}
                  className={cn(
                    "relative flex items-center gap-4 p-5 rounded-xl border transition-all duration-200",
                    statusFilter === 'at_risk' 
                      ? "bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10" 
                      : "bg-card/60 border-border/50 hover:bg-card hover:border-border hover:shadow-md"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-xl transition-colors",
                    statusFilter === 'at_risk' ? "bg-amber-500/25" : "bg-amber-500/10"
                  )}>
                    <Target className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-3xl font-bold text-amber-500">
                      {summaryStats?.atRiskTotal ?? "-"}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                      {t.dashboard.atRisk}
                    </p>
                  </div>
                </button>

                {/* Critical */}
                <button
                  onClick={() => handleFilterClick('critical')}
                  className={cn(
                    "relative flex items-center gap-4 p-5 rounded-xl border transition-all duration-200",
                    statusFilter === 'critical' 
                      ? "bg-destructive/15 border-destructive shadow-lg shadow-destructive/10" 
                      : "bg-card/60 border-border/50 hover:bg-card hover:border-border hover:shadow-md"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-xl transition-colors",
                    statusFilter === 'critical' ? "bg-destructive/25" : "bg-destructive/10"
                  )}>
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                  <div className="text-left">
                    <p className="text-3xl font-bold text-destructive">
                      {summaryStats?.criticalTotal ?? "-"}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                      {t.dashboard.critical}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Detailed Status Chips */}
            <div className="px-6 py-4 border-t border-border bg-card/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-medium mr-2">
                    {language === "tr" ? "Detaylı Durum:" : "Detailed Status:"}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {summaryStats && (
                      <>
                        <StatusChip status="on_track" count={summaryStats.counts.on_track} />
                        <div className="w-px h-4 bg-border mx-1" />
                        <StatusChip status="at_risk" count={summaryStats.counts.at_risk} />
                        <StatusChip status="melting" count={summaryStats.counts.melting} />
                        <StatusChip status="growing" count={summaryStats.counts.growing} />
                        <div className="w-px h-4 bg-border mx-1" />
                        <StatusChip status="critical" count={summaryStats.counts.critical} />
                        <StatusChip status="ticket_size" count={summaryStats.counts.ticket_size} />
                        <StatusChip status="diversity" count={summaryStats.counts.diversity} />
                      </>
                    )}
                  </div>
                </div>
                
                {/* Active Filter Indicator */}
                {statusFilter !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                    className="text-muted-foreground hover:text-foreground gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    {language === "tr" ? "Filtreyi Temizle" : "Clear Filter"}
                  </Button>
                )}
              </div>
              
              {/* Filter Description */}
              {statusFilter !== 'all' && (
                <div className="mt-3 flex items-center gap-2 text-sm animate-fade-in">
                  <Badge variant="outline" className={cn("gap-1.5", statusConfig[statusFilter].colorClass, statusConfig[statusFilter].bgClass)}>
                    {(() => {
                      const Icon = statusConfig[statusFilter].icon;
                      return <Icon className="w-3.5 h-3.5" />;
                    })()}
                    {statusConfig[statusFilter].label}
                  </Badge>
                  <span className="text-muted-foreground">
                    — {statusConfig[statusFilter].description}
                  </span>
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
            statusFilter={statusFilter}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default ProductPerformance;