import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePortfolioTargets, useRecordDates, useCreatePortfolioTargets } from "@/hooks/usePortfolioTargets";
import { useActions } from "@/hooks/useActions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const { data: recordDates = [], isLoading: datesLoading } = useRecordDates();
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  
  // Set default to first available date
  const effectiveDate = selectedDate || recordDates[0];
  
  const { data: targets = [], isLoading: targetsLoading } = usePortfolioTargets(effectiveDate);
  const { data: actions = [] } = useActions();
  const createTargets = useCreatePortfolioTargets();

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

  const getProductStatus = (target: typeof targets[0]): 'on_track' | 'at_risk' | 'critical' => {
    if (target.stock_count_delta_ytd < 0) return 'critical';
    if (target.stock_count_delta_ytd < 2) return 'at_risk';
    return 'on_track';
  };

  const getActionsCount = (productId: string) => {
    const productActions = actions.filter(a => a.product_id === productId);
    const planned = productActions.filter(a => a.current_status === 'Planlandı' || a.current_status === 'Tamamlandı').length;
    const pending = productActions.filter(a => a.current_status === 'Beklemede').length;
    return { planned, pending };
  };

  const handleCreateRecords = async () => {
    const currentDate = new Date();
    const recordDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    try {
      await createTargets.mutateAsync(recordDate);
      toast.success(`Records created for ${recordDate}`);
      setSelectedDate(recordDate);
    } catch (error) {
      toast.error("Failed to create records");
    }
  };

  const noData = !targetsLoading && targets.length === 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold text-card-foreground">
          Product Performance
        </CardTitle>
        <div className="flex items-center gap-2">
          {noData && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateRecords}
              disabled={createTargets.isPending}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Records
            </Button>
          )}
          <Select
            value={effectiveDate}
            onValueChange={setSelectedDate}
            disabled={datesLoading || recordDates.length === 0}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select date" />
            </SelectTrigger>
            <SelectContent>
              {recordDates.map((date) => (
                <SelectItem key={date} value={date}>
                  {date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {targetsLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : noData ? (
          <div className="text-center py-8 text-muted-foreground">
            No data available. Click "Create Records" to initialize targets.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border border-b-0">
                <TableHead rowSpan={2} className="text-muted-foreground align-bottom border-r border-border">Product</TableHead>
                <TableHead rowSpan={2} className="text-muted-foreground text-center align-bottom border-r border-border">Type</TableHead>
                <TableHead colSpan={4} className="text-muted-foreground text-center border-r border-border">Customer Count</TableHead>
                <TableHead colSpan={4} className="text-muted-foreground text-center border-r border-border">Volume</TableHead>
                <TableHead rowSpan={2} className="text-muted-foreground text-center align-bottom border-r border-border">Actions</TableHead>
                <TableHead rowSpan={2} className="text-muted-foreground text-center align-bottom">Status</TableHead>
              </TableRow>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground text-center text-xs">#</TableHead>
                <TableHead className="text-muted-foreground text-center text-xs">HGO %</TableHead>
                <TableHead className="text-muted-foreground text-center text-xs">YTD</TableHead>
                <TableHead className="text-muted-foreground text-center text-xs border-r border-border">MTD</TableHead>
                <TableHead className="text-muted-foreground text-center text-xs">#</TableHead>
                <TableHead className="text-muted-foreground text-center text-xs">HGO %</TableHead>
                <TableHead className="text-muted-foreground text-center text-xs">YTD</TableHead>
                <TableHead className="text-muted-foreground text-center text-xs border-r border-border">MTD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets.map((target) => {
                const status = getProductStatus(target);
                const actionsCount = getActionsCount(target.product_id);
                
                return (
                  <>
                    {/* Stock Row */}
                    <TableRow 
                      key={`${target.id}-stock`} 
                      className="border-border cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/customers?product=${target.product_id}`)}
                    >
                      <TableCell className="border-r border-border" rowSpan={2}>
                        <div>
                          <span className="font-medium text-card-foreground">{target.products?.name}</span>
                          <span className="block text-xs text-muted-foreground capitalize">
                            {target.products?.category}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground font-medium">
                        Stock
                      </TableCell>
                      <TableCell className="text-center text-card-foreground">
                        {target.stock_count}
                      </TableCell>
                      <TableCell className="text-center text-card-foreground">
                        {Number(target.stock_count_tar).toFixed(0)}%
                      </TableCell>
                      <TableCell className="text-center">
                        {renderChange(target.stock_count_delta_ytd)}
                      </TableCell>
                      <TableCell className="text-center border-r border-border">
                        {renderChange(target.stock_count_delta_mtd)}
                      </TableCell>
                      <TableCell className="text-center text-card-foreground">
                        {Number(target.stock_volume).toFixed(1)}M
                      </TableCell>
                      <TableCell className="text-center text-card-foreground">
                        {Number(target.stock_volume_tar).toFixed(0)}%
                      </TableCell>
                      <TableCell className="text-center">
                        {renderChange(Number(target.stock_volume_delta_ytd), true)}
                      </TableCell>
                      <TableCell className="text-center border-r border-border">
                        {renderChange(Number(target.stock_volume_delta_mtd), true)}
                      </TableCell>
                      <TableCell className="text-center border-r border-border" rowSpan={2}>
                        <span className="text-success">{actionsCount.planned}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-warning">{actionsCount.pending}</span>
                      </TableCell>
                      <TableCell className="text-center" rowSpan={2}>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", statusColors[status])}
                        >
                          {statusLabels[status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {/* Flow Row */}
                    <TableRow 
                      key={`${target.id}-flow`} 
                      className="border-border cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/customers?product=${target.product_id}`)}
                    >
                      <TableCell className="text-center text-xs text-muted-foreground font-medium">
                        Flow
                      </TableCell>
                      <TableCell className="text-center text-card-foreground">
                        {target.flow_count}
                      </TableCell>
                      <TableCell className="text-center text-card-foreground">
                        {Number(target.flow_count_tar).toFixed(0)}%
                      </TableCell>
                      <TableCell className="text-center">
                        {renderChange(target.flow_count_delta_ytd)}
                      </TableCell>
                      <TableCell className="text-center border-r border-border">
                        {renderChange(target.flow_count_delta_mtd)}
                      </TableCell>
                      <TableCell className="text-center text-card-foreground">
                        {Number(target.flow_volume).toFixed(1)}M
                      </TableCell>
                      <TableCell className="text-center text-card-foreground">
                        {Number(target.flow_volume_tar).toFixed(0)}%
                      </TableCell>
                      <TableCell className="text-center">
                        {renderChange(Number(target.flow_volume_delta_ytd), true)}
                      </TableCell>
                      <TableCell className="text-center border-r border-border">
                        {renderChange(Number(target.flow_volume_delta_mtd), true)}
                      </TableCell>
                    </TableRow>
                  </>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
