import { useMemo } from "react";
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
import { usePortfolioTargets, useCreatePortfolioTargets } from "@/hooks/usePortfolioTargets";
import { useActions } from "@/hooks/useActions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type ProductStatus = 'on_track' | 'at_risk' | 'critical' | 'melting' | 'growing' | 'ticket_size' | 'diversity';
type StatusFilter = 'all' | ProductStatus[];

interface ProductPerformanceTableProps {
  selectedDate?: string;
  onDateChange?: (date: string | undefined) => void;
  statusFilter?: StatusFilter;
}

const statusColors: Record<ProductStatus, string> = {
  on_track: "bg-success/10 text-success border-success/20",
  at_risk: "bg-warning/10 text-warning border-warning/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  melting: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  growing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  ticket_size: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  diversity: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
};

export function ProductPerformanceTable({ selectedDate, onDateChange, statusFilter = 'all' }: ProductPerformanceTableProps) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  const { data: targets = [], isLoading: targetsLoading } = usePortfolioTargets(selectedDate);
  const { data: actions = [] } = useActions();
  const createTargets = useCreatePortfolioTargets();

  // Helper to check if a status matches the filter
  const matchesFilter = (status: ProductStatus, filter: StatusFilter): boolean => {
    if (filter === 'all') return true;
    if (Array.isArray(filter)) {
      return filter.includes(status);
    }
    return false;
  };

  const statusLabels: Record<ProductStatus, string> = {
    on_track: t.dashboard.onTrack,
    at_risk: t.dashboard.atRisk,
    critical: t.dashboard.critical,
    melting: t.dashboard.melting,
    growing: t.dashboard.growing,
    ticket_size: t.dashboard.ticketSize,
    diversity: t.dashboard.diversity,
  };

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

  const getProductStatus = (target: typeof targets[0]): ProductStatus => {
    const stockCountTar = Number(target.stock_count_tar) || 0;
    const stockVolumeTar = Number(target.stock_volume_tar) || 0;
    const flowCountTar = Number(target.flow_count_tar) || 0;
    const flowVolumeTar = Number(target.flow_volume_tar) || 0;
    
    const GOOD_THRESHOLD = 80;
    const BAD_THRESHOLD = 50;
    
    // Calculate averages for stock vs flow and count vs volume
    const stockAvg = (stockCountTar + stockVolumeTar) / 2;
    const flowAvg = (flowCountTar + flowVolumeTar) / 2;
    const countAvg = (stockCountTar + flowCountTar) / 2;
    const volumeAvg = (stockVolumeTar + flowVolumeTar) / 2;
    
    const stockOk = stockAvg >= GOOD_THRESHOLD;
    const flowOk = flowAvg >= GOOD_THRESHOLD;
    const countOk = countAvg >= GOOD_THRESHOLD;
    const volumeOk = volumeAvg >= GOOD_THRESHOLD;
    
    const overallAvg = (stockCountTar + stockVolumeTar + flowCountTar + flowVolumeTar) / 4;
    
    // Check for specific warning scenarios
    if (stockOk && !flowOk) return 'melting';      // Stock good, flow bad → losing momentum
    if (!stockOk && flowOk) return 'growing';       // Flow good, stock bad → building up
    if (countOk && !volumeOk) return 'ticket_size'; // Count good, volume bad → small tickets
    if (!countOk && volumeOk) return 'diversity';   // Volume good, count bad → few large customers
    
    // General status based on overall average
    if (overallAvg < BAD_THRESHOLD) return 'critical';
    if (overallAvg < GOOD_THRESHOLD) return 'at_risk';
    return 'on_track';
  };

  const getActionsCount = (productId: string) => {
    const productActions = actions.filter(a => a.product_id === productId);
    const planned = productActions.filter(a => a.current_status === 'Planlandı' || a.current_status === 'Tamamlandı').length;
    const pending = productActions.filter(a => a.current_status === 'Beklemede').length;
    return { planned, pending };
  };

  const handleCreateRecords = async () => {
    if (!selectedDate) return;
    
    try {
      await createTargets.mutateAsync(selectedDate);
      toast.success(`Records created for ${selectedDate}`);
    } catch (error) {
      toast.error("Failed to create records");
    }
  };

  // Filter targets based on status filter
  const filteredTargets = useMemo(() => {
    if (statusFilter === 'all') return targets;
    
    return targets.filter(target => {
      const status = getProductStatus(target);
      return matchesFilter(status, statusFilter);
    });
  }, [targets, statusFilter]);

  const noData = !targetsLoading && targets.length === 0;
  const noFilteredData = !targetsLoading && targets.length > 0 && filteredTargets.length === 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold text-card-foreground">
          {t.dashboard.productPerformance}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreateRecords}
          disabled={createTargets.isPending || !selectedDate}
        >
          <Plus className="h-4 w-4 mr-1" />
          {noData ? t.dashboard.createRecords : t.dashboard.regenerateInsights}
        </Button>
      </CardHeader>
      <CardContent>
        {targetsLoading ? (
          <div className="text-center py-8 text-muted-foreground">{t.common.loading}</div>
        ) : noData ? (
          <div className="text-center py-8 text-muted-foreground">
            {t.dashboard.noDataAvailable}
          </div>
        ) : noFilteredData ? (
          <div className="text-center py-8 text-muted-foreground">
            {language === "tr" ? "Bu filtreye uygun ürün bulunamadı" : "No products match this filter"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border border-b-0">
                <TableHead rowSpan={2} className="text-muted-foreground align-bottom border-r border-border">{t.actions.product}</TableHead>
                <TableHead rowSpan={2} className="text-muted-foreground text-center align-bottom border-r border-border">{t.dashboard.type}</TableHead>
                <TableHead colSpan={4} className="text-muted-foreground text-center border-r border-border">{t.dashboard.customerCount}</TableHead>
                <TableHead colSpan={4} className="text-muted-foreground text-center border-r border-border">{t.dashboard.volume}</TableHead>
                <TableHead rowSpan={2} className="text-muted-foreground text-center align-bottom border-r border-border">{t.common.actions}</TableHead>
                <TableHead rowSpan={2} className="text-muted-foreground text-center align-bottom">{t.common.status}</TableHead>
              </TableRow>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground text-center text-xs">#</TableHead>
                <TableHead className="text-muted-foreground text-center text-xs">{t.dashboard.hgo} %</TableHead>
                <TableHead className="text-muted-foreground text-center text-xs">{t.dashboard.ytd}</TableHead>
                <TableHead className="text-muted-foreground text-center text-xs border-r border-border">{t.dashboard.mtd}</TableHead>
                <TableHead className="text-muted-foreground text-center text-xs">#</TableHead>
                <TableHead className="text-muted-foreground text-center text-xs">{t.dashboard.hgo} %</TableHead>
                <TableHead className="text-muted-foreground text-center text-xs">{t.dashboard.ytd}</TableHead>
                <TableHead className="text-muted-foreground text-center text-xs border-r border-border">{t.dashboard.mtd}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTargets.map((target) => {
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
                        {t.dashboard.stock}
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
                        {t.dashboard.flow}
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
