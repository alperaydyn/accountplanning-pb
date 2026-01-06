import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TrendingUp, AlertCircle, Plus, Bot, ArrowUpDown, ArrowUp, ArrowDown, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCustomerById } from "@/hooks/useCustomers";
import { useCustomerProducts, CustomerProduct } from "@/hooks/useCustomerProducts";
import { useProducts, Product } from "@/hooks/useProducts";
import { useActionsByCustomer, useCreateAction, Action, ACTION_STATUSES, ACTION_PRIORITIES } from "@/hooks/useActions";
import { useActionTemplates, ActionTemplate, ActionTemplateField } from "@/hooks/useActionTemplates";
import { ActionPlanningModal } from "@/components/actions/ActionPlanningModal";
import { AICustomerSummary } from "@/components/customer/AICustomerSummary";
import { PrincipalityScoreModal } from "@/components/customer/PrincipalityScoreModal";
import { AutoPilotPanel } from "@/components/customer/AutoPilotPanel";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";

type DBCustomerStatus = Database['public']['Enums']['customer_status'];
type DBActionStatus = Database['public']['Enums']['action_status'];
type DBActionPriority = Database['public']['Enums']['action_priority'];

type SortColumn = "product" | "name" | "type" | "priority" | "status" | "gap" | "plannedDate";
type SortDirection = "asc" | "desc";

const getStatusLabel = (status: DBCustomerStatus): string => {
  return status;
};

const getStatusBadgeClass = (status: DBCustomerStatus): string => {
  switch (status) {
    case "Ana Banka": return "bg-emerald-600 text-white hover:bg-emerald-600";
    case "Strong Target": return "bg-amber-500 text-white hover:bg-amber-500";
    case "Target": return "bg-sky-500 text-white hover:bg-sky-500";
    case "Aktif": return "bg-slate-400 text-white hover:bg-slate-400";
    case "Yeni Müşteri": return "bg-slate-200 text-slate-600 hover:bg-slate-200";
    default: return "bg-slate-200 text-slate-600 hover:bg-slate-200";
  }
};

type ViewMode = "products" | "actions" | "autopilot";

