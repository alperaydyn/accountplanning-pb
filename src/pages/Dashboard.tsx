import { useState, useMemo } from "react";
import { Calendar, Sparkles } from "lucide-react";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { SummaryCards, InsightsPanel, DailyPlanPanel } from "@/components/dashboard";
import { usePortfolioManager } from "@/hooks/usePortfolioManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";

// Generate fixed date options
const generateDateOptions = (currentLabel: string) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  
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
  
  // 1. Current month (with "Current" label)
  addDate(currentYear, currentMonth, `(${currentLabel})`);
  
  // 2. Last 3 months
  for (let i = 1; i <= 3; i++) {
    const date = new Date(currentYear, currentMonth - 1 - i, 1);
    addDate(date.getFullYear(), date.getMonth() + 1);
  }
  
  // 3. Last 4 quarters' end months (going back from PREVIOUS quarter, not current)
  // Quarter end months: Q1=03, Q2=06, Q3=09, Q4=12
  const currentQuarter = Math.ceil(currentMonth / 3);
  for (let i = 1; i <= 4; i++) {  // Start from i=1 to skip current (unfinished) quarter
    let q = currentQuarter - i;
    let year = currentYear;
    while (q <= 0) {
      q += 4;
      year -= 1;
    }
    const quarterEndMonth = q * 3; // 3, 6, 9, or 12
    addDate(year, quarterEndMonth);
  }
  
  // 4. Last 2 year ends
  addDate(currentYear - 1, 12);
  addDate(currentYear - 2, 12);
  
  return options;
};

// Get greeting based on time of day
const getGreeting = (t: any) => {
  const hour = new Date().getHours();
  if (hour < 12) return t.dashboard.goodMorning || "Günaydın";
  if (hour < 18) return t.dashboard.goodAfternoon || "İyi günler";
  return t.dashboard.goodEvening || "İyi akşamlar";
};

const Dashboard = () => {
  const { t } = useLanguage();
  const dateOptions = useMemo(() => generateDateOptions(t.primaryBank.current), [t]);
  const { data: portfolioManager } = usePortfolioManager();
  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].value);
  
  const effectiveDate = selectedDate;

  // Get user's first name from portfolio_managers table
  const userName = portfolioManager?.name?.split(' ')[0] || 'User';
  const greeting = getGreeting(t);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Enhanced Page Header */}
        <div 
          data-demo-id="page-header"
          className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 p-6 border border-border/50"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <PageBreadcrumb items={[]} />
              </div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {greeting}, {userName}! 👋
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {t.dashboard.portfolioOverview}
              </p>
            </div>
            
            {/* Date Selector with enhanced styling */}
            <div 
              data-demo-id="date-selector"
              className="flex items-center gap-3 bg-background/80 backdrop-blur-sm border border-border rounded-xl px-4 py-2.5 shadow-sm"
            >
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <Select value={effectiveDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-[160px] border-0 bg-transparent h-auto p-0 focus:ring-0 font-medium">
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
        </div>

        {/* Summary Cards with staggered animation */}
        <div data-demo-id="summary-cards" className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <SummaryCards recordDate={effectiveDate} />
        </div>

        {/* Daily Plan Panel */}
        <div data-demo-id="daily-plan-panel" className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <DailyPlanPanel recordDate={effectiveDate} />
        </div>

        {/* AI Insights Panel */}
        <div data-demo-id="insights-panel" className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <InsightsPanel recordDate={effectiveDate} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
