import { Loader2, Building2, CreditCard, FileCheck, Shield, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomerPrimaryBankData } from "@/hooks/useCustomerPrimaryBankData";
import { cn } from "@/lib/utils";

interface PrimaryBankPanelProps {
  customerId: string;
}

const getProgressColor = (score: number): string => {
  if (score >= 70) return "bg-success";
  if (score >= 40) return "bg-warning";
  return "bg-destructive";
};

export const PrimaryBankPanel = ({ customerId }: PrimaryBankPanelProps) => {
  const { t } = useLanguage();
  const { data, isLoading } = useCustomerPrimaryBankData(customerId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.hasData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t.customerDetail.primaryBankNoData}</p>
        </CardContent>
      </Card>
    );
  }

  const { loanSummary, posData, chequeData, collateral, scores } = data;

  // Calculate totals for display
  const totalLoan = loanSummary.reduce((sum, l) => sum + l.cash_loan + l.non_cash_loan, 0);
  const ourBankLoan = loanSummary.filter(l => l.our_bank_flag).reduce((sum, l) => sum + l.cash_loan + l.non_cash_loan, 0);
  const totalCollateral = collateral.reduce((sum, c) => sum + c.group1_amount + c.group2_amount + c.group3_amount + c.group4_amount, 0);
  const ourBankCollateral = collateral.filter(c => c.our_bank_flag).reduce((sum, c) => sum + c.group1_amount + c.group2_amount + c.group3_amount + c.group4_amount, 0);

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span>{t.customerDetail.primaryBankScore}</span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-lg font-bold px-3 py-1",
                scores.overallScore >= 70 ? "border-success text-success" :
                scores.overallScore >= 40 ? "border-warning text-warning" :
                "border-destructive text-destructive"
              )}
            >
              {scores.overallScore}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={scores.overallScore} className={cn("h-3", getProgressColor(scores.overallScore))} />
          <p className="text-xs text-muted-foreground mt-2">
            {t.customerDetail.primaryBankScoreFormula}
          </p>
        </CardContent>
      </Card>

      {/* External Data Grid */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t.primaryBank.externalDataTitle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Loan Share */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                {t.primaryBank.loansTitle}
                <Badge variant="outline" className="ml-auto">40%</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{scores.loanShare}%</span>
                  {scores.loanShare >= 50 ? (
                    <TrendingUp className="h-5 w-5 text-success" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <Progress value={scores.loanShare} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t.primaryBankEngine.ourBankVolume}: ₺{ourBankLoan.toLocaleString()}</span>
                  <span>{t.primaryBankEngine.totalVolume}: ₺{totalLoan.toLocaleString()}</span>
                </div>
                {loanSummary.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {t.primaryBankEngine.bankCount}: {loanSummary.length}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* POS Share */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-info" />
                {t.primaryBank.posTitle}
                <Badge variant="outline" className="ml-auto">30%</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{scores.posShare}%</span>
                  {scores.posShare >= 50 ? (
                    <TrendingUp className="h-5 w-5 text-success" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <Progress value={scores.posShare} className="h-2" />
                {posData ? (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t.primaryBankEngine.ourBankVolume}: ₺{posData.our_bank_pos_volume.toLocaleString()}</span>
                    <span>{t.primaryBankEngine.totalVolume}: ₺{posData.total_pos_volume.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">{t.customerDetail.primaryBankNoData}</div>
                )}
                {posData && (
                  <div className="text-xs text-muted-foreground">
                    {t.primaryBankEngine.bankCount}: {posData.number_of_banks}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cheque */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-warning" />
                {t.primaryBank.chequeTitle}
                <Badge variant="outline" className="ml-auto">20%</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{scores.chequeActive ? "100%" : "0%"}</span>
                  {scores.chequeActive ? (
                    <Badge variant="outline" className="border-success text-success">{t.dashboard.onTrack}</Badge>
                  ) : (
                    <Badge variant="outline" className="border-muted text-muted-foreground">{t.common.noData}</Badge>
                  )}
                </div>
                <Progress value={scores.chequeActive ? 100 : 0} className="h-2" />
                {chequeData ? (
                  <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                    <div>1M: ₺{chequeData.cheque_volume_1m.toLocaleString()}</div>
                    <div>3M: ₺{chequeData.cheque_volume_3m.toLocaleString()}</div>
                    <div>12M: ₺{chequeData.cheque_volume_12m.toLocaleString()}</div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">{t.customerDetail.primaryBankNoData}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Collateral Share */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-destructive" />
                {t.primaryBank.collateralsTitle}
                <Badge variant="outline" className="ml-auto">10%</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{scores.collateralShare}%</span>
                  {scores.collateralShare >= 50 ? (
                    <TrendingUp className="h-5 w-5 text-success" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <Progress value={scores.collateralShare} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t.primaryBankEngine.ourBankVolume}: ₺{ourBankCollateral.toLocaleString()}</span>
                  <span>{t.primaryBankEngine.totalVolume}: ₺{totalCollateral.toLocaleString()}</span>
                </div>
                {collateral.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {t.primaryBankEngine.bankCount}: {collateral.length}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Score Explanation */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            {t.primaryBank.scoreExplanation}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
