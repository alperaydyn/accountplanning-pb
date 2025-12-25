import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCustomerById } from "@/data/customers";
import { getCustomerProductByProductId } from "@/data/customerProducts";
import { getProductById } from "@/data/products";
import { getActionsByProductId } from "@/data/actions";
import { cn } from "@/lib/utils";

interface ActionPlanningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  productId: string;
}

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

const responseOptions = [
  { value: "pending", label: "Pending" },
  { value: "planned", label: "Planned" },
  { value: "completed", label: "Completed" },
  { value: "postponed", label: "Postponed" },
  { value: "not_interested", label: "Not Interested" },
  { value: "not_possible", label: "Not Possible" },
];

export function ActionPlanningModal({ open, onOpenChange, customerId, productId }: ActionPlanningModalProps) {
  const [customerExplanation, setCustomerExplanation] = useState("");
  const [actionStates, setActionStates] = useState<Record<string, { response: string; actionDate: string; volume: string }>>({});
  
  const customer = getCustomerById(customerId);
  const product = getProductById(productId);
  const customerProduct = getCustomerProductByProductId(customerId, productId);
  const actions = getActionsByProductId(customerId, productId);

  if (!customer || !product || !customerProduct) return null;

  const handleResponseChange = (actionId: string, response: string) => {
    setActionStates(prev => ({
      ...prev,
      [actionId]: { ...prev[actionId], response }
    }));
  };

  const handleDateChange = (actionId: string, actionDate: string) => {
    setActionStates(prev => ({
      ...prev,
      [actionId]: { ...prev[actionId], actionDate }
    }));
  };

  const handleVolumeChange = (actionId: string, volume: string) => {
    setActionStates(prev => ({
      ...prev,
      [actionId]: { ...prev[actionId], volume }
    }));
  };

  const getActionState = (actionId: string) => {
    return actionStates[actionId] || { response: "pending", actionDate: "", volume: "" };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.name} - Action Planning</DialogTitle>
          <p className="text-sm text-muted-foreground">{customer.name}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <span className="text-xs text-muted-foreground">Current Value</span>
              <p className="text-lg font-semibold">₺{customerProduct.currentValue.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Threshold</span>
              <p className="text-lg font-semibold">₺{customerProduct.threshold.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Gap</span>
              <p className={cn("text-lg font-semibold", customerProduct.gap > 0 ? "text-destructive" : "text-success")}>
                {customerProduct.gap > 0 ? `-₺${customerProduct.gap.toLocaleString()}` : "On Target"}
              </p>
            </div>
          </div>

          {/* Actions List */}
          <div>
            <h3 className="font-semibold mb-3">Actions ({actions.length})</h3>
            <div className="space-y-4">
              {actions.map((action) => {
                const state = getActionState(action.id);
                const isPlanned = state.response !== "pending" && state.response !== "";
                
                return (
                  <div key={action.id} className="border rounded-lg p-4 space-y-4">
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
                      </div>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>

                    {/* Response, Action Time & Volume Row */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Response</label>
                        <Select value={state.response} onValueChange={(value) => handleResponseChange(action.id, value)}>
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
                        <label className="text-xs text-muted-foreground block mb-1">Estimated Action Time</label>
                        <Input
                          type="datetime-local"
                          value={state.actionDate}
                          onChange={(e) => handleDateChange(action.id, e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Volume (₺)</label>
                        <Input
                          type="number"
                          placeholder="Enter volume"
                          value={state.volume}
                          onChange={(e) => handleVolumeChange(action.id, e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Action Explanation */}
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Action Explanation</label>
                      <p className="text-sm p-2 bg-muted/50 rounded-md min-h-[2rem]">
                        {isPlanned ? (action.explanation || "No explanation provided") : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
              {actions.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No actions for this product.</p>
              )}
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
