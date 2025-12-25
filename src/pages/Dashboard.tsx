import { AppLayout } from "@/components/layout";
import { SummaryCards, ProductPerformanceTable, InsightsPanel, RepresentativeBadges } from "@/components/dashboard";
import { currentUser } from "@/data/portfolio";

const Dashboard = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header with Badges */}
        <div className="flex items-start justify-between gap-4">
          <div>
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
        <InsightsPanel />

        {/* Product Performance Table */}
        <ProductPerformanceTable />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
