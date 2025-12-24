import { useState } from "react";
import { Calendar, CheckCircle, Clock, XCircle, Ban } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

export function ActionPlanningModal({ open, onOpenChange, customerId, productId }: ActionPlanningModalProps) {
  const [explanation, setExplanation] = useState("");
  
  const customer = getCustomerById(customerId);
  const product = getProductById(productId);
  const customerProduct = getCustomerProductByProductId(customerId, productId);
  const actions = getActionsByProductId(customerId, productId);

  if (!customer || !product || !customerProduct) return null;

  const handleAction = (actionId: string, status: string) => {
    console.log(`Action ${actionId} marked as ${status}`, { explanation });
    setExplanation("");
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
              {actions.map((action) => (
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

                  {/* Response & Action Time Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Response</label>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => handleAction(action.id, 'planned')} className="gap-1">
                          <Calendar className="h-3 w-3" /> Planned
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleAction(action.id, 'completed')} className="gap-1 text-success border-success/50 hover:bg-success/10">
                          <CheckCircle className="h-3 w-3" /> Done
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleAction(action.id, 'postponed')} className="gap-1">
                          <Clock className="h-3 w-3" /> Postponed
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleAction(action.id, 'not_possible')} className="gap-1 text-destructive border-destructive/50 hover:bg-destructive/10">
                          <Ban className="h-3 w-3" /> Not Possible
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Estimated Action Time</label>
                      <p className="text-sm font-medium">{action.estimatedActionTime} days</p>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Explanation</label>
                    <p className="text-sm p-2 bg-muted/50 rounded-md">{action.explanation || "No explanation provided"}</p>
                  </div>
                </div>
              ))}
              {actions.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No actions for this product.</p>
              )}
            </div>
          </div>

          {/* Explanation Field */}
          <div>
            <label className="text-sm font-medium">Explanation (optional)</label>
            <Textarea
              placeholder="Add notes or explanation for your decision..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
