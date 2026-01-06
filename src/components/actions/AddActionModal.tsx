import { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useProducts } from "@/hooks/useProducts";
import { useActionTemplates } from "@/hooks/useActionTemplates";
import { useCreateAction, ACTION_TYPE_LABELS } from "@/hooks/useActions";
import { Database } from "@/integrations/supabase/types";

type ActionType = Database['public']['Enums']['action_type'];

interface AddActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  preselectedProductId?: string;
}

const RECURRENCE_PATTERNS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export const AddActionModal = ({ open, onOpenChange, customerId, preselectedProductId }: AddActionModalProps) => {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [explanation, setExplanation] = useState<string>("");
  const [requiredFields, setRequiredFields] = useState<Record<string, string>>({});
  
  // Recursion state
  const [isRecursive, setIsRecursive] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<string>("monthly");
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>("");

  const { data: allProducts = [] } = useProducts();
  const { data: actionTemplates = [] } = useActionTemplates(selectedProduct || undefined);
  const createAction = useCreateAction();

  const selectedActionTemplate = actionTemplates.find(t => t.id === selectedAction);
  const selectedActionRequirements = selectedActionTemplate?.fields || [];

  // Set preselected product when modal opens
  useEffect(() => {
    if (open && preselectedProductId) {
      setSelectedProduct(preselectedProductId);
    }
  }, [open, preselectedProductId]);

  const resetForm = () => {
    setSelectedProduct("");
    setSelectedAction("");
    setExplanation("");
    setRequiredFields({});
    setIsRecursive(false);
    setRecurrencePattern("monthly");
    setRecurrenceInterval(1);
    setRecurrenceEndDate("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleRequiredFieldChange = (fieldName: string, value: string) => {
    setRequiredFields(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleProductChange = (value: string) => {
    setSelectedProduct(value);
    setSelectedAction("");
    setRequiredFields({});
  };

  const handleAddAction = async () => {
    if (!selectedAction || !selectedProduct || !customerId || !selectedActionTemplate) return;
    
    const today = new Date().toISOString().split('T')[0];
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
    
    // Build description from required fields
    const fieldsDescription = Object.entries(requiredFields)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    // Determine action type based on recursion
    const actionType: ActionType = isRecursive ? 'recursive' : 'rm_action';
    
    await createAction.mutateAsync({
      customer_id: customerId,
      product_id: selectedProduct,
      name: selectedActionTemplate.name,
      description: selectedActionTemplate.description || undefined,
      creation_reason: explanation || undefined,
      customer_hints: fieldsDescription || undefined,
      creator_name: 'User',
      source_data_date: today,
      action_target_date: endOfMonth,
      type: actionType,
      priority: 'medium',
      // Recursion fields will be handled by the backend
      ...(isRecursive && {
        is_recursive: true,
        recurrence_pattern: recurrencePattern,
        recurrence_interval: recurrenceInterval,
        recurrence_end_date: recurrenceEndDate || undefined,
      }),
    } as any);
    
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Action</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product & Action Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Product</Label>
              <Select value={selectedProduct} onValueChange={handleProductChange}>
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
                value={selectedAction} 
                onValueChange={(value) => {
                  setSelectedAction(value);
                  setRequiredFields({});
                }}
                disabled={!selectedProduct}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedProduct ? "Select action" : "Select a product first"} />
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

          {/* Explanation */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Explanation</Label>
            <Textarea 
              placeholder="Enter action explanation..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Required Fields */}
          {selectedActionRequirements.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/30">
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
                        value={requiredFields[field.field_name] || ''} 
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
                          value={requiredFields[field.field_name] || ''}
                          onChange={(e) => handleRequiredFieldChange(field.field_name, e.target.value)}
                        />
                      </div>
                    ) : field.field_type === 'number' ? (
                      <Input 
                        type="number"
                        placeholder="0"
                        value={requiredFields[field.field_name] || ''}
                        onChange={(e) => handleRequiredFieldChange(field.field_name, e.target.value)}
                      />
                    ) : field.field_type === 'date' ? (
                      <Input 
                        type="date"
                        value={requiredFields[field.field_name] || ''}
                        onChange={(e) => handleRequiredFieldChange(field.field_name, e.target.value)}
                      />
                    ) : (
                      <Input 
                        type="text"
                        placeholder={`Enter ${field.field_name.toLowerCase()}`}
                        value={requiredFields[field.field_name] || ''}
                        onChange={(e) => handleRequiredFieldChange(field.field_name, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recursion Section */}
          <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Recurring Action</Label>
              </div>
              <Switch
                checked={isRecursive}
                onCheckedChange={setIsRecursive}
              />
            </div>

            {isRecursive && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Frequency</Label>
                  <Select value={recurrencePattern} onValueChange={setRecurrencePattern}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_PATTERNS.map((pattern) => (
                        <SelectItem key={pattern.value} value={pattern.value}>
                          {pattern.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Every</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number"
                      min={1}
                      max={12}
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      {recurrencePattern === 'daily' ? 'day(s)' :
                       recurrencePattern === 'weekly' ? 'week(s)' :
                       recurrencePattern === 'monthly' ? 'month(s)' :
                       recurrencePattern === 'quarterly' ? 'quarter(s)' : 'year(s)'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">End Date (Optional)</Label>
                  <Input 
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Type Preview */}
          {selectedAction && (
            <div className="text-xs text-muted-foreground">
              Action type: <span className="font-medium">{ACTION_TYPE_LABELS[isRecursive ? 'recursive' : 'rm_action']}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            disabled={!selectedAction || !selectedProduct || !selectedActionTemplate || createAction.isPending}
            onClick={handleAddAction}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {createAction.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Add Action
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
