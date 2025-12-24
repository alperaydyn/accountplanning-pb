import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomerById } from "@/data/customers";
import { getCustomerProducts } from "@/data/customerProducts";
import { getProductById } from "@/data/products";
import { ActionPlanningModal } from "@/components/actions/ActionPlanningModal";
import { cn } from "@/lib/utils";

const CustomerDetail = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const customer = getCustomerById(customerId || "");
  const customerProducts = getCustomerProducts(customerId || "");

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

        <div>
          <h2 className="text-lg font-semibold mb-4">Products & Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customerProducts.map((cp) => {
              const product = getProductById(cp.productId);
              if (!product) return null;
              const isAboveThreshold = cp.currentValue >= cp.threshold;
              
              return (
                <Card 
                  key={cp.id} 
                  className={cn("cursor-pointer transition-all hover:shadow-md", cp.actionsCount > 0 && "border-info/50")}
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
      </div>

      <ActionPlanningModal
        open={!!selectedProductId}
        onOpenChange={(open) => !open && setSelectedProductId(null)}
        customerId={customerId || ""}
        productId={selectedProductId || ""}
      />
    </AppLayout>
  );
};

export default CustomerDetail;
