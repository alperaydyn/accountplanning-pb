import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Users, Loader2, Plus, Sparkles, Package } from "lucide-react";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCustomers, SECTORS, SEGMENTS, STATUSES, Customer } from "@/hooks/useCustomers";
import { useCustomerGroups } from "@/hooks/useCustomerGroups";
import { useProducts } from "@/hooks/useProducts";
import { useActions, ACTION_STATUSES } from "@/hooks/useActions";
import { CreateCustomerModal } from "@/components/customer/CreateCustomerModal";
import { Database } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type CustomerStatus = Database['public']['Enums']['customer_status'];

const getStatusBadgeClass = (status: CustomerStatus): string => {
  switch (status) {
    case "Ana Banka": return "bg-emerald-600 text-white hover:bg-emerald-600";
    case "Strong Target": return "bg-amber-500 text-white hover:bg-amber-500";
    case "Target": return "bg-sky-500 text-white hover:bg-sky-500";
    case "Aktif": return "bg-slate-400 text-white hover:bg-slate-400";
    case "Yeni Müşteri": return "bg-slate-200 text-slate-600 hover:bg-slate-200";
    default: return "bg-slate-200 text-slate-600 hover:bg-slate-200";
  }
};

const Customers = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionStatusFilter, setActionStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Initialize filters from URL params
  useEffect(() => {
    const productId = searchParams.get("product");
    const groupId = searchParams.get("group");
    if (productId) {
      setProductFilter(productId);
    }
    if (groupId) {
      setGroupFilter(groupId);
    }
  }, [searchParams]);

  // Fetch data from database
  const { data: customers = [], isLoading: customersLoading } = useCustomers({
    search,
    status: statusFilter as CustomerStatus | 'all',
    groupId: groupFilter,
  });
  const { data: customerGroups = [] } = useCustomerGroups();
  const { data: products = [] } = useProducts();
  const { data: allActions = [] } = useActions();

  // Fetch product counts for all customers
  const customerIds = customers.map((c) => c.id);
  const { data: productCounts = [] } = useQuery({
    queryKey: ["customer-product-counts", customerIds],
    queryFn: async () => {
      if (customerIds.length === 0) return [];
      const { data, error } = await supabase
        .from("customer_products")
        .select("customer_id")
        .in("customer_id", customerIds);
      if (error) throw error;
      return data;
    },
    enabled: customerIds.length > 0,
  });

  const productCountMap = useMemo(() => {
    const map = new Map<string, number>();
    productCounts.forEach((row) => {
      map.set(row.customer_id, (map.get(row.customer_id) || 0) + 1);
    });
    return map;
  }, [productCounts]);

  // Filter by product (need to check customer_products) - for now just filter actions
  const getCustomerIdsWithActionStatus = (status: string): Set<string> => {
    if (status === "all") return new Set(customers.map(c => c.id));
    return new Set(allActions.filter(a => a.current_status === status).map(a => a.customer_id));
  };

  const customerIdsWithActionStatus = getCustomerIdsWithActionStatus(actionStatusFilter);

  // Calculate action counts per customer
  const getCustomerActionCounts = (customerId: string) => {
    const customerActions = allActions.filter(a => a.customer_id === customerId);
    const planned = customerActions.filter(a => a.current_status === 'Planlandı').length;
    const pending = customerActions.filter(a => a.current_status === 'Beklemede').length;
    return { planned, pending };
  };

  const filteredCustomers = customers.filter(c => {
    if (actionStatusFilter !== "all" && !customerIdsWithActionStatus.has(c.id)) return false;
    return true;
  });

  const handleGroupClick = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGroupFilter(groupId);
    searchParams.set("group", groupId);
    setSearchParams(searchParams);
  };

  const updateGroupFilter = (value: string) => {
    setGroupFilter(value);
    if (value === "all") {
      searchParams.delete("group");
    } else {
      searchParams.set("group", value);
    }
    setSearchParams(searchParams);
  };

  if (customersLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <PageBreadcrumb items={[{ label: "Customers" }]} />
            <h1 className="text-2xl font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground mt-1">Manage your customer portfolio and plan actions.</p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Create Customer
          </Button>
        </div>

        <CreateCustomerModal open={createModalOpen} onOpenChange={setCreateModalOpen} />

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {STATUSES.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={productFilter} onValueChange={(value) => {
                  setProductFilter(value);
                  if (value === "all") {
                    searchParams.delete("product");
                  } else {
                    searchParams.set("product", value);
                  }
                  setSearchParams(searchParams);
                }}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="Product" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={groupFilter} onValueChange={updateGroupFilter}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="Customer Group" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {customerGroups.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={actionStatusFilter} onValueChange={setActionStatusFilter}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Action Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {ACTION_STATUSES.slice(0, 3).map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No customers found</p>
                <p className="text-sm">Add your first customer to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Products</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const group = customer.customer_groups;
                    const actionCounts = getCustomerActionCounts(customer.id);
                    return (
                      <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/customers/${customer.id}`)}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>
                          {group ? (
                            <Badge 
                              variant="outline" 
                              className="cursor-pointer hover:bg-primary/10 gap-1"
                              onClick={(e) => handleGroupClick(group.id, e)}
                            >
                              <Users className="h-3 w-3" />
                              {group.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>{customer.sector}</TableCell>
                        <TableCell>{customer.segment}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={getStatusBadgeClass(customer.status)}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="gap-1">
                            <Package className="h-3 w-3" />
                            {productCountMap.get(customer.id) || 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-success">{actionCounts.planned}</span>
                          <span className="text-muted-foreground"> / </span>
                          <span className="text-warning">{actionCounts.pending}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{customer.last_activity_date || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Customers;
