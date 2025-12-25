import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TrendingUp, AlertCircle, Plus, Bot } from "lucide-react";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCustomerById } from "@/data/customers";
import { getCustomerProducts } from "@/data/customerProducts";
import { getProductById } from "@/data/products";
import { getActionsByCustomerId, actionNames } from "@/data/actions";
import { ActionPlanningModal } from "@/components/actions/ActionPlanningModal";
import { AICustomerSummary } from "@/components/customer/AICustomerSummary";
import { PrincipalityScoreModal } from "@/components/customer/PrincipalityScoreModal";
import { AutoPilotPanel } from "@/components/customer/AutoPilotPanel";
import { cn } from "@/lib/utils";
import { Action, ActionStatus, Priority } from "@/types";

type ViewMode = "products" | "actions" | "autopilot";

const CustomerDetail = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("products");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ActionStatus | "all">("all");
  const [showPrincipalityModal, setShowPrincipalityModal] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);
  const [newActionName, setNewActionName] = useState<string>("");
  const [newActionProduct, setNewActionProduct] = useState<string>("");

  const customer = getCustomerById(customerId || "");
  const customerProducts = getCustomerProducts(customerId || "");
  const customerActions = getActionsByCustomerId(customerId || "");

  // Calculate total balance for principality modal
  const totalBalance = customerProducts.reduce((sum, cp) => sum + cp.currentValue, 0);
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const filteredActions = customerActions.filter(action => {
    if (priorityFilter !== "all" && action.priority !== priorityFilter) return false;
    if (statusFilter !== "all" && action.status !== statusFilter) return false;
    return true;
  });

  const sortedActions = [...filteredActions].sort((a, b) => {
    const productA = customerProducts.find(cp => cp.productId === a.productId);
    const productB = customerProducts.find(cp => cp.productId === b.productId);
    const gapA = productA ? Math.abs(productA.gap) : 0;
    const gapB = productB ? Math.abs(productB.gap) : 0;
    
    // First sort by product gap (descending - larger gap = more critical)
    if (gapB !== gapA) return gapB - gapA;
    
    // Then by action priority
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const getPriorityBadgeVariant = (priority: Action["priority"]) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
    }
  };

  const getStatusBadgeVariant = (status: Action["status"]) => {
    switch (status) {
      case "completed": return "default";
      case "planned": return "outline";
      case "pending": return "secondary";
      default: return "secondary";
    }
  };

  if (!customer) {
    return <AppLayout><div className="text-center py-12">Customer not found</div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <PageBreadcrumb items={[{ label: "Customers", href: "/customers" }, { label: customer.name }]} />
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
              <Badge variant={customer.isPrimaryBank ? "default" : "secondary"}>
                {customer.isPrimaryBank ? "Primary Bank" : "Non-Primary"}
              </Badge>
            </div>
            <p className="text-muted-foreground">{customer.sector} · {customer.segment}</p>
          </div>
          <div 
            className="text-right cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setShowPrincipalityModal(true)}
          >
            <div className="text-sm text-muted-foreground">Principality Score</div>
            <div className="text-2xl font-bold text-primary underline decoration-dotted underline-offset-4">{customer.principalityScore}%</div>
          </div>
        </div>

        {/* AI Customer Summary */}
        <AICustomerSummary 
          customer={customer} 
          customerProducts={customerProducts} 
          actionsCount={customerActions.length} 
        />

        <div>
          <div className="flex items-center gap-4 mb-4">
            <h2 
              className={cn(
                "text-lg font-semibold cursor-pointer transition-colors",
                viewMode === "products" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode("products")}
            >
              Products
            </h2>
            <span className="text-muted-foreground">|</span>
            <h2 
              className={cn(
                "text-lg font-semibold cursor-pointer transition-colors",
                viewMode === "actions" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode("actions")}
            >
              Actions
            </h2>
            <span className="text-muted-foreground">|</span>
            <h2 
              className={cn(
                "text-lg font-semibold cursor-pointer transition-colors flex items-center gap-1.5",
                viewMode === "autopilot" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode("autopilot")}
            >
              <Bot className="h-4 w-4" />
              AutoPilot
            </h2>
          </div>

          {viewMode === "products" ? (
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
          ) : viewMode === "actions" ? (
            <div className="space-y-4">
              <div className="flex gap-4 items-center justify-between">
                <div className="flex gap-4">
                  <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val as Priority | "all")}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as ActionStatus | "all")}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="postponed">Postponed</SelectItem>
                      <SelectItem value="not_interested">Not Interested</SelectItem>
                      <SelectItem value="not_possible">Not Possible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAddAction(!showAddAction)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add New Action
                </Button>
              </div>

              {showAddAction && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Add New Action</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 items-end">
                      <div className="flex-1 space-y-1">
                        <label className="text-xs text-muted-foreground">Product</label>
                        <Select value={newActionProduct} onValueChange={setNewActionProduct}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {customerProducts.map((cp) => {
                              const product = getProductById(cp.productId);
                              return product ? (
                                <SelectItem key={cp.productId} value={cp.productId}>
                                  {product.name}
                                </SelectItem>
                              ) : null;
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-xs text-muted-foreground">Action</label>
                        <Select value={newActionName} onValueChange={setNewActionName}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select action" />
                          </SelectTrigger>
                          <SelectContent>
                            {actionNames.map((name) => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        size="sm"
                        disabled={!newActionName || !newActionProduct}
                        onClick={() => {
                          // In a real app, this would add to the database
                          setShowAddAction(false);
                          setNewActionName("");
                          setNewActionProduct("");
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Action Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gap</TableHead>
                    <TableHead>Planned Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedActions.map((action) => {
                    const product = getProductById(action.productId);
                    const customerProduct = customerProducts.find(cp => cp.productId === action.productId);
                    
                    return (
                      <TableRow 
                        key={action.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedProductId(action.productId)}
                      >
                        <TableCell className="font-medium">{product?.name || "Unknown"}</TableCell>
                        <TableCell>{action.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {action.type === 'model_based' ? 'Model' : 'Ad-hoc'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityBadgeVariant(action.priority)} className="capitalize">
                            {action.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(action.status)} className="capitalize">
                            {action.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className={customerProduct && customerProduct.gap < 0 ? "text-destructive" : "text-success"}>
                          {customerProduct ? `₺${Math.abs(customerProduct.gap).toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell>{action.plannedDate || "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                  {sortedActions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No actions for this customer
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
            </div>
          ) : viewMode === "autopilot" ? (
            <AutoPilotPanel customerId={customerId || ""} />
          ) : null}
        </div>
      </div>

      <ActionPlanningModal
        open={!!selectedProductId}
        onOpenChange={(open) => !open && setSelectedProductId(null)}
        customerId={customerId || ""}
        productId={selectedProductId || ""}
      />

      <PrincipalityScoreModal
        open={showPrincipalityModal}
        onOpenChange={setShowPrincipalityModal}
        customer={customer}
        totalBalance={totalBalance}
      />
    </AppLayout>
  );
};

export default CustomerDetail;
