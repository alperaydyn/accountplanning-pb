import { AlertTriangle, TrendingDown, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProductPerformance } from "@/data/portfolio";

export function InsightsPanel() {
  const products = getProductPerformance();
  const criticalProducts = products.filter(p => p.status === 'critical');
  const atRiskProducts = products.filter(p => p.status === 'at_risk');
  const highPendingActions = products.filter(p => p.actionsNotPlanned > 3);

  const insights = [
    ...(criticalProducts.length > 0 ? [{
      type: 'critical' as const,
      icon: AlertTriangle,
      title: 'Critical Products Identified',
      message: `${criticalProducts.map(p => p.productName).join(', ')} showing negative YoY growth. Immediate action recommended.`,
    }] : []),
    ...(atRiskProducts.length > 0 ? [{
      type: 'warning' as const,
      icon: TrendingDown,
      title: 'Products At Risk',
      message: `${atRiskProducts.length} products showing below-target performance. Consider prioritizing customer outreach.`,
    }] : []),
    ...(highPendingActions.length > 0 ? [{
      type: 'info' as const,
      icon: Lightbulb,
      title: 'Action Opportunities',
      message: `${highPendingActions.length} products have high pending action counts. Review and assign to increase engagement.`,
    }] : []),
  ];

  const getIconColor = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical': return 'text-destructive';
      case 'warning': return 'text-warning';
      case 'info': return 'text-info';
    }
  };

  const getBgColor = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical': return 'bg-destructive/5 border-destructive/20';
      case 'warning': return 'bg-warning/5 border-warning/20';
      case 'info': return 'bg-info/5 border-info/20';
    }
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-info" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getBgColor(insight.type)}`}
          >
            <div className="flex items-start gap-3">
              <insight.icon className={`h-5 w-5 mt-0.5 ${getIconColor(insight.type)}`} />
              <div>
                <h4 className="font-medium text-card-foreground">{insight.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
