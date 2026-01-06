import { useState } from "react";
import { Loader2, Sparkles, RefreshCw, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const queryClient = useQueryClient();
  const { data: products = [] } = useProducts();
  const { data: portfolioManager } = usePortfolioManager();

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || productId;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedCustomer(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-customer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
          return;
        }
        if (response.status === 402) {
          toast.error("AI usage credits exhausted.");
          return;
        }
        throw new Error(error.error || "Failed to generate customer");
      }

      const data = await response.json();
      setGeneratedCustomer(data);
    } catch (error) {
      console.error("Error generating customer:", error);
      toast.error("Failed to generate customer data");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedCustomer || !portfolioManager) return;

    setIsSaving(true);
    try {
      // Create customer
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: generatedCustomer.name,
          sector: generatedCustomer.sector as CustomerSector,
          segment: generatedCustomer.segment as CustomerSegment,
          status: generatedCustomer.status as CustomerStatus,
          principality_score: generatedCustomer.principality_score,
          portfolio_manager_id: portfolioManager.id,
          last_activity_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (customerError) throw customerError;

      // Create customer products
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

  const handleClose = () => {
    onOpenChange(false);
    setGeneratedCustomer(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Customer with AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!generatedCustomer && !isGenerating && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Click generate to create a new customer with AI-generated data including realistic product holdings.
              </p>
              <Button onClick={handleGenerate}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Customer
              </Button>
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
