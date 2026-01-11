import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, RotateCcw, Check, Loader2, AlertCircle, Trash2, Database, Calculator, X, Save, Square } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { usePortfolioManager } from "@/hooks/usePortfolioManager";
import { useCustomers } from "@/hooks/useCustomers";
import { useUserSettings } from "@/hooks/useUserSettings";
import { format } from "date-fns";

// Storage key for persisting engine state
const ENGINE_STATE_KEY = "primary_bank_engine_state";

interface GeneratedData {
  loan_summary: any[];
  loan_detail: any[];
  pos_data: any | null;
  cheque_data: any | null;
  collateral_data: any[];
  provider?: string;
  model?: string;
}

interface CustomerResult {
  customerId: string;
  customerName: string;
  segment?: string;
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

// Format currency for display
const formatCurrency = (value: number | null | undefined): string => {
  if (value == null) return "-";
  return new Intl.NumberFormat("tr-TR", { style: "decimal", maximumFractionDigits: 0 }).format(value) + " TL";
};

// Interface for persisted engine state
interface PersistedEngineState {
  isRunning: boolean;
  isPaused: boolean;
  currentIndex: number;
  results: CustomerResult[];
  overwriteExisting: boolean;
  recordMonth: string;
  existingCustomerIds: string[];
  timestamp: number;
}

export default function PrimaryBankEngine() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { data: portfolioManager } = usePortfolioManager();
  const { data: customers = [] } = useCustomers();
  const { settings } = useUserSettings();

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [recordMonth] = useState(format(new Date(), "yyyy-MM"));
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [existingCustomerIds, setExistingCustomerIds] = useState<Set<string>>(new Set());
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState<string | null>(null);
  const [hasRestoredState, setHasRestoredState] = useState(false);

  // Use ref to track pause state during async operations
  const isPausedRef = useRef(isPaused);
  const isStoppedRef = useRef(false);

  // Manual calculation state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isManualGenerating, setIsManualGenerating] = useState(false);
  const [manualResult, setManualResult] = useState<CustomerResult | null>(null);

