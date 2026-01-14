import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, isSameDay, isSameMonth, getDay, parseISO, eachDayOfInterval, isToday as isDateToday } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Target, Sparkles, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActions, Action } from "@/hooks/useActions";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 4;

interface DailyPlanPanelProps {
  recordDate?: string; // Format: "YYYY-MM"
}

// Generate week dates containing a specific date
const generateWeekDatesForDate = (targetDate: Date) => {
  const today = new Date();
  const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday
  const dates: { value: string; label: string; isToday: boolean }[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const isTodayDate = isSameDay(date, today);
    dates.push({
      value: format(date, "yyyy-MM-dd"),
      label: format(date, "EEEE, d MMM", { locale: tr }),
      isToday: isTodayDate,
    });
  }
  
  return dates;
};

// Priority badge component with enhanced styling
const PriorityBadge = ({ priority }: { priority: string }) => {
  const config: Record<string, { variant: "destructive" | "secondary" | "outline"; className: string }> = {
    high: { variant: "destructive", className: "bg-destructive/10 text-destructive border-destructive/20" },
    medium: { variant: "secondary", className: "bg-warning/10 text-warning border-warning/20" },
    low: { variant: "outline", className: "bg-muted text-muted-foreground" },
  };
  const labels: Record<string, string> = {
    high: "Yüksek",
    medium: "Orta",
    low: "Düşük",
  };
  const { className } = config[priority] || config.low;
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", className)}>
      {labels[priority] || priority}
    </Badge>
  );
};

// Action list item with enhanced design
const ActionItem = ({ action, onClick, accentColor }: { action: Action; onClick: () => void; accentColor?: string }) => (
  <div 
    onClick={onClick}
    className={cn(
      "group relative flex items-start gap-3 p-3 rounded-xl border border-border bg-card/50",
      "hover:bg-accent/50 hover:border-accent hover:shadow-sm cursor-pointer transition-all duration-200",
      "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1 before:rounded-full before:transition-all",
      accentColor
    )}
  >
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
          {action.customers?.name}
        </span>
        <PriorityBadge priority={action.priority} />
      </div>
      <p className="text-sm text-muted-foreground truncate">{action.name}</p>
      <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/50" />
        {action.products?.name}
      </p>
    </div>
    <div className="flex flex-col items-end gap-1">
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {format(new Date(action.action_target_date), "d MMM", { locale: tr })}
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  </div>
);

// Pagination component with improved design
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
}) => (
  <div className="flex items-center justify-center gap-1 mt-3">
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-7 w-7 rounded-full"
      disabled={currentPage <= 1}
      onClick={() => onPageChange(currentPage - 1)}
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
    <div className="flex items-center gap-1 px-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={cn(
            "w-2 h-2 rounded-full transition-all",
            page === currentPage 
              ? "bg-primary w-4" 
              : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
          )}
        />
      ))}
    </div>
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-7 w-7 rounded-full"
      disabled={currentPage >= totalPages}
      onClick={() => onPageChange(currentPage + 1)}
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
);

