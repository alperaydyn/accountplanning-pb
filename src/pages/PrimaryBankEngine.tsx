import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Play, Pause, RotateCcw, Check, Loader2, AlertCircle, Trash2, Database, Calculator, X, Save, Square, Settings, Sparkles } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  existingDataInfo?: {
    hasSummary: boolean;
    hasDetail: boolean;
    hasPos: boolean;
    hasCheque: boolean;
    hasCollateral: boolean;
  };
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
  const [isPauseRequested, setIsPauseRequested] = useState(false); // New: shows "pausing" state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [recordMonth, setRecordMonth] = useState(format(new Date(), "yyyy-MM"));
  
  // Generate date options similar to Dashboard
  const dateOptions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const dateSet = new Set<string>();
    const options: { value: string; label: string }[] = [];
    
    const addDate = (year: number, month: number, labelSuffix?: string) => {
      const value = `${year}-${String(month).padStart(2, '0')}`;
      if (!dateSet.has(value)) {
        dateSet.add(value);
        const label = labelSuffix ? `${value} ${labelSuffix}` : value;
        options.push({ value, label });
      }
    };
    
    addDate(currentYear, currentMonth, `(${t.primaryBank.current})`);
    for (let i = 1; i <= 3; i++) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      addDate(date.getFullYear(), date.getMonth() + 1);
    }
    const currentQuarter = Math.ceil(currentMonth / 3);
    for (let i = 1; i <= 4; i++) {
      let q = currentQuarter - i;
      let year = currentYear;
      while (q <= 0) { q += 4; year -= 1; }
      addDate(year, q * 3);
    }
    addDate(currentYear - 1, 12);
    addDate(currentYear - 2, 12);
    return options;
  }, [t.primaryBank.current]);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [existingCustomerIds, setExistingCustomerIds] = useState<Set<string>>(new Set());
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState<string | null>(null);
  const [hasRestoredState, setHasRestoredState] = useState(false);
  const [shouldAutoResume, setShouldAutoResume] = useState(false); // New: auto-resume after restore

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
    // Clear pause requested when actually paused
    if (isPaused) {
      setIsPauseRequested(false);
    }
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

  // Fetch existing customers with primary bank data (including data types)
  const fetchExistingCustomers = useCallback(async (skipResultsInit = false) => {
    setIsLoadingExisting(true);
    try {
      // Fetch all data types in parallel
      const [summaryData, detailData, posData, chequeData, collateralData] = await Promise.all([
        supabase.from("primary_bank_loan_summary").select("customer_id").eq("record_month", recordMonth),
        supabase.from("primary_bank_loan_detail").select("customer_id").eq("record_month", recordMonth),
        supabase.from("primary_bank_pos").select("customer_id").eq("record_month", recordMonth),
        supabase.from("primary_bank_cheque").select("customer_id").eq("record_month", recordMonth),
        supabase.from("primary_bank_collateral").select("customer_id").eq("record_month", recordMonth),
      ]);

      const summaryIds = new Set(summaryData.data?.map(d => d.customer_id) || []);
      const detailIds = new Set(detailData.data?.map(d => d.customer_id) || []);
      const posIds = new Set(posData.data?.map(d => d.customer_id) || []);
      const chequeIds = new Set(chequeData.data?.map(d => d.customer_id) || []);
      const collateralIds = new Set(collateralData.data?.map(d => d.customer_id) || []);

      // Combined set for any existing data
      const allExistingIds = new Set([...summaryIds, ...detailIds, ...posIds, ...chequeIds, ...collateralIds]);
      setExistingCustomerIds(allExistingIds);
      
      // Only initialize results if not restoring from persisted state
      if (!skipResultsInit) {
        const initialResults: CustomerResult[] = customers.map(c => ({
          customerId: c.id,
          customerName: c.name,
          segment: c.segment,
          status: allExistingIds.has(c.id) ? "existing" as const : "pending" as const,
          hasExistingData: allExistingIds.has(c.id),
          existingDataInfo: allExistingIds.has(c.id) ? {
            hasSummary: summaryIds.has(c.id),
            hasDetail: detailIds.has(c.id),
            hasPos: posIds.has(c.id),
            hasCheque: chequeIds.has(c.id),
            hasCollateral: collateralIds.has(c.id),
          } : undefined
        }));
        setResults(initialResults);
      }
      
      return allExistingIds;
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
            
            // If the engine was running when the page was closed, set up for auto-resume
            if (parsed.isRunning) {
              setShouldAutoResume(true);
            } else {
              // Was paused, just show paused state
              setIsPaused(true);
            }
            
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

  // Auto-resume ref to track if we should resume after runEngine is defined
  const autoResumeIndexRef = useRef<number | null>(null);
  
  // Mark for auto-resume when state is restored with isRunning=true
  useEffect(() => {
    if (shouldAutoResume && hasRestoredState && results.length > 0) {
      setShouldAutoResume(false);
      autoResumeIndexRef.current = currentIndex;
    }
  }, [shouldAutoResume, hasRestoredState, results.length, currentIndex]);

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
      const completedCount = results.filter(r => r.status === "success" || r.status === "error").length + 1; // +1 for current
      toast({ title: "Engine Complete", description: `Completed ${completedCount} customers` });
    }
  }, [customers, currentIndex, generateForCustomer, toast, existingCustomerIds, overwriteExisting, recordMonth, persistState, clearPersistedState, results]);

  // Effect to trigger auto-resume after runEngine is available
  useEffect(() => {
    if (autoResumeIndexRef.current !== null) {
      const resumeIndex = autoResumeIndexRef.current;
      autoResumeIndexRef.current = null;
      // Small delay to ensure UI is ready
      setTimeout(() => {
        runEngine(resumeIndex);
      }, 500);
    }
  }, [runEngine]);

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
    setIsPauseRequested(true); // Show "pausing" indicator immediately
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

  // Handle record month change - refresh existing data
  const handleRecordMonthChange = useCallback((newMonth: string) => {
    setRecordMonth(newMonth);
    setCurrentIndex(0);
    setHasRestoredState(false); // Force re-fetch of existing data
    clearPersistedState();
  }, [clearPersistedState]);

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

        <div className="grid gap-4 md:grid-cols-3 md:items-stretch" style={{ height: 'calc(100vh - 300px)', minHeight: '320px' }}>
          {/* Control Panel */}
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="py-3 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{t.primaryBankEngine.runDate}</CardTitle>
                <Select value={recordMonth} onValueChange={handleRecordMonthChange} disabled={isRunning}>
                  <SelectTrigger className="h-7 w-auto min-w-[100px] text-xs border-dashed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {dateOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* AI Model with Settings Link */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Sparkles className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{currentModel || "Default"}</span>
                <Link 
                  to="/settings" 
                  className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  title={t.primaryBankEngine.changeModel}
                >
                  <Settings className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 overflow-auto py-2">

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!isRunning && !isPaused && !isPauseRequested ? (
                  <Button onClick={handleStart} className="flex-1" size="sm">
                    <Play className="mr-2 h-4 w-4" />
                    {t.primaryBankEngine.start}
                  </Button>
                ) : isRunning && isPauseRequested ? (
                  <Button variant="secondary" className="flex-1" size="sm" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.primaryBankEngine.pausing}
                  </Button>
                ) : isRunning ? (
                  <Button onClick={handlePause} variant="secondary" className="flex-1" size="sm">
                    <Pause className="mr-2 h-4 w-4" />
                    {t.primaryBankEngine.pause}
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleResume} className="flex-1" size="sm">
                      <Play className="mr-2 h-4 w-4" />
                      {t.primaryBankEngine.resume}
                    </Button>
                    <Button onClick={handleStop} variant="destructive" className="flex-1" size="sm">
                      <Square className="mr-2 h-4 w-4" />
                      {t.primaryBankEngine.stop}
                    </Button>
                  </>
                )}
                <Button onClick={handleReset} variant="outline" size="sm" disabled={isRunning}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {/* Overwrite Checkbox */}
              <div className="flex items-center gap-1.5 text-xs">
                <Checkbox 
                  id="overwrite" 
                  checked={overwriteExisting}
                  onCheckedChange={(checked) => setOverwriteExisting(checked === true)}
                  disabled={isRunning}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor="overwrite" className="text-xs cursor-pointer text-muted-foreground">
                  {t.primaryBankEngine.overwriteExisting}
                </Label>
              </div>

              {/* Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{t.primaryBankEngine.progress}</span>
                  <span>{currentIndex}/{customers.length}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-1.5 text-center">
                <div className="rounded-lg bg-muted p-1.5">
                  <div className="text-base font-bold">{customers.length}</div>
                  <div className="text-[10px] text-muted-foreground">{t.primaryBankEngine.total}</div>
                </div>
                <div className="rounded-lg bg-blue-500/10 p-1.5">
                  <div className="text-base font-bold text-blue-600">{existingCount}</div>
                  <div className="text-[10px] text-muted-foreground">{t.primaryBankEngine.hasData}</div>
                </div>
                <div className="rounded-lg bg-green-500/10 p-1.5">
                  <div className="text-base font-bold text-green-600">{successCount}</div>
                  <div className="text-[10px] text-muted-foreground">{t.primaryBankEngine.success}</div>
                </div>
                <div className="rounded-lg bg-red-500/10 p-1.5">
                  <div className="text-base font-bold text-red-600">{errorCount}</div>
                  <div className="text-[10px] text-muted-foreground">{t.primaryBankEngine.errors}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Progress List */}
          <Card className="md:col-span-2 flex flex-col overflow-hidden">
            <CardHeader className="py-3 flex-shrink-0">
              <CardTitle className="text-base">{t.primaryBankEngine.customerProgress}</CardTitle>
              <CardDescription className="text-xs">{t.primaryBankEngine.customerProgressDesc}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0">
              {isLoadingExisting ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-1.5 px-6 pb-4">
                    {results.map((result, idx) => (
                      <div 
                        key={result.customerId}
                        className={`flex items-center justify-between rounded-lg border p-2 ${
                          result.status === "processing" ? "border-primary bg-primary/5" : ""
                        } ${result.hasExistingData ? "bg-blue-500/5" : ""} ${
                          selectedCustomerId === result.customerId ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                            result.hasExistingData ? "bg-blue-500/20 text-blue-600" : "bg-muted"
                          }`}>
                            {result.hasExistingData ? <Database className="h-3 w-3" /> : idx + 1}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{result.customerName}</div>
                            {result.segment && (
                              <div className="text-[10px] text-muted-foreground">{result.segment}</div>
                            )}
                            {/* Show existing data types for customers with data */}
                            {result.existingDataInfo && (
                              <div className="text-[10px] text-blue-600">
                                {t.primaryBankEngine.existingDataTypes}: {[
                                  result.existingDataInfo.hasSummary && "Summary",
                                  result.existingDataInfo.hasDetail && "Detail",
                                  result.existingDataInfo.hasPos && "POS",
                                  result.existingDataInfo.hasCheque && "Cheque",
                                  result.existingDataInfo.hasCollateral && "Collateral"
                                ].filter(Boolean).join(", ")}
                              </div>
                            )}
                            {result.status === "success" && result.data && (
                              <div className="text-[10px] text-muted-foreground">
                                {result.data.loan_summary?.length || 0} banks, {" "}
                                {result.data.loan_detail?.length || 0} loans
                                {result.data.pos_data ? ", POS" : ""}
                                {result.data.cheque_data ? ", Cheque" : ""}
                                {result.data.collateral_data?.length ? `, ${result.data.collateral_data.length} coll` : ""}
                              </div>
                            )}
                            {result.status === "error" && (
                              <div className="text-[10px] text-red-500 truncate max-w-[200px]">{result.error}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {result.status === "pending" && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                              {t.primaryBankEngine.pending}
                            </Badge>
                          )}
                          {result.status === "existing" && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-600">
                              <Database className="mr-1 h-2.5 w-2.5" />
                              {t.primaryBankEngine.existing}
                            </Badge>
                          )}
                          {result.status === "skipped" && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                              {t.primaryBankEngine.skipped}
                            </Badge>
                          )}
                          {result.status === "processing" && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 animate-pulse">
                              <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />
                              {t.primaryBankEngine.generating}
                            </Badge>
                          )}
                          {result.status === "success" && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-green-500">
                              <Check className="mr-1 h-2.5 w-2.5" />
                              {t.primaryBankEngine.done}
                            </Badge>
                          )}
                          {result.status === "error" && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              <AlertCircle className="mr-1 h-2.5 w-2.5" />
                              {t.primaryBankEngine.failed}
                            </Badge>
                          )}

                          {/* Manual Calculate button */}
                          {!isRunning && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-primary"
                              onClick={() => handleManualCalculation(result.customerId)}
                              disabled={isManualGenerating && selectedCustomerId === result.customerId}
                              title={t.primaryBankEngine.calculate}
                            >
                              {isManualGenerating && selectedCustomerId === result.customerId ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Calculator className="h-3 w-3" />
                              )}
                            </Button>
                          )}

                          {/* Remove button for customers with existing data */}
                          {result.hasExistingData && !isRunning && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteCustomerData(result.customerId)}
                              disabled={isDeletingCustomer === result.customerId}
                            >
                              {isDeletingCustomer === result.customerId ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
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

        {/* Current Customer Detail - Compact */}
        {results[currentIndex]?.status === "processing" && (
          <Card className="mt-4">
            <CardContent className="py-3 flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">{t.primaryBankEngine.currentlyProcessing}:</span>
              <span className="text-sm">{results[currentIndex]?.customerName}</span>
              <span className="text-xs text-muted-foreground ml-auto">{t.primaryBankEngine.processingDesc}</span>
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
