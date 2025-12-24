import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customers } from "@/data/customers";
import { Sector, Segment } from "@/types";

const Customers = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState<string>("all");
  const [segment, setSegment] = useState<string>("all");
  const [primaryBank, setPrimaryBank] = useState<string>("all");

  const filteredCustomers = customers.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (sector !== "all" && c.sector !== sector) return false;
    if (segment !== "all" && c.segment !== segment) return false;
    if (primaryBank !== "all" && c.isPrimaryBank !== (primaryBank === "true")) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
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
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Sector" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    {["Agriculture", "Manufacturing", "Services", "Technology", "Healthcare", "Retail", "Energy"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={segment} onValueChange={setSegment}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Segment" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Segments</SelectItem>
                    {["Small", "Medium", "Large Enterprise"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={primaryBank} onValueChange={setPrimaryBank}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Primary Bank" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Primary Bank</SelectItem>
                    <SelectItem value="false">Non-Primary</SelectItem>
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
                  <TableHead>Sector</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/customers/${customer.id}`)}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.sector}</TableCell>
                    <TableCell>{customer.segment}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={customer.isPrimaryBank ? "default" : "secondary"}>
                        {customer.isPrimaryBank ? "Primary" : "Non-Primary"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-success">{customer.totalActionsPlanned}</span>
                      <span className="text-muted-foreground"> / </span>
                      <span className="text-warning">{customer.totalActionsNotPlanned}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{customer.lastActivityDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Customers;
