import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Lightbulb } from "lucide-react";
import { useCustomerById } from "@/hooks/useCustomers";
import { useCustomerProducts } from "@/hooks/useCustomerProducts";
import { useProducts } from "@/hooks/useProducts";
import { useActionsByCustomer } from "@/hooks/useActions";
import { useActionUpdates } from "@/hooks/useActionUpdates";
import { cn } from "@/lib/utils";

interface ActionPlanningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  actionId: string;
}

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

const responseOptions = [
  { value: "Beklemede", label: "Pending" },
  { value: "Planlandı", label: "Planned" },
  { value: "Tamamlandı", label: "Completed" },
  { value: "Ertelendi", label: "Postponed" },
  { value: "İlgilenmiyor", label: "Not Interested" },
  { value: "Uygun Değil", label: "Not Possible" },
];

export function ActionPlanningModal({ open, onOpenChange, customerId, actionId }: ActionPlanningModalProps) {
  const [customerExplanation, setCustomerExplanation] = useState("");
  const [actionState, setActionState] = useState<{ response: string; actionDate: string; volume: string; responseText: string }>({
    response: "Beklemede",
    actionDate: "",
    volume: "",
    responseText: "",
  });
  const [hintsExpanded, setHintsExpanded] = useState(false);
  
  const { data: customer } = useCustomerById(customerId);
  const { data: allProducts = [] } = useProducts();
  const { data: customerProducts = [] } = useCustomerProducts(customerId);
  const { data: customerActions = [] } = useActionsByCustomer(customerId);
  const { data: updates = [] } = useActionUpdates(actionId);
  
  const action = customerActions.find(a => a.id === actionId);
  const product = action ? allProducts.find(p => p.id === action.product_id) : null;
  const customerProduct = action ? customerProducts.find(cp => cp.product_id === action.product_id) : null;

  // Only require customer, action, and product - customerProduct is optional for non-owned products
  if (!customer || !action || !product) return null;

  const handleResponseChange = (response: string) => {
    setActionState(prev => ({ ...prev, response }));
  };

  const handleDateChange = (actionDate: string) => {
    setActionState(prev => ({ ...prev, actionDate }));
  };

  const handleVolumeChange = (volume: string) => {
    setActionState(prev => ({ ...prev, volume }));
  };

  const handleResponseTextChange = (responseText: string) => {
    setActionState(prev => ({ ...prev, responseText }));
  };

  const currentValue = customerProduct ? Number(customerProduct.current_value) : 0;
  const threshold = customerProduct?.threshold || 0;
  const gap = customerProduct?.gap || 0;
  const isOwned = !!customerProduct;

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

          {/* Single Action */}
          <div className="border rounded-lg p-4 space-y-4">
            {/* Action Name & Description */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-base">{action.name}</span>
                <Badge variant="outline" className={priorityColors[action.priority]}>
                  {action.priority}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {action.type === 'model_based' ? 'Model' : 'Ad-hoc'}
                </Badge>
                {(action.creation_reason || action.customer_hints) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-auto"
                    onClick={() => setHintsExpanded(!hintsExpanded)}
                  >
                    <Lightbulb className={cn("h-4 w-4", hintsExpanded ? "text-warning" : "text-muted-foreground")} />
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{action.description}</p>
              
              {/* Hints Panel */}
              <Collapsible open={hintsExpanded}>
                <CollapsibleContent className="mt-2 space-y-2 p-3 bg-warning/10 border border-warning/20 rounded-md">
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
                  type="number"
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
      </DialogContent>
    </Dialog>
  );
}
