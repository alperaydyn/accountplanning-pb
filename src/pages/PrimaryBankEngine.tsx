import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, RotateCcw, Check, Loader2, AlertCircle, Trash2, Database } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { usePortfolioManager } from "@/hooks/usePortfolioManager";
import { useCustomers } from "@/hooks/useCustomers";
import { format } from "date-fns";

interface GeneratedData {
  loan_summary: any[];
  loan_detail: any[];
  pos_data: any | null;
  cheque_data: any | null;
  collateral_data: any[];
}

interface CustomerResult {
  customerId: string;
  customerName: string;
  status: "pending" | "processing" | "success" | "error" | "existing" | "skipped";
  data?: GeneratedData;
  error?: string;
  hasExistingData?: boolean;
}

const LOAN_CATEGORY = "Kredi" as const;

// NOTE: These IDs are placeholders (kept for now). Loan detection is done via category=Kredi.
const POS_PRODUCT_ID = "prod-11"; // POS Giro
const CHEQUE_PRODUCT_ID = "prod-12"; // Cheque
const COLLATERAL_PRODUCT_IDS = ["prod-15", "prod-16", "prod-17"]; // Collateral products

export default function PrimaryBankEngine() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { data: portfolioManager } = usePortfolioManager();
  const { data: customers = [] } = useCustomers();

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [recordMonth] = useState(format(new Date(), "yyyy-MM"));
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [existingCustomerIds, setExistingCustomerIds] = useState<Set<string>>(new Set());
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState<string | null>(null);

  // Fetch existing customers with primary bank data
  const fetchExistingCustomers = useCallback(async () => {
    setIsLoadingExisting(true);
    try {
      const { data } = await supabase
        .from("primary_bank_loan_summary")
        .select("customer_id")
        .eq("record_month", recordMonth);
      
      const uniqueIds = new Set(data?.map(d => d.customer_id) || []);
      setExistingCustomerIds(uniqueIds);
      
      // Initialize results with all customers
      const initialResults: CustomerResult[] = customers.map(c => ({
        customerId: c.id,
        customerName: c.name,
        status: uniqueIds.has(c.id) ? "existing" as const : "pending" as const,
        hasExistingData: uniqueIds.has(c.id)
      }));
      setResults(initialResults);
    } catch (error) {
      console.error("Error fetching existing customers:", error);
    } finally {
      setIsLoadingExisting(false);
    }
  }, [customers, recordMonth]);

  useEffect(() => {
    if (customers.length > 0) {
      fetchExistingCustomers();
    }
  }, [customers, fetchExistingCustomers]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const deleteCustomerData = async (customerId: string) => {
    setIsDeletingCustomer(customerId);
    try {
      // Delete from all primary bank tables
      await Promise.all([
        supabase.from("primary_bank_loan_summary").delete().eq("customer_id", customerId).eq("record_month", recordMonth),
        supabase.from("primary_bank_loan_detail").delete().eq("customer_id", customerId).eq("record_month", recordMonth),
        supabase.from("primary_bank_pos").delete().eq("customer_id", customerId).eq("record_month", recordMonth),
        supabase.from("primary_bank_cheque").delete().eq("customer_id", customerId).eq("record_month", recordMonth),
        supabase.from("primary_bank_collateral").delete().eq("customer_id", customerId).eq("record_month", recordMonth),
      ]);

      // Update state
      setExistingCustomerIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(customerId);
        return newSet;
      });
      
      setResults(prev => prev.map(r => 
        r.customerId === customerId 
          ? { ...r, status: "pending" as const, hasExistingData: false, data: undefined }
          : r
      ));

      toast({ title: t.primaryBankEngine.dataDeleted, description: t.primaryBankEngine.dataDeletedDesc });
    } catch (error: any) {
      console.error("Error deleting customer data:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsDeletingCustomer(null);
    }
  };

  const fetchCustomerProducts = async (customerId: string) => {
    const { data, error } = await supabase
      .from("customer_products")
      .select("product_id, products ( id, name, category, display_order )")
      .eq("customer_id", customerId);

    if (error) throw error;

    return (data || []).map((row: any) => {
      const prod = Array.isArray(row.products) ? row.products[0] : row.products;
      return {
        id: row.product_id as string,
        name: prod?.name as string | undefined,
        category: prod?.category as string | undefined,
        display_order: prod?.display_order as number | undefined,
      };
    });
  };

  const generateForCustomer = useCallback(async (customer: any): Promise<GeneratedData | null> => {
    const customerProducts = await fetchCustomerProducts(customer.id);
    const productIds = customerProducts.map(p => p.id);

    // FIX: DB products use real UUIDs; detect loan capability via category = 'Kredi'
    const hasKrediAccount = customerProducts.some(p => p.category === LOAN_CATEGORY);
    const loanProducts = customerProducts
      .filter(p => p.category === LOAN_CATEGORY)
      .map(p => p.name ?? p.id);

    const hasPosProduct = productIds.includes(POS_PRODUCT_ID);
    const hasChequeProduct = productIds.includes(CHEQUE_PRODUCT_ID);
    const hasCollateralProduct = COLLATERAL_PRODUCT_IDS.some(id => productIds.includes(id));

    const { data, error } = await supabase.functions.invoke("generate-primary-bank-data", {
      body: {
        customer: {
          customerId: customer.id,
          customerName: customer.name,
          segment: customer.segment,
          sector: customer.sector,
          hasKrediAccount,
          loanProducts,
          hasPosProduct,
          hasChequeProduct,
          hasCollateralProduct
        },
        recordMonth
      }
    });

    if (error) throw error;
    return data;
  }, [recordMonth]);

  const saveGeneratedData = async (data: GeneratedData) => {
    // Save loan summary
    if (data.loan_summary?.length > 0) {
      const { error } = await supabase
        .from("primary_bank_loan_summary")
        .upsert(data.loan_summary, { onConflict: "record_month,customer_id,bank_code" });
      if (error) console.error("Error saving loan summary:", error);
    }

    // Save loan detail
    if (data.loan_detail?.length > 0) {
      const { error } = await supabase
        .from("primary_bank_loan_detail")
        .upsert(data.loan_detail, { onConflict: "record_month,customer_id,bank_code,account_id" });
      if (error) console.error("Error saving loan detail:", error);
    }

    // Save POS data
    if (data.pos_data) {
      const { error } = await supabase
        .from("primary_bank_pos")
        .upsert([data.pos_data], { onConflict: "record_month,customer_id" });
      if (error) console.error("Error saving POS data:", error);
    }

    // Save cheque data
    if (data.cheque_data) {
      const { error } = await supabase
        .from("primary_bank_cheque")
        .upsert([data.cheque_data], { onConflict: "record_month,customer_id" });
      if (error) console.error("Error saving cheque data:", error);
    }

    // Save collateral data
    if (data.collateral_data?.length > 0) {
      const { error } = await supabase
        .from("primary_bank_collateral")
        .upsert(data.collateral_data, { onConflict: "record_month,customer_id,bank_code" });
      if (error) console.error("Error saving collateral data:", error);
    }
  };

  const runEngine = useCallback(async () => {
    if (!customers.length) {
      toast({ title: "No customers", description: "No customers found in portfolio", variant: "destructive" });
      return;
    }

    setIsRunning(true);
    setIsPaused(false);

    for (let i = currentIndex; i < customers.length; i++) {
      if (isPaused) break;

      const customer = customers[i];
      const hasExistingData = existingCustomerIds.has(customer.id);

      // Skip customers with existing data if overwrite is disabled
      if (hasExistingData && !overwriteExisting) {
        setResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: "skipped" as const } : r
        ));
        setCurrentIndex(i + 1);
        continue;
      }

      setCurrentIndex(i);
      
      // Update status to processing
      setResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: "processing" as const } : r
      ));

      try {
        const data = await generateForCustomer(customer);
        
        if (data) {
          await saveGeneratedData(data);
          
          // Update existing customer IDs
          setExistingCustomerIds(prev => new Set([...prev, customer.id]));
          
          setResults(prev => prev.map((r, idx) => 
            idx === i ? { ...r, status: "success" as const, data, hasExistingData: true } : r
          ));
        }
      } catch (error: any) {
        console.error(`Error for customer ${customer.name}:`, error);
        setResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: "error" as const, error: error.message } : r
        ));
      }

      // Wait 2 seconds before next customer
      if (i < customers.length - 1) {
        await sleep(2000);
      }
    }

    setIsRunning(false);
    toast({ title: "Engine Complete", description: `Processed ${customers.length} customers` });
  }, [customers, currentIndex, generateForCustomer, isPaused, toast, existingCustomerIds, overwriteExisting]);

  const handleStart = () => {
    if (isPaused) {
      setIsPaused(false);
      runEngine();
    } else {
      setCurrentIndex(0);
      // Reset results to initial state (preserve existing status)
      setResults(customers.map(c => ({
        customerId: c.id,
        customerName: c.name,
        status: existingCustomerIds.has(c.id) ? "existing" as const : "pending" as const,
        hasExistingData: existingCustomerIds.has(c.id)
      })));
      runEngine();
    }
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentIndex(0);
    fetchExistingCustomers();
  };

  const progress = customers.length > 0 ? (currentIndex / customers.length) * 100 : 0;
  const successCount = results.filter(r => r.status === "success").length;
  const errorCount = results.filter(r => r.status === "error").length;
  const existingCount = results.filter(r => r.hasExistingData).length;
  const skippedCount = results.filter(r => r.status === "skipped").length;

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 md:p-6">
        <PageBreadcrumb 
          items={[
            { label: t.primaryBank.title, href: "/primary-bank" },
            { label: t.primaryBankEngine.title }
          ]} 
        />

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/primary-bank")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t.primaryBankEngine.title}</h1>
            <p className="text-muted-foreground">{t.primaryBankEngine.subtitle}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle>{t.primaryBankEngine.controls}</CardTitle>
              <CardDescription>{t.primaryBankEngine.controlsDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {!isRunning ? (
                  <Button onClick={handleStart} className="flex-1">
                    <Play className="mr-2 h-4 w-4" />
                    {isPaused ? t.primaryBankEngine.resume : t.primaryBankEngine.start}
                  </Button>
                ) : (
                  <Button onClick={handlePause} variant="secondary" className="flex-1">
                    <Pause className="mr-2 h-4 w-4" />
                    {t.primaryBankEngine.pause}
                  </Button>
                )}
                <Button onClick={handleReset} variant="outline" disabled={isRunning && !isPaused}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <Separator />

              {/* Overwrite checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="overwrite" 
                  checked={overwriteExisting}
                  onCheckedChange={(checked) => setOverwriteExisting(checked === true)}
                  disabled={isRunning}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="overwrite" className="text-sm font-medium cursor-pointer">
                    {t.primaryBankEngine.overwriteExisting}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t.primaryBankEngine.overwriteExistingDesc}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t.primaryBankEngine.progress}</span>
                  <span>{currentIndex}/{customers.length}</span>
                </div>
                <Progress value={progress} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg bg-muted p-2">
                  <div className="text-lg font-bold">{customers.length}</div>
                  <div className="text-xs text-muted-foreground">{t.primaryBankEngine.total}</div>
                </div>
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <div className="text-lg font-bold text-blue-600">{existingCount}</div>
                  <div className="text-xs text-muted-foreground">{t.primaryBankEngine.hasData}</div>
                </div>
                <div className="rounded-lg bg-green-500/10 p-2">
                  <div className="text-lg font-bold text-green-600">{successCount}</div>
                  <div className="text-xs text-muted-foreground">{t.primaryBankEngine.success}</div>
                </div>
                <div className="rounded-lg bg-red-500/10 p-2">
                  <div className="text-lg font-bold text-red-600">{errorCount}</div>
                  <div className="text-xs text-muted-foreground">{t.primaryBankEngine.errors}</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                {t.primaryBankEngine.recordMonth}: <Badge variant="outline">{recordMonth}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Customer Progress List */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t.primaryBankEngine.customerProgress}</CardTitle>
              <CardDescription>{t.primaryBankEngine.customerProgressDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingExisting ? (
                <div className="flex h-[400px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {results.map((result, idx) => (
                      <div 
                        key={result.customerId}
                        className={`flex items-center justify-between rounded-lg border p-3 ${
                          result.status === "processing" ? "border-primary bg-primary/5" : ""
                        } ${result.hasExistingData ? "bg-blue-500/5" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                            result.hasExistingData ? "bg-blue-500/20 text-blue-600" : "bg-muted"
                          }`}>
                            {result.hasExistingData ? <Database className="h-4 w-4" /> : idx + 1}
                          </div>
                          <div>
                            <div className="font-medium">{result.customerName}</div>
                            {result.status === "success" && result.data && (
                              <div className="text-xs text-muted-foreground">
                                {result.data.loan_summary?.length || 0} banks, {" "}
                                {result.data.loan_detail?.length || 0} loans
                                {result.data.pos_data ? ", POS" : ""}
                                {result.data.cheque_data ? ", Cheque" : ""}
                                {result.data.collateral_data?.length ? `, ${result.data.collateral_data.length} collaterals` : ""}
                              </div>
                            )}
                            {result.status === "error" && (
                              <div className="text-xs text-red-500">{result.error}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.status === "pending" && (
                            <Badge variant="outline" className="text-muted-foreground">
                              {t.primaryBankEngine.pending}
                            </Badge>
                          )}
                          {result.status === "existing" && (
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                              <Database className="mr-1 h-3 w-3" />
                              {t.primaryBankEngine.existing}
                            </Badge>
                          )}
                          {result.status === "skipped" && (
                            <Badge variant="outline" className="text-muted-foreground">
                              {t.primaryBankEngine.skipped}
                            </Badge>
                          )}
                          {result.status === "processing" && (
                            <Badge variant="secondary" className="animate-pulse">
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              {t.primaryBankEngine.generating}
                            </Badge>
                          )}
                          {result.status === "success" && (
                            <Badge className="bg-green-500">
                              <Check className="mr-1 h-3 w-3" />
                              {t.primaryBankEngine.done}
                            </Badge>
                          )}
                          {result.status === "error" && (
                            <Badge variant="destructive">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              {t.primaryBankEngine.failed}
                            </Badge>
                          )}
                          {/* Remove button for customers with existing data */}
                          {result.hasExistingData && !isRunning && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteCustomerData(result.customerId)}
                              disabled={isDeletingCustomer === result.customerId}
                            >
                              {isDeletingCustomer === result.customerId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {results.length === 0 && (
                      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                        {t.primaryBankEngine.clickStart}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Customer Detail */}
        {results[currentIndex]?.status === "processing" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                {t.primaryBankEngine.currentlyProcessing}: {results[currentIndex]?.customerName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {t.primaryBankEngine.processingDesc}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
