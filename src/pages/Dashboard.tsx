import { useState } from "react";
import { Calendar } from "lucide-react";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { SummaryCards, ProductPerformanceTable, InsightsPanel, RepresentativeBadges } from "@/components/dashboard";
import { useRecordDates } from "@/hooks/usePortfolioTargets";
import { usePortfolioManager } from "@/hooks/usePortfolioManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Dashboard = () => {
  const { data: recordDates = [] } = useRecordDates();
  const { data: portfolioManager } = usePortfolioManager();
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  
  // Use first available date as default
  const effectiveDate = selectedDate || recordDates[0];

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
              Portfolio Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {userName}. Here's your portfolio overview.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Date Selector */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={effectiveDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-[140px] border-0 bg-transparent h-auto p-0 focus:ring-0">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {recordDates.map((date) => (
                    <SelectItem key={date} value={date}>
                      {date}
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
