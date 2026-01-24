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

const keyMomentColors: Record<string, { gradient: string; iconBg: string; iconColor: string; border: string }> = {
  'customer-visit': {
    gradient: 'from-blue-500/10 via-transparent to-transparent',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    border: 'hover:border-blue-500/30',
  },
  'urgent-financial-support': {
    gradient: 'from-purple-500/10 via-transparent to-transparent',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
    border: 'hover:border-purple-500/30',
  },
  'digital-channel': {
    gradient: 'from-cyan-500/10 via-transparent to-transparent',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-500',
    border: 'hover:border-cyan-500/30',
  },
  'critical-payments': {
    gradient: 'from-amber-500/10 via-transparent to-transparent',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    border: 'hover:border-amber-500/30',
  },
  'cash-management': {
    gradient: 'from-emerald-500/10 via-transparent to-transparent',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    border: 'hover:border-emerald-500/30',
  },
  'quick-support': {
    gradient: 'from-rose-500/10 via-transparent to-transparent',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-500',
    border: 'hover:border-rose-500/30',
  },
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
      className={cn(
        "relative overflow-hidden bg-card border-border transition-all duration-300 cursor-pointer group",
        colors.border,
        "hover:shadow-lg hover:-translate-y-0.5"
      )}
      onClick={onClick}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Gradient accent overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity group-hover:opacity-100",
        colors.gradient
      )} />

      <CardContent className="relative p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", colors.iconBg)}>
              <Icon className={cn("h-5 w-5", colors.iconColor)} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{keyMoment.name}</h3>
              <p className="text-xs text-muted-foreground">{keyMoment.nameEn}</p>
            </div>
          </div>
          {getStatusIcon()}
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className={cn("text-3xl font-bold", getScoreColor())}>
              {keyMoment.score}%
            </span>
            <span className="text-sm text-muted-foreground">
              Hedef: {keyMoment.target}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", getProgressColor())}
              style={{ width: `${Math.min(100, (keyMoment.score / keyMoment.target) * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{keyMoment.variables.length} değişken</span>
          <div className="flex items-center gap-1 opacity-0 translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
            <span>Detay</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
