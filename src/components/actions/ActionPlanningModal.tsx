import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Lightbulb, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { useCustomerById } from "@/hooks/useCustomers";
import { useCustomerProducts } from "@/hooks/useCustomerProducts";
import { useProducts } from "@/hooks/useProducts";
import { useActionsByCustomer, Action } from "@/hooks/useActions";
import { useActionUpdates, useCreateActionUpdate } from "@/hooks/useActionUpdates";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";
import { PriorityScoreCard } from "./PriorityScoreCard";

interface ActionPlanningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  actionIds: string[]; // Now accepts multiple action IDs
  initialActionId?: string; // Optional: which action to show first
}

type ActionStatus = Database['public']['Enums']['action_status'];

const statusMapping: Record<string, ActionStatus> = {
  "Beklemede": "Beklemede",
  "Planlandı": "Planlandı",
  "Tamamlandı": "Tamamlandı",
  "Ertelendi": "Ertelendi",
  "İlgilenmiyor": "İlgilenmiyor",
  "Uygun Değil": "Uygun Değil",
};

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

const statusColors: Record<ActionStatus, string> = {
  "Beklemede": "bg-muted text-muted-foreground",
  "Planlandı": "bg-success/20 text-success border-success/30",
  "Tamamlandı": "bg-primary/20 text-primary border-primary/30",
  "Ertelendi": "bg-warning/20 text-warning border-warning/30",
  "İlgilenmiyor": "bg-destructive/20 text-destructive border-destructive/30",
  "Uygun Değil": "bg-destructive/20 text-destructive border-destructive/30",
};

const responseOptions = [
  { value: "Beklemede", label: "Pending" },
  { value: "Planlandı", label: "Planned" },
  { value: "Tamamlandı", label: "Completed" },
  { value: "Ertelendi", label: "Postponed" },
  { value: "İlgilenmiyor", label: "Not Interested" },
  { value: "Uygun Değil", label: "Not Possible" },
];

// Format number with thousand separators
const formatWithThousandSeparator = (value: string | number): string => {
  const numericValue = String(value).replace(/[^\d]/g, '');
  if (!numericValue) return '';
  return Number(numericValue).toLocaleString('tr-TR');
};

// Parse formatted number back to raw number
const parseFormattedNumber = (value: string): number => {
  return Number(value.replace(/[^\d]/g, '')) || 0;
};

const getDefaultState = () => ({
  response: "Beklemede" as string,
  actionDate: "",
  volume: "",
  responseText: "",
});

