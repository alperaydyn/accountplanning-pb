import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Sparkles, ArrowLeft, Users, Target, TrendingUp, AlertCircle, CheckCircle2, XCircle, ChevronRight, Loader2, RefreshCw, CreditCard, Smartphone, Wallet, Banknote, HeadphonesIcon } from "lucide-react";
import { AppLayout, PageBreadcrumb } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomerExperienceMetrics, calculateKeyMoments, calculateOverallScore, KeyMomentScore } from "@/hooks/useCustomerExperienceMetrics";
import { useCustomerExperienceActions } from "@/hooks/useCustomerExperienceActions";
import { cn } from "@/lib/utils";
import { KeyMomentCard } from "@/components/customer-experience/KeyMomentCard";
import { AIActionPanel } from "@/components/customer-experience/AIActionPanel";

// Generate fixed date options
const generateDateOptions = (currentLabel: string) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const dateSet = new Set<string>();
  const options: { value: string; label: string }[] = [];
  
  const addDate = (year: number, month: number, labelSuffix?: string) => {
    const value = `${year}-${String(month).padStart(2, '0')}`;
    if (!dateSet.has(value)) {
      dateSet.add(value);
      const label = labelSuffix ? `${value} ${labelSuffix}` : value;
      options.push({ value, label });
    }
  };
  
  addDate(currentYear, currentMonth, `(${currentLabel})`);
  
  for (let i = 1; i <= 3; i++) {
    const date = new Date(currentYear, currentMonth - 1 - i, 1);
    addDate(date.getFullYear(), date.getMonth() + 1);
  }
  
  return options;
};

