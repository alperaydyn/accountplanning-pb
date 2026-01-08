import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Users, Building, ClipboardCheck, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolioSummary } from "@/hooks/usePortfolioSummary";
import { useCustomers } from "@/hooks/useCustomers";
import { usePortfolioTargets } from "@/hooks/usePortfolioTargets";

interface SummaryCardsProps {
  recordDate?: string;
}

export function SummaryCards({ recordDate }: SummaryCardsProps) {
  const navigate = useNavigate();
  const { data: summary, isLoading } = usePortfolioSummary();
  const { data: customers = [] } = useCustomers();
  const { data: portfolioTargets = [] } = usePortfolioTargets(recordDate);

  // Calculate customer breakdown by status from database
  const primaryCount = customers.filter(c => c.status === 'Ana Banka').length;
  const targetCount = customers.filter(c => c.status === 'Target' || c.status === 'Strong Target').length;
  const restCount = customers.length - primaryCount - targetCount;

  // Calculate benchmark score from portfolio_targets HGO% >= 75%
  const benchmarkData = useMemo(() => {
    if (portfolioTargets.length === 0) return { score: 0, total: 0 };

    let hgoAbove75 = 0;
    let totalHgos = 0;

    portfolioTargets.forEach((target) => {
      // Stock Count HGO%
      if (target.stock_count_target > 0) {
        totalHgos++;
        const stockCountHgo = (target.stock_count / target.stock_count_target) * 100;
        if (stockCountHgo >= 75) hgoAbove75++;
      }
      // Stock Volume HGO%
      if (target.stock_volume_target > 0) {
        totalHgos++;
        const stockVolumeHgo = (target.stock_volume / target.stock_volume_target) * 100;
        if (stockVolumeHgo >= 75) hgoAbove75++;
      }
      // Flow Count HGO%
      if (target.flow_count_target > 0) {
        totalHgos++;
        const flowCountHgo = (target.flow_count / target.flow_count_target) * 100;
        if (flowCountHgo >= 75) hgoAbove75++;
      }
      // Flow Volume HGO%
      if (target.flow_volume_target > 0) {
        totalHgos++;
        const flowVolumeHgo = (target.flow_volume / target.flow_volume_target) * 100;
        if (flowVolumeHgo >= 75) hgoAbove75++;
      }
    });

    return { score: hgoAbove75, total: totalHgos };
  }, [portfolioTargets]);

  const cards = [
    {
      title: "Primary Bank Score",
      value: isLoading ? "..." : `${summary?.primaryBankScore ?? 0}%`,
      icon: Building,
      onClick: () => navigate("/primary-bank"),
    },
    {
      title: "Total Customers",
      value: isLoading ? "..." : (summary?.totalCustomers ?? 0),
      subtitle: `${primaryCount} Primary | ${targetCount} Target | ${restCount} Rest`,
      icon: Users,
      onClick: () => navigate("/customers"),
    },
    {
      title: "Benchmark Score",
      value: `${benchmarkData.score}/${benchmarkData.total}`,
      subtitle: `${benchmarkData.total > 0 ? Math.round((benchmarkData.score / benchmarkData.total) * 100) : 0}% HGO ≥ 75%`,
      icon: Target,
    },
    {
      title: "Actions",
      value: isLoading ? "..." : (summary?.totalActionsPlanned ?? 0),
      subtitle: `${summary?.totalActionsPlanned ?? 0} Planned | ${summary?.totalActionsPending ?? 0} Pending`,
      change: summary?.totalActionsCompleted ?? 0,
      changeLabel: "Completed",
      icon: ClipboardCheck,
      positive: true,
      onClick: () => navigate("/agenda"),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card 
          key={index} 
          className={`bg-card border-border ${card.onClick ? "cursor-pointer hover:border-primary/50 transition-colors" : ""}`}
          onClick={card.onClick}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{card.value}</div>
            {card.change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {card.positive ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className={`text-sm ${card.positive ? 'text-success' : 'text-destructive'}`}>
                  {card.positive ? '+' : ''}{card.change}%
                </span>
                <span className="text-sm text-muted-foreground">{card.changeLabel}</span>
              </div>
            )}
            {card.subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{card.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
