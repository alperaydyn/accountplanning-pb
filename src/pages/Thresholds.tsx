import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Upload, Download, Filter, X, ShieldAlert } from 'lucide-react';
import {
  useProductThresholds,
  useUpdateProductThreshold,
  type ThresholdFilters,
  type ProductThresholdWithProduct,
} from '@/hooks/useProductThresholds';
import { useProducts } from '@/hooks/useProducts';
import { useIsAdmin } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Database } from '@/integrations/supabase/types';

type Sector = Database['public']['Enums']['customer_sector'];
type Segment = Database['public']['Enums']['customer_segment'];

const SECTORS: Sector[] = ['Turizm', 'Ulaşım', 'Perakende', 'Gayrimenkul', 'Tarım Hayvancılık', 'Sağlık', 'Enerji'];
const SEGMENTS: Segment[] = ['MİKRO', 'Kİ', 'OBİ', 'TİCARİ'];

const ITEMS_PER_PAGE = 20;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('tr-TR');
};

export default function Thresholds() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [filters, setFilters] = useState<ThresholdFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [editingThreshold, setEditingThreshold] = useState<ProductThresholdWithProduct | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: thresholds, isLoading } = useProductThresholds(filters);
  const { data: products } = useProducts();
  const updateThreshold = useUpdateProductThreshold();
  const { isAdmin, isLoading: isLoadingRole } = useIsAdmin();

  // Pagination
  const paginatedThresholds = useMemo(() => {
    if (!thresholds) return [];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return thresholds.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [thresholds, currentPage]);

  const totalPages = useMemo(() => {
    if (!thresholds) return 0;
    return Math.ceil(thresholds.length / ITEMS_PER_PAGE);
  }, [thresholds]);

  const handleFilterChange = (key: keyof ThresholdFilters, value: string | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handleEditClick = (threshold: ProductThresholdWithProduct) => {
    setEditingThreshold(threshold);
    setEditValue(threshold.threshold_value.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingThreshold || !isAdmin) return;

    try {
      await updateThreshold.mutateAsync({
        id: editingThreshold.id,
        threshold_value: parseFloat(editValue),
      });
      toast({
        title: t.common.save,
        description: t.thresholds.saveThreshold,
      });
      setEditingThreshold(null);
    } catch (error) {
      toast({
        title: t.common.unknown,
        description: t.thresholds.adminRequired,
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (threshold: ProductThresholdWithProduct) => {
    if (!isAdmin) {
      toast({
        title: t.common.unknown,
        description: t.thresholds.adminRequired,
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateThreshold.mutateAsync({
        id: threshold.id,
        is_active: !threshold.is_active,
      });
      toast({
        title: t.common.save,
        description: `${threshold.is_active ? t.thresholds.inactive : t.thresholds.active}`,
      });
    } catch (error) {
      toast({
        title: t.common.unknown,
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = () => {
    if (!thresholds) return;

    const headers = [t.customers.sector, t.customers.segment, t.thresholds.product, 'Category', t.thresholds.thresholdValue, t.thresholds.calculationDate, t.thresholds.version, t.thresholds.active];
    const rows = thresholds.map(threshold => [
      threshold.sector,
      threshold.segment,
      threshold.products?.name || '',
      threshold.products?.category || '',
      threshold.threshold_value,
      threshold.calculation_date,
      threshold.version_num,
      threshold.is_active ? t.common.yes : t.common.no,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `thresholds_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: t.common.save,
      description: 'CSV downloaded',
    });
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.thresholds.title}</h1>
            <p className="text-muted-foreground">
              {t.thresholds.description}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" />
              {t.common.filter}
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={!thresholds?.length}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" disabled>
              <Upload className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </div>
        </div>

        {/* Admin Notice */}
        {!isLoadingRole && !isAdmin && (
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              {t.thresholds.adminRequired}
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>{t.customers.sector}</Label>
                  <Select
                    value={filters.sector || 'all'}
                    onValueChange={(value) => handleFilterChange('sector', value as Sector)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.common.all} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.common.all}</SelectItem>
                      {SECTORS.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {t.sectorLabels[sector] || sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t.customers.segment}</Label>
                  <Select
                    value={filters.segment || 'all'}
                    onValueChange={(value) => handleFilterChange('segment', value as Segment)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.common.all} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.common.all}</SelectItem>
                      {SEGMENTS.map((segment) => (
                        <SelectItem key={segment} value={segment}>
                          {t.segmentLabels[segment] || segment}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t.thresholds.product}</Label>
                  <Select
                    value={filters.productId || 'all'}
                    onValueChange={(value) => handleFilterChange('productId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.common.all} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.common.all}</SelectItem>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t.common.status}</Label>
                  <Select
                    value={filters.isActive === undefined ? 'all' : filters.isActive.toString()}
                    onValueChange={(value) =>
                      handleFilterChange('isActive', value === 'all' ? undefined : value === 'true')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.common.all} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.common.all}</SelectItem>
                      <SelectItem value="true">{t.thresholds.active}</SelectItem>
                      <SelectItem value="false">{t.thresholds.inactive}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {activeFiltersCount > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    {t.common.close}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Thresholds Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {t.thresholds.title}
                {thresholds && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({thresholds.length})
                  </span>
                )}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.customers.sector}</TableHead>
                      <TableHead>{t.customers.segment}</TableHead>
                      <TableHead>{t.thresholds.product}</TableHead>
                      <TableHead>{t.categoryLabels['Kredi']}</TableHead>
                      <TableHead className="text-right">{t.thresholds.thresholdValue}</TableHead>
                      <TableHead>{t.thresholds.calculationDate}</TableHead>
                      <TableHead className="text-center">{t.thresholds.version}</TableHead>
                      <TableHead className="text-center">{t.thresholds.active}</TableHead>
                      <TableHead className="text-right">{t.common.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedThresholds.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          {t.thresholds.noThresholds}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedThresholds.map((threshold) => (
                        <TableRow key={threshold.id}>
                          <TableCell>{t.sectorLabels[threshold.sector] || threshold.sector}</TableCell>
                          <TableCell>{t.segmentLabels[threshold.segment] || threshold.segment}</TableCell>
                          <TableCell className="font-medium">
                            {threshold.products?.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{t.categoryLabels[threshold.products?.category as keyof typeof t.categoryLabels] || threshold.products?.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(Number(threshold.threshold_value))}
                          </TableCell>
                          <TableCell>{formatDate(threshold.calculation_date)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">v{threshold.version_num}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={threshold.is_active}
                              onCheckedChange={() => handleToggleActive(threshold)}
                              disabled={!isAdmin}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(threshold)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      {currentPage} / {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        {t.common.previous}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        {t.common.next}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingThreshold} onOpenChange={() => setEditingThreshold(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.thresholds.editThreshold}</DialogTitle>
              <DialogDescription>
                {editingThreshold?.products?.name} - {t.sectorLabels[editingThreshold?.sector as keyof typeof t.sectorLabels] || editingThreshold?.sector} / {t.segmentLabels[editingThreshold?.segment as keyof typeof t.segmentLabels] || editingThreshold?.segment}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="threshold-value">{t.thresholds.thresholdValue}</Label>
                <Input
                  id="threshold-value"
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={t.thresholds.thresholdValue}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingThreshold(null)}>
                {t.common.cancel}
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateThreshold.isPending}>
                {updateThreshold.isPending ? t.common.loading : t.common.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
