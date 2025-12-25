import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProductPerformance } from "@/data/portfolio";
import { cn } from "@/lib/utils";

const statusColors = {
  on_track: "bg-success/10 text-success border-success/20",
  at_risk: "bg-warning/10 text-warning border-warning/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels = {
  on_track: "On Track",
  at_risk: "At Risk",
  critical: "Critical",
};

export function ProductPerformanceTable() {
  const navigate = useNavigate();
  const products = getProductPerformance();

  const renderChange = (value: number, isVolume: boolean = false) => {
    const displayValue = isVolume ? `${Math.abs(value).toFixed(1)}M` : Math.abs(value).toString();
    if (value > 0) {
      return (
        <span className="flex items-center justify-center gap-1 text-success">
          <TrendingUp className="h-4 w-4" />
          +{displayValue}
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="flex items-center justify-center gap-1 text-destructive">
          <TrendingDown className="h-4 w-4" />
          -{displayValue}
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        0
      </span>
    );
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-card-foreground">
          Product Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border border-b-0">
              <TableHead rowSpan={2} className="text-muted-foreground align-bottom border-r border-border">Product</TableHead>
              <TableHead colSpan={4} className="text-muted-foreground text-center border-r border-border">Customer Count</TableHead>
              <TableHead colSpan={4} className="text-muted-foreground text-center border-r border-border">Volume</TableHead>
              <TableHead rowSpan={2} className="text-muted-foreground text-center align-bottom border-r border-border">Actions</TableHead>
              <TableHead rowSpan={2} className="text-muted-foreground text-center align-bottom">Status</TableHead>
            </TableRow>
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground text-center text-xs">#</TableHead>
              <TableHead className="text-muted-foreground text-center text-xs">HGO %</TableHead>
              <TableHead className="text-muted-foreground text-center text-xs">YoY</TableHead>
              <TableHead className="text-muted-foreground text-center text-xs border-r border-border">MoM</TableHead>
              <TableHead className="text-muted-foreground text-center text-xs">#</TableHead>
              <TableHead className="text-muted-foreground text-center text-xs">HGO %</TableHead>
              <TableHead className="text-muted-foreground text-center text-xs">YoY</TableHead>
              <TableHead className="text-muted-foreground text-center text-xs border-r border-border">MoM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow 
                key={product.productId} 
                className="border-border cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/customers?product=${product.productId}`)}
              >
                <TableCell className="border-r border-border">
                  <div>
                    <span className="font-medium text-card-foreground">{product.productName}</span>
                    <span className="block text-xs text-muted-foreground capitalize">
                      {product.category}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center text-card-foreground">
                  {product.customerCount}
                </TableCell>
                <TableCell className="text-center text-card-foreground">
                  {product.customerTargetPercent}%
                </TableCell>
                <TableCell className="text-center">
                  {renderChange(product.customerYoy)}
                </TableCell>
                <TableCell className="text-center border-r border-border">
                  {renderChange(product.customerMom)}
                </TableCell>
                <TableCell className="text-center text-card-foreground">
                  {product.totalVolume.toFixed(1)}M
                </TableCell>
                <TableCell className="text-center text-card-foreground">
                  {product.volumeTargetPercent}%
                </TableCell>
                <TableCell className="text-center">
                  {renderChange(product.volumeYoy, true)}
                </TableCell>
                <TableCell className="text-center border-r border-border">
                  {renderChange(product.volumeMom, true)}
                </TableCell>
                <TableCell className="text-center border-r border-border">
                  <span className="text-success">{product.actionsPlanned}</span>
                  <span className="text-muted-foreground"> / </span>
                  <span className="text-warning">{product.actionsNotPlanned}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={cn("text-xs", statusColors[product.status])}
                  >
                    {statusLabels[product.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
