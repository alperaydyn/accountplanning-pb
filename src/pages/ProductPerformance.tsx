import { useState, useMemo } from "react";
import { Calendar, TrendingUp, BarChart3, Target, ArrowUpRight } from "lucide-react";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { ProductPerformanceTable } from "@/components/dashboard";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePortfolioTargets } from "@/hooks/usePortfolioTargets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
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

const getBaseStatus = (status: ProductStatus): 'on_track' | 'at_risk' | 'critical' => {
  if (status === 'on_track') return 'on_track';
  if (status === 'at_risk' || status === 'melting' || status === 'growing') return 'at_risk';
  return 'critical';
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

  const statusLabels: Record<ProductStatus, string> = {
    on_track: t.dashboard.onTrack,
    at_risk: t.dashboard.atRisk,
    critical: t.dashboard.critical,
    melting: t.dashboard.melting,
    growing: t.dashboard.growing,
    ticket_size: t.dashboard.ticketSize,
    diversity: t.dashboard.diversity,
  };

  const DetailedStatusLabel = ({ 
    status, 
    count 
  }: { 
    status: ProductStatus; 
    count: number;
  }) => {
    if (count === 0) return null;
    
    const isSelected = statusFilter === status;
    
    const colorClasses: Record<ProductStatus, string> = {
      on_track: "text-emerald-600 hover:bg-emerald-500/10",
      at_risk: "text-amber-600 hover:bg-amber-500/10",
      critical: "text-destructive hover:bg-destructive/10",
      melting: "text-orange-600 hover:bg-orange-500/10",
      growing: "text-blue-600 hover:bg-blue-500/10",
      ticket_size: "text-purple-600 hover:bg-purple-500/10",
      diversity: "text-cyan-600 hover:bg-cyan-500/10",
    };
    
    const selectedClasses: Record<ProductStatus, string> = {
      on_track: "bg-emerald-500/20 ring-1 ring-emerald-500/30",
      at_risk: "bg-amber-500/20 ring-1 ring-amber-500/30",
      critical: "bg-destructive/20 ring-1 ring-destructive/30",
      melting: "bg-orange-500/20 ring-1 ring-orange-500/30",
      growing: "bg-blue-500/20 ring-1 ring-blue-500/30",
      ticket_size: "bg-purple-500/20 ring-1 ring-purple-500/30",
      diversity: "bg-cyan-500/20 ring-1 ring-cyan-500/30",
    };
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setStatusFilter(isSelected ? 'all' : status);
        }}
        className={cn(
          "text-xs px-2 py-0.5 rounded-full transition-all cursor-pointer",
          colorClasses[status],
          isSelected && selectedClasses[status]
        )}
      >
        {statusLabels[status]} ({count})
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

        {/* Hero Panel */}
        <Card className="border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="relative bg-gradient-to-br from-muted/50 to-muted py-8 px-6">
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Total Products */}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`flex flex-col gap-3 p-4 rounded-xl backdrop-blur-sm border transition-all duration-200 text-left ${
                      statusFilter === 'all' 
                        ? 'bg-primary/10 border-primary ring-2 ring-primary/20' 
                        : 'bg-card/80 border-border/50 hover:bg-card hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${statusFilter === 'all' ? 'bg-primary/20' : 'bg-primary/10'}`}>
                        <BarChart3 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {summaryStats?.totalProducts || "-"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === "tr" ? "Toplam Ürün" : "Total Products"}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* On Track */}
                  <button
                    onClick={() => setStatusFilter('on_track')}
                    className={`flex flex-col gap-3 p-4 rounded-xl backdrop-blur-sm border transition-all duration-200 text-left ${
                      statusFilter === 'on_track' 
                        ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/20' 
                        : 'bg-card/80 border-border/50 hover:bg-card hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${statusFilter === 'on_track' ? 'bg-emerald-500/20' : 'bg-emerald-500/10'}`}>
                        <TrendingUp className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-emerald-500">
                          {summaryStats?.onTrackTotal || "-"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t.dashboard.onTrack}
                        </p>
                      </div>
                    </div>
                    {/* Detailed status - only on_track here */}
                    {summaryStats && summaryStats.counts.on_track > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        <DetailedStatusLabel status="on_track" count={summaryStats.counts.on_track} />
                      </div>
                    )}
                  </button>

                  {/* At Risk */}
                  <button
                    onClick={() => setStatusFilter('at_risk')}
                    className={`flex flex-col gap-3 p-4 rounded-xl backdrop-blur-sm border transition-all duration-200 text-left ${
                      statusFilter === 'at_risk' 
                        ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/20' 
                        : 'bg-card/80 border-border/50 hover:bg-card hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${statusFilter === 'at_risk' ? 'bg-amber-500/20' : 'bg-amber-500/10'}`}>
                        <Target className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-amber-500">
                          {summaryStats?.atRiskTotal || "-"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t.dashboard.atRisk}
                        </p>
                      </div>
                    </div>
                    {/* Detailed statuses */}
                    {summaryStats && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        <DetailedStatusLabel status="at_risk" count={summaryStats.counts.at_risk} />
                        <DetailedStatusLabel status="melting" count={summaryStats.counts.melting} />
                        <DetailedStatusLabel status="growing" count={summaryStats.counts.growing} />
                      </div>
                    )}
                  </button>

                  {/* Critical */}
                  <button
                    onClick={() => setStatusFilter('critical')}
                    className={`flex flex-col gap-3 p-4 rounded-xl backdrop-blur-sm border transition-all duration-200 text-left ${
                      statusFilter === 'critical' 
                        ? 'bg-destructive/15 border-destructive ring-2 ring-destructive/20' 
                        : 'bg-card/80 border-border/50 hover:bg-card hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${statusFilter === 'critical' ? 'bg-destructive/20' : 'bg-destructive/10'}`}>
                        <ArrowUpRight className="w-6 h-6 text-destructive" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-destructive">
                          {summaryStats?.criticalTotal || "-"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t.dashboard.critical}
                        </p>
                      </div>
                    </div>
                    {/* Detailed statuses */}
                    {summaryStats && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        <DetailedStatusLabel status="critical" count={summaryStats.counts.critical} />
                        <DetailedStatusLabel status="ticket_size" count={summaryStats.counts.ticket_size} />
                        <DetailedStatusLabel status="diversity" count={summaryStats.counts.diversity} />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">{t.dashboard.onTrack} (≥80% HGO)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">{t.dashboard.atRisk} (50-79% HGO)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">{t.dashboard.critical} (&lt;50% HGO)</span>
                </div>
              </div>
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