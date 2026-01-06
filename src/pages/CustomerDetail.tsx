import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TrendingUp, AlertCircle, Plus, Bot, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getCustomerById } from "@/data/customers";
import { getCustomerProducts } from "@/data/customerProducts";
import { getProductById } from "@/data/products";
import { getActionsByCustomerId, actionNames } from "@/data/actions";
import { getRequirementsForAction, ActionRequiredField } from "@/data/actionRequirements";
import { ActionPlanningModal } from "@/components/actions/ActionPlanningModal";
import { AICustomerSummary } from "@/components/customer/AICustomerSummary";
import { PrincipalityScoreModal } from "@/components/customer/PrincipalityScoreModal";
import { AutoPilotPanel } from "@/components/customer/AutoPilotPanel";
import { cn } from "@/lib/utils";
import { Action, ActionStatus, CustomerStatus, Priority } from "@/types";

type SortColumn = "product" | "name" | "type" | "priority" | "status" | "gap" | "plannedDate";
type SortDirection = "asc" | "desc";

const getStatusLabel = (status: CustomerStatus): string => {
  const labels: Record<CustomerStatus, string> = {
    inactive: "Inactive",
    active: "Active",
    target: "Target",
    strong_target: "Strong Target",
    primary: "Primary",
  };
  return labels[status];
};

const getStatusBadgeClass = (status: CustomerStatus): string => {
  switch (status) {
    case "primary": return "bg-emerald-600 text-white hover:bg-emerald-600";
    case "strong_target": return "bg-amber-500 text-white hover:bg-amber-500";
    case "target": return "bg-sky-500 text-white hover:bg-sky-500";
    case "active": return "bg-slate-400 text-white hover:bg-slate-400";
    case "inactive": return "bg-slate-200 text-slate-600 hover:bg-slate-200";
  }
};

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
  const [newActionExplanation, setNewActionExplanation] = useState<string>("");
  const [newActionRequiredFields, setNewActionRequiredFields] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<SortColumn>("gap");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const selectedActionRequirements = getRequirementsForAction(newActionName);

  const handleRequiredFieldChange = (fieldName: string, value: string) => {
    setNewActionRequiredFields(prev => ({ ...prev, [fieldName]: value }));
  };

  const resetAddActionForm = () => {
    setShowAddAction(false);
    setNewActionName("");
    setNewActionProduct("");
    setNewActionExplanation("");
    setNewActionRequiredFields({});
  };

  const customer = getCustomerById(customerId || "");
  const customerProducts = getCustomerProducts(customerId || "");
  const customerActions = getActionsByCustomerId(customerId || "");

  // Calculate total balance for principality modal
  const totalBalance = customerProducts.reduce((sum, cp) => sum + cp.currentValue, 0);
  const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
  const statusOrder: Record<ActionStatus, number> = { pending: 0, planned: 1, completed: 2, postponed: 3, not_interested: 4, not_possible: 5 };

  const filteredActions = customerActions.filter(action => {
    if (priorityFilter !== "all" && action.priority !== priorityFilter) return false;
    if (statusFilter !== "all" && action.status !== statusFilter) return false;
    return true;
  });

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const sortedActions = useMemo(() => {
    return [...filteredActions].sort((a, b) => {
      const productA = getProductById(a.productId);
      const productB = getProductById(b.productId);
      const customerProductA = customerProducts.find(cp => cp.productId === a.productId);
      const customerProductB = customerProducts.find(cp => cp.productId === b.productId);
      const gapA = customerProductA?.gap ? Math.abs(customerProductA.gap) : 0;
      const gapB = customerProductB?.gap ? Math.abs(customerProductB.gap) : 0;

      let comparison = 0;
      switch (sortColumn) {
        case "product":
          comparison = (productA?.name || "").localeCompare(productB?.name || "");
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "priority":
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case "status":
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case "gap":
          comparison = gapA - gapB;
          break;
        case "plannedDate":
          comparison = (a.plannedDate || "").localeCompare(b.plannedDate || "");
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredActions, sortColumn, sortDirection, customerProducts]);

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
              <Badge className={getStatusBadgeClass(customer.status)}>
                {getStatusLabel(customer.status)}
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
                const threshold = cp.threshold || 0;
                const gap = cp.gap || 0;
                const isAboveThreshold = cp.currentValue >= threshold;
                
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
                          <span>₺{threshold.toLocaleString()}</span>
                        </div>
                        <div className={cn("flex items-center gap-1 text-sm", isAboveThreshold ? "text-success" : "text-destructive")}>
                          {isAboveThreshold ? <TrendingUp className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                          <span>{isAboveThreshold ? "Above threshold" : `Gap: ₺${Math.abs(gap).toLocaleString()}`}</span>
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
                  size="sm" 
                  onClick={() => setShowAddAction(!showAddAction)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add New Action
                </Button>
              </div>

              {showAddAction && (
                <Card className="border-emerald-200 bg-slate-50/80">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Add New Action</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Product</Label>
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
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Action</Label>
                        <Select value={newActionName} onValueChange={(value) => {
                          setNewActionName(value);
                          setNewActionRequiredFields({});
                        }}>
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
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Explanation</Label>
                      <Textarea 
                        placeholder="Enter action explanation..."
                        value={newActionExplanation}
                        onChange={(e) => setNewActionExplanation(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>

                    {selectedActionRequirements.length > 0 && (
                      <div className="border rounded-lg p-4 bg-background">
                        <h4 className="text-sm font-medium mb-3 text-foreground">Required Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedActionRequirements.map((field) => (
                            <div key={field.name} className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">{field.name}</Label>
                              {field.type === 'select' && field.options ? (
                                <Select 
                                  value={newActionRequiredFields[field.name] || ''} 
                                  onValueChange={(value) => handleRequiredFieldChange(field.name, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.options.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : field.type === 'currency' ? (
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₺</span>
                                  <Input 
                                    type="number"
                                    placeholder="0"
                                    className="pl-7"
                                    value={newActionRequiredFields[field.name] || ''}
                                    onChange={(e) => handleRequiredFieldChange(field.name, e.target.value)}
                                  />
                                </div>
                              ) : field.type === 'number' ? (
                                <Input 
                                  type="number"
                                  placeholder="0"
                                  value={newActionRequiredFields[field.name] || ''}
                                  onChange={(e) => handleRequiredFieldChange(field.name, e.target.value)}
                                />
                              ) : field.type === 'date' ? (
                                <Input 
                                  type="date"
                                  value={newActionRequiredFields[field.name] || ''}
                                  onChange={(e) => handleRequiredFieldChange(field.name, e.target.value)}
                                />
                              ) : (
                                <Input 
                                  type="text"
                                  placeholder={`Enter ${field.name.toLowerCase()}`}
                                  value={newActionRequiredFields[field.name] || ''}
                                  onChange={(e) => handleRequiredFieldChange(field.name, e.target.value)}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button 
                        size="sm"
                        disabled={!newActionName || !newActionProduct}
                        onClick={resetAddActionForm}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Add Action
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("product")}>
                      <div className="flex items-center">Product{getSortIcon("product")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("name")}>
                      <div className="flex items-center">Action Name{getSortIcon("name")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("type")}>
                      <div className="flex items-center">Type{getSortIcon("type")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("priority")}>
                      <div className="flex items-center">Priority{getSortIcon("priority")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("status")}>
                      <div className="flex items-center">Status{getSortIcon("status")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("gap")}>
                      <div className="flex items-center">Gap{getSortIcon("gap")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("plannedDate")}>
                      <div className="flex items-center">Planned Date{getSortIcon("plannedDate")}</div>
                    </TableHead>
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
