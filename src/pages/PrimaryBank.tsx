import { useState, useMemo } from "react";
import { Package, CreditCard, Wallet, PiggyBank, Users, Factory, ArrowLeft, Banknote, Receipt, FileCheck, Shield, Cog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomers, SEGMENTS, SECTORS } from "@/hooks/useCustomers";
import { usePrimaryBankData } from "@/hooks/usePrimaryBankData";
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
}

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

  // Get customer IDs for primary bank data query
  const customerIds = useMemo(() => customers.map(c => c.id), [customers]);

  // Fetch primary bank data for share of wallet calculations
  const { data: primaryBankData, isLoading: isPrimaryBankLoading } = usePrimaryBankData({ 
    customerIds 
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalCustomers = customers.length;
    const primaryBankCustomers = customers.filter(c => c.status === "Ana Banka").length;
    const primaryBankPercentage = totalCustomers > 0 
      ? Math.round((primaryBankCustomers / totalCustomers) * 100) 
      : 0;

    return {
      totalCustomers,
      primaryBankCustomers,
      primaryBankPercentage,
    };
  }, [customers]);

  // Generate score axes with translations
  const axes = useMemo(() => {
    const baseScore = primaryBankData?.overallScore || 0;
    const variance = 15;
    
    const productsScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * variance * 2) - variance));
    const transactionalScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * variance * 2) - variance));
    const liabilitiesScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * variance * 2) - variance));
    const assetsScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * variance * 2) - variance));

    return [
      {
        name: t.primaryBank.productsAxis,
        icon: <Package className="h-5 w-5" />,
        score: productsScore,
        description: t.primaryBank.productsAxisDescription,
      },
      {
        name: t.primaryBank.transactionalAxis,
        icon: <CreditCard className="h-5 w-5" />,
        score: transactionalScore,
        description: t.primaryBank.transactionalAxisDescription,
      },
      {
        name: t.primaryBank.liabilitiesAxis,
        icon: <PiggyBank className="h-5 w-5" />,
        score: liabilitiesScore,
        description: t.primaryBank.liabilitiesAxisDescription,
      },
      {
        name: t.primaryBank.assetsAxis,
        icon: <Wallet className="h-5 w-5" />,
        score: assetsScore,
        description: t.primaryBank.assetsAxisDescription,
      },
    ];
  }, [primaryBankData?.overallScore, t]);

  const segmentLabel = selectedSegment === "all" ? t.primaryBank.allSegments : selectedSegment;
  const sectorLabel = selectedSector === "all" ? t.primaryBank.allSectors : selectedSector;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-6">
        <PageBreadcrumb items={[{ label: t.nav.primaryBank }]} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t.primaryBank.pageTitle}</h1>
              <p className="text-muted-foreground">{t.primaryBank.pageSubtitle}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/primary-bank/engine")}>
            <Cog className="mr-2 h-4 w-4" />
            {t.primaryBankEngine.title}
          </Button>
        </div>

        {/* Filters Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">{t.primaryBank.segment}</p>
                  <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.primaryBank.allSegments} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.primaryBank.allSegments}</SelectItem>
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
                  <p className="text-sm text-muted-foreground mb-1">{t.primaryBank.sector}</p>
                  <Select value={selectedSector} onValueChange={setSelectedSector}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.primaryBank.allSectors} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.primaryBank.allSectors}</SelectItem>
                      {SECTORS.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Score */}
        <Card>
          <CardHeader>
            <CardTitle>{t.primaryBank.principalityScore}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-4 mb-4">
              <span className="text-5xl font-bold text-primary">
                {isLoading || isPrimaryBankLoading ? "..." : `${primaryBankData?.overallScore || 0}%`}
              </span>
              <span className="text-muted-foreground">
                {segmentLabel} / {sectorLabel} {t.primaryBank.avgScoreDescription}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t.primaryBank.scoreExplanation}
            </p>
          </CardContent>
        </Card>

        {/* External Data Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">{t.primaryBank.externalDataTitle}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Banknote className="h-5 w-5" />
                <CardTitle className="text-sm font-medium">{t.primaryBank.loansTitle}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-bold">{isLoading || isPrimaryBankLoading ? "..." : `${primaryBankData?.loanShare || 0}%`}</p>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${getProgressColor(primaryBankData?.loanShare || 0)}`}
                  style={{ width: `${primaryBankData?.loanShare || 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-tight">{t.primaryBank.loansDescription}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Receipt className="h-5 w-5" />
                <CardTitle className="text-sm font-medium">{t.primaryBank.posTitle}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-bold">{isLoading || isPrimaryBankLoading ? "..." : `${primaryBankData?.posShare || 0}%`}</p>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${getProgressColor(primaryBankData?.posShare || 0)}`}
                  style={{ width: `${primaryBankData?.posShare || 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-tight">{t.primaryBank.posDescription}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileCheck className="h-5 w-5" />
                <CardTitle className="text-sm font-medium">{t.primaryBank.chequeTitle}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-bold">{isLoading || isPrimaryBankLoading ? "..." : `${primaryBankData?.chequeShare || 0}%`}</p>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${getProgressColor(primaryBankData?.chequeShare || 0)}`}
                  style={{ width: `${primaryBankData?.chequeShare || 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-tight">{t.primaryBank.chequeDescription}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-5 w-5" />
                <CardTitle className="text-sm font-medium">{t.primaryBank.collateralsTitle}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-bold">{isLoading || isPrimaryBankLoading ? "..." : `${primaryBankData?.collateralShare || 0}%`}</p>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${getProgressColor(primaryBankData?.collateralShare || 0)}`}
                  style={{ width: `${primaryBankData?.collateralShare || 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-tight">{t.primaryBank.collateralsDescription}</p>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Internal Data Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">{t.primaryBank.internalDataTitle}</h3>
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
              </CardContent>
            </Card>
          ))}
          </div>
        </div>

        {/* Explanation */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.primaryBank.bottomExplanation}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PrimaryBank;