export function ActionPlanningModal({ 
  open, 
  onOpenChange, 
  customerId, 
  actionIds,
  initialActionId 
}: ActionPlanningModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customerExplanation, setCustomerExplanation] = useState("");
  const [actionState, setActionState] = useState(getDefaultState());
  const [hintsExpanded, setHintsExpanded] = useState(false);
  
  const { toast } = useToast();
  const { data: customer } = useCustomerById(customerId);
  const { data: allProducts = [] } = useProducts();
  const { data: customerProducts = [] } = useCustomerProducts(customerId);
  const { data: customerActions = [] } = useActionsByCustomer(customerId);
  const createActionUpdate = useCreateActionUpdate();

  // Get current action ID based on carousel index
  const currentActionId = actionIds[currentIndex];
  
  // Fetch updates for current action
  const { data: updates = [] } = useActionUpdates(currentActionId);

  // Find actions in the order specified by actionIds
  const actions = useMemo(() => {
    return actionIds
      .map(id => customerActions.find(a => a.id === id))
      .filter((a): a is Action => !!a);
  }, [actionIds, customerActions]);

  const action = actions[currentIndex];
  const product = action ? allProducts.find(p => p.id === action.product_id) : null;
  const customerProduct = action ? customerProducts.find(cp => cp.product_id === action.product_id) : null;

  // Set initial index based on initialActionId
  useEffect(() => {
    if (open && initialActionId) {
      const idx = actionIds.indexOf(initialActionId);
      if (idx >= 0) {
        setCurrentIndex(idx);
      }
    }
  }, [open, initialActionId, actionIds]);

  // Reset fields when action changes or modal closes
  useEffect(() => {
    if (!open) {
      setCurrentIndex(0);
      setActionState(getDefaultState());
      setCustomerExplanation("");
      setHintsExpanded(false);
      return;
    }
    
    // Load data from action and its latest update
    if (action) {
      const latestUpdate = updates[0]; // Most recent update
      
      setActionState({
        response: action.current_status || "Beklemede",
        actionDate: latestUpdate?.new_date || action.current_planned_date || "",
        volume: latestUpdate?.new_value 
          ? formatWithThousandSeparator(latestUpdate.new_value) 
          : action.current_value 
            ? formatWithThousandSeparator(action.current_value)
            : "",
        responseText: latestUpdate?.response_text || "",
      });
      setCustomerExplanation(latestUpdate?.notes || "");
      setHintsExpanded(false);
    }
  // Note: updates is intentionally excluded to prevent infinite loop
  // (updates changes reference on re-render, causing effect to re-run)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentActionId, action]);

  if (!customer || !action || !product) return null;

  const handleResponseChange = (response: string) => {
    setActionState(prev => ({ ...prev, response }));
  };

  const handleDateChange = (actionDate: string) => {
    setActionState(prev => ({ ...prev, actionDate }));
  };

  const handleVolumeChange = (value: string) => {
    const formatted = formatWithThousandSeparator(value);
    setActionState(prev => ({ ...prev, volume: formatted }));
  };

  const handleResponseTextChange = (responseText: string) => {
    setActionState(prev => ({ ...prev, responseText }));
  };

  const handleSave = async () => {
    const newStatus = statusMapping[actionState.response];
    const newValue = parseFormattedNumber(actionState.volume);
    
    try {
      await createActionUpdate.mutateAsync({
        action_id: currentActionId,
        update_type: 'response',
        previous_status: action.current_status,
        new_status: newStatus,
        previous_value: action.current_value ?? undefined,
        new_value: newValue || undefined,
        previous_date: action.current_planned_date ?? undefined,
        new_date: actionState.actionDate || undefined,
        response_text: actionState.responseText || undefined,
        notes: customerExplanation || undefined,
      });

      toast({
        title: "Action saved",
        description: "The action response has been saved successfully.",
      });

      // If there's a next action, move to it. Otherwise close.
      if (currentIndex < actionIds.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save action response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < actionIds.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentValue = customerProduct ? Number(customerProduct.current_value) : 0;
  const threshold = customerProduct?.threshold || 0;
  const gap = customerProduct?.gap || 0;
  const isOwned = !!customerProduct;
  const hasMultipleActions = actionIds.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.name} - Action Planning</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {customer.name}
            {!isOwned && <span className="ml-2 text-warning">(Product not owned)</span>}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Summary */}
          {isOwned ? (
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <span className="text-xs text-muted-foreground">Current Value</span>
                <p className="text-lg font-semibold">₺{currentValue.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Threshold</span>
                <p className="text-lg font-semibold">₺{threshold.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Gap</span>
                <p className={cn("text-lg font-semibold", gap > 0 ? "text-destructive" : "text-success")}>
                  {gap > 0 ? `-₺${gap.toLocaleString()}` : "On Target"}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning">
                This is a cross-sell action for a product the customer doesn't currently own.
              </p>
            </div>
          )}

          {/* Carousel Navigation */}
          {hasMultipleActions && (
            <div className="flex items-center justify-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2">
                {actionIds.map((id, idx) => {
                  const act = actions[idx];
                  const isPlanned = act && act.current_status === 'Planlandı';
                  return (
                    <button
                      key={id}
                      onClick={() => setCurrentIndex(idx)}
                      className={cn(
                        "h-8 w-8 rounded-full text-sm font-medium transition-all",
                        idx === currentIndex 
                          ? "bg-primary text-primary-foreground" 
                          : isPlanned
                            ? "bg-success/20 text-success hover:bg-success/30 border border-success/30"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleNext}
                disabled={currentIndex === actionIds.length - 1}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Single Action */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            {/* Action Name & Description */}
            <div className="min-h-[72px]">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-medium text-base">{action.name}</span>
                <Badge variant="outline" className={priorityColors[action.priority]}>
                  {action.priority}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {action.type === 'model_based' ? 'Model' : 'Ad-hoc'}
                </Badge>
                {/* Status Badge */}
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", statusColors[action.current_status])}
                >
                  {action.current_status}
                </Badge>
                {/* Always show lightbulb since we have priority scores */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-auto"
                  onClick={() => setHintsExpanded(!hintsExpanded)}
                >
                  <Lightbulb className={cn("h-4 w-4", hintsExpanded ? "text-warning" : "text-muted-foreground")} />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 h-10">{action.description}</p>
              
              {/* Hints Panel */}
              <Collapsible open={hintsExpanded}>
                <CollapsibleContent className="mt-2 space-y-3">
                  {/* Creation Reason & Customer Hints */}
                  {(action.creation_reason || action.customer_hints) && (
                    <div className="space-y-2 p-3 bg-warning/10 border border-warning/20 rounded-md">
                      {action.creation_reason && (
                        <div>
                          <span className="text-xs font-medium text-warning">Creation Reason:</span>
                          <p className="text-sm text-foreground">{action.creation_reason}</p>
                        </div>
                      )}
                      {action.customer_hints && (
                        <div>
                          <span className="text-xs font-medium text-warning">Customer Hints:</span>
                          <p className="text-sm text-foreground">{action.customer_hints}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Prioritization Reason */}
                  <PriorityScoreCard
                    portfolioScore={action.priority_portfolio_score}
                    portfolioReason={action.priority_portfolio_reason}
                    adhocScore={action.priority_adhoc_score}
                    adhocReason={action.priority_adhoc_reason}
                    customerScore={action.priority_customer_score}
                    customerReason={action.priority_customer_reason}
                    profitabilityScore={action.priority_profitability_score}
                    profitabilityReason={action.priority_profitability_reason}
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Response, Action Time & Volume Row */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Response</label>
                <Select value={actionState.response} onValueChange={handleResponseChange}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Select response" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {responseOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Estimated Action Date</label>
                <Input
                  type="date"
                  value={actionState.actionDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Volume (₺)</label>
                <Input
                  type="text"
                  placeholder="Enter volume"
                  value={actionState.volume}
                  onChange={(e) => handleVolumeChange(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Response Explanation */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Response Explanation</label>
              <Textarea
                placeholder="Explain your response..."
                value={actionState.responseText}
                onChange={(e) => handleResponseTextChange(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
          </div>

          {/* Customer Explanation Field */}
          <div>
            <label className="text-sm font-medium">Customer Explanation (optional)</label>
            <Textarea
              placeholder="Add notes or explanation for your decision..."
              value={customerExplanation}
              onChange={(e) => setCustomerExplanation(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={createActionUpdate.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {createActionUpdate.isPending ? "Saving..." : "Save Action"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
