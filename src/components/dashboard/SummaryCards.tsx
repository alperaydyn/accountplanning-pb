import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Users, Building, ClipboardCheck, Target, Package, CreditCard, Wallet, PiggyBank, Factory, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePortfolioSummary } from "@/hooks/usePortfolioSummary";
import { useCustomers } from "@/hooks/useCustomers";

interface ScoreAxis {
  name: string;
  icon: React.ReactNode;
  score: number;
  description: string;
  volume: number;
}

const getProgressColor = (score: number) => {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-warning";
  return "bg-destructive";
};

export function SummaryCards() {
  const navigate = useNavigate();
  const { data: summary, isLoading } = usePortfolioSummary();
  const { data: customers = [] } = useCustomers();
  const [showScoreModal, setShowScoreModal] = useState(false);

  // Calculate customer breakdown by status from database
  const primaryCount = customers.filter(c => c.status === 'Ana Banka').length;
  const targetCount = customers.filter(c => c.status === 'Target' || c.status === 'Strong Target').length;
  const restCount = customers.length - primaryCount - targetCount;

  // Mock benchmark score
  const benchmarkScore = 47;
  const benchmarkMax = 60;

  // Generate portfolio-level score breakdown
  const totalVolume = 125000000; // Mock total portfolio volume
  const primaryBankScore = summary?.primaryBankScore ?? 0;
  const axes: ScoreAxis[] = [
    {
      name: "Products",
      icon: <Package className="h-4 w-4" />,
      score: Math.min(100, primaryBankScore + 5),
      description: "Share of loans, guarantees, insurance",
      volume: Math.floor(totalVolume * 0.35),
    },
    {
      name: "Transactional Services",
      icon: <CreditCard className="h-4 w-4" />,
      score: Math.min(100, primaryBankScore - 3),
      description: "Share of monthly payment volume",
      volume: Math.floor(totalVolume * 0.45),
    },
    {
      name: "Liabilities",
      icon: <PiggyBank className="h-4 w-4" />,
      score: Math.min(100, primaryBankScore + 8),
      description: "Share of deposits and other liabilities",
      volume: Math.floor(totalVolume * 0.25),
    },
    {
      name: "Assets / Share of Wallet",
      icon: <Wallet className="h-4 w-4" />,
      score: Math.min(100, primaryBankScore - 7),
      description: "Share of drawn short and long term debt",
      volume: Math.floor(totalVolume * 0.30),
    },
  ];

  const cards = [
    {
      title: "Primary Bank Score",
      value: isLoading ? "..." : `${summary?.primaryBankScore ?? 0}%`,
      icon: Building,
      onClick: () => setShowScoreModal(true),
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
      value: `${benchmarkScore}/${benchmarkMax}`,
      subtitle: "Portfolio benchmark",
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
    <>
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

      {/* Primary Bank Score Modal */}
      <Dialog open={showScoreModal} onOpenChange={setShowScoreModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Portfolio Principality Score Breakdown</DialogTitle>
          </DialogHeader>

          {/* Portfolio Info Header */}
          <div className="grid grid-cols-3 gap-4 py-4 border-b">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Customers</p>
                <p className="font-medium">{summary?.totalCustomers ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Factory className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Primary Bank</p>
                <p className="font-medium">{summary?.primaryBankCustomers ?? 0} customers</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Total Volume</p>
                <p className="font-medium">₺{totalVolume.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Main Score */}
          <div className="py-4">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl font-bold text-primary">{primaryBankScore}%</span>
              <span className="text-sm text-muted-foreground">
                Average principality score across your entire portfolio.
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              The Primary Bank Score measures how much of your customers' banking relationships are concentrated at our bank, calculated across four key axes:
            </p>
          </div>

          {/* Four Axes Breakdown */}
          <div className="grid grid-cols-4 gap-4 py-4">
            {axes.map((axis) => (
              <div key={axis.name} className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {axis.icon}
                  <span className="font-medium">{axis.name}</span>
                </div>
                <p className="text-2xl font-bold">{axis.score}%</p>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${getProgressColor(axis.score)}`}
                    style={{ width: `${axis.score}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground leading-tight">{axis.description}</p>
                <p className="text-sm font-medium">₺{axis.volume.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div className="py-4 border-t">
            <p className="text-xs text-muted-foreground leading-relaxed">
              These four axes aggregate data from all {summary?.totalCustomers ?? 0} customers in your portfolio. The overall Primary Bank Score of {primaryBankScore}% indicates the average depth of banking relationships. Focus on improving underperforming axes to increase wallet share and strengthen customer relationships.
            </p>
          </div>

          {/* OK Button */}
          <div className="flex justify-center pt-2">
            <Button onClick={() => setShowScoreModal(false)} className="px-8">
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
