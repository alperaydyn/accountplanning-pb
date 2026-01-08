import { useMemo } from "react";
import { 
  Users, 
  Factory, 
  Landmark, 
  Package, 
  CreditCard, 
  Wallet, 
  PiggyBank, 
  Store, 
  FileCheck, 
  Shield 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { usePortfolioSummary } from "@/hooks/usePortfolioSummary";
import { useCustomers } from "@/hooks/useCustomers";
import { useAllCustomerProducts } from "@/hooks/useAllCustomerProducts";
import { useProductThresholds } from "@/hooks/useProductThresholds";
import { useProducts } from "@/hooks/useProducts";

interface ScoreAxis {
  name: string;
  icon: React.ReactNode;
  score: number;
  description: string;
}

const getProgressColor = (score: number) => {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-warning";
  return "bg-destructive";
};

export default function PrimaryBank() {
  const { data: summary } = usePortfolioSummary();
  const { data: customers = [] } = useCustomers();
  const { data: customerProducts = [] } = useAllCustomerProducts();
  const { data: thresholds = [] } = useProductThresholds();
  const { data: products = [] } = useProducts();

  // Mock total portfolio volume
  const totalVolume = 125000000;

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

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageBreadcrumb items={[{ label: "Primary Bank" }]} />

        <div className="space-y-6">
          {/* Portfolio Info Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Portfolio Principality Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
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
              <div className="py-6">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-5xl font-bold text-primary">{primaryBankScore}%</span>
                  <span className="text-sm text-muted-foreground">
                    Average principality score across your entire portfolio.
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  The Primary Bank Score measures how much of your customers' banking relationships are concentrated at our bank, calculated across four key axes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* External Products Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">External Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {externalAxes.map((axis) => (
                  <div key={axis.name} className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground h-8">
                      {axis.icon}
                      <span className="font-medium">{axis.name}</span>
                    </div>
                    <p className="text-3xl font-bold">{axis.score}%</p>
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
            </CardContent>
          </Card>

          {/* Internal Products Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Internal Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {internalAxes.map((axis) => (
                  <div key={axis.name} className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground h-8">
                      {axis.icon}
                      <span className="font-medium">{axis.name}</span>
                    </div>
                    <p className="text-3xl font-bold">{axis.score}%</p>
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
            </CardContent>
          </Card>

          {/* Explanation */}
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                These four axes aggregate data from all {summary?.totalCustomers ?? 0} customers in your portfolio. The overall Primary Bank Score of {primaryBankScore}% indicates the average depth of banking relationships. Focus on improving underperforming axes to increase wallet share and strengthen customer relationships.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