const CustomerDetail = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("products");
  const [priorityFilter, setPriorityFilter] = useState<DBActionPriority | "all">("all");
  const [statusFilter, setStatusFilter] = useState<DBActionStatus | "all">("all");
  const [showPrincipalityModal, setShowPrincipalityModal] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);
  const [newActionName, setNewActionName] = useState<string>("");
  const [newActionProduct, setNewActionProduct] = useState<string>("");
  const [newActionExplanation, setNewActionExplanation] = useState<string>("");
  const [newActionRequiredFields, setNewActionRequiredFields] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<SortColumn>("gap");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isGeneratingActions, setIsGeneratingActions] = useState(false);

  // Database hooks
  const { data: customer, isLoading: customerLoading } = useCustomerById(customerId);
  const { data: customerProducts = [], isLoading: productsLoading } = useCustomerProducts(customerId);
  const { data: customerActions = [], isLoading: actionsLoading } = useActionsByCustomer(customerId);
  const { data: allProducts = [] } = useProducts();
  const createAction = useCreateAction();
  
  // Fetch action templates for the selected product
  const { data: actionTemplates = [] } = useActionTemplates(newActionProduct || undefined);
  
  // Get the selected action template and its fields
  const selectedActionTemplate = actionTemplates.find(t => t.id === newActionName);
  const selectedActionRequirements = selectedActionTemplate?.fields || [];

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

  const handleAddAction = async () => {
    if (!newActionName || !newActionProduct || !customerId || !selectedActionTemplate) return;
    
    const today = new Date().toISOString().split('T')[0];
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
    
    // Build description from required fields
    const fieldsDescription = Object.entries(newActionRequiredFields)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    await createAction.mutateAsync({
      customer_id: customerId,
      product_id: newActionProduct,
      name: selectedActionTemplate.name,
      description: selectedActionTemplate.description || undefined,
      creation_reason: newActionExplanation || undefined,
      customer_hints: fieldsDescription || undefined,
      creator_name: 'User',
      source_data_date: today,
      action_target_date: endOfMonth,
      type: 'ad_hoc',
      priority: 'medium',
    });
    
    resetAddActionForm();
  };

  const handleGenerateActions = async () => {
    if (!customer || !customerId) return;
    
    setIsGeneratingActions(true);
    try {
      const ownedProductIds = customerProducts.map(cp => cp.product_id);
      
      const { data, error } = await supabase.functions.invoke('generate-actions', {
        body: {
          customer: {
            name: customer.name,
            segment: customer.segment,
            sector: customer.sector,
            status: customer.status,
            principality_score: customer.principality_score,
          },
          products: allProducts.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
          })),
          ownedProductIds,
        },
      });

      if (error) throw error;

      if (data?.actions && data.actions.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

        for (const action of data.actions) {
          await createAction.mutateAsync({
            customer_id: customerId,
            product_id: action.product_id,
            name: action.name,
            description: action.description,
            creation_reason: action.creation_reason,
            customer_hints: action.customer_hints,
            target_value: action.target_value,
            creator_name: 'AI Action Generator',
            source_data_date: today,
            action_target_date: endOfMonth,
            type: 'model_based',
            priority: action.priority,
          });
        }
        
        toast.success(`${data.actions.length} actions generated successfully`);
      } else {
        toast.info('No actions were generated for this customer');
      }
    } catch (error) {
      console.error('Error generating actions:', error);
      toast.error('Failed to generate actions');
    } finally {
      setIsGeneratingActions(false);
    }
  };

  // Helper to get product by ID from allProducts
  const getProductById = (productId: string): Product | undefined => {
    return allProducts.find(p => p.id === productId);
  };

  // Calculate total balance for principality modal
  const totalBalance = customerProducts.reduce((sum, cp) => sum + Number(cp.current_value), 0);
  
  const priorityOrder: Record<DBActionPriority, number> = { high: 0, medium: 1, low: 2 };
  const statusOrder: Record<DBActionStatus, number> = { 
    'Beklemede': 0, 
    'Planlandı': 1, 
    'Tamamlandı': 2, 
    'Ertelendi': 3, 
    'İlgilenmiyor': 4, 
    'Uygun Değil': 5 
  };

  const filteredActions = customerActions.filter(action => {
    if (priorityFilter !== "all" && action.priority !== priorityFilter) return false;
    if (statusFilter !== "all" && action.current_status !== statusFilter) return false;
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
      const productA = getProductById(a.product_id);
      const productB = getProductById(b.product_id);
      const customerProductA = customerProducts.find(cp => cp.product_id === a.product_id);
      const customerProductB = customerProducts.find(cp => cp.product_id === b.product_id);
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
          comparison = statusOrder[a.current_status] - statusOrder[b.current_status];
          break;
        case "gap":
          comparison = gapA - gapB;
          break;
        case "plannedDate":
          comparison = (a.current_planned_date || "").localeCompare(b.current_planned_date || "");
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredActions, sortColumn, sortDirection, customerProducts, allProducts]);

  const getPriorityBadgeVariant = (priority: DBActionPriority) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
    }
  };

  const getStatusBadgeVariant = (status: DBActionStatus) => {
    switch (status) {
      case "Tamamlandı": return "default";
      case "Planlandı": return "outline";
      case "Beklemede": return "secondary";
      default: return "secondary";
    }
  };

  const isLoading = customerLoading || productsLoading || actionsLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!customer) {
    return <AppLayout><div className="text-center py-12">Customer not found</div></AppLayout>;
  }

  // Convert customer data for components expecting simpler format
  const customerForComponents = {
    id: customer.id,
    name: customer.name,
    sector: customer.sector,
    segment: customer.segment,
    status: customer.status,
    principalityScore: customer.principality_score || 0,
  };

  // Convert customerProducts for AICustomerSummary
  const customerProductsForSummary = customerProducts.map(cp => ({
    productId: cp.product_id,
    currentValue: Number(cp.current_value),
    threshold: cp.threshold || 0,
  }));

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
            <div className="text-2xl font-bold text-primary underline decoration-dotted underline-offset-4">{customer.principality_score || 0}%</div>
          </div>
        </div>

        {/* AI Customer Summary */}
        <AICustomerSummary 
          customer={customerForComponents} 
          customerProducts={customerProductsForSummary} 
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
              {(() => {
                // Get all unique product IDs from customer products and actions
                const customerProductIds = new Set(customerProducts.map(cp => cp.product_id));
                const actionProductIds = new Set(customerActions.map(a => a.product_id));
                const allProductIds = new Set([...customerProductIds, ...actionProductIds]);
                
                // Get all products we need to display and sort by display_order
                const productsToDisplay = [...allProductIds]
                  .map(productId => {
                    const product = getProductById(productId);
                    const customerProduct = customerProducts.find(cp => cp.product_id === productId);
                    const actionsForProduct = customerActions.filter(a => a.product_id === productId);
                    return { productId, product, customerProduct, actionsForProduct };
                  })
                  .filter(item => item.product)
                  .sort((a, b) => (a.product?.display_order ?? 999) - (b.product?.display_order ?? 999));

                return productsToDisplay.map(({ productId, product, customerProduct, actionsForProduct }) => {
                  if (!product) return null;
                  const threshold = customerProduct?.threshold || 0;
                  const gap = customerProduct?.gap || 0;
                  const currentValue = customerProduct ? Number(customerProduct.current_value) : 0;
                  const isAboveThreshold = currentValue >= threshold;
                  const actionsCount = actionsForProduct.length;
                  const isOwned = !!customerProduct;
                  
                  return (
                    <Card 
                      key={productId} 
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        actionsCount > 0 && "border-info/50",
                        !isOwned && "bg-muted/30"
                      )}
                      onClick={() => {
                        if (actionsCount > 0) {
                          setSelectedActionId(actionsForProduct[0].id);
                        } else {
                          // Open Add Action panel with this product pre-selected
                          setNewActionProduct(productId);
                          setShowAddAction(true);
                          setViewMode("actions");
                        }
                      }}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-medium">{product.name}</CardTitle>
                          {actionsCount > 0 && (
                            <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                              {actionsCount} action{actionsCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">
                          {product.category}{!isOwned && " • Not owned"}
                        </span>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current</span>
                            <span className="font-medium">₺{currentValue.toLocaleString()}</span>
                          </div>
                          {isOwned && (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Threshold</span>
                                <span>₺{threshold.toLocaleString()}</span>
                              </div>
                              <div className={cn("flex items-center gap-1 text-sm", isAboveThreshold ? "text-success" : "text-destructive")}>
                                {isAboveThreshold ? <TrendingUp className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                <span>{isAboveThreshold ? "Above threshold" : `Gap: ₺${Math.abs(gap).toLocaleString()}`}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                });
              })()}
            </div>
          ) : viewMode === "actions" ? (
            <div className="space-y-4">
              <div className="flex gap-4 items-center justify-between">
                <div className="flex gap-4">
                  <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val as DBActionPriority | "all")}>
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
                  <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as DBActionStatus | "all")}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {ACTION_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleGenerateActions}
                    disabled={isGeneratingActions}
                    className="border-violet-500/50 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/20"
                  >
                    {isGeneratingActions ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-1" />
                    )}
                    Generate Actions
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setShowAddAction(!showAddAction)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add New Action
                  </Button>
                </div>
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
                        <Select 
                          value={newActionProduct} 
                          onValueChange={(value) => {
                            setNewActionProduct(value);
                            // Reset action selection when product changes
                            setNewActionName("");
                            setNewActionRequiredFields({});
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {allProducts
                              .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))
                              .map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Action</Label>
                        <Select 
                          value={newActionName} 
                          onValueChange={(value) => {
                            setNewActionName(value);
                            setNewActionRequiredFields({});
                          }}
                          disabled={!newActionProduct}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={newActionProduct ? "Select action" : "Select a product first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {actionTemplates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
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
                            <div key={field.id} className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">
                                {field.field_name}
                                {field.is_required && <span className="text-destructive ml-0.5">*</span>}
                              </Label>
                              {field.field_type === 'select' && field.field_options ? (
                                <Select 
                                  value={newActionRequiredFields[field.field_name] || ''} 
                                  onValueChange={(value) => handleRequiredFieldChange(field.field_name, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={`Select ${field.field_name.toLowerCase()}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.field_options.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : field.field_type === 'currency' ? (
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₺</span>
                                  <Input 
                                    type="number"
                                    placeholder="0"
                                    className="pl-7"
                                    value={newActionRequiredFields[field.field_name] || ''}
                                    onChange={(e) => handleRequiredFieldChange(field.field_name, e.target.value)}
                                  />
                                </div>
                              ) : field.field_type === 'number' ? (
                                <Input 
                                  type="number"
                                  placeholder="0"
                                  value={newActionRequiredFields[field.field_name] || ''}
                                  onChange={(e) => handleRequiredFieldChange(field.field_name, e.target.value)}
                                />
                              ) : field.field_type === 'date' ? (
                                <Input 
                                  type="date"
                                  value={newActionRequiredFields[field.field_name] || ''}
                                  onChange={(e) => handleRequiredFieldChange(field.field_name, e.target.value)}
                                />
                              ) : (
                                <Input 
                                  type="text"
                                  placeholder={`Enter ${field.field_name.toLowerCase()}`}
                                  value={newActionRequiredFields[field.field_name] || ''}
                                  onChange={(e) => handleRequiredFieldChange(field.field_name, e.target.value)}
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
                        disabled={!newActionName || !newActionProduct || !selectedActionTemplate || createAction.isPending}
                        onClick={handleAddAction}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {createAction.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
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
                    const product = getProductById(action.product_id);
                    const customerProduct = customerProducts.find(cp => cp.product_id === action.product_id);
                    
                    return (
                      <TableRow 
                        key={action.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedActionId(action.id)}
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
                          <Badge variant={getStatusBadgeVariant(action.current_status)}>
                            {action.current_status}
                          </Badge>
                        </TableCell>
                        <TableCell className={customerProduct && (customerProduct.gap || 0) > 0 ? "text-destructive" : "text-success"}>
                          {customerProduct ? `₺${Math.abs(customerProduct.gap || 0).toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell>{action.current_planned_date || "-"}</TableCell>
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
        open={!!selectedActionId}
        onOpenChange={(open) => !open && setSelectedActionId(null)}
        customerId={customerId || ""}
        actionId={selectedActionId || ""}
      />

      <PrincipalityScoreModal
        open={showPrincipalityModal}
        onOpenChange={setShowPrincipalityModal}
        customer={customerForComponents}
        totalBalance={totalBalance}
      />
    </AppLayout>
  );
};

export default CustomerDetail;
