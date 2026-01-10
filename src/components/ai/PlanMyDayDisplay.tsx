import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Save, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateAction, Action } from "@/hooks/useActions";
import { toast } from "sonner";

interface PlanAction {
  product: string;
  action: string;
  note: string;
}

interface PlanCustomer {
  tempId: string;
  reason: string;
  actions: PlanAction[];
}

interface PlanMyDayResponse {
  greeting: string;
  customers: PlanCustomer[];
  summary: string;
}

interface CustomerMapping {
  id: string;
  name: string;
}

interface PlanMyDayDisplayProps {
  plan: PlanMyDayResponse;
  mapping: Record<string, CustomerMapping>;
  products: { id: string; name: string }[];
  actionTemplates: { product_id: string; name: string }[];
  existingActions: Action[];
}

const normalizeKeyPart = (value: string) =>
  value.normalize("NFKC").trim().toLowerCase();

export function PlanMyDayDisplay({ 
  plan, 
  mapping, 
  products, 
  actionTemplates,
  existingActions 
}: PlanMyDayDisplayProps) {
  const [newlySavedActions, setNewlySavedActions] = useState<Set<string>>(new Set());
  const [savingActions, setSavingActions] = useState<Set<string>>(new Set());
  const createAction = useCreateAction();

  // Build a set of already-saved action keys from the database
  const alreadySavedActions = useMemo(() => {
    const keys = new Set<string>();
    existingActions.forEach(action => {
      const productName = action.products?.name;
      if (productName) {
        keys.add(`${action.customer_id}|${normalizeKeyPart(productName)}|${normalizeKeyPart(action.name)}`);
      }
    });
    return keys;
  }, [existingActions]);

  const getActionKey = (customerId: string, productName: string, actionName: string) => {
    return `${customerId}|${normalizeKeyPart(productName)}|${normalizeKeyPart(actionName)}`;
  };

  const isActionSaved = (actionKey: string) => {
    return alreadySavedActions.has(actionKey) || newlySavedActions.has(actionKey);
  };

  const handleSaveAction = async (
    customer: PlanCustomer,
    action: PlanAction
  ) => {
    const customerInfo = mapping[customer.tempId];
    if (!customerInfo) {
      toast.error("Müşteri bilgisi bulunamadı");
      return;
    }

    const actionKey = getActionKey(customerInfo.id, action.product, action.action);
    
    // Find the product ID (normalize to avoid minor AI formatting differences)
    const product = products.find(p => normalizeKeyPart(p.name) === normalizeKeyPart(action.product));
    if (!product) {
      toast.error(`Ürün bulunamadı: ${action.product}`);
      return;
    }

    setSavingActions(prev => new Set(prev).add(actionKey));
    const today = new Date().toISOString().split('T')[0];

    try {
      await createAction.mutateAsync({
        customer_id: customerInfo.id,
        product_id: product.id,
        name: action.action,
        description: action.note || null,
        priority: "medium",
        type: "rm_action",
        action_target_date: today,
        source_data_date: today,
        creator_name: "AI Assistant",
        creation_reason: customer.reason,
        current_planned_date: today,
      });

      setNewlySavedActions(prev => new Set(prev).add(actionKey));
      toast.success("Aksiyon kaydedildi");
    } catch (err) {
      console.error("Failed to save action:", err);
      toast.error("Aksiyon kaydedilemedi");
    } finally {
      setSavingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Greeting */}
      <p className="text-sm">{plan.greeting}</p>
      
      {/* Header */}
      <p className="text-sm font-medium">
        📋 Bugün odaklanılacak {plan.customers.length} müşteri:
      </p>

      {/* Customers List */}
      <div className="space-y-4">
        {plan.customers.map((customer, idx) => {
          const customerInfo = mapping[customer.tempId];
          const customerName = customerInfo?.name || customer.tempId;
          const customerId = customerInfo?.id;

          return (
            <div key={customer.tempId} className="space-y-1.5">
              {/* Customer Name with Link */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{idx + 1}.</span>
                {customerId ? (
                  <Link
                    to={`/customers/${customerId}`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {customerName}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold">{customerName}</span>
                )}
              </div>
              
              {/* Reason */}
              <p className="text-xs text-muted-foreground ml-4">
                📌 {customer.reason}
              </p>

              {/* Actions */}
              <div className="ml-4 space-y-1">
                {customer.actions.map((action, actionIdx) => {
                  const actionKey = customerId 
                    ? getActionKey(customerId, action.product, action.action)
                    : `${customer.tempId}|${action.product}|${action.action}`;
                  const isSaved = isActionSaved(actionKey);
                  const isSaving = savingActions.has(actionKey);

                  return (
                    <div 
                      key={actionIdx} 
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="flex-1">
                        • {action.product} → {action.action}
                        {action.note && (
                          <span className="text-muted-foreground"> ({action.note})</span>
                        )}
                      </span>
                      
                      {/* Save Button */}
                      {customerId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 shrink-0 ${
                            isSaved 
                              ? "text-green-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" 
                              : "text-muted-foreground hover:text-primary"
                          }`}
                          onClick={() => handleSaveAction(customer, action)}
                          disabled={isSaved || isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isSaved ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground mt-3">
        💡 {plan.summary}
      </p>
    </div>
  );
}
