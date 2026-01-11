import { useState, useMemo } from "react";
import { Calendar } from "lucide-react";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { SummaryCards, ProductPerformanceTable, InsightsPanel } from "@/components/dashboard";
import { usePortfolioManager } from "@/hooks/usePortfolioManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

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

const Dashboard = () => {
  const { t } = useLanguage();
  const dateOptions = useMemo(() => generateDateOptions(t.primaryBank.current), [t]);
  const { data: portfolioManager } = usePortfolioManager();
  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].value);
  
  const effectiveDate = selectedDate;

  // Get user's first name from portfolio_managers table
  const userName = portfolioManager?.name?.split(' ')[0] || 'User';

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header with Badges and Date Selector */}
        <div 
          data-demo-id="page-header"
          className="flex items-start justify-between gap-4"
        >
          <div>
            <PageBreadcrumb items={[]} />
            <h1 className="text-2xl font-bold text-foreground">
              {t.dashboard.portfolioDashboard}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t.dashboard.welcomeBack}, {userName}. {t.dashboard.portfolioOverview}
            </p>
          </div>
          {/* Date Selector */}
          <div 
            data-demo-id="date-selector"
            className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2"
          >
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={effectiveDate} onValueChange={setSelectedDate}>
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

        {/* Summary Cards */}
        <div data-demo-id="summary-cards">
          <SummaryCards recordDate={effectiveDate} />
        </div>

        {/* AI Insights Panel */}
        <div data-demo-id="insights-panel">
          <InsightsPanel recordDate={effectiveDate} />
        </div>

        {/* Product Performance Table */}
        <div data-demo-id="product-table">
          <ProductPerformanceTable 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
