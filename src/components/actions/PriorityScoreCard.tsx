import { cn } from "@/lib/utils";
import { Target, Megaphone, Heart, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PriorityScoreItemProps {
  icon: React.ReactNode;
  label: string;
  score: number | null;
  reason: string | null;
  colorClass: string;
}

function PriorityScoreItem({ icon, label, score, reason, colorClass }: PriorityScoreItemProps) {
  const scoreValue = score ?? 0;
  const scorePercent = Math.round(scoreValue * 100);
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("p-1 rounded", colorClass)}>{icon}</span>
          <span className="text-xs font-medium">{label}</span>
        </div>
        <span className={cn(
          "text-xs font-semibold",
          scorePercent >= 70 ? "text-success" : scorePercent >= 40 ? "text-warning" : "text-muted-foreground"
        )}>
          {scorePercent}%
        </span>
      </div>
      <Progress 
        value={scorePercent} 
        className="h-1.5"
      />
      {reason && (
        <p className="text-xs text-muted-foreground leading-relaxed">{reason}</p>
      )}
    </div>
  );
}

interface PriorityScoreCardProps {
  portfolioScore: number | null;
  portfolioReason: string | null;
  adhocScore: number | null;
  adhocReason: string | null;
  customerScore: number | null;
  customerReason: string | null;
  profitabilityScore: number | null;
  profitabilityReason: string | null;
}

export function PriorityScoreCard({
  portfolioScore,
  portfolioReason,
  adhocScore,
  adhocReason,
  customerScore,
  customerReason,
  profitabilityScore,
  profitabilityReason,
}: PriorityScoreCardProps) {
  // Calculate overall score (average of all scores)
  const scores = [portfolioScore, adhocScore, customerScore, profitabilityScore].filter(s => s !== null) as number[];
  const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const overallPercent = Math.round(overallScore * 100);

  return (
    <div className="space-y-4 p-3 bg-primary/5 border border-primary/20 rounded-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-primary">Prioritization Reason</span>
        <span className={cn(
          "text-sm font-bold",
          overallPercent >= 70 ? "text-success" : overallPercent >= 40 ? "text-warning" : "text-muted-foreground"
        )}>
          Overall: {overallPercent}%
        </span>
      </div>
      
      <div className="space-y-3">
        <PriorityScoreItem
          icon={<Target className="h-3.5 w-3.5" />}
          label="Portföy Hedef Uyumu"
          score={portfolioScore}
          reason={portfolioReason}
          colorClass="bg-blue-500/10 text-blue-500"
        />
        
        <PriorityScoreItem
          icon={<Megaphone className="h-3.5 w-3.5" />}
          label="Dönemsel Ad-Hoc Hedef"
          score={adhocScore}
          reason={adhocReason}
          colorClass="bg-purple-500/10 text-purple-500"
        />
        
        <PriorityScoreItem
          icon={<Heart className="h-3.5 w-3.5" />}
          label="Müşteri Memnuniyeti"
          score={customerScore}
          reason={customerReason}
          colorClass="bg-rose-500/10 text-rose-500"
        />
        
        <PriorityScoreItem
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Karlılık Etkisi"
          score={profitabilityScore}
          reason={profitabilityReason}
          colorClass="bg-emerald-500/10 text-emerald-500"
        />
      </div>
    </div>
  );
}