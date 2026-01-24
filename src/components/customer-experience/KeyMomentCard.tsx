import { 
  Users, 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Banknote, 
  HeadphonesIcon,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { KeyMomentScore } from "@/hooks/useCustomerExperienceMetrics";

interface KeyMomentCardProps {
  keyMoment: KeyMomentScore;
  index: number;
  onClick: () => void;
}

const keyMomentIcons: Record<string, React.ElementType> = {
  'customer-visit': Users,
  'urgent-financial-support': CreditCard,
  'digital-channel': Smartphone,
  'critical-payments': Wallet,
  'cash-management': Banknote,
  'quick-support': HeadphonesIcon,
};

// Corporate subdued color scheme - using design system tokens
const keyMomentColors: Record<string, { iconBg: string; iconColor: string }> = {
  'customer-visit': { iconBg: 'bg-muted', iconColor: 'text-foreground' },
  'urgent-financial-support': { iconBg: 'bg-muted', iconColor: 'text-foreground' },
  'digital-channel': { iconBg: 'bg-muted', iconColor: 'text-foreground' },
  'critical-payments': { iconBg: 'bg-muted', iconColor: 'text-foreground' },
  'cash-management': { iconBg: 'bg-muted', iconColor: 'text-foreground' },
  'quick-support': { iconBg: 'bg-muted', iconColor: 'text-foreground' },
};

export function KeyMomentCard({ keyMoment, index, onClick }: KeyMomentCardProps) {
  const Icon = keyMomentIcons[keyMoment.id] || Users;
  const colors = keyMomentColors[keyMoment.id] || keyMomentColors['customer-visit'];

  const getStatusIcon = () => {
    switch (keyMoment.status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getProgressColor = () => {
    switch (keyMoment.status) {
      case 'success':
        return 'bg-success';
      case 'warning':
        return 'bg-warning';
      case 'critical':
        return 'bg-destructive';
    }
  };

  const getScoreColor = () => {
    switch (keyMoment.status) {
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'critical':
        return 'text-destructive';
    }
  };

  return (
    <Card
      className="bg-card border-border transition-all duration-200 cursor-pointer hover:border-primary/30 hover:shadow-sm"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn("p-2 rounded-lg", colors.iconBg)}>
              <Icon className={cn("h-4 w-4", colors.iconColor)} />
            </div>
            <div>
              <h3 className="font-medium text-sm text-foreground">{keyMoment.name}</h3>
              <p className="text-xs text-muted-foreground">{keyMoment.nameEn}</p>
            </div>
          </div>
          {getStatusIcon()}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className={cn("text-2xl font-bold", getScoreColor())}>
              {keyMoment.score}%
            </span>
            <span className="text-xs text-muted-foreground">
              Hedef: {keyMoment.target}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", getProgressColor())}
              style={{ width: `${Math.min(100, (keyMoment.score / keyMoment.target) * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
          <span>{keyMoment.variables.length} değişken</span>
          <div className="flex items-center gap-1">
            <span>Detay</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
