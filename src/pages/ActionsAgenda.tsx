import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, addWeeks, subWeeks, addMonths, subMonths, addDays, subDays, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, AlertCircle, Sparkles, List, Search, Filter } from "lucide-react";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useActions, Action } from "@/hooks/useActions";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserSettings, AgendaViewMode } from "@/hooks/useUserSettings";
import { Database } from "@/integrations/supabase/types";

// Helper function to check if a day is weekend (Saturday = 6, Sunday = 0)
const isWeekendDay = (date: Date): boolean => {
  const day = getDay(date);
  return day === 0 || day === 6;
};

type ViewMode = AgendaViewMode;
type ActionStatus = Database['public']['Enums']['action_status'];

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

export default function ActionsAgenda() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { settings, updateSettings } = useUserSettings();
  const filterStatus = searchParams.get("status");
  
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isViewInitialized, setIsViewInitialized] = useState(false);

  // Load preferred view from settings
  useEffect(() => {
    if (settings?.preferred_agenda_view && !isViewInitialized) {
      setViewMode(settings.preferred_agenda_view);
      setIsViewInitialized(true);
    }
  }, [settings?.preferred_agenda_view, isViewInitialized]);

  const handleViewModeChange = (newMode: ViewMode) => {
    setViewMode(newMode);
    // Save preference to database
    if (settings) {
      updateSettings({ preferred_agenda_view: newMode });
    }
  };

  const statusConfig: Record<ActionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
    'Beklemede': { label: t.statusLabels['Beklemede'], variant: "secondary", icon: Clock },
    'Planlandı': { label: t.statusLabels['Planlandı'], variant: "default", icon: CalendarIcon },
    'Tamamlandı': { label: t.statusLabels['Tamamlandı'], variant: "outline", icon: CheckCircle2 },
    'Ertelendi': { label: t.statusLabels['Ertelendi'], variant: "secondary", icon: AlertCircle },
    'İlgilenmiyor': { label: t.statusLabels['İlgilenmiyor'], variant: "destructive", icon: XCircle },
    'Uygun Değil': { label: t.statusLabels['Uygun Değil'], variant: "destructive", icon: XCircle },
  };

  const handleAIPlanForDate = (date: Date) => {
    const dateParam = format(date, "yyyy-MM-dd");
    navigate(`/ai-assistant?prompt=plan-my-day&date=${dateParam}`);
  };
  
  const { data: actions = [] } = useActions();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "daily" || viewMode === "list") {
      setCurrentDate(direction === "next" ? addDays(currentDate, 1) : subDays(currentDate, 1));
    } else if (viewMode === "weekly") {
      setCurrentDate(direction === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const handleDayClick = (day: Date) => {
    setCurrentDate(day);
    setViewMode("daily");
    if (settings) {
      updateSettings({ preferred_agenda_view: "daily" });
    }
  };

  const dateRange = useMemo(() => {
    if (viewMode === "daily" || viewMode === "list") {
      return { start: currentDate, end: currentDate };
    } else if (viewMode === "weekly") {
      return { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) };
    } else {
      return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }
  }, [currentDate, viewMode]);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange.start, dateRange.end]);

  const filteredActions = useMemo(() => {
    let result = actions;
    
    if (filterStatus === "Planlandı") {
      result = result.filter(a => a.current_status === "Planlandı");
    } else if (filterStatus === "Beklemede") {
      result = result.filter(a => a.current_status === "Beklemede");
    } else {
      result = result.filter(a => a.current_status === "Planlandı" || a.current_status === "Beklemede");
    }
    
    return result;
  }, [actions, filterStatus]);

  const getActionsForDay = (day: Date): Action[] => {
    return filteredActions.filter(action => {
      if (action.current_planned_date) {
        return isSameDay(new Date(action.current_planned_date), day);
      }
      if (action.current_status === "Beklemede" && action.action_target_date) {
        return isSameDay(new Date(action.action_target_date), day);
      }
      return false;
    });
  };

  // For list view, get all actions within the current month
  const allActionsInRange = useMemo(() => {
    if (viewMode !== "list") return [];
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    return filteredActions
      .filter(action => {
        const actionDate = action.current_planned_date 
          ? new Date(action.current_planned_date)
          : action.action_target_date 
            ? new Date(action.action_target_date)
            : null;
        
        if (!actionDate) return false;
        return actionDate >= monthStart && actionDate <= monthEnd;
      })
      .sort((a, b) => {
        const dateA = new Date(a.current_planned_date || a.action_target_date || 0);
        const dateB = new Date(b.current_planned_date || b.action_target_date || 0);
        return dateA.getTime() - dateB.getTime();
      });
  }, [filteredActions, currentDate, viewMode]);

  const getCustomerName = (customerId: string) => 
    customers.find(c => c.id === customerId)?.name || t.common.unknown;

  const getProductName = (productId: string) => 
    products.find(p => p.id === productId)?.name || t.common.unknown;

  const headerText = useMemo(() => {
    if (viewMode === "daily") {
      return format(currentDate, "EEEE, MMMM d, yyyy");
    } else if (viewMode === "weekly") {
      return `${format(dateRange.start, "MMM d")} - ${format(dateRange.end, "MMM d, yyyy")}`;
    } else {
      return format(currentDate, "MMMM yyyy");
    }
  }, [currentDate, viewMode, dateRange]);

  const totalActionsInView = useMemo(() => {
    if (viewMode === "list") return allActionsInRange.length;
    return days.reduce((sum, day) => sum + getActionsForDay(day).length, 0);
  }, [days, filteredActions, viewMode, allActionsInRange]);

  const getFilterDescription = () => {
    if (filterStatus === "Planlandı") return t.actions.plannedActions;
    if (filterStatus === "Beklemede") return t.actions.pendingActions;
    return t.actions.allPlannedPending;
  };

  const getNoActionsMessage = () => {
    if (viewMode === "daily" || viewMode === "list") return t.actions.noActionsDay;
    if (viewMode === "weekly") return t.actions.noActionsWeek;
    return t.actions.noActionsMonth;
  };

  // List view state
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [listPriorityFilter, setListPriorityFilter] = useState<string>("all");
  const [listStatusFilter, setListStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtered list for list view with search, priority, and status filters
  const filteredListActions = useMemo(() => {
    if (viewMode !== "list") return [];
    
    let result = allActionsInRange;
    
    // Search filter
    if (listSearchQuery.trim()) {
      const query = listSearchQuery.toLowerCase();
      result = result.filter(action => 
        action.name.toLowerCase().includes(query) ||
        getCustomerName(action.customer_id).toLowerCase().includes(query) ||
        getProductName(action.product_id).toLowerCase().includes(query)
      );
    }
    
    // Priority filter
    if (listPriorityFilter !== "all") {
      result = result.filter(action => action.priority === listPriorityFilter);
    }
    
    // Status filter
    if (listStatusFilter !== "all") {
      result = result.filter(action => action.current_status === listStatusFilter);
    }
    
    return result;
  }, [allActionsInRange, listSearchQuery, listPriorityFilter, listStatusFilter, viewMode]);

  // Pagination
  const totalPages = Math.ceil(filteredListActions.length / itemsPerPage);
  const paginatedActions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredListActions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredListActions, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [listSearchQuery, listPriorityFilter, listStatusFilter]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <PageBreadcrumb items={[{ label: t.actions.title }]} />
            <h1 className="text-2xl font-bold text-foreground">{t.actions.title}</h1>
            <p className="text-muted-foreground">
              {getFilterDescription()} 
              {" "}• {totalActionsInView} {t.actions.actionsInView}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => handleViewModeChange(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="daily">{t.actions.daily}</TabsTrigger>
                <TabsTrigger value="weekly">{t.actions.weekly}</TabsTrigger>
                <TabsTrigger value="monthly">{t.actions.monthly}</TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-1">
                  <List className="h-3.5 w-3.5" />
                  {t.actions.list}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={goToToday}>
                  {t.common.today}
                </Button>
              </div>
              <CardTitle className="text-lg">{headerText}</CardTitle>
              <div className="flex gap-2">
                {filterStatus && (
                  <Badge variant="secondary">
                    {filterStatus === "Planlandı" ? t.actions.planned : t.actions.pending}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Empty State for no actions */}
        {totalActionsInView === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 rounded-full bg-violet-500/10 mb-4">
                <Sparkles className="h-8 w-8 text-violet-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t.actions.noActionsPlanned}</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                {getNoActionsMessage()}
              </p>
              <Button 
                onClick={() => handleAIPlanForDate(currentDate)}
                className="bg-violet-500 hover:bg-violet-600 text-white"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {t.actions.letAIFind}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* List View - Modern Table with Filters and Pagination */}
        {viewMode === "list" && (
          <Card>
            {/* Filters */}
            <CardHeader className="pb-4 border-b">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t.common.search}
                    value={listSearchQuery}
                    onChange={(e) => setListSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={listPriorityFilter} onValueChange={setListPriorityFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder={t.actions.priority} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.common.all} {t.actions.priority}</SelectItem>
                      <SelectItem value="high">{t.actions.highPriority}</SelectItem>
                      <SelectItem value="medium">{t.actions.mediumPriority}</SelectItem>
                      <SelectItem value="low">{t.actions.lowPriority}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={listStatusFilter} onValueChange={setListStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder={t.actions.status} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.common.all} {t.actions.status}</SelectItem>
                      <SelectItem value="Beklemede">{t.statusLabels['Beklemede']}</SelectItem>
                      <SelectItem value="Planlandı">{t.statusLabels['Planlandı']}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            {/* Table */}
            <CardContent className="p-0">
              {filteredListActions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">{t.actions.noActionsFound}</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-[200px]">{t.actions.action}</TableHead>
                        <TableHead>{t.actions.customer}</TableHead>
                        <TableHead>{t.actions.product}</TableHead>
                        <TableHead className="w-[100px]">{t.actions.priority}</TableHead>
                        <TableHead className="w-[120px]">{t.actions.status}</TableHead>
                        <TableHead className="w-[120px]">{t.actions.date}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedActions.map(action => {
                        const StatusIcon = statusConfig[action.current_status].icon;
                        const actionDate = action.current_planned_date || action.action_target_date;
                        return (
                          <TableRow key={action.id} className="hover:bg-muted/20">
                            <TableCell>
                              <Link 
                                to={`/customers/${action.customer_id}?action=${action.id}`}
                                className="font-medium hover:underline hover:text-primary"
                              >
                                {action.name}
                              </Link>
                              {action.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                  {action.description}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <Link 
                                to={`/customers/${action.customer_id}`}
                                className="hover:underline hover:text-primary text-sm"
                              >
                                {getCustomerName(action.customer_id)}
                              </Link>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {getProductName(action.product_id)}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${priorityColors[action.priority]}`}
                              >
                                {action.priority === 'high' ? t.actions.highPriority : 
                                 action.priority === 'medium' ? t.actions.mediumPriority : 
                                 t.actions.lowPriority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusConfig[action.current_status].variant} className="text-xs">
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[action.current_status].label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-3.5 w-3.5" />
                                {actionDate ? format(new Date(actionDate), "d MMM yyyy") : "-"}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        {t.common.showing} {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredListActions.length)} {t.common.of} {filteredListActions.length}
                      </p>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum = i + 1;
                            if (totalPages > 5) {
                              if (currentPage > 3) {
                                pageNum = currentPage - 2 + i;
                              }
                              if (currentPage > totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              }
                            }
                            if (pageNum < 1 || pageNum > totalPages) return null;
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(pageNum)}
                                  isActive={currentPage === pageNum}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Monthly View */}
        {totalActionsInView > 0 && viewMode === "monthly" && (
          <div className="grid grid-cols-7 gap-2">
            {[t.calendar.mon, t.calendar.tue, t.calendar.wed, t.calendar.thu, t.calendar.fri, t.calendar.sat, t.calendar.sun].map((day, index) => (
              <div 
                key={day} 
                className={`text-center text-sm font-medium py-2 ${index >= 5 ? "text-muted-foreground/70" : "text-muted-foreground"}`}
              >
                {day}
              </div>
            ))}
            {days.map(day => {
              const dayActions = getActionsForDay(day);
              const isWeekend = isWeekendDay(day);
              return (
                <Card 
                  key={day.toISOString()} 
                  className={`min-h-[120px] ${isToday(day) ? "ring-2 ring-primary" : ""} ${isWeekend ? "bg-muted/30" : ""}`}
                >
                  <CardContent className="p-2">
                    <div className="flex items-center justify-between mb-1">
                      <button
                        onClick={() => handleDayClick(day)}
                        className={`text-sm font-medium hover:text-primary hover:underline cursor-pointer ${isToday(day) ? "text-primary" : isWeekend ? "text-muted-foreground/70" : "text-muted-foreground"}`}
                      >
                        {format(day, "d")}
                      </button>
                      {dayActions.length === 0 && (
                        <button
                          onClick={() => handleAIPlanForDate(day)}
                          className="flex items-center gap-0.5 text-[10px] text-violet-500 hover:text-violet-600 transition-colors"
                          title={t.actions.planDay}
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>{t.actions.planDay}</span>
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayActions.slice(0, 3).map(action => (
                        <Link 
                          key={action.id}
                          to={`/customers/${action.customer_id}?action=${action.id}`}
                          className={`text-xs p-1 rounded border truncate block hover:underline ${priorityColors[action.priority]}`}
                          title={`${action.name} - ${getCustomerName(action.customer_id)}`}
                        >
                          {action.name}
                        </Link>
                      ))}
                      {dayActions.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayActions.length - 3} {t.common.more}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Weekly View */}
        {totalActionsInView > 0 && viewMode === "weekly" && (
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {days.map(day => {
                const dayActions = getActionsForDay(day);
                const isWeekend = isWeekendDay(day);
                return (
                  <div 
                    key={day.toISOString()} 
                    className={`flex ${isToday(day) ? "bg-primary/5" : ""} ${isWeekendDay ? "bg-muted/30" : ""}`}
                  >
                    <div className={`w-24 shrink-0 p-3 border-r border-border ${isToday(day) ? "bg-primary/10" : isWeekendDay ? "bg-muted/50" : "bg-muted/30"}`}>
                      <p className={`text-xs font-medium ${isToday(day) ? "text-primary" : isWeekendDay ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                        {format(day, "EEE")}
                      </p>
                      <button
                        onClick={() => handleDayClick(day)}
                        className={`text-lg font-semibold hover:text-primary hover:underline cursor-pointer ${isToday(day) ? "text-primary" : isWeekendDay ? "text-muted-foreground/70" : "text-foreground"}`}
                      >
                        {format(day, "d")}
                      </button>
                    </div>
                    <div className="flex-1 p-2 min-h-[60px]">
                      {dayActions.length === 0 ? (
                        <div className="flex items-center justify-between py-2">
                          <p className="text-xs text-muted-foreground italic">{t.actions.noActionsFound}</p>
                          <button
                            onClick={() => handleAIPlanForDate(day)}
                            className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-600 transition-colors"
                            title={t.actions.planDay}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>{t.actions.planDay}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {dayActions.map(action => (
                            <div 
                              key={action.id} 
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs ${priorityColors[action.priority]}`}
                              title={`${action.name} - ${getProductName(action.product_id)}`}
                            >
                              <Link 
                                to={`/customers/${action.customer_id}`}
                                className="font-medium truncate max-w-[120px] hover:underline hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {getCustomerName(action.customer_id)}
                              </Link>
                              <span className="text-muted-foreground">•</span>
                              <Link 
                                to={`/customers/${action.customer_id}?action=${action.id}`}
                                className="truncate max-w-[150px] hover:underline hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {action.name}
                              </Link>
                              <Badge variant={statusConfig[action.current_status].variant} className="text-[10px] px-1 py-0 h-4">
                                {statusConfig[action.current_status].label}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Daily View */}
        {totalActionsInView > 0 && viewMode === "daily" && (
          <div className="grid grid-cols-1 gap-4">
            {days.map(day => {
              const dayActions = getActionsForDay(day);
              return (
                <Card 
                  key={day.toISOString()} 
                  className={`${isToday(day) ? "ring-2 ring-primary" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-sm ${isToday(day) ? "text-primary" : ""}`}>
                        {format(day, "EEEE, MMMM d")}
                      </CardTitle>
                      {dayActions.length === 0 && (
                        <button
                          onClick={() => handleAIPlanForDate(day)}
                          className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-600 transition-colors"
                          title={t.actions.planDay}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>{t.actions.planDay}</span>
                        </button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dayActions.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">{t.actions.noActionsFound}</p>
                    ) : (
                      dayActions.map(action => {
                        const StatusIcon = statusConfig[action.current_status].icon;
                        return (
                          <div 
                            key={action.id} 
                            className={`p-3 rounded-lg border ${priorityColors[action.priority]}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <Link 
                                  to={`/customers/${action.customer_id}?action=${action.id}`}
                                  className="font-medium text-sm truncate hover:underline hover:text-primary block"
                                >
                                  {action.name}
                                </Link>
                                <Link 
                                  to={`/customers/${action.customer_id}`}
                                  className="text-xs text-muted-foreground truncate hover:underline hover:text-primary block"
                                >
                                  {getCustomerName(action.customer_id)}
                                </Link>
                                <p className="text-xs text-muted-foreground truncate">
                                  {getProductName(action.product_id)}
                                </p>
                              </div>
                              <Badge variant={statusConfig[action.current_status].variant} className="text-xs shrink-0">
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[action.current_status].label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {action.description}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
