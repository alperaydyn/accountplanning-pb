import { TrendingUp, TrendingDown, Users, Building, ClipboardCheck, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPortfolioSummary } from "@/data/portfolio";

export function SummaryCards() {
  const summary = getPortfolioSummary();

  const cards = [
    {
      title: "Primary Bank Score",
      value: `${summary.primaryBankScore}%`,
      change: summary.primaryBankScoreYoY,
      changeLabel: "YoY",
      icon: Building,
      positive: summary.primaryBankScoreYoY > 0,
    },
    {
      title: "Total Customers",
      value: summary.totalCustomers,
      subtitle: `${summary.primaryBankCustomers} Primary | ${summary.nonPrimaryCustomers} Non-Primary`,
      icon: Users,
    },
    {
      title: "Actions Planned",
      value: summary.totalActionsPlanned,
      change: summary.totalActionsCompleted,
      changeLabel: "Completed",
      icon: ClipboardCheck,
      positive: true,
    },
    {
      title: "Pending Actions",
      value: summary.totalActionsPending,
      subtitle: "Awaiting response",
      icon: Clock,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="bg-card border-border">
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
