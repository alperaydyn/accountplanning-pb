import { useState } from "react";
import { Bot, Play, CheckCircle2, Clock, User, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  autopilotProducts,
  getAutopilotInstancesByCustomer,
  createAutopilotInstance,
  getAutopilotProductById,
  AutopilotProduct,
  AutopilotInstance,
} from "@/data/autopilot";
import { cn } from "@/lib/utils";

interface AutoPilotPanelProps {
  customerId: string;
}

export const AutoPilotPanel = ({ customerId }: AutoPilotPanelProps) => {
  const [selectedProduct, setSelectedProduct] = useState<AutopilotProduct | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string | number>>({});
  const [instances, setInstances] = useState<AutopilotInstance[]>(() => 
    getAutopilotInstancesByCustomer(customerId)
  );

  const handleProductSelect = (product: AutopilotProduct) => {
    setSelectedProduct(product);
    setInputValues({});
  };

  const handleInputChange = (fieldName: string, value: string | number) => {
    setInputValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = () => {
    if (!selectedProduct) return;

    // Validate required fields
    const missingFields = selectedProduct.inputs
      .filter(field => field.required && !inputValues[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    const newInstance = createAutopilotInstance(selectedProduct.id, customerId, inputValues);
    setInstances(prev => [...prev, newInstance]);
    setSelectedProduct(null);
    setInputValues({});
    toast.success(`AutoPilot "${selectedProduct.name}" started with ${selectedProduct.steps.length} action steps`);
  };

  return (
    <div className="space-y-6">
      {/* AutoPilot Products Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-5 w-5 text-primary" />
            Start New AutoPilot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {autopilotProducts.map((product) => (
              <Card
                key={product.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedProduct?.id === product.id && "ring-2 ring-primary"
                )}
                onClick={() => handleProductSelect(product)}
              >
                <CardContent className="p-4">
                  <div className="font-medium text-sm">{product.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{product.description}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {product.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {product.steps.length} steps
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Input Form for Selected Product */}
      {selectedProduct && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Configure: {selectedProduct.name}</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)}>
                Cancel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedProduct.inputs.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <Label htmlFor={field.id} className="text-sm">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {field.type === "select" ? (
                    <Select
                      value={inputValues[field.name]?.toString() || ""}
                      onValueChange={(val) => handleInputChange(field.name, val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.id}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={inputValues[field.name] || ""}
                      onChange={(e) =>
                        handleInputChange(
                          field.name,
                          field.type === "number" ? parseFloat(e.target.value) || "" : e.target.value
                        )
                      }
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Steps Preview */}
            <div className="pt-4 border-t">
              <div className="text-sm font-medium mb-2">Action Steps that will be generated:</div>
              <div className="flex flex-wrap gap-2">
                {selectedProduct.steps.map((step, idx) => (
                  <Badge
                    key={step.id}
                    variant={step.type === "automatic" ? "default" : "secondary"}
                    className="flex items-center gap-1"
                  >
                    {step.type === "automatic" ? (
                      <Zap className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    {idx + 1}. {step.name}
                  </Badge>
                ))}
              </div>
            </div>

            <Button onClick={handleSubmit} className="w-full">
              <Play className="h-4 w-4 mr-2" />
              Start AutoPilot
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active AutoPilot Instances */}
      {instances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active AutoPilot Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-2">
              {instances.map((instance) => {
                const product = getAutopilotProductById(instance.autopilotProductId);
                if (!product) return null;

                return (
                  <AccordionItem
                    key={instance.id}
                    value={instance.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <Bot className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Started: {new Date(instance.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          Auto-pilot
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {/* Input Summary */}
                        <div className="bg-muted/50 rounded-md p-3">
                          <div className="text-xs font-medium text-muted-foreground mb-2">
                            Configuration
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {product.inputs.map((field) => (
                              <div key={field.id}>
                                <span className="text-muted-foreground">{field.label}:</span>{" "}
                                <span className="font-medium">
                                  {instance.inputs[field.name] || "-"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Steps Status */}
                        <div className="space-y-2">
                          {product.steps.map((step) => {
                            const status = instance.stepStatuses[step.id] || "pending";
                            return (
                              <div
                                key={step.id}
                                className="flex items-center justify-between p-2 rounded-md bg-background border"
                              >
                                <div className="flex items-center gap-2">
                                  {status === "completed" ? (
                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                  ) : status === "in_progress" ? (
                                    <Clock className="h-4 w-4 text-warning animate-pulse" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className="text-sm">{step.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={step.type === "automatic" ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {step.type === "automatic" ? (
                                      <><Zap className="h-3 w-3 mr-1" />Auto</>
                                    ) : (
                                      <><User className="h-3 w-3 mr-1" />Human</>
                                    )}
                                  </Badge>
                                  <Badge
                                    variant={
                                      status === "completed"
                                        ? "default"
                                        : status === "in_progress"
                                        ? "outline"
                                        : "secondary"
                                    }
                                    className="text-xs capitalize"
                                  >
                                    {status.replace("_", " ")}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {instances.length === 0 && !selectedProduct && (
        <div className="text-center py-8 text-muted-foreground">
          <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No active AutoPilot actions. Select a product above to start.</p>
        </div>
      )}
    </div>
  );
};