// Mini calendar component with enhanced visuals
const MiniCalendar = ({ 
  selectedDate, 
  actionsByDay,
  plannedByDay,
  onDayClick 
}: { 
  selectedDate: Date;
  actionsByDay: Record<string, number>;
  plannedByDay: Record<string, number>;
  onDayClick: (date: Date) => void;
}) => {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const today = new Date();
  
  // Get the first day of the month's week
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  
  // Generate 6 weeks of days
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  let day = calendarStart;
  
  for (let i = 0; i < 42; i++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    day = addDays(day, 1);
  }
  
  const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  // Calculate max actions for intensity scaling (based on planned actions)
  const maxActions = Math.max(...Object.values(plannedByDay), 1);

  return (
    <div className="w-full">
      <div className="text-center mb-2">
        <span className="font-semibold text-sm text-foreground">
          {format(selectedDate, "MMMM yyyy", { locale: tr })}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {weekDays.map((d, idx) => (
          <div 
            key={d} 
            className={cn(
              "text-center text-[10px] text-muted-foreground font-medium py-0.5",
              idx >= 5 && "text-muted-foreground/60"
            )}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {weeks.flat().map((d, idx) => {
          const dateStr = format(d, "yyyy-MM-dd");
          const completedCount = actionsByDay[dateStr] || 0;
          const plannedCount = plannedByDay[dateStr] || 0;
          const isCurrentMonth = isSameMonth(d, selectedDate);
          const isToday = isSameDay(d, today);
          const isWeekend = getDay(d) === 0 || getDay(d) === 6;
          const intensity = plannedCount > 0 ? Math.min(plannedCount / maxActions, 1) : 0;
          const isHovered = hoveredDay === dateStr;
          
          // Color based on planned actions
          const getBgColor = () => {
            if (!isCurrentMonth || plannedCount === 0) return undefined;
            if (intensity > 0.7) return 'hsl(var(--primary) / 0.25)';
            if (intensity > 0.4) return 'hsl(var(--primary) / 0.15)';
            return 'hsl(var(--primary) / 0.08)';
          };
          
          return (
            <button
              key={idx}
              onClick={() => onDayClick(d)}
              onMouseEnter={() => setHoveredDay(dateStr)}
              onMouseLeave={() => setHoveredDay(null)}
              className={cn(
                "relative aspect-square flex flex-col items-center justify-center rounded-md text-xs transition-all",
                !isCurrentMonth && "text-muted-foreground/30",
                isCurrentMonth && !isWeekend && "hover:bg-accent hover:scale-105",
                isCurrentMonth && isWeekend && "bg-muted/30 hover:bg-muted/50",
                isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background font-bold",
                plannedCount > 0 && isCurrentMonth && "font-medium"
              )}
              style={{
                backgroundColor: getBgColor()
              }}
            >
              {isHovered && isCurrentMonth && (plannedCount > 0 || completedCount > 0) ? (
                <span className="text-[9px] font-bold leading-tight text-center">
                  <span className="text-success">{completedCount}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-primary">{plannedCount}</span>
                </span>
              ) : (
                <span>{format(d, "d")}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Section header component
const SectionHeader = ({ 
  icon: Icon, 
  iconColor, 
  title, 
  count, 
  subtitle 
}: { 
  icon: React.ElementType; 
  iconColor: string; 
  title: string; 
  count?: number; 
  subtitle: string;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-2">
      <div className={cn("p-1.5 rounded-lg", iconColor)}>
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-semibold text-sm">{title}</h3>
      {count !== undefined && (
        <Badge variant="secondary" className="text-xs h-5 px-1.5">
          {count}
        </Badge>
      )}
    </div>
    <p className="text-xs text-muted-foreground pl-8">
      {subtitle}
    </p>
  </div>
);

export const DailyPlanPanel = ({ recordDate }: DailyPlanPanelProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Parse the recordDate prop (format: "YYYY-MM") to get the target month
  const targetMonth = useMemo(() => {
    if (recordDate) {
      // recordDate is "YYYY-MM", parse as first day of that month
      return parseISO(`${recordDate}-01`);
    }
    return new Date();
  }, [recordDate]);
  
  const monthStart = startOfMonth(targetMonth);
  const monthEnd = endOfMonth(targetMonth);
  
  // Check if target month is current month
  const isCurrentMonth = isSameMonth(targetMonth, new Date());
  
  // Generate week dates - for current month use current week, otherwise use first week of month
  const weekDates = useMemo(() => {
    if (isCurrentMonth) {
      return generateWeekDatesForDate(new Date());
    }
    // For historical months, generate dates from the first week of that month
    return generateWeekDatesForDate(monthStart);
  }, [isCurrentMonth, monthStart]);
  
  // Default selected date
  const defaultSelectedDate = useMemo(() => {
    if (isCurrentMonth) {
      return format(new Date(), "yyyy-MM-dd");
    }
    // For historical months, select the first day of the month
    return format(monthStart, "yyyy-MM-dd");
  }, [isCurrentMonth, monthStart]);
  
  const [selectedDate, setSelectedDate] = useState(defaultSelectedDate);
  const [pendingPage, setPendingPage] = useState(1);
  const [todayPage, setTodayPage] = useState(1);
  
  // Reset selectedDate when recordDate changes
  useEffect(() => {
    setSelectedDate(defaultSelectedDate);
    setPendingPage(1);
    setTodayPage(1);
  }, [defaultSelectedDate]);
  
  // Fetch all actions
  const { data: allActions = [], isLoading } = useActions();
  
  // Pending actions for the month (planned but not completed)
  const pendingMonthActions = useMemo(() => {
    return allActions.filter(a => {
      const actionDate = new Date(a.action_target_date);
      const isPendingOrPlanned = a.current_status === "Beklemede" || a.current_status === "Planlandı";
      const isInMonth = actionDate >= monthStart && actionDate <= monthEnd;
      return isPendingOrPlanned && isInMonth;
    }).sort((a, b) => new Date(a.action_target_date).getTime() - new Date(b.action_target_date).getTime());
  }, [allActions, monthStart, monthEnd]);
  
  // Today's actions
  const todayActions = useMemo(() => {
    return allActions.filter(a => {
      const actionDate = format(new Date(a.action_target_date), "yyyy-MM-dd");
      const isActiveStatus = a.current_status === "Beklemede" || a.current_status === "Planlandı";
      return actionDate === selectedDate && isActiveStatus;
    });
  }, [allActions, selectedDate]);
  
  // Completed actions by day for calendar
  const completedByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    allActions.forEach(a => {
      if (a.current_status === "Tamamlandı") {
        const dateStr = format(new Date(a.action_target_date), "yyyy-MM-dd");
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      }
    });
    return counts;
  }, [allActions]);

  // Planned actions by day for calendar coloring
  const plannedByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    allActions.forEach(a => {
      if (a.current_status === "Beklemede" || a.current_status === "Planlandı") {
        const dateStr = format(new Date(a.action_target_date), "yyyy-MM-dd");
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      }
    });
    return counts;
  }, [allActions]);
  
  // Pagination calculations
  const pendingTotalPages = Math.ceil(pendingMonthActions.length / ITEMS_PER_PAGE);
  const todayTotalPages = Math.ceil(todayActions.length / ITEMS_PER_PAGE);
  
  const paginatedPending = pendingMonthActions.slice(
    (pendingPage - 1) * ITEMS_PER_PAGE,
    pendingPage * ITEMS_PER_PAGE
  );
  
  const paginatedToday = todayActions.slice(
    (todayPage - 1) * ITEMS_PER_PAGE,
    todayPage * ITEMS_PER_PAGE
  );
  
  const handleActionClick = (action: Action) => {
    navigate(`/customers/${action.customer_id}?action=${action.id}`);
  };
  
  const handleDayClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    navigate(`/agenda?date=${dateStr}&view=daily`);
  };

  const selectedDateLabel = weekDates.find(d => d.value === selectedDate)?.label || selectedDate;

  return (
    <Card className="w-full overflow-hidden">
      {/* Header with gradient */}
      <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 via-transparent to-accent/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <CalendarIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Günlük Planım</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aksiyonlarınızı takip edin ve planlayın
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section 1: Pending actions for the month */}
          <div className="space-y-4">
            <SectionHeader 
              icon={AlertCircle}
              iconColor="bg-amber-500/10 text-amber-500"
              title="Bekleyen Aksiyonlar"
              count={pendingMonthActions.length}
              subtitle={`${format(monthStart, "MMMM", { locale: tr })} ayı içinde`}
            />
            <ScrollArea className="h-[260px] pr-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div className="h-3 w-20 rounded bg-muted" />
                  </div>
                </div>
              ) : paginatedPending.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-3 rounded-full bg-muted/50 mb-3">
                    <CheckCircle2 className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bekleyen aksiyon yok
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedPending.map((action) => (
                    <ActionItem 
                      key={action.id} 
                      action={action} 
                      onClick={() => handleActionClick(action)}
                      accentColor="before:bg-amber-500"
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
            {pendingTotalPages > 1 && (
              <Pagination 
                currentPage={pendingPage}
                totalPages={pendingTotalPages}
                onPageChange={setPendingPage}
              />
            )}
          </div>
          
          {/* Section 2: Today's actions */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg", "bg-primary/10 text-primary")}>
                  <Target className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-sm">Günün Aksiyonları</h3>
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  {todayActions.length}
                </Badge>
              </div>
              <div className="pl-8">
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger className="h-6 w-auto gap-1 px-2 text-xs bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {weekDates.map((date) => (
                      <SelectItem key={date.value} value={date.value} className="text-xs">
                        <span className={cn(date.isToday && "font-semibold text-primary")}>
                          {format(parseISO(date.value), "d MMM", { locale: tr })} {date.isToday && "(Bugün)"}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ScrollArea className="h-[260px] pr-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div className="h-3 w-20 rounded bg-muted" />
                  </div>
                </div>
              ) : paginatedToday.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-3 rounded-full bg-primary/5 mb-3">
                    <Clock className="h-6 w-6 text-primary/50" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Bu gün için planlanmış aksiyon yok
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2 group"
                    onClick={() => navigate(`/ai-assistant?mode=plan-my-day&date=${selectedDate}`)}
                  >
                    <Sparkles className="h-4 w-4 text-primary group-hover:animate-pulse" />
                    AI ile planla
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedToday.map((action) => (
                    <ActionItem 
                      key={action.id} 
                      action={action} 
                      onClick={() => handleActionClick(action)}
                      accentColor="before:bg-primary"
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
            {todayTotalPages > 1 && (
              <Pagination 
                currentPage={todayPage}
                totalPages={todayTotalPages}
                onPageChange={setTodayPage}
              />
            )}
          </div>
          
          {/* Section 3: Monthly calendar */}
          <div className="space-y-3">
            <SectionHeader 
              icon={CalendarIcon}
              iconColor="bg-primary/10 text-primary"
              title="Aksiyon Takvimi"
              subtitle="Güne tıklayarak ajandaya gidin"
            />
            <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-3 border border-border/50">
              <MiniCalendar 
                selectedDate={targetMonth}
                actionsByDay={completedByDay}
                plannedByDay={plannedByDay}
                onDayClick={handleDayClick}
              />
            </div>
            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-muted/30 text-center">
                <p className="text-lg font-bold text-foreground">
                  {Object.values(completedByDay).reduce((a, b) => a + b, 0)}
                </p>
                <p className="text-[10px] text-muted-foreground">Bu Ay Tamamlanan</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/30 text-center">
                <p className="text-lg font-bold text-foreground">
                  {Object.keys(completedByDay).length}
                </p>
                <p className="text-[10px] text-muted-foreground">Aktif Gün</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
