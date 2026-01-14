import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrendingUp, TrendingDown, Users, Building, ClipboardCheck, Target, Package, CreditCard, Wallet, PiggyBank, Factory, Landmark, Store, FileCheck, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePortfolioSummary } from "@/hooks/usePortfolioSummary";
import { useCustomers } from "@/hooks/useCustomers";
import { useAllCustomerProducts } from "@/hooks/useAllCustomerProducts";
import { useProductThresholds } from "@/hooks/useProductThresholds";
import { useProducts } from "@/hooks/useProducts";
import { usePortfolioTargets } from "@/hooks/usePortfolioTargets";

interface ScoreAxis {
  name: string;
  icon: React.ReactNode;
  score: number;
  description: string;
}

interface SummaryCardsProps {
  recordDate?: string;
}

const getProgressColor = (score: number) => {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-warning";
  return "bg-destructive";
};

export function SummaryCards({ recordDate }: SummaryCardsProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: summary, isLoading } = usePortfolioSummary();
  const { data: customers = [] } = useCustomers();
  const { data: customerProducts = [] } = useAllCustomerProducts();
  const { data: thresholds = [] } = useProductThresholds();
  const { data: products = [] } = useProducts();
  const { data: portfolioTargets = [] } = usePortfolioTargets(recordDate);
  const [showScoreModal, setShowScoreModal] = useState(false);

  // Mock total portfolio volume
  const totalVolume = 125000000;

  // Calculate customer breakdown by status from database
  const primaryCount = customers.filter(c => c.status === 'Ana Banka').length;
  const strongTargetCount = customers.filter(c => c.status === 'Strong Target').length;
  const targetCount = customers.filter(c => c.status === 'Target').length;
  const activeCount = customers.filter(c => c.status === 'Aktif').length;
  const totalCustomerCount = customers.length;

  // Calculate Primary Bank Score as percentage of Primary Bank customers over total
  const primaryBankScorePercent = totalCustomerCount > 0 ? Math.round((primaryCount / totalCustomerCount) * 100) : 0;

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

  const primaryBankScore = summary?.primaryBankScore ?? 0;

  // Calculate external product scores
  const externalProductScores = useMemo(() => {
    if (customers.length === 0 || customerProducts.length === 0 || thresholds.length === 0 || products.length === 0) {
      return { kredi: 0, uyeIsyeri: 0, odemeNakdi: 0, teminat: 0 };
    }

    // Helper to find threshold for a customer/product combo
    const getThreshold = (customerId: string, productId: string) => {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return 0;
      const threshold = thresholds.find(
        t => t.product_id === productId && t.sector === customer.sector && t.segment === customer.segment && t.is_active
      );
      return threshold?.threshold_value ?? 0;
    };

    // Get product IDs by name
    const getProductIdByName = (name: string) => products.find(p => p.name === name)?.id;
    
    // Kredi products (category = 'Kredi')
    const krediProductIds = products.filter(p => p.category === 'Kredi').map(p => p.id);
    
    // Specific product IDs
    const uyeIsyeriId = getProductIdByName('Üye İşyeri');
    const odemeNakdiId = getProductIdByName('Ödeme Çeki');
    const teminatIds = products.filter(p => p.name.includes('Gayrinakdi')).map(p => p.id);

    // Calculate Kredi score: % of all Kredi products over threshold across all customers
    let krediOverThreshold = 0;
    let krediTotal = 0;
    customerProducts.forEach(cp => {
      if (krediProductIds.includes(cp.product_id)) {
        krediTotal++;
        const threshold = getThreshold(cp.customer_id, cp.product_id);
        if ((cp.current_value ?? 0) >= threshold && threshold > 0) {
          krediOverThreshold++;
        }
      }
    });
    const krediScore = krediTotal > 0 ? Math.round((krediOverThreshold / krediTotal) * 100) : 0;

    // Calculate single product score helper
    const calcProductScore = (productId: string | undefined) => {
      if (!productId) return 0;
      let overThreshold = 0;
      let total = 0;
      customerProducts.forEach(cp => {
        if (cp.product_id === productId) {
          total++;
          const threshold = getThreshold(cp.customer_id, cp.product_id);
          if ((cp.current_value ?? 0) >= threshold && threshold > 0) {
            overThreshold++;
          }
        }
      });
      return total > 0 ? Math.round((overThreshold / total) * 100) : 0;
    };

    // Calculate Teminat score (Gayrinakdi products)
    let teminatOverThreshold = 0;
    let teminatTotal = 0;
    customerProducts.forEach(cp => {
      if (teminatIds.includes(cp.product_id)) {
        teminatTotal++;
        const threshold = getThreshold(cp.customer_id, cp.product_id);
        if ((cp.current_value ?? 0) >= threshold && threshold > 0) {
          teminatOverThreshold++;
        }
      }
    });
    const teminatScore = teminatTotal > 0 ? Math.round((teminatOverThreshold / teminatTotal) * 100) : 0;

    return {
      kredi: krediScore,
      uyeIsyeri: calcProductScore(uyeIsyeriId),
      odemeNakdi: calcProductScore(odemeNakdiId),
      teminat: teminatScore,
    };
  }, [customers, customerProducts, thresholds, products]);

  // External products axes
  const externalAxes: ScoreAxis[] = [
    {
      name: "Kredi",
      icon: <CreditCard className="h-4 w-4" />,
      score: externalProductScores.kredi,
      description: "Nakdi + Gayrinakdi krediler",
    },
    {
      name: "Üye İşyeri",
      icon: <Store className="h-4 w-4" />,
      score: externalProductScores.uyeIsyeri,
      description: "POS cirosu payı",
    },
    {
      name: "Ödeme Çeki",
      icon: <FileCheck className="h-4 w-4" />,
      score: externalProductScores.odemeNakdi,
      description: "Çek ödeme hacmi",
    },
    {
      name: "Teminat",
      icon: <Shield className="h-4 w-4" />,
      score: externalProductScores.teminat,
      description: "Gayrinakdi teminatlar",
    },
  ];

  // Internal products axes
  const internalAxes: ScoreAxis[] = [
    {
      name: "Products",
      icon: <Package className="h-4 w-4" />,
      score: Math.min(100, primaryBankScore + 5),
      description: "Share of loans, guarantees, insurance",
    },
    {
      name: "Transactional Services",
      icon: <CreditCard className="h-4 w-4" />,
      score: Math.min(100, primaryBankScore - 3),
      description: "Share of monthly payment volume",
    },
    {
      name: "Liabilities",
      icon: <PiggyBank className="h-4 w-4" />,
      score: Math.min(100, primaryBankScore + 8),
      description: "Share of deposits and other liabilities",
    },
    {
      name: "Assets / Share of Wallet",
      icon: <Wallet className="h-4 w-4" />,
      score: Math.min(100, primaryBankScore - 7),
      description: "Share of drawn short and long term debt",
    },
  ];

  const cards = [
    {
      id: "benchmark-score",
      title: t.dashboard.benchmarkScore,
      value: `${benchmarkData.score}/${benchmarkData.total}`,
      subtitle: `${benchmarkData.total > 0 ? Math.round((benchmarkData.score / benchmarkData.total) * 100) : 0}% HGO ≥ 75%`,
      icon: Target,
    },
    {
      id: "scale-up-enterprise",
      title: t.dashboard.customerJourney,
      value: isLoading ? "..." : (summary?.totalCustomers ?? 0),
      customSubtitle: (
        <div className="flex items-center gap-2 mt-1">
          <div className="text-center">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap block">{t.customerStatusLabels.Aktif}</span>
            <span className="text-sm font-medium">{activeCount}</span>
          </div>
          <span className="text-muted-foreground">›</span>
          <div className="text-center">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap block">{t.customerStatusLabels.Target}</span>
            <span className="text-sm font-medium">{targetCount}</span>
          </div>
          <span className="text-muted-foreground">›</span>
          <div className="text-center">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap block">Strong</span>
            <span className="text-sm font-medium">{strongTargetCount}</span>
          </div>
          <span className="text-muted-foreground">›</span>
          <div className="text-center">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap block">{t.customerStatusLabels["Ana Banka"]}</span>
            <span className="text-sm font-medium">{primaryCount}</span>
          </div>
        </div>
      ),
      icon: Users,
      onClick: () => navigate("/customer-journey"),
    },
    {
      id: "primary-bank-score",
      title: t.dashboard.primaryBankScore,
      value: isLoading ? "..." : `${primaryBankScorePercent}%`,
      subtitle: isLoading ? undefined : `${primaryCount} / ${totalCustomerCount}`,
      icon: Building,
      onClick: () => navigate("/primary-bank"),
    },
    {
      id: "actions-card",
      title: t.common.actions,
      value: isLoading ? "..." : (summary?.totalActionsPlanned ?? 0),
      subtitle: `${summary?.totalActionsPlanned ?? 0} ${t.dashboard.planned} | ${summary?.totalActionsPending ?? 0} ${t.dashboard.pending}`,
      change: summary?.totalActionsCompleted ?? 0,
      changeLabel: t.dashboard.completed,
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
            key={card.id} 
            data-demo-id={card.id}
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
              {card.customSubtitle && card.customSubtitle}
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

          {/* External Products Section */}
          <div className="py-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-4">External Products</h4>
            <div className="grid grid-cols-4 gap-4">
              {externalAxes.map((axis) => (
                <div key={axis.name} className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground h-8">
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
                </div>
              ))}
            </div>
          </div>

          {/* Internal Products Section */}
          <div className="py-4 border-t">
            <h4 className="text-sm font-semibold text-muted-foreground mb-4">Internal Products</h4>
            <div className="grid grid-cols-4 gap-4">
              {internalAxes.map((axis) => (
                <div key={axis.name} className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground h-8">
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
                </div>
              ))}
            </div>
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