  // Keep isPausedRef in sync with isPaused
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Persist state to localStorage
  const persistState = useCallback((state: Partial<PersistedEngineState>) => {
    try {
      const currentState = JSON.parse(localStorage.getItem(ENGINE_STATE_KEY) || "{}");
      const newState = {
        ...currentState,
        ...state,
        timestamp: Date.now()
      };
      localStorage.setItem(ENGINE_STATE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error("Error persisting engine state:", error);
    }
  }, []);

  // Clear persisted state
  const clearPersistedState = useCallback(() => {
    localStorage.removeItem(ENGINE_STATE_KEY);
  }, []);

  // Fetch existing customers with primary bank data
  const fetchExistingCustomers = useCallback(async (skipResultsInit = false) => {
    setIsLoadingExisting(true);
    try {
      const { data } = await supabase
        .from("primary_bank_loan_summary")
        .select("customer_id")
        .eq("record_month", recordMonth);
      
      const uniqueIds = new Set(data?.map(d => d.customer_id) || []);
      setExistingCustomerIds(uniqueIds);
      
      // Only initialize results if not restoring from persisted state
      if (!skipResultsInit) {
        const initialResults: CustomerResult[] = customers.map(c => ({
          customerId: c.id,
          customerName: c.name,
          segment: c.segment,
          status: uniqueIds.has(c.id) ? "existing" as const : "pending" as const,
          hasExistingData: uniqueIds.has(c.id)
        }));
        setResults(initialResults);
      }
      
      return uniqueIds;
    } catch (error) {
      console.error("Error fetching existing customers:", error);
      return new Set<string>();
    } finally {
      setIsLoadingExisting(false);
    }
  }, [customers, recordMonth]);

  // Restore state from localStorage on mount
  useEffect(() => {
    if (customers.length > 0 && !hasRestoredState) {
      try {
        const savedState = localStorage.getItem(ENGINE_STATE_KEY);
        if (savedState) {
          const parsed: PersistedEngineState = JSON.parse(savedState);
          
          // Only restore if recordMonth matches and state is less than 24 hours old
          const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
          const isSameMonth = parsed.recordMonth === recordMonth;
          
          if (isRecent && isSameMonth && (parsed.isRunning || parsed.isPaused)) {
            // Restore state
            setCurrentIndex(parsed.currentIndex);
            setOverwriteExisting(parsed.overwriteExisting);
            setExistingCustomerIds(new Set(parsed.existingCustomerIds));
            
            // Merge saved results with current customer data
            const restoredResults: CustomerResult[] = customers.map(c => {
              const savedResult = parsed.results.find(r => r.customerId === c.id);
              if (savedResult) {
                return {
                  ...savedResult,
                  customerName: c.name,
                  segment: c.segment
                };
              }
              return {
                customerId: c.id,
                customerName: c.name,
                segment: c.segment,
                status: parsed.existingCustomerIds.includes(c.id) ? "existing" as const : "pending" as const,
                hasExistingData: parsed.existingCustomerIds.includes(c.id)
              };
            });
            setResults(restoredResults);
            
            // Set as paused so user can resume
            setIsPaused(true);
            setIsRunning(false);
            
            toast({
              title: t.primaryBankEngine.stateRestored || "State Restored",
              description: t.primaryBankEngine.stateRestoredDesc || `Progress restored: ${parsed.currentIndex}/${customers.length} customers`,
            });
            
            setHasRestoredState(true);
            setIsLoadingExisting(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error restoring engine state:", error);
      }
      
      // No valid saved state, fetch fresh
      fetchExistingCustomers();
      setHasRestoredState(true);
    }
  }, [customers, recordMonth, hasRestoredState, fetchExistingCustomers, toast, t.primaryBankEngine]);

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

  // Pre-calculate product generation flags based on probability distribution
  // This ensures deterministic data generation rather than relying on AI randomness
  const calculateGenerationFlags = useCallback((customerId: string) => {
    // Use customerId hash to get consistent but distributed results
    const hash = customerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rand = (hash % 100) / 100; // Pseudo-random 0-1 based on customer ID
    
    // Probability distribution as specified:
    // 90% have loan_summary, 50% have loan_detail, 33% have pos, 25% have cheque, 40% have collaterals
    return {
      shouldGenerateLoanSummary: rand < 0.90,  // 90%
      shouldGenerateLoanDetail: rand < 0.50,   // 50%
      shouldGeneratePos: rand < 0.33,          // 33%
      shouldGenerateCheque: rand < 0.25,       // 25%
      shouldGenerateCollateral: rand < 0.40,   // 40%
    };
  }, []);

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

    // Pre-calculate which data types to generate based on probability distribution
    const generationFlags = calculateGenerationFlags(customer.id);

    // Get session for auth token
    const { data: { session } } = await supabase.auth.getSession();

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
          hasCollateralProduct,
          // Pass pre-calculated flags to the model
          shouldGenerateLoanSummary: generationFlags.shouldGenerateLoanSummary,
          shouldGenerateLoanDetail: generationFlags.shouldGenerateLoanDetail,
          shouldGeneratePos: generationFlags.shouldGeneratePos,
          shouldGenerateCheque: generationFlags.shouldGenerateCheque,
          shouldGenerateCollateral: generationFlags.shouldGenerateCollateral,
        },
        recordMonth
      },
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined
    });

