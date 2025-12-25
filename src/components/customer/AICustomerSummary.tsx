import { useState } from "react";
import { Sparkles, FileText, TrendingUp, Building2, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Customer, CustomerProduct } from "@/types";
import { getProductById } from "@/data/products";

interface AICustomerSummaryProps {
  customer: Customer;
  customerProducts: CustomerProduct[];
  actionsCount: number;
}

// Generate mock AI summary data based on customer
const generateCustomerSummary = (customer: Customer, customerProducts: CustomerProduct[], actionsCount: number) => {
  const totalVolume = customerProducts.reduce((sum, cp) => sum + cp.currentValue, 0);
  const productsAboveThreshold = customerProducts.filter(cp => cp.currentValue >= cp.threshold).length;
  const productsBelowThreshold = customerProducts.length - productsAboveThreshold;
  
  const statusSummary = customer.isPrimaryBank
    ? `${customer.name} is a primary bank customer with a principality score of ${customer.principalityScore}%. The customer has ${customerProducts.length} active products with a total volume of ₺${totalVolume.toLocaleString()}. ${productsAboveThreshold} products are performing above threshold while ${productsBelowThreshold} require attention.`
    : `${customer.name} is currently using competitor banks as their primary provider. With a principality score of ${customer.principalityScore}%, there is significant opportunity to increase wallet share. Focus on ${productsBelowThreshold} underperforming product areas to strengthen the relationship.`;

  const visitNotes = [
    { date: "2024-12-15", note: "Discussed expansion plans for Q1 2025. Customer expressed interest in additional credit facilities." },
    { date: "2024-11-28", note: "Quarterly review meeting. Customer satisfied with service levels but requested better FX rates." },
    { date: "2024-10-10", note: "Introduced new digital banking features. Customer agreed to pilot the mobile payment solution." },
  ];

  const recentActivity = {
    topProducts: customerProducts
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 3)
      .map(cp => ({
        name: getProductById(cp.productId)?.name || "Unknown",
        volume: cp.currentValue,
        trend: cp.currentValue >= cp.threshold ? "up" : "down"
      })),
    transactionSummary: `Last 30 days: ${Math.floor(Math.random() * 50) + 20} transactions totaling ₺${(Math.floor(Math.random() * 5000000) + 1000000).toLocaleString()}. Average transaction size increased by ${Math.floor(Math.random() * 15) + 5}% compared to previous period.`
  };

  const competitors = [
    { name: "Bank A", products: ["FX", "Trade Finance"], strength: "Competitive FX rates" },
    { name: "Bank B", products: ["Loans", "Deposits"], strength: "Higher deposit rates" },
    { name: "Bank C", products: ["Cards", "Payment"], strength: "Lower card fees" },
  ].slice(0, customer.isPrimaryBank ? 1 : 3);

  return { statusSummary, visitNotes, recentActivity, competitors };
};

export const AICustomerSummary = ({ customer, customerProducts, actionsCount }: AICustomerSummaryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const summary = generateCustomerSummary(customer, customerProducts, actionsCount);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full text-left">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Customer Summary
              </CardTitle>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer Status Summary - Always visible */}
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Customer Status
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {summary.statusSummary}
            </p>
          </div>

          <CollapsibleContent className="space-y-4">
            <Separator />

            {/* Previous Visit Notes */}
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Previous Visit Notes
              </h4>
              <div className="space-y-2">
                {summary.visitNotes.map((visit, index) => (
                  <div key={index} className="text-sm">
                    <span className="text-xs text-muted-foreground">{visit.date}</span>
                    <p className="text-muted-foreground">{visit.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Recent Product & Transaction Summary */}
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Recent Activity
              </h4>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {summary.recentActivity.topProducts.map((product, index) => (
                    <div 
                      key={index} 
                      className="text-xs px-2 py-1 rounded-md bg-muted"
                    >
                      <span className="font-medium">{product.name}</span>
                      <span className="text-muted-foreground ml-1">₺{product.volume.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {summary.recentActivity.transactionSummary}
                </p>
              </div>
            </div>

            <Separator />

            {/* Competitors Summary */}
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Competitor Analysis
              </h4>
              {summary.competitors.length > 0 ? (
                <div className="space-y-2">
                  {summary.competitors.map((competitor, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{competitor.name}</span>
                      <span className="text-muted-foreground ml-2">
                        ({competitor.products.join(", ")}) - {competitor.strength}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No significant competitor presence detected.</p>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};
