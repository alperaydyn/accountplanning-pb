import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, TrendingDown, Lightbulb, ChevronRight, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProductPerformance } from "@/data/portfolio";
import { ProductPerformance } from "@/types";

interface Insight {
  type: 'critical' | 'warning' | 'info';
  icon: typeof AlertTriangle;
  title: string;
  message: string;
  products: ProductPerformance[];
  detailedDescription: string;
}

export function InsightsPanel() {
  const navigate = useNavigate();
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  
  const products = getProductPerformance();
  const criticalProducts = products.filter(p => p.status === 'critical');
  const atRiskProducts = products.filter(p => p.status === 'at_risk');
  const highPendingActions = products.filter(p => p.actionsNotPlanned > 3);

  const insights: Insight[] = [
    ...(criticalProducts.length > 0 ? [{
      type: 'critical' as const,
      icon: AlertTriangle,
      title: 'Critical Products Identified',
      message: `${criticalProducts.map(p => p.productName).join(', ')} showing negative YoY growth. Immediate action recommended.`,
      products: criticalProducts,
      detailedDescription: `Bu ürünler yıllık bazda negatif büyüme göstermektedir. Müşteri kaybı ve hacim düşüşü yaşanmaktadır. Acil müdahale gerektiren durumlar için müşteri ziyaretleri planlanmalı ve rekabet analizi yapılmalıdır. Ürün fiyatlaması ve müşteri ihtiyaçları yeniden değerlendirilmelidir.`,
    }] : []),
    ...(atRiskProducts.length > 0 ? [{
      type: 'warning' as const,
      icon: TrendingDown,
      title: 'Products At Risk',
      message: `${atRiskProducts.length} products showing below-target performance. Consider prioritizing customer outreach.`,
      products: atRiskProducts,
      detailedDescription: `Bu ürünler hedefin altında performans göstermektedir. Büyüme oranları beklentilerin altında kalmaktadır. Müşteri iletişimini artırarak ve çapraz satış fırsatlarını değerlendirerek performansı iyileştirebilirsiniz. Proaktif yaklaşım ile bu ürünlerin kritik kategoriye düşmesi önlenebilir.`,
    }] : []),
    ...(highPendingActions.length > 0 ? [{
      type: 'info' as const,
      icon: Lightbulb,
      title: 'Action Opportunities',
      message: `${highPendingActions.length} products have high pending action counts. Review and assign to increase engagement.`,
      products: highPendingActions,
      detailedDescription: `Bu ürünler için planlanması gereken çok sayıda aksiyon bulunmaktadır. Bekleyen aksiyonların planlanması ve takibi ile müşteri etkileşimi artırılabilir. Aksiyonları önceliklendirerek portföy yönetimini optimize edebilirsiniz.`,
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'at_risk':
        return <Badge className="bg-warning/20 text-warning-foreground border-warning">At Risk</Badge>;
      default:
        return <Badge variant="secondary">On Track</Badge>;
    }
  };

  const handleProductClick = (productId: string) => {
    setSelectedInsight(null);
    navigate(`/customers?product=${productId}`);
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <>
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
              className={`p-4 rounded-lg border ${getBgColor(insight.type)} cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md`}
              onClick={() => setSelectedInsight(insight)}
            >
              <div className="flex items-start gap-3">
                <insight.icon className={`h-5 w-5 mt-0.5 ${getIconColor(insight.type)}`} />
                <div className="flex-1">
                  <h4 className="font-medium text-card-foreground">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!selectedInsight} onOpenChange={() => setSelectedInsight(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedInsight && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <selectedInsight.icon className={`h-5 w-5 ${getIconColor(selectedInsight.type)}`} />
                  {selectedInsight.title}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {selectedInsight.detailedDescription}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                <h4 className="font-medium text-foreground mb-3">İlgili Ürünler</h4>
                <div className="space-y-2">
                  {selectedInsight.products.map((product) => (
                    <div
                      key={product.productId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleProductClick(product.productId)}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-foreground">{product.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.stock.count} müşteri • YoY: {product.stock.yoy > 0 ? '+' : ''}{product.stock.yoy}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(product.status)}
                        <Button variant="ghost" size="sm" className="gap-1">
                          <ExternalLink className="h-4 w-4" />
                          Müşterileri Gör
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
