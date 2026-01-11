import { Loader2, Building2, CreditCard, FileCheck, Shield, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const otherBanksLoan = totalLoan - ourBankLoan;
  const totalCollateral = collateral.reduce((sum, c) => sum + c.group1_amount + c.group2_amount + c.group3_amount + c.group4_amount, 0);
  const ourBankCollateral = collateral.filter(c => c.our_bank_flag).reduce((sum, c) => sum + c.group1_amount + c.group2_amount + c.group3_amount + c.group4_amount, 0);
  const otherBanksCollateral = totalCollateral - ourBankCollateral;

  // Group loans by bank
  const otherBankLoans = loanSummary.filter(l => !l.our_bank_flag);
  const ourBankLoans = loanSummary.filter(l => l.our_bank_flag);

  // Group collaterals by bank
  const otherBankCollaterals = collateral.filter(c => !c.our_bank_flag);

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
        </CardContent>
      </Card>

      {/* External Data Grid */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t.primaryBank.externalDataTitle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Loan Share */}
          <Card className={cn(!scores.hasLoanData && "opacity-50")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                {t.primaryBank.loansTitle}
                {scores.hasLoanData && <Badge variant="outline" className="ml-auto">40%</Badge>}
                {!scores.hasLoanData && <Badge variant="secondary" className="ml-auto">{t.common.noData}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scores.hasLoanData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{scores.loanShare}%</span>
                    {scores.loanShare >= 50 ? (
                      <TrendingUp className="h-5 w-5 text-success" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <Progress value={scores.loanShare} className="h-2" />
                  
                  {/* Bank breakdown table */}
                  <div className="mt-3 border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs">
                          <TableHead className="py-1 px-2">{t.primaryBankEngine.bankCode}</TableHead>
                          <TableHead className="py-1 px-2 text-right">{t.primaryBankEngine.cashLoan}</TableHead>
                          <TableHead className="py-1 px-2 text-right">{t.primaryBankEngine.nonCashLoan}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ourBankLoans.map((loan, idx) => (
                          <TableRow key={`our-${idx}`} className="text-xs bg-success/10">
                            <TableCell className="py-1 px-2 font-medium">{loan.bank_code} ★</TableCell>
                            <TableCell className="py-1 px-2 text-right">₺{loan.cash_loan.toLocaleString()}</TableCell>
                            <TableCell className="py-1 px-2 text-right">₺{loan.non_cash_loan.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        {otherBankLoans.map((loan, idx) => (
                          <TableRow key={`other-${idx}`} className="text-xs">
                            <TableCell className="py-1 px-2">{loan.bank_code}</TableCell>
                            <TableCell className="py-1 px-2 text-right">₺{loan.cash_loan.toLocaleString()}</TableCell>
                            <TableCell className="py-1 px-2 text-right">₺{loan.non_cash_loan.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>{t.primaryBankEngine.ourBankVolume}: ₺{ourBankLoan.toLocaleString()}</span>
                    <span>{t.customerDetail.otherBanks}: ₺{otherBanksLoan.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">{t.customerDetail.primaryBankNoData}</div>
              )}
            </CardContent>
          </Card>

          {/* POS Share */}
          <Card className={cn(!scores.hasPosData && "opacity-50")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-info" />
                {t.primaryBank.posTitle}
                {scores.hasPosData && <Badge variant="outline" className="ml-auto">30%</Badge>}
                {!scores.hasPosData && <Badge variant="secondary" className="ml-auto">{t.common.noData}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scores.hasPosData && posData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{scores.posShare}%</span>
                    {scores.posShare >= 50 ? (
                      <TrendingUp className="h-5 w-5 text-success" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <Progress value={scores.posShare} className="h-2" />
                  
                  {/* POS details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-success/10 rounded p-2">
                      <div className="text-muted-foreground">{t.primaryBankEngine.ourBankVolume}</div>
                      <div className="font-semibold">₺{posData.our_bank_pos_volume.toLocaleString()}</div>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <div className="text-muted-foreground">{t.customerDetail.otherBanks}</div>
                      <div className="font-semibold">₺{(posData.total_pos_volume - posData.our_bank_pos_volume).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t.primaryBankEngine.totalVolume}: ₺{posData.total_pos_volume.toLocaleString()}</span>
                    <span>{t.primaryBankEngine.bankCount}: {posData.number_of_banks}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">{t.customerDetail.primaryBankNoData}</div>
              )}
            </CardContent>
          </Card>

          {/* Cheque */}
          <Card className={cn(!scores.hasChequeData && "opacity-50")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-warning" />
                {t.primaryBank.chequeTitle}
                {scores.hasChequeData && <Badge variant="outline" className="ml-auto">20%</Badge>}
                {!scores.hasChequeData && <Badge variant="secondary" className="ml-auto">{t.common.noData}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scores.hasChequeData && chequeData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{scores.chequeActive ? "100%" : "0%"}</span>
                    {scores.chequeActive ? (
                      <Badge variant="outline" className="border-success text-success">{t.dashboard.onTrack}</Badge>
                    ) : (
                      <Badge variant="outline" className="border-muted text-muted-foreground">{t.customerDetail.noActivity}</Badge>
                    )}
                  </div>
                  <Progress value={scores.chequeActive ? 100 : 0} className="h-2" />
                  
                  {/* Cheque volume breakdown */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-muted rounded p-2 text-center">
                      <div className="text-muted-foreground">1M</div>
                      <div className="font-semibold">₺{chequeData.cheque_volume_1m.toLocaleString()}</div>
                    </div>
                    <div className="bg-muted rounded p-2 text-center">
                      <div className="text-muted-foreground">3M</div>
                      <div className="font-semibold">₺{chequeData.cheque_volume_3m.toLocaleString()}</div>
                    </div>
                    <div className="bg-muted rounded p-2 text-center">
                      <div className="text-muted-foreground">12M</div>
                      <div className="font-semibold">₺{chequeData.cheque_volume_12m.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">{t.customerDetail.primaryBankNoData}</div>
              )}
            </CardContent>
          </Card>

          {/* Collateral Share */}
          <Card className={cn(!scores.hasCollateralData && "opacity-50")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-destructive" />
                {t.primaryBank.collateralsTitle}
                {scores.hasCollateralData && <Badge variant="outline" className="ml-auto">10%</Badge>}
                {!scores.hasCollateralData && <Badge variant="secondary" className="ml-auto">{t.common.noData}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scores.hasCollateralData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{scores.collateralShare}%</span>
                    {scores.collateralShare >= 50 ? (
                      <TrendingUp className="h-5 w-5 text-success" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <Progress value={scores.collateralShare} className="h-2" />
                  
                  {/* Collateral breakdown table */}
                  <div className="mt-3 border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs">
                          <TableHead className="py-1 px-2">{t.primaryBankEngine.bankCode}</TableHead>
                          <TableHead className="py-1 px-2 text-right">{t.primaryBankEngine.totalVolume}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {collateral.filter(c => c.our_bank_flag).map((col, idx) => (
                          <TableRow key={`our-${idx}`} className="text-xs bg-success/10">
                            <TableCell className="py-1 px-2 font-medium">{col.bank_code} ★</TableCell>
                            <TableCell className="py-1 px-2 text-right">
                              ₺{(col.group1_amount + col.group2_amount + col.group3_amount + col.group4_amount).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        {otherBankCollaterals.map((col, idx) => (
                          <TableRow key={`other-${idx}`} className="text-xs">
                            <TableCell className="py-1 px-2">{col.bank_code}</TableCell>
                            <TableCell className="py-1 px-2 text-right">
                              ₺{(col.group1_amount + col.group2_amount + col.group3_amount + col.group4_amount).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>{t.primaryBankEngine.ourBankVolume}: ₺{ourBankCollateral.toLocaleString()}</span>
                    <span>{t.customerDetail.otherBanks}: ₺{otherBanksCollateral.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">{t.customerDetail.primaryBankNoData}</div>
              )}
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