const CustomerExperience = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const dateOptions = useMemo(() => generateDateOptions(t.primaryBank?.current || 'Güncel'), [t]);
  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].value);
  const [selectedKeyMoment, setSelectedKeyMoment] = useState<KeyMomentScore | null>(null);

  const { data: metrics, isLoading: metricsLoading } = useCustomerExperienceMetrics(selectedDate);
  const { data: actions = [], isLoading: actionsLoading } = useCustomerExperienceActions(selectedDate);

  const keyMoments = useMemo(() => calculateKeyMoments(metrics), [metrics]);
  const overallScore = useMemo(() => calculateOverallScore(keyMoments), [keyMoments]);

  const getStatusIcon = (status: 'success' | 'warning' | 'critical') => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getOverallStatusColor = (score: number) => {
    if (score >= 75) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const successCount = keyMoments.filter(km => km.status === 'success').length;
  const warningCount = keyMoments.filter(km => km.status === 'warning').length;
  const criticalCount = keyMoments.filter(km => km.status === 'critical').length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="gap-1 text-muted-foreground hover:text-foreground -ml-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
            </div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-muted-foreground" />
              Müşteri Deneyim Skoru
            </h1>
            <p className="text-sm text-muted-foreground">
              Customer Experience Index - 6 Kritik An, 9 Değişken
            </p>
          </div>
          
          {/* Date Selector */}
          <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-[140px] border-0 bg-transparent h-auto p-0 focus:ring-0 text-sm font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overall Score Hero */}
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-8">
              {/* Left: Score Info */}
              <div className="space-y-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-muted">
                    <Target className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Genel Deneyim Skoru</h2>
                    <p className="text-sm text-muted-foreground">6 kritik an ortalaması</p>
                  </div>
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-5xl font-bold", getOverallStatusColor(overallScore))}>
                    {metricsLoading ? '...' : overallScore}
                  </span>
                  <span className="text-xl text-muted-foreground">/100</span>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    <span className="text-xs font-medium text-foreground">{successCount} Yolunda</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted">
                    <AlertCircle className="h-3.5 w-3.5 text-warning" />
                    <span className="text-xs font-medium text-foreground">{warningCount} Riskli</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted">
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-xs font-medium text-foreground">{criticalCount} Kritik</span>
                  </div>
                </div>
              </div>

              {/* Center: Timeline Visualization */}
              <div className="flex-1 px-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Kritik Anlar Timeline</span>
                    <span className="font-medium">{successCount}/6 Başarılı</span>
                  </div>
                  <div className="relative flex items-center justify-between">
                    {/* Timeline Line */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-muted" />
                    
                    {/* Timeline Points */}
                    {keyMoments.map((km, idx) => {
                      const KMIcon = {
                        'customer-visit': Users,
                        'urgent-financial-support': CreditCard,
                        'digital-channel': Smartphone,
                        'critical-payments': Wallet,
                        'cash-management': Banknote,
                        'quick-support': HeadphonesIcon,
                      }[km.id] || Users;
                      
                      return (
                        <div key={km.id} className="relative z-10 flex flex-col items-center gap-1">
                          <div 
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                              km.status === 'success' 
                                ? "bg-success/10 border-success" 
                                : km.status === 'warning' 
                                  ? "bg-warning/10 border-warning" 
                                  : "bg-destructive/10 border-destructive"
                            )}
                          >
                            <KMIcon className={cn(
                              "h-3.5 w-3.5",
                              km.status === 'success' 
                                ? "text-success" 
                                : km.status === 'warning' 
                                  ? "text-warning" 
                                  : "text-destructive"
                            )} />
                          </div>
                          <span className="text-[10px] text-muted-foreground text-center max-w-[60px] truncate">
                            {km.name.split(' ')[0]}
                          </span>
                          <span className={cn(
                            "text-[10px] font-semibold",
                            km.status === 'success' 
                              ? "text-success" 
                              : km.status === 'warning' 
                                ? "text-warning" 
                                : "text-destructive"
                          )}>
                            {km.score}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right: Circular progress visualization */}
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${overallScore * 2.64} ${264 - overallScore * 2.64}`}
                    className={cn(
                      "transition-all duration-1000",
                      overallScore >= 75 ? "text-success" : overallScore >= 50 ? "text-warning" : "text-destructive"
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={cn("text-xl font-bold", getOverallStatusColor(overallScore))}>
                    {overallScore}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Moments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {keyMoments.map((keyMoment, index) => (
            <KeyMomentCard
              key={keyMoment.id}
              keyMoment={keyMoment}
              index={index}
              onClick={() => setSelectedKeyMoment(keyMoment)}
            />
          ))}
        </div>

        {/* AI Action Recommendations */}
        <AIActionPanel 
          actions={actions}
          isLoading={actionsLoading}
          recordMonth={selectedDate}
          keyMoments={keyMoments}
        />

        {/* Key Moment Detail Dialog */}
        <Dialog open={!!selectedKeyMoment} onOpenChange={(open) => !open && setSelectedKeyMoment(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedKeyMoment && getStatusIcon(selectedKeyMoment.status)}
                {selectedKeyMoment?.name}
              </DialogTitle>
              <DialogDescription>
                {selectedKeyMoment?.nameEn}
              </DialogDescription>
            </DialogHeader>

            {selectedKeyMoment && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Mevcut Skor</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-2xl font-bold",
                      selectedKeyMoment.status === 'success' ? 'text-success' :
                      selectedKeyMoment.status === 'warning' ? 'text-warning' : 'text-destructive'
                    )}>
                      {selectedKeyMoment.score}%
                    </span>
                    <span className="text-sm text-muted-foreground">/ {selectedKeyMoment.target}%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">Değişkenler</h4>
                  {selectedKeyMoment.variables.map((variable, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-border bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{variable.name}</span>
                        <Badge variant={variable.value >= variable.target ? 'default' : 'destructive'}>
                          {variable.value.toFixed(1)}{variable.unit}
                        </Badge>
                      </div>
                      {/* Progress bar with 100% max and target marker */}
                      <div className="relative">
                        <Progress 
                          value={Math.min(100, variable.value)} 
                          className="h-2"
                        />
                        {/* Target marker */}
                        <div 
                          className="absolute top-0 h-2 w-0.5 bg-foreground/70"
                          style={{ left: `${variable.target}%` }}
                          title={`Hedef: ${variable.target}${variable.unit}`}
                        />
                        <div 
                          className="absolute -top-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-foreground/70"
                          style={{ left: `calc(${variable.target}% - 4px)` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Hedef: {variable.target}{variable.unit}</span>
                        {variable.formula && <code className="px-1 py-0.5 rounded bg-muted text-[10px]">{variable.formula}</code>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default CustomerExperience;
