import { useState, useMemo } from "react";
import { Calendar } from "lucide-react";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { SummaryCards, ProductPerformanceTable, InsightsPanel, RepresentativeBadges } from "@/components/dashboard";
import { usePortfolioManager } from "@/hooks/usePortfolioManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

// Generate fixed date options
const generateDateOptions = () => {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  
  // Current month
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  options.push({ value: currentMonth, label: `${currentMonth} (Current)` });
  
  // Last 3 months
  for (let i = 1; i <= 3; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    options.push({ value, label: value });
  }
  
  // Last 4 quarters (Q4, Q3, Q2, Q1 of current/previous years)
  const currentQuarter = Math.floor(now.getMonth() / 3);
  for (let i = 0; i < 4; i++) {
    let q = currentQuarter - i;
    let year = now.getFullYear();
    while (q < 0) {
      q += 4;
      year -= 1;
    }
    const quarterMonth = q * 3 + 3; // End of quarter month (3, 6, 9, 12)
    const value = `${year}-${String(quarterMonth).padStart(2, '0')}`;
    // Avoid duplicates
    if (!options.find(o => o.value === value)) {
      options.push({ value, label: `${year} Q${q + 1}` });
    }
  }
  
  // Last year end
  const lastYearEnd = `${now.getFullYear() - 1}-12`;
  if (!options.find(o => o.value === lastYearEnd)) {
    options.push({ value: lastYearEnd, label: `${now.getFullYear() - 1} Year End` });
  }
  
  return options;
};

const Dashboard = () => {
  const dateOptions = useMemo(() => generateDateOptions(), []);
  const { data: portfolioManager } = usePortfolioManager();
  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].value);
  const { t } = useLanguage();
  
  const effectiveDate = selectedDate;

  // Get user's first name from portfolio_managers table
  const userName = portfolioManager?.name?.split(' ')[0] || 'User';

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header with Badges and Date Selector */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <PageBreadcrumb items={[]} />
            <h1 className="text-2xl font-bold text-foreground">
              {t.dashboard.portfolioDashboard}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t.dashboard.welcomeBack}, {userName}. {t.dashboard.portfolioOverview}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Date Selector */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
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
            <RepresentativeBadges manager={portfolioManager} />
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards recordDate={effectiveDate} />

        {/* AI Insights Panel */}
        <InsightsPanel recordDate={effectiveDate} />

        {/* Product Performance Table */}
        <ProductPerformanceTable 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
