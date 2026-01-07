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
        title: 'Başarılı',
        description: 'Eşik değeri güncellendi.',
      });
      setEditingThreshold(null);
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Eşik değeri güncellenirken bir hata oluştu. Yalnızca yöneticiler düzenleme yapabilir.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (threshold: ProductThresholdWithProduct) => {
    if (!isAdmin) {
      toast({
        title: 'Yetki Hatası',
        description: 'Yalnızca yöneticiler eşik değerlerini düzenleyebilir.',
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
        title: 'Başarılı',
        description: `Eşik değeri ${!threshold.is_active ? 'aktif' : 'pasif'} yapıldı.`,
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Durum güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = () => {
    if (!thresholds) return;

    const headers = ['Sektör', 'Segment', 'Ürün', 'Kategori', 'Eşik Değeri', 'Hesaplama Tarihi', 'Versiyon', 'Aktif'];
    const rows = thresholds.map(t => [
      t.sector,
      t.segment,
      t.products?.name || '',
      t.products?.category || '',
      t.threshold_value,
      t.calculation_date,
      t.version_num,
      t.is_active ? 'Evet' : 'Hayır',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `esik_degerleri_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'Başarılı',
      description: 'CSV dosyası indirildi.',
    });
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Eşik Değerleri</h1>
            <p className="text-muted-foreground">
              Sektör, segment ve ürün bazlı hedef eşik değerlerini yönetin
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" />
              Filtreler
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={!thresholds?.length}>
              <Download className="mr-2 h-4 w-4" />
              CSV İndir
            </Button>
            <Button variant="outline" disabled>
              <Upload className="mr-2 h-4 w-4" />
              CSV Yükle
            </Button>
          </div>
        </div>

        {/* Admin Notice */}
        {!isLoadingRole && !isAdmin && (
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              Eşik değerlerini görüntüleyebilirsiniz ancak düzenleme yapabilmek için yönetici yetkisi gereklidir.
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Sektör</Label>
                  <Select
                    value={filters.sector || 'all'}
                    onValueChange={(value) => handleFilterChange('sector', value as Sector)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {SECTORS.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Segment</Label>
                  <Select
                    value={filters.segment || 'all'}
                    onValueChange={(value) => handleFilterChange('segment', value as Segment)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {SEGMENTS.map((segment) => (
                        <SelectItem key={segment} value={segment}>
                          {segment}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ürün</Label>
                  <Select
                    value={filters.productId || 'all'}
                    onValueChange={(value) => handleFilterChange('productId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Durum</Label>
                  <Select
                    value={filters.isActive === undefined ? 'all' : filters.isActive.toString()}
                    onValueChange={(value) =>
                      handleFilterChange('isActive', value === 'all' ? undefined : value === 'true')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="true">Aktif</SelectItem>
                      <SelectItem value="false">Pasif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {activeFiltersCount > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Filtreleri Temizle
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
                Eşik Değerleri Listesi
                {thresholds && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({thresholds.length} kayıt)
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
                      <TableHead>Sektör</TableHead>
                      <TableHead>Segment</TableHead>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">Eşik Değeri</TableHead>
                      <TableHead>Hesaplama Tarihi</TableHead>
                      <TableHead className="text-center">Versiyon</TableHead>
                      <TableHead className="text-center">Aktif</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedThresholds.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          Eşik değeri bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedThresholds.map((threshold) => (
                        <TableRow key={threshold.id}>
                          <TableCell>{threshold.sector}</TableCell>
                          <TableCell>{threshold.segment}</TableCell>
                          <TableCell className="font-medium">
                            {threshold.products?.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{threshold.products?.category}</Badge>
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
                      Sayfa {currentPage} / {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Önceki
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Sonraki
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
              <DialogTitle>Eşik Değeri Düzenle</DialogTitle>
              <DialogDescription>
                {editingThreshold?.products?.name} - {editingThreshold?.sector} / {editingThreshold?.segment}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="threshold-value">Eşik Değeri</Label>
                <Input
                  id="threshold-value"
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Eşik değeri girin"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingThreshold(null)}>
                İptal
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateThreshold.isPending}>
                {updateThreshold.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
