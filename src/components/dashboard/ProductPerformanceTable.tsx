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
  const products = getProductPerformance();

  const renderChange = (value: number) => {
    if (value > 0) {
      return (
        <span className="flex items-center gap-1 text-success">
          <TrendingUp className="h-4 w-4" />
          +{value}%
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="flex items-center gap-1 text-destructive">
          <TrendingDown className="h-4 w-4" />
          {value}%
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        0%
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
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground">Product</TableHead>
              <TableHead className="text-muted-foreground text-center">Customers</TableHead>
              <TableHead className="text-muted-foreground text-center">YoY</TableHead>
              <TableHead className="text-muted-foreground text-center">MoM</TableHead>
              <TableHead className="text-muted-foreground text-center">Actions</TableHead>
              <TableHead className="text-muted-foreground text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.productId} className="border-border">
                <TableCell>
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
                <TableCell className="text-center">
                  {renderChange(product.yoyChange)}
                </TableCell>
                <TableCell className="text-center">
                  {renderChange(product.momChange)}
                </TableCell>
                <TableCell className="text-center">
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
