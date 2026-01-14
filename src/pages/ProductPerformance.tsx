import { useState, useMemo } from "react";
import { Calendar, TrendingUp, BarChart3, Target, ArrowUpRight } from "lucide-react";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { ProductPerformanceTable } from "@/components/dashboard";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePortfolioTargets } from "@/hooks/usePortfolioTargets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

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

type StatusFilter = 'all' | 'on_track' | 'at_risk' | 'critical';

const ProductPerformance = () => {
  const { t, language } = useLanguage();
  const dateOptions = useMemo(() => generateDateOptions(t.primaryBank.current), [t]);
  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].value);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  const { data: targets = [] } = usePortfolioTargets(selectedDate);
  
  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (targets.length === 0) return null;
    
    let onTrack = 0;
    let atRisk = 0;
    let critical = 0;
    let totalProducts = targets.length;
    
    targets.forEach(target => {
      const stockHgo = target.stock_count_target > 0 
        ? (target.stock_count / target.stock_count_target) * 100 
        : 0;
      
      if (stockHgo >= 80) onTrack++;
      else if (stockHgo >= 50) atRisk++;
      else critical++;
    });
    
    return { onTrack, atRisk, critical, totalProducts };
  }, [targets]);

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
                    className={`flex items-center gap-4 p-4 rounded-xl backdrop-blur-sm border transition-all duration-200 text-left ${
                      statusFilter === 'all' 
                        ? 'bg-primary/10 border-primary ring-2 ring-primary/20' 
                        : 'bg-card/80 border-border/50 hover:bg-card hover:border-border'
                    }`}
                  >
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
                  </button>

                  {/* On Track */}
                  <button
                    onClick={() => setStatusFilter('on_track')}
                    className={`flex items-center gap-4 p-4 rounded-xl backdrop-blur-sm border transition-all duration-200 text-left ${
                      statusFilter === 'on_track' 
                        ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/20' 
                        : 'bg-card/80 border-border/50 hover:bg-card hover:border-border'
                    }`}
                  >
                    <div className={`p-3 rounded-lg ${statusFilter === 'on_track' ? 'bg-emerald-500/20' : 'bg-emerald-500/10'}`}>
                      <TrendingUp className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-500">
                        {summaryStats?.onTrack || "-"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t.dashboard.onTrack}
                      </p>
                    </div>
                  </button>

                  {/* At Risk */}
                  <button
                    onClick={() => setStatusFilter('at_risk')}
                    className={`flex items-center gap-4 p-4 rounded-xl backdrop-blur-sm border transition-all duration-200 text-left ${
                      statusFilter === 'at_risk' 
                        ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/20' 
                        : 'bg-card/80 border-border/50 hover:bg-card hover:border-border'
                    }`}
                  >
                    <div className={`p-3 rounded-lg ${statusFilter === 'at_risk' ? 'bg-amber-500/20' : 'bg-amber-500/10'}`}>
                      <Target className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-500">
                        {summaryStats?.atRisk || "-"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t.dashboard.atRisk}
                      </p>
                    </div>
                  </button>

                  {/* Critical */}
                  <button
                    onClick={() => setStatusFilter('critical')}
                    className={`flex items-center gap-4 p-4 rounded-xl backdrop-blur-sm border transition-all duration-200 text-left ${
                      statusFilter === 'critical' 
                        ? 'bg-destructive/15 border-destructive ring-2 ring-destructive/20' 
                        : 'bg-card/80 border-border/50 hover:bg-card hover:border-border'
                    }`}
                  >
                    <div className={`p-3 rounded-lg ${statusFilter === 'critical' ? 'bg-destructive/20' : 'bg-destructive/10'}`}>
                      <ArrowUpRight className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">
                        {summaryStats?.critical || "-"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t.dashboard.critical}
                      </p>
                    </div>
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
