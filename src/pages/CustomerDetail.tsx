import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, AlertCircle, Clock, Calendar, CheckCircle, XCircle, Ban } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getCustomerById } from "@/data/customers";
import { getCustomerProducts, getCustomerProductByProductId } from "@/data/customerProducts";
import { getProductById } from "@/data/products";
import { getActionsByProductId } from "@/data/actions";
import { cn } from "@/lib/utils";

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

const CustomerDetail = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState("");

  const customer = getCustomerById(customerId || "");
  const customerProducts = getCustomerProducts(customerId || "");
  
  const selectedProduct = selectedProductId ? getProductById(selectedProductId) : null;
  const selectedCustomerProduct = selectedProductId ? getCustomerProductByProductId(customerId || "", selectedProductId) : null;
  const selectedActions = selectedProductId ? getActionsByProductId(customerId || "", selectedProductId) : [];

  const handleAction = (actionId: string, status: string) => {
    console.log(`Action ${actionId} marked as ${status}`, { explanation });
    setExplanation("");
  };

  if (!customer) {
    return <AppLayout><div className="text-center py-12">Customer not found</div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/customers")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
              <Badge variant={customer.isPrimaryBank ? "default" : "secondary"}>
                {customer.isPrimaryBank ? "Primary Bank" : "Non-Primary"}
              </Badge>
            </div>
            <p className="text-muted-foreground">{customer.sector} · {customer.segment}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Principality Score</div>
            <div className="text-2xl font-bold text-foreground">{customer.principalityScore}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products List */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Products & Actions</h2>
            <div className="space-y-3">
              {customerProducts.map((cp) => {
                const product = getProductById(cp.productId);
                if (!product) return null;
                const isAboveThreshold = cp.currentValue >= cp.threshold;
                const isSelected = selectedProductId === cp.productId;
                
                return (
                  <Card 
                    key={cp.id} 
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md", 
                      cp.actionsCount > 0 && "border-info/50",
                      isSelected && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedProductId(cp.productId)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium">{product.name}</CardTitle>
                        {cp.actionsCount > 0 && (
                          <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                            {cp.actionsCount} actions
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">{product.category}</span>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Current</span>
                          <span className="font-medium">₺{cp.currentValue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Threshold</span>
                          <span>₺{cp.threshold.toLocaleString()}</span>
                        </div>
                        <div className={cn("flex items-center gap-1 text-sm", isAboveThreshold ? "text-success" : "text-destructive")}>
                          {isAboveThreshold ? <TrendingUp className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                          <span>{isAboveThreshold ? "Above threshold" : `Gap: ₺${Math.abs(cp.gap).toLocaleString()}`}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Action Planning Panel */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Action Planning</h2>
            {selectedProductId && selectedProduct && selectedCustomerProduct ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{selectedProduct.name}</CardTitle>
                  <p className="text-xs text-muted-foreground capitalize">{selectedProduct.category}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Product Summary */}
                  <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
                    <div>
                      <span className="text-xs text-muted-foreground">Current</span>
                      <p className="text-sm font-semibold">₺{selectedCustomerProduct.currentValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Threshold</span>
                      <p className="text-sm font-semibold">₺{selectedCustomerProduct.threshold.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Gap</span>
                      <p className={cn("text-sm font-semibold", selectedCustomerProduct.gap > 0 ? "text-destructive" : "text-success")}>
                        {selectedCustomerProduct.gap > 0 ? `-₺${selectedCustomerProduct.gap.toLocaleString()}` : "On Target"}
                      </p>
                    </div>
                  </div>

                  {/* Actions List */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Pending Actions ({selectedActions.filter(a => a.status === 'pending').length})
                    </h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {selectedActions.filter(a => a.status === 'pending').map((action) => (
                        <div key={action.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{action.name}</span>
                                <Badge variant="outline" className={cn("text-xs", priorityColors[action.priority])}>
                                  {action.priority}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Ready in {action.timeToReady} days</span>
                            {action.targetValue && (
                              <>
                                <span>·</span>
                                <span>Target: ₺{action.targetValue.toLocaleString()}</span>
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            <Button size="sm" onClick={() => handleAction(action.id, 'planned')} className="gap-1 h-7 text-xs">
                              <Calendar className="h-3 w-3" /> Planned
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleAction(action.id, 'completed')} className="gap-1 h-7 text-xs text-success border-success/50 hover:bg-success/10">
                              <CheckCircle className="h-3 w-3" /> Completed
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleAction(action.id, 'postponed')} className="gap-1 h-7 text-xs">
                              <Clock className="h-3 w-3" /> Postponed
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleAction(action.id, 'not_interested')} className="gap-1 h-7 text-xs text-muted-foreground">
                              <XCircle className="h-3 w-3" /> Not Interested
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleAction(action.id, 'not_possible')} className="gap-1 h-7 text-xs text-destructive border-destructive/50 hover:bg-destructive/10">
                              <Ban className="h-3 w-3" /> Not Possible
                            </Button>
                          </div>
                        </div>
                      ))}
                      {selectedActions.filter(a => a.status === 'pending').length === 0 && (
                        <p className="text-muted-foreground text-center py-4 text-sm">No pending actions for this product.</p>
                      )}
                    </div>
                  </div>

                  {/* Explanation Field */}
                  <div>
                    <label className="text-xs font-medium">Explanation (optional)</label>
                    <Textarea
                      placeholder="Add notes or explanation..."
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      className="mt-1 text-sm"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Select a product to view and plan actions
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CustomerDetail;
