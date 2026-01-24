import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  Loader2, 
  RefreshCw, 
  User, 
  ChevronRight, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CustomerExperienceAction, useUpdateCustomerExperienceAction, useCreateCustomerExperienceAction } from "@/hooks/useCustomerExperienceActions";
import { KeyMomentScore } from "@/hooks/useCustomerExperienceMetrics";
import { useCustomers } from "@/hooks/useCustomers";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePortfolioManager } from "@/hooks/usePortfolioManager";

interface AIActionPanelProps {
  actions: CustomerExperienceAction[];
  isLoading: boolean;
  recordMonth: string;
  keyMoments: KeyMomentScore[];
}

const priorityConfig = {
  high: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertTriangle },
  medium: { color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  low: { color: 'bg-muted text-muted-foreground border-border', icon: CheckCircle2 },
};

const statusConfig = {
  pending: { color: 'bg-muted', label: 'Beklemede' },
  in_progress: { color: 'bg-primary/10 text-primary', label: 'Devam Ediyor' },
  completed: { color: 'bg-success/10 text-success', label: 'Tamamlandı' },
  dismissed: { color: 'bg-destructive/10 text-destructive', label: 'Reddedildi' },
};

export function AIActionPanel({ actions, isLoading, recordMonth, keyMoments }: AIActionPanelProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: portfolioManager } = usePortfolioManager();
  const { data: customers = [] } = useCustomers();
  const createAction = useCreateCustomerExperienceAction();
  const updateAction = useUpdateCustomerExperienceAction();
  const [generating, setGenerating] = useState(false);

  const handleGenerateActions = async () => {
    if (!portfolioManager?.id) return;
    
    setGenerating(true);
    try {
      // Get critical and warning key moments
      const problemMoments = keyMoments.filter(km => km.status !== 'success');
      
      if (problemMoments.length === 0) {
        toast({
          title: "Tüm metrikler yolunda",
          description: "Şu anda iyileştirme gerektiren kritik an bulunmuyor.",
        });
        setGenerating(false);
        return;
      }

      // Generate AI recommendations using edge function
      const { data, error } = await supabase.functions.invoke('generate-experience-actions', {
        body: {
          keyMoments: problemMoments,
          customers: customers.slice(0, 20), // Limit customers for AI context
          recordMonth,
        },
      });

      if (error) throw error;

      if (data?.actions && Array.isArray(data.actions)) {
        // Save generated actions
        for (const action of data.actions) {
          await createAction.mutateAsync({
            customer_id: action.customer_id,
            key_moment: action.key_moment,
            recommendation: action.recommendation,
            priority: action.priority || 'medium',
            status: 'pending',
            ai_reasoning: action.ai_reasoning,
            record_month: recordMonth,
          });
        }

        toast({
          title: "Aksiyon önerileri oluşturuldu",
          description: `${data.actions.length} yeni öneri eklendi.`,
        });
      }
    } catch (error) {
      console.error('Error generating actions:', error);
      toast({
        title: "Hata",
        description: "Aksiyon önerileri oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (actionId: string, newStatus: 'in_progress' | 'completed' | 'dismissed') => {
    try {
      await updateAction.mutateAsync({ id: actionId, status: newStatus });
      toast({
        title: "Durum güncellendi",
        description: `Aksiyon durumu "${statusConfig[newStatus].label}" olarak değiştirildi.`,
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Durum güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const pendingActions = actions.filter(a => a.status === 'pending' || a.status === 'in_progress');

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>AI Aksiyon Önerileri</CardTitle>
              <CardDescription>Müşteri deneyimini iyileştirmek için yapay zeka önerileri</CardDescription>
            </div>
          </div>
          <Button 
            onClick={handleGenerateActions} 
            disabled={generating || isLoading}
            className="gap-2"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {generating ? 'Oluşturuluyor...' : 'Öneri Oluştur'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : pendingActions.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">Henüz öneri yok</p>
              <p className="text-sm text-muted-foreground">
                "Öneri Oluştur" butonuna tıklayarak AI destekli aksiyon önerileri alın
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {pendingActions.map((action) => {
                const PriorityIcon = priorityConfig[action.priority as keyof typeof priorityConfig]?.icon || Clock;
                
                return (
                  <div
                    key={action.id}
                    className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn(
                          "p-2 rounded-lg border",
                          priorityConfig[action.priority as keyof typeof priorityConfig]?.color
                        )}>
                          <PriorityIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium text-foreground">{action.recommendation}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {action.key_moment}
                            </Badge>
                            <Badge className={cn("text-xs", statusConfig[action.status as keyof typeof statusConfig]?.color)}>
                              {statusConfig[action.status as keyof typeof statusConfig]?.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {action.ai_reasoning && (
                      <p className="text-sm text-muted-foreground pl-11">
                        💡 {action.ai_reasoning}
                      </p>
                    )}

                    {action.customer && (
                      <div 
                        className="flex items-center justify-between pl-11 cursor-pointer group"
                        onClick={() => navigate(`/customers/${action.customer_id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium group-hover:text-primary transition-colors">
                            {action.customer.name}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {action.customer.segment}
                          </Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    )}

                    <div className="flex items-center gap-2 pl-11">
                      {action.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleStatusChange(action.id, 'in_progress')}
                          >
                            Başla
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive"
                            onClick={() => handleStatusChange(action.id, 'dismissed')}
                          >
                            Reddet
                          </Button>
                        </>
                      )}
                      {action.status === 'in_progress' && (
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleStatusChange(action.id, 'completed')}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Tamamla
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
