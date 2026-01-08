import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, RefreshCw, Check, Users, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useProducts } from "@/hooks/useProducts";
import { usePortfolioManager } from "@/hooks/usePortfolioManager";
import { Database } from "@/integrations/supabase/types";

type CustomerSector = Database['public']['Enums']['customer_sector'];
type CustomerSegment = Database['public']['Enums']['customer_segment'];
type CustomerStatus = Database['public']['Enums']['customer_status'];

interface GeneratedProduct {
  product_id: string;
  current_value: number;
}

interface GeneratedCustomer {
  name: string;
  sector: string;
  segment: string;
  status: string;
  principality_score: number;
  products: GeneratedProduct[];
}

interface CreateCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M TL`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K TL`;
  }
  return `${value.toFixed(0)} TL`;
};

export const CreateCustomerModal = ({ open, onOpenChange }: CreateCustomerModalProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedCustomer, setGeneratedCustomer] = useState<GeneratedCustomer | null>(null);
  const [batchCount, setBatchCount] = useState<number>(1);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, names: [] as string[], currentStep: '' });
  const cancelledRef = useRef(false);
  const queryClient = useQueryClient();
  const { data: products = [] } = useProducts();
  const { data: portfolioManager } = usePortfolioManager();

  const resetState = useCallback(() => {
    setIsGenerating(false);
    setIsSaving(false);
    setGeneratedCustomer(null);
    setIsBatchMode(false);
    setBatchProgress({ current: 0, total: 0, names: [], currentStep: '' });
    cancelledRef.current = false;
  }, []);

  useEffect(() => {
    if (!open) resetState();
  }, [open, resetState]);

  const handleDialogOpenChange = (nextOpen: boolean) => {
    // Don't allow closing while batch create is running
    if (isBatchMode && !nextOpen) return;

    if (!nextOpen) resetState();
    onOpenChange(nextOpen);
  };

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.name || productId;
  };

  const invokeGenerateCustomer = async (): Promise<GeneratedCustomer> => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session?.access_token) throw new Error("Unauthorized");

    const { data, error } = await supabase.functions.invoke("generate-customer", {
      body: {},
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      const status = (error as any)?.context?.status as number | undefined;

      if (status === 429) throw new Error("Rate limit exceeded");
      if (status === 402) throw new Error("AI credits exhausted");
      if (status === 401 || status === 403) throw new Error("Unauthorized");

      throw error;
    }

    if (!data) throw new Error("No data returned");
    return data as GeneratedCustomer;
  };

  const generateAndSaveCustomer = async (): Promise<string | null> => {
    if (!portfolioManager) return null;

    const customerData = await invokeGenerateCustomer();

    // Save customer
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({
        name: customerData.name,
        sector: customerData.sector as CustomerSector,
        segment: customerData.segment as CustomerSegment,
        status: customerData.status as CustomerStatus,
        principality_score: Math.round(customerData.principality_score),
        portfolio_manager_id: portfolioManager.id,
        last_activity_date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (customerError) throw customerError;

    // Save products
    if (customerData.products.length > 0) {
      const customerProducts = customerData.products.map((p) => ({
        customer_id: customer.id,
        product_id: p.product_id,
        current_value: p.current_value,
      }));

      const { error: productsError } = await supabase
        .from("customer_products")
        .insert(customerProducts);

      if (productsError) throw productsError;
    }

    return customerData.name;
  };

  const handleCancelBatch = () => {
    cancelledRef.current = true;
  };

  const handleBatchGenerate = async () => {
    if (!portfolioManager || batchCount < 1) return;

    cancelledRef.current = false;
    setIsBatchMode(true);
    setBatchProgress({ current: 0, total: batchCount, names: [], currentStep: 'Starting...' });

    let successCount = 0;
    const createdNames: string[] = [];

    for (let i = 0; i < batchCount; i++) {
      if (cancelledRef.current) {
        toast.info(`Cancelled. Created ${successCount} customers.`);
        break;
      }

      try {
        setBatchProgress(prev => ({ ...prev, currentStep: `Generating customer ${i + 1}...` }));
        const customerData = await invokeGenerateCustomer();
        
        if (cancelledRef.current) {
          toast.info(`Cancelled. Created ${successCount} customers.`);
          break;
        }

        setBatchProgress(prev => ({ ...prev, currentStep: `Saving "${customerData.name}"...` }));
        
        // Save customer
        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .insert({
            name: customerData.name,
            sector: customerData.sector as CustomerSector,
            segment: customerData.segment as CustomerSegment,
            status: customerData.status as CustomerStatus,
            principality_score: Math.round(customerData.principality_score),
            portfolio_manager_id: portfolioManager.id,
            last_activity_date: new Date().toISOString().split("T")[0],
          })
          .select()
          .single();

        if (customerError) throw customerError;

        // Save products
        if (customerData.products.length > 0) {
          const customerProducts = customerData.products.map((p) => ({
            customer_id: customer.id,
            product_id: p.product_id,
            current_value: p.current_value,
          }));

          const { error: productsError } = await supabase
            .from("customer_products")
            .insert(customerProducts);

          if (productsError) throw productsError;
        }

        successCount++;
        createdNames.push(customerData.name);
        setBatchProgress({ current: i + 1, total: batchCount, names: [...createdNames], currentStep: '' });
      } catch (error) {
        console.error(`Error generating customer ${i + 1}:`, error);

        if (error instanceof Error) {
          if (error.message.includes("Rate limit") || error.message.includes("credits")) {
            toast.error(error.message);
            break;
          }

          if (error.message.includes("Unauthorized")) {
            toast.error("Your session expired. Please sign in again.");
            break;
          }

          toast.error(error.message);
        } else {
          toast.error("Failed to create customer");
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ["customers"] });
    if (!cancelledRef.current) {
      toast.success(`Created ${successCount} customers`);
    }
    
    setTimeout(() => {
      setIsBatchMode(false);
      setBatchProgress({ current: 0, total: 0, names: [], currentStep: '' });
      onOpenChange(false);
    }, 1500);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedCustomer(null);

    try {
      const data = await invokeGenerateCustomer();
      setGeneratedCustomer(data);
    } catch (error) {
      console.error("Error generating customer:", error);

      if (error instanceof Error) {
        if (error.message.includes("Rate limit")) {
          toast.error("Rate limit exceeded. Please try again later.");
          return;
        }
        if (error.message.includes("credits")) {
          toast.error("AI usage credits exhausted.");
          return;
        }
        if (error.message.includes("Unauthorized")) {
          toast.error("Your session expired. Please sign in again.");
          return;
        }
      }

      toast.error("Failed to generate customer data");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedCustomer || !portfolioManager) return;

    setIsSaving(true);
    try {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: generatedCustomer.name,
          sector: generatedCustomer.sector as CustomerSector,
          segment: generatedCustomer.segment as CustomerSegment,
          status: generatedCustomer.status as CustomerStatus,
          principality_score: Math.round(generatedCustomer.principality_score),
          portfolio_manager_id: portfolioManager.id,
          last_activity_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (customerError) throw customerError;

      if (generatedCustomer.products.length > 0) {
        const customerProducts = generatedCustomer.products.map(p => ({
          customer_id: customer.id,
          product_id: p.product_id,
          current_value: p.current_value,
        }));

        const { error: productsError } = await supabase
          .from("customer_products")
          .insert(customerProducts);

        if (productsError) throw productsError;
      }

      toast.success(`Customer "${generatedCustomer.name}" created successfully`);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onOpenChange(false);
      setGeneratedCustomer(null);
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Failed to save customer");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Customer with AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isBatchMode && (
            <div className="space-y-4">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Creating customers... {batchProgress.current} / {batchProgress.total}
                </p>
                {batchProgress.currentStep && (
                  <p className="text-xs text-muted-foreground/70 mt-1">{batchProgress.currentStep}</p>
                )}
              </div>
              <Progress value={(batchProgress.current / batchProgress.total) * 100} />
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelBatch}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
              {batchProgress.names.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {batchProgress.names.map((name, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isBatchMode && !generatedCustomer && !isGenerating && (
            <div className="space-y-6">
              {/* Batch Generation */}
              <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="batch-count" className="text-sm font-medium">Batch Generation</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    id="batch-count"
                    type="number"
                    min={1}
                    max={50}
                    value={batchCount}
                    onChange={(e) => setBatchCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">customers (max 50)</span>
                </div>
                <Button onClick={handleBatchGenerate} className="w-full" variant="default">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate & Save {batchCount} Customers
                </Button>
              </div>

              {/* Single Generation */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">Or generate one at a time with preview</p>
                <Button onClick={handleGenerate} variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Single Customer
                </Button>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Generating customer data...</p>
            </div>
          )}

          {generatedCustomer && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-muted/30">
                <h3 className="font-semibold text-lg mb-3">{generatedCustomer.name}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Sector: </span>
                    <span>{generatedCustomer.sector}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Segment: </span>
                    <span>{generatedCustomer.segment}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status: </span>
                    <Badge variant="secondary">{generatedCustomer.status}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Score: </span>
                    <span>{generatedCustomer.principality_score}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Products ({generatedCustomer.products.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {generatedCustomer.products.map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-2 rounded bg-muted/30 text-sm">
                      <span>{getProductName(product.product_id)}</span>
                      <Badge variant="outline">{formatCurrency(product.current_value)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {generatedCustomer && (
            <>
              <Button variant="outline" onClick={handleGenerate} disabled={isGenerating || isSaving}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Save Customer
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};