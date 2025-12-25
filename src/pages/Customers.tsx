import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Users } from "lucide-react";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { customers, customerGroups, getGroupById } from "@/data/customers";
import { products } from "@/data/products";
import { customerProducts } from "@/data/customerProducts";
import { actions } from "@/data/actions";
import { ActionStatus, CustomerStatus } from "@/types";

const getStatusLabel = (status: CustomerStatus): string => {
  const labels: Record<CustomerStatus, string> = {
    inactive: "Inactive",
    active: "Active",
    target: "Target",
    strong_target: "Strong Target",
    primary: "Primary",
  };
  return labels[status];
};

const getStatusBadgeClass = (status: CustomerStatus): string => {
  switch (status) {
    case "primary": return "bg-emerald-600 text-white hover:bg-emerald-600";
    case "strong_target": return "bg-amber-500 text-white hover:bg-amber-500";
    case "target": return "bg-sky-500 text-white hover:bg-sky-500";
    case "active": return "bg-slate-400 text-white hover:bg-slate-400";
    case "inactive": return "bg-slate-200 text-slate-600 hover:bg-slate-200";
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

  // Get customer IDs that have the selected product
  const getCustomerIdsWithProduct = (productId: string): Set<string> => {
    if (productId === "all") return new Set(customers.map(c => c.id));
    return new Set(customerProducts.filter(cp => cp.productId === productId).map(cp => cp.customerId));
  };

  // Get customer IDs that have actions with the selected status
  const getCustomerIdsWithActionStatus = (status: string): Set<string> => {
    if (status === "all") return new Set(customers.map(c => c.id));
    return new Set(actions.filter(a => a.status === status).map(a => a.customerId));
  };

  const customerIdsWithProduct = getCustomerIdsWithProduct(productFilter);
  const customerIdsWithActionStatus = getCustomerIdsWithActionStatus(actionStatusFilter);

  const filteredCustomers = customers.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (productFilter !== "all" && !customerIdsWithProduct.has(c.id)) return false;
    if (actionStatusFilter !== "all" && !customerIdsWithActionStatus.has(c.id)) return false;
    if (groupFilter !== "all" && c.groupId !== groupFilter) return false;
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <PageBreadcrumb items={[{ label: "Customers" }]} />
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer portfolio and plan actions.</p>
        </div>

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
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="target">Target</SelectItem>
                    <SelectItem value="strong_target">Strong Target</SelectItem>
                    <SelectItem value="primary">Primary</SelectItem>
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => {
                  const group = customer.groupId ? getGroupById(customer.groupId) : null;
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
                          {getStatusLabel(customer.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-success">{customer.totalActionsPlanned}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-warning">{customer.totalActionsNotPlanned}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{customer.lastActivityDate}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Customers;
