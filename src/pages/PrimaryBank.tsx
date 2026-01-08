import { useState, useMemo } from "react";
import { Package, CreditCard, Wallet, PiggyBank, Users, Factory, Landmark, ArrowLeft, Percent } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomers, SEGMENTS, SECTORS } from "@/hooks/useCustomers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScoreAxis {
  name: string;
  icon: React.ReactNode;
  score: number;
  description: string;
  volume: number;
}

const generateScoreBreakdown = (avgScore: number, customerCount: number): ScoreAxis[] => {
  const baseScore = avgScore;
  const variance = 15;
  const baseVolume = customerCount * 500000;
  
  const productsScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * variance * 2) - variance));
  const transactionalScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * variance * 2) - variance));
  const liabilitiesScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * variance * 2) - variance));
  const assetsScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * variance * 2) - variance));

  return [
    {
      name: "Products",
      icon: <Package className="h-5 w-5" />,
      score: productsScore,
      description: "Share of loans, guarantees, insurance",
      volume: Math.floor(baseVolume * 0.35),
    },
    {
      name: "Transactional Services",
      icon: <CreditCard className="h-5 w-5" />,
      score: transactionalScore,
      description: "Share of monthly payment volume",
      volume: Math.floor(baseVolume * 0.45),
    },
    {
      name: "Liabilities",
      icon: <PiggyBank className="h-5 w-5" />,
      score: liabilitiesScore,
      description: "Share of deposits and other liabilities",
      volume: Math.floor(baseVolume * 0.25),
    },
    {
      name: "Assets / Share of Wallet",
      icon: <Wallet className="h-5 w-5" />,
      score: assetsScore,
      description: "Share of drawn short and long term debt",
      volume: Math.floor(baseVolume * 0.30),
    },
  ];
};

const getProgressColor = (score: number) => {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-warning";
  return "bg-destructive";
};

const PrimaryBank = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [selectedSegment, setSelectedSegment] = useState<string>("all");
  const [selectedSector, setSelectedSector] = useState<string>("all");

  // Fetch customers with filters
  const { data: customers = [], isLoading } = useCustomers({
    segment: selectedSegment === "all" ? undefined : selectedSegment as any,
    sector: selectedSector === "all" ? undefined : selectedSector as any,
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalCustomers = customers.length;
    const primaryBankCustomers = customers.filter(c => c.status === "Ana Banka").length;
    const primaryBankPercentage = totalCustomers > 0 
      ? Math.round((primaryBankCustomers / totalCustomers) * 100) 
      : 0;
    const avgPrincipalityScore = totalCustomers > 0
      ? Math.round(customers.reduce((sum, c) => sum + (c.principality_score || 0), 0) / totalCustomers)
      : 0;

    return {
      totalCustomers,
      primaryBankCustomers,
      primaryBankPercentage,
      avgPrincipalityScore,
    };
  }, [customers]);

  const axes = useMemo(() => 
    generateScoreBreakdown(metrics.avgPrincipalityScore, metrics.totalCustomers),
    [metrics.avgPrincipalityScore, metrics.totalCustomers]
  );

  const segmentLabel = selectedSegment === "all" ? "All Segments" : selectedSegment;
  const sectorLabel = selectedSector === "all" ? "All Sectors" : selectedSector;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-6">
        <PageBreadcrumb items={[{ label: t.nav.primaryBank }]} />

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Primary Bank Score</h1>
            <p className="text-muted-foreground">Portfolio Overview</p>
          </div>
        </div>

        {/* Filters and Info Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Segment</p>
                  <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Segments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Segments</SelectItem>
                      {SEGMENTS.map((segment) => (
                        <SelectItem key={segment} value={segment}>
                          {segment}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Factory className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Sector</p>
                  <Select value={selectedSector} onValueChange={setSelectedSector}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Sectors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sectors</SelectItem>
                      {SECTORS.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Percent className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Primary Bank %</p>
                  <p className="font-semibold">
                    {isLoading ? "..." : `${metrics.primaryBankPercentage}% (${metrics.primaryBankCustomers}/${metrics.totalCustomers})`}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Score */}
        <Card>
          <CardHeader>
            <CardTitle>Principality Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-4 mb-4">
              <span className="text-5xl font-bold text-primary">
                {isLoading ? "..." : `${metrics.avgPrincipalityScore}%`}
              </span>
              <span className="text-muted-foreground">
                Average principality score across {segmentLabel} / {sectorLabel}.
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Principality Score is a metric that quantifies how much of the banking relationship is concentrated 
              at our bank by measuring performance across four axes.
            </p>
          </CardContent>
        </Card>

        {/* Four Axes Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {axes.map((axis) => (
            <Card key={axis.name}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {axis.icon}
                  <CardTitle className="text-sm font-medium">{axis.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-3xl font-bold">{isLoading ? "..." : `${axis.score}%`}</p>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${getProgressColor(axis.score)}`}
                    style={{ width: `${axis.score}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground leading-tight">{axis.description}</p>
                <p className="text-lg font-semibold">₺{axis.volume.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Explanation */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The four axes (Products, Transactional Services, Liabilities, and Assets) measure how much of 
              the portfolio's financial activity is captured by our bank. The Principality Score aggregates 
              these axes to determine how central our bank is as the main bank, providing a score from 0-100 
              that indicates the extent of the banking relationship concentrated at our institution.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PrimaryBank;