    if (error) throw error;
    return data;
  }, [recordMonth, calculateGenerationFlags]);

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

  const runEngine = useCallback(async (startFromIndex?: number) => {
    if (!customers.length) {
      toast({ title: "No customers", description: "No customers found in portfolio", variant: "destructive" });
      return;
    }

    const startIndex = startFromIndex ?? currentIndex;
    isStoppedRef.current = false;
    setIsRunning(true);
    setIsPaused(false);
    isPausedRef.current = false;

    for (let i = startIndex; i < customers.length; i++) {
      // Check for pause or stop
      if (isPausedRef.current || isStoppedRef.current) {
        if (!isStoppedRef.current) {
          // Persist state when paused
          persistState({
            isRunning: false,
            isPaused: true,
            currentIndex: i,
            results,
            overwriteExisting,
            recordMonth,
            existingCustomerIds: Array.from(existingCustomerIds)
          });
        }
        break;
      }

      const customer = customers[i];
      const hasExistingData = existingCustomerIds.has(customer.id);

      // Skip customers with existing data if overwrite is disabled
      if (hasExistingData && !overwriteExisting) {
        setResults(prev => {
          const newResults = prev.map((r, idx) => 
            idx === i ? { ...r, status: "skipped" as const } : r
          );
          return newResults;
        });
        setCurrentIndex(i + 1);
        continue;
      }

      setCurrentIndex(i);
      
      // Update status to processing
      setResults(prev => {
        const newResults = prev.map((r, idx) => 
          idx === i ? { ...r, status: "processing" as const } : r
        );
        // Persist state periodically
        persistState({
          isRunning: true,
          isPaused: false,
          currentIndex: i,
          results: newResults,
          overwriteExisting,
          recordMonth,
          existingCustomerIds: Array.from(existingCustomerIds)
        });
        return newResults;
      });

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

      // Wait 2 seconds before next customer (if not paused/stopped)
      if (i < customers.length - 1 && !isPausedRef.current && !isStoppedRef.current) {
        await sleep(2000);
      }
    }

    setIsRunning(false);
    
    // Clear persisted state on completion
    if (!isPausedRef.current && !isStoppedRef.current) {
      clearPersistedState();
      toast({ title: "Engine Complete", description: `Processed ${customers.length} customers` });
    }
  }, [customers, currentIndex, generateForCustomer, toast, existingCustomerIds, overwriteExisting, recordMonth, persistState, clearPersistedState, results]);

  const handleStart = () => {
    if (isPaused) {
      // Resume from current position
      setIsPaused(false);
      isPausedRef.current = false;
      runEngine(currentIndex);
    } else {
      // Fresh start
      setCurrentIndex(0);
      isStoppedRef.current = false;
      // Reset results to initial state (preserve existing status)
      const newResults = customers.map(c => ({
        customerId: c.id,
        customerName: c.name,
        segment: c.segment,
        status: existingCustomerIds.has(c.id) ? "existing" as const : "pending" as const,
        hasExistingData: existingCustomerIds.has(c.id)
      }));
      setResults(newResults);
      runEngine(0);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    isPausedRef.current = true;
  };

  const handleResume = () => {
    setIsPaused(false);
    isPausedRef.current = false;
    runEngine(currentIndex);
  };

  const handleStop = () => {
    isStoppedRef.current = true;
    setIsRunning(false);
    setIsPaused(false);
    isPausedRef.current = false;
    clearPersistedState();
  };

  const handleReset = () => {
    isStoppedRef.current = true;
    setIsRunning(false);
    setIsPaused(false);
    isPausedRef.current = false;
    setCurrentIndex(0);
    clearPersistedState();
    fetchExistingCustomers();
  };

  // Manual calculation handler
  const handleManualCalculation = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    setSelectedCustomerId(customerId);
    setIsManualGenerating(true);
    setManualResult({
      customerId,
      customerName: customer.name,
      segment: customer.segment,
      status: "processing"
    });

    try {
      const data = await generateForCustomer(customer);
      
      if (data) {
        setManualResult({
          customerId,
          customerName: customer.name,
          segment: customer.segment,
          status: "success",
          data
        });
      }
    } catch (error: any) {
      console.error("Manual calculation error:", error);
      setManualResult({
        customerId,
        customerName: customer.name,
        segment: customer.segment,
        status: "error",
        error: error.message
      });
    } finally {
      setIsManualGenerating(false);
    }
  };

  // Save manual result
  const handleSaveManualResult = async () => {
    if (!manualResult?.data) return;

    try {
      await saveGeneratedData(manualResult.data);
      
      // Update existing customer IDs
      setExistingCustomerIds(prev => new Set([...prev, manualResult.customerId]));
      
      // Update results list
      setResults(prev => prev.map(r => 
        r.customerId === manualResult.customerId 
          ? { ...r, status: "success" as const, data: manualResult.data, hasExistingData: true }
          : r
      ));

      toast({ title: t.common.save, description: t.primaryBankEngine.dataDeletedDesc });
      setManualResult(null);
      setSelectedCustomerId(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const closeManualResult = () => {
    setManualResult(null);
    setSelectedCustomerId(null);
  };

  const progress = customers.length > 0 ? (currentIndex / customers.length) * 100 : 0;
  const successCount = results.filter(r => r.status === "success").length;
  const errorCount = results.filter(r => r.status === "error").length;
  const existingCount = results.filter(r => r.hasExistingData).length;
  const skippedCount = results.filter(r => r.status === "skipped").length;

  // Get current AI model info
  const currentProvider = settings?.ai_provider || "lovable";
  const currentModel = settings?.ai_model || (currentProvider === "lovable" ? "google/gemini-3-flash-preview" : "");

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
                {!isRunning && !isPaused ? (
                  <Button onClick={handleStart} className="flex-1">
                    <Play className="mr-2 h-4 w-4" />
                    {t.primaryBankEngine.start}
                  </Button>
                ) : isRunning ? (
                  <Button onClick={handlePause} variant="secondary" className="flex-1">
                    <Pause className="mr-2 h-4 w-4" />
                    {t.primaryBankEngine.pause}
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleResume} className="flex-1">
                      <Play className="mr-2 h-4 w-4" />
                      {t.primaryBankEngine.resume}
                    </Button>
                    <Button onClick={handleStop} variant="destructive" className="flex-1">
                      <Square className="mr-2 h-4 w-4" />
                      {t.primaryBankEngine.stop}
                    </Button>
                  </>
                )}
                <Button onClick={handleReset} variant="outline" disabled={isRunning}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <Separator />

              {/* AI Model Info */}
              <div className="rounded-lg bg-muted/50 p-3 text-xs">
                <div className="font-medium mb-1">AI Model</div>
                <div className="text-muted-foreground">
                  {currentProvider.charAt(0).toUpperCase() + currentProvider.slice(1)}: {currentModel || "Default"}
                </div>
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
          <Card className="md:col-span-2 flex flex-col min-h-[500px]">
            <CardHeader className="flex-shrink-0">
              <CardTitle>{t.primaryBankEngine.customerProgress}</CardTitle>
              <CardDescription>{t.primaryBankEngine.customerProgressDesc}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-hidden">
              {isLoadingExisting ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-2">
                    {results.map((result, idx) => (
                      <div 
                        key={result.customerId}
                        className={`flex items-center justify-between rounded-lg border p-3 ${
                          result.status === "processing" ? "border-primary bg-primary/5" : ""
                        } ${result.hasExistingData ? "bg-blue-500/5" : ""} ${
                          selectedCustomerId === result.customerId ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                            result.hasExistingData ? "bg-blue-500/20 text-blue-600" : "bg-muted"
                          }`}>
                            {result.hasExistingData ? <Database className="h-4 w-4" /> : idx + 1}
                          </div>
                          <div>
                            <div className="font-medium">{result.customerName}</div>
                            {result.segment && (
                              <div className="text-xs text-muted-foreground">{result.segment}</div>
                            )}
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

                          {/* Manual Calculate button */}
                          {!isRunning && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={() => handleManualCalculation(result.customerId)}
                              disabled={isManualGenerating && selectedCustomerId === result.customerId}
                              title={t.primaryBankEngine.calculate}
                            >
                              {isManualGenerating && selectedCustomerId === result.customerId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Calculator className="h-4 w-4" />
                              )}
                            </Button>
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
                      <div className="flex h-full min-h-[200px] items-center justify-center text-muted-foreground">
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

        {/* Manual Calculation Result Panel */}
        {manualResult && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {manualResult.status === "processing" && <Loader2 className="h-5 w-5 animate-spin" />}
                  {manualResult.status === "success" && <Check className="h-5 w-5 text-green-500" />}
                  {manualResult.status === "error" && <AlertCircle className="h-5 w-5 text-destructive" />}
                  {t.primaryBankEngine.calculationResult}: {manualResult.customerName}
                </CardTitle>
                <CardDescription>
                  {manualResult.segment && <Badge variant="outline" className="mr-2">{manualResult.segment}</Badge>}
                  {manualResult.data?.provider && (
                    <span className="text-xs">
                      {manualResult.data.provider} / {manualResult.data.model}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {manualResult.status === "success" && manualResult.data && (
                  <Button size="sm" onClick={handleSaveManualResult}>
                    <Save className="mr-2 h-4 w-4" />
                    {t.primaryBankEngine.saveResult}
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={closeManualResult}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {manualResult.status === "processing" && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {manualResult.status === "error" && (
                <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                  {manualResult.error}
                </div>
              )}

              {manualResult.status === "success" && manualResult.data && (
                <div className="space-y-6">
                  {/* Loan Summary */}
                  {manualResult.data.loan_summary?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">{t.primaryBankEngine.loanSummary}</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t.primaryBankEngine.bankCode}</TableHead>
                            <TableHead className="text-right">{t.primaryBankEngine.cashLoan}</TableHead>
                            <TableHead className="text-right">{t.primaryBankEngine.nonCashLoan}</TableHead>
                            <TableHead>{t.primaryBankEngine.approvalDate}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {manualResult.data.loan_summary.map((ls: any, idx: number) => (
                            <TableRow key={idx} className={ls.our_bank_flag ? "bg-primary/5" : ""}>
                              <TableCell>
                                <span className="font-medium">{ls.bank_code}</span>
                                {ls.our_bank_flag && <Badge variant="secondary" className="ml-2 text-xs">Ours</Badge>}
                              </TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(ls.cash_loan)}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(ls.non_cash_loan)}</TableCell>
                              <TableCell>{ls.last_approval_date || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Loan Details */}
                  {manualResult.data.loan_detail?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">{t.primaryBankEngine.loanDetails}</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t.primaryBankEngine.bankCode}</TableHead>
                            <TableHead>{t.primaryBankEngine.accountId}</TableHead>
                            <TableHead>{t.primaryBankEngine.loanType}</TableHead>
                            <TableHead>{t.primaryBankEngine.loanStatus}</TableHead>
                            <TableHead className="text-right">{t.primaryBankEngine.openAmount}</TableHead>
                            <TableHead className="text-right">{t.primaryBankEngine.currentAmount}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {manualResult.data.loan_detail.map((ld: any, idx: number) => (
                            <TableRow key={idx} className={ld.our_bank_flag ? "bg-primary/5" : ""}>
                              <TableCell>{ld.bank_code}</TableCell>
                              <TableCell className="font-mono text-xs">{ld.account_id}</TableCell>
                              <TableCell>{ld.loan_type}</TableCell>
                              <TableCell>
                                <Badge variant={ld.loan_status === "Aktif" ? "default" : "secondary"}>
                                  {ld.loan_status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(ld.open_amount)}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(ld.current_amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* POS & Cheque Data */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {manualResult.data.pos_data && (
                      <div className="rounded-lg border p-4">
                        <h4 className="font-semibold mb-2">POS</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.primaryBankEngine.totalVolume}</span>
                            <span className="font-mono">{formatCurrency(manualResult.data.pos_data.total_pos_volume)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.primaryBankEngine.ourBankVolume}</span>
                            <span className="font-mono">{formatCurrency(manualResult.data.pos_data.our_bank_pos_volume)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.primaryBankEngine.share}</span>
                            <span className="font-mono">{manualResult.data.pos_data.pos_share}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.primaryBankEngine.bankCount}</span>
                            <span>{manualResult.data.pos_data.number_of_banks}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {manualResult.data.cheque_data && (
                      <div className="rounded-lg border p-4">
                        <h4 className="font-semibold mb-2">{t.primaryBank.chequeTitle}</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">1M</span>
                            <span className="font-mono">{formatCurrency(manualResult.data.cheque_data.cheque_volume_1m)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">3M</span>
                            <span className="font-mono">{formatCurrency(manualResult.data.cheque_data.cheque_volume_3m)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">12M</span>
                            <span className="font-mono">{formatCurrency(manualResult.data.cheque_data.cheque_volume_12m)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Collateral Data */}
                  {manualResult.data.collateral_data?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">{t.primaryBank.collateralsTitle}</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t.primaryBankEngine.bankCode}</TableHead>
                            <TableHead className="text-right">Group 1</TableHead>
                            <TableHead className="text-right">Group 2</TableHead>
                            <TableHead className="text-right">Group 3</TableHead>
                            <TableHead className="text-right">Group 4</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {manualResult.data.collateral_data.map((cd: any, idx: number) => (
                            <TableRow key={idx} className={cd.our_bank_flag ? "bg-primary/5" : ""}>
                              <TableCell>
                                <span className="font-medium">{cd.bank_code}</span>
                                {cd.our_bank_flag && <Badge variant="secondary" className="ml-2 text-xs">Ours</Badge>}
                              </TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(cd.group1_amount)}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(cd.group2_amount)}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(cd.group3_amount)}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(cd.group4_amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
