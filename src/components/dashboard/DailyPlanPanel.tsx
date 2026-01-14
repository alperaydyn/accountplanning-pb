import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, isSameDay, isSameMonth, getDay } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActions, Action } from "@/hooks/useActions";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 4;

// Generate current week's dates
const generateWeekDates = () => {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const dates: { value: string; label: string; isToday: boolean }[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const isToday = isSameDay(date, today);
    dates.push({
      value: format(date, "yyyy-MM-dd"),
      label: format(date, "EEEE, d MMM", { locale: tr }),
      isToday,
    });
  }
  
  return dates;
};

// Priority badge component
const PriorityBadge = ({ priority }: { priority: string }) => {
  const variants: Record<string, "destructive" | "secondary" | "outline"> = {
    high: "destructive",
    medium: "secondary",
    low: "outline",
  };
  const labels: Record<string, string> = {
    high: "Yüksek",
    medium: "Orta",
    low: "Düşük",
  };
  return (
    <Badge variant={variants[priority] || "outline"} className="text-xs">
      {labels[priority] || priority}
    </Badge>
  );
};

// Action list item
const ActionItem = ({ action, onClick }: { action: Action; onClick: () => void }) => (
  <div 
    onClick={onClick}
    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
  >
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium text-sm truncate">{action.customers?.name}</span>
        <PriorityBadge priority={action.priority} />
      </div>
      <p className="text-sm text-muted-foreground truncate">{action.name}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {action.products?.name}
      </p>
    </div>
    <div className="text-xs text-muted-foreground whitespace-nowrap">
      {format(new Date(action.action_target_date), "d MMM", { locale: tr })}
    </div>
  </div>
);

// Pagination component
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
}) => (
  <div className="flex items-center justify-center gap-2 mt-3">
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-7 w-7"
      disabled={currentPage <= 1}
      onClick={() => onPageChange(currentPage - 1)}
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
    <span className="text-xs text-muted-foreground">
      {currentPage} / {totalPages || 1}
    </span>
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-7 w-7"
      disabled={currentPage >= totalPages}
      onClick={() => onPageChange(currentPage + 1)}
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
);

// Mini calendar component
const MiniCalendar = ({ 
  selectedDate, 
  actionsByDay,
  onDayClick 
}: { 
  selectedDate: Date;
  actionsByDay: Record<string, number>;
  onDayClick: (date: Date) => void;
}) => {
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

  return (
    <div className="w-full">
      <div className="text-center mb-2">
        <span className="font-medium text-sm">
          {format(selectedDate, "MMMM yyyy", { locale: tr })}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {weeks.flat().map((d, idx) => {
          const dateStr = format(d, "yyyy-MM-dd");
          const count = actionsByDay[dateStr] || 0;
          const isCurrentMonth = isSameMonth(d, selectedDate);
          const isToday = isSameDay(d, today);
          const isWeekend = getDay(d) === 0 || getDay(d) === 6;
          
          return (
            <button
              key={idx}
              onClick={() => onDayClick(d)}
              className={cn(
                "relative aspect-square flex flex-col items-center justify-center rounded text-xs transition-colors",
                !isCurrentMonth && "text-muted-foreground/40",
                isCurrentMonth && !isWeekend && "hover:bg-accent",
                isCurrentMonth && isWeekend && "bg-muted/50 hover:bg-muted",
                isToday && "ring-1 ring-primary font-bold"
              )}
            >
              <span>{format(d, "d")}</span>
              {count > 0 && isCurrentMonth && (
                <span className="absolute -bottom-0.5 text-[9px] font-medium text-primary">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const DailyPlanPanel = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const weekDates = useMemo(() => generateWeekDates(), []);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [pendingPage, setPendingPage] = useState(1);
  const [todayPage, setTodayPage] = useState(1);
  
  // Fetch all actions
  const { data: allActions = [], isLoading } = useActions();
  
  // Current month for filtering
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
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
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Günlük Planım</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-[180px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weekDates.map((date) => (
                  <SelectItem key={date.value} value={date.value}>
                    <span className={cn(date.isToday && "font-bold")}>
                      {date.label} {date.isToday && "(Bugün)"}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section 1: Pending actions for the month */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <h3 className="font-medium text-sm">Bekleyen Aksiyonlar</h3>
              <Badge variant="secondary" className="text-xs">
                {pendingMonthActions.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {format(monthStart, "MMMM", { locale: tr })} ayı içinde planlanıp sonuçlanmayan
            </p>
            <ScrollArea className="h-[280px]">
              {isLoading ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Yükleniyor...
                </div>
              ) : paginatedPending.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Bekleyen aksiyon yok
                </div>
              ) : (
                <div className="space-y-2 pr-2">
                  {paginatedPending.map((action) => (
                    <ActionItem 
                      key={action.id} 
                      action={action} 
                      onClick={() => handleActionClick(action)}
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
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-sm">Günün Aksiyonları</h3>
              <Badge variant="default" className="text-xs">
                {todayActions.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedDateLabel}
            </p>
            <ScrollArea className="h-[280px]">
              {isLoading ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Yükleniyor...
                </div>
              ) : paginatedToday.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Bu gün için planlanmış aksiyon yok
                  </p>
                  <Button 
                    variant="link" 
                    className="mt-2 text-sm"
                    onClick={() => navigate(`/ai-assistant?mode=plan-my-day&date=${selectedDate}`)}
                  >
                    AI ile planla
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 pr-2">
                  {paginatedToday.map((action) => (
                    <ActionItem 
                      key={action.id} 
                      action={action} 
                      onClick={() => handleActionClick(action)}
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
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <h3 className="font-medium text-sm">Tamamlanan Aksiyonlar</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Güne tıklayarak ajanda görünümüne gidin
            </p>
            <div className="bg-muted/30 rounded-lg p-3">
              <MiniCalendar 
                selectedDate={currentMonth}
                actionsByDay={completedByDay}
                onDayClick={handleDayClick}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
