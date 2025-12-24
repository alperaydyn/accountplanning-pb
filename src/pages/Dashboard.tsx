import { AppLayout } from "@/components/layout";
import { SummaryCards, ProductPerformanceTable, InsightsPanel } from "@/components/dashboard";
import { currentUser } from "@/data/portfolio";

const Dashboard = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Portfolio Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {currentUser.name.split(' ')[0]}. Here's your portfolio overview.
          </p>
        </div>

        {/* Summary Cards */}
        <SummaryCards />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Product Performance - Takes 2 columns */}
          <div className="xl:col-span-2">
            <ProductPerformanceTable />
          </div>

          {/* Insights Panel - Takes 1 column */}
          <div className="xl:col-span-1">
            <InsightsPanel />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
