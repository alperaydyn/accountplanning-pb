import { useState } from "react";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { SummaryCards, ProductPerformanceTable, InsightsPanel, RepresentativeBadges } from "@/components/dashboard";
import { currentUser } from "@/data/portfolio";
import { useRecordDates } from "@/hooks/usePortfolioTargets";

const Dashboard = () => {
  const { data: recordDates = [] } = useRecordDates();
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  
  // Use first available date as default
  const effectiveDate = selectedDate || recordDates[0];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header with Badges */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <PageBreadcrumb items={[]} />
            <h1 className="text-2xl font-bold text-foreground">
              Portfolio Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {currentUser.name.split(' ')[0]}. Here's your portfolio overview.
            </p>
          </div>
          <RepresentativeBadges manager={currentUser} />
        </div>

        {/* Summary Cards */}
        <SummaryCards />

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
