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
            <h3 className="font-semibold mb-3">Pending Actions ({actions.filter(a => a.status === 'pending').length})</h3>
            <div className="space-y-3">
              {actions.filter(a => a.status === 'pending').map((action) => (
                <div key={action.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{action.name}</span>
                        <Badge variant="outline" className={priorityColors[action.priority]}>
                          {action.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {action.type === 'model_based' ? 'Model' : 'Ad-hoc'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Ready in {action.timeToReady} days</span>
                    {action.targetValue && (
                      <>
                        <span className="mx-2">·</span>
                        <span>Target: ₺{action.targetValue.toLocaleString()}</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => handleAction(action.id, 'planned')} className="gap-1">
                      <Calendar className="h-4 w-4" /> Planned
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(action.id, 'completed')} className="gap-1 text-success border-success/50 hover:bg-success/10">
                      <CheckCircle className="h-4 w-4" /> Completed
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(action.id, 'postponed')} className="gap-1">
                      <Clock className="h-4 w-4" /> Postponed
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(action.id, 'not_interested')} className="gap-1 text-muted-foreground">
                      <XCircle className="h-4 w-4" /> Not Interested
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(action.id, 'not_possible')} className="gap-1 text-destructive border-destructive/50 hover:bg-destructive/10">
                      <Ban className="h-4 w-4" /> Not Possible
                    </Button>
                  </div>
                </div>
              ))}
              {actions.filter(a => a.status === 'pending').length === 0 && (
                <p className="text-muted-foreground text-center py-4">No pending actions for this product.</p>
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
