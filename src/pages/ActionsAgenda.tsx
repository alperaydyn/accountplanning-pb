import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, addWeeks, subWeeks, addMonths, subMonths, addDays, subDays, isWeekend } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { actions } from "@/data/actions";
import { customers } from "@/data/customers";
import { products } from "@/data/products";
import { Action, ActionStatus } from "@/types";

type ViewMode = "daily" | "weekly" | "monthly";

const statusConfig: Record<ActionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  planned: { label: "Planned", variant: "default", icon: CalendarIcon },
  completed: { label: "Completed", variant: "outline", icon: CheckCircle2 },
  postponed: { label: "Postponed", variant: "secondary", icon: AlertCircle },
  not_interested: { label: "Not Interested", variant: "destructive", icon: XCircle },
  not_possible: { label: "Not Possible", variant: "destructive", icon: XCircle },
};

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

export default function ActionsAgenda() {
  const [searchParams] = useSearchParams();
  const filterStatus = searchParams.get("status"); // 'planned' or 'pending'
  
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "daily") {
      setCurrentDate(direction === "next" ? addDays(currentDate, 1) : subDays(currentDate, 1));
    } else if (viewMode === "weekly") {
      setCurrentDate(direction === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const dateRange = useMemo(() => {
    if (viewMode === "daily") {
      return { start: currentDate, end: currentDate };
    } else if (viewMode === "weekly") {
      return { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) };
    } else {
      return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }
  }, [currentDate, viewMode]);

  const days = useMemo(() => {
    const allDays = eachDayOfInterval(dateRange);
    // Hide weekends for weekly view
    if (viewMode === "weekly") {
      return allDays.filter(day => !isWeekend(day));
    }
    return allDays;
  }, [dateRange, viewMode]);

  const filteredActions = useMemo(() => {
    let result = actions;
    
    if (filterStatus === "planned") {
      result = result.filter(a => a.status === "planned");
    } else if (filterStatus === "pending") {
      result = result.filter(a => a.status === "pending");
    } else {
      result = result.filter(a => a.status === "planned" || a.status === "pending");
    }
    
    return result;
  }, [filterStatus]);

  const getActionsForDay = (day: Date): Action[] => {
    return filteredActions.filter(action => {
      if (action.plannedDate) {
        return isSameDay(new Date(action.plannedDate), day);
      }
      // For pending actions without planned date, show on creation date
      if (action.status === "pending" && action.createdAt) {
        return isSameDay(new Date(action.createdAt), day);
      }
      return false;
    });
  };

  const getCustomerName = (customerId: string) => 
    customers.find(c => c.id === customerId)?.name || "Unknown";

  const getProductName = (productId: string) => 
    products.find(p => p.id === productId)?.name || "Unknown";

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
    return days.reduce((sum, day) => sum + getActionsForDay(day).length, 0);
  }, [days, filteredActions]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Actions Agenda</h1>
            <p className="text-muted-foreground">
              {filterStatus === "planned" ? "Planned actions" : filterStatus === "pending" ? "Pending actions" : "All planned & pending actions"} 
              {" "}• {totalActionsInView} actions in view
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Navigation */}
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
                  Today
                </Button>
              </div>
              <CardTitle className="text-lg">{headerText}</CardTitle>
              <div className="flex gap-2">
                {filterStatus && (
                  <Badge variant="secondary">
                    Filtered: {filterStatus === "planned" ? "Planned" : "Pending"}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Calendar Grid */}
        {viewMode === "monthly" ? (
          <div className="grid grid-cols-7 gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            {days.map(day => {
              const dayActions = getActionsForDay(day);
              return (
                <Card 
                  key={day.toISOString()} 
                  className={`min-h-[120px] ${isToday(day) ? "ring-2 ring-primary" : ""}`}
                >
                  <CardContent className="p-2">
                    <div className={`text-sm font-medium mb-1 ${isToday(day) ? "text-primary" : "text-muted-foreground"}`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayActions.slice(0, 3).map(action => (
                        <div 
                          key={action.id} 
                          className={`text-xs p-1 rounded border truncate ${priorityColors[action.priority]}`}
                          title={`${action.name} - ${getCustomerName(action.customerId)}`}
                        >
                          {action.name}
                        </div>
                      ))}
                      {dayActions.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayActions.length - 3} more
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : viewMode === "weekly" ? (
          /* Weekly View - Vertical days, compact layout, no weekends */
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {days.map(day => {
                const dayActions = getActionsForDay(day);
                return (
                  <div 
                    key={day.toISOString()} 
                    className={`flex ${isToday(day) ? "bg-primary/5" : ""}`}
                  >
                    {/* Day label */}
                    <div className={`w-24 shrink-0 p-3 border-r border-border ${isToday(day) ? "bg-primary/10" : "bg-muted/30"}`}>
                      <p className={`text-xs font-medium ${isToday(day) ? "text-primary" : "text-muted-foreground"}`}>
                        {format(day, "EEE")}
                      </p>
                      <p className={`text-lg font-semibold ${isToday(day) ? "text-primary" : "text-foreground"}`}>
                        {format(day, "d")}
                      </p>
                    </div>
                    {/* Actions */}
                    <div className="flex-1 p-2 min-h-[60px]">
                      {dayActions.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2">No actions</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {dayActions.map(action => (
                            <div 
                              key={action.id} 
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs ${priorityColors[action.priority]}`}
                              title={`${action.name} - ${getProductName(action.productId)}`}
                            >
                              <Link 
                                to={`/customers/${action.customerId}`}
                                className="font-medium truncate max-w-[120px] hover:underline hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {getCustomerName(action.customerId)}
                              </Link>
                              <span className="text-muted-foreground">•</span>
                              <span className="truncate max-w-[150px]">{action.name}</span>
                              <Badge variant={statusConfig[action.status].variant} className="text-[10px] px-1 py-0 h-4">
                                {statusConfig[action.status].label}
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
        ) : (
          /* Daily View */
          <div className="grid grid-cols-1 gap-4">
            {days.map(day => {
              const dayActions = getActionsForDay(day);
              return (
                <Card 
                  key={day.toISOString()} 
                  className={`${isToday(day) ? "ring-2 ring-primary" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm ${isToday(day) ? "text-primary" : ""}`}>
                      {format(day, "EEEE, MMMM d")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dayActions.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No actions</p>
                    ) : (
                      dayActions.map(action => {
                        const StatusIcon = statusConfig[action.status].icon;
                        return (
                          <div 
                            key={action.id} 
                            className={`p-3 rounded-lg border ${priorityColors[action.priority]}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{action.name}</p>
                                <Link 
                                  to={`/customers/${action.customerId}`}
                                  className="text-xs text-muted-foreground truncate hover:underline hover:text-primary block"
                                >
                                  {getCustomerName(action.customerId)}
                                </Link>
                                <p className="text-xs text-muted-foreground truncate">
                                  {getProductName(action.productId)}
                                </p>
                              </div>
                              <Badge variant={statusConfig[action.status].variant} className="text-xs shrink-0">
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[action.status].label}
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
