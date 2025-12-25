import { Trophy, Star, Target, TrendingUp, Users, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PortfolioManager } from "@/types";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  earned: boolean;
  earnedDate?: string;
}

interface RepresentativeBadgesProps {
  manager: PortfolioManager;
}

const generateBadges = (manager: PortfolioManager): Badge[] => {
  return [
    {
      id: "top-performer",
      name: "Top Performer",
      description: "Achieved highest portfolio growth this quarter",
      icon: <Trophy className="h-5 w-5" />,
      color: "text-yellow-500",
      earned: true,
      earnedDate: "2024-12-01",
    },
    {
      id: "customer-champion",
      name: "Customer Champion",
      description: "Maintained 95%+ customer satisfaction rate",
      icon: <Star className="h-5 w-5" />,
      color: "text-amber-500",
      earned: true,
      earnedDate: "2024-11-15",
    },
    {
      id: "target-crusher",
      name: "Target Crusher",
      description: "Exceeded quarterly targets by 20%+",
      icon: <Target className="h-5 w-5" />,
      color: "text-emerald-500",
      earned: true,
      earnedDate: "2024-10-30",
    },
    {
      id: "growth-master",
      name: "Growth Master",
      description: "Grew portfolio volume by 15%+ YoY",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-blue-500",
      earned: manager.customerCount > 40,
      earnedDate: manager.customerCount > 40 ? "2024-09-20" : undefined,
    },
    {
      id: "relationship-builder",
      name: "Relationship Builder",
      description: "Converted 10+ non-primary customers to primary",
      icon: <Users className="h-5 w-5" />,
      color: "text-purple-500",
      earned: false,
    },
    {
      id: "action-hero",
      name: "Action Hero",
      description: "Completed 100+ actions in a single month",
      icon: <Award className="h-5 w-5" />,
      color: "text-rose-500",
      earned: false,
    },
  ];
};

export const RepresentativeBadges = ({ manager }: RepresentativeBadgesProps) => {
  const badges = generateBadges(manager);
  const earnedBadges = badges.filter(b => b.earned);
  const unearnedBadges = badges.filter(b => !b.earned);

  return (
    <Card className="border-primary/20">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">My Badges</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {earnedBadges.length}/{badges.length} earned
          </span>
        </div>
        <TooltipProvider>
          <div className="flex items-center gap-2">
            {/* Earned badges */}
            {earnedBadges.map((badge) => (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <div className={`p-2 rounded-full bg-muted cursor-pointer hover:bg-muted/80 transition-colors ${badge.color}`}>
                    {badge.icon}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="font-medium">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                  {badge.earnedDate && (
                    <p className="text-xs text-muted-foreground mt-1">Earned: {badge.earnedDate}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            ))}
            
            {/* Separator if there are both earned and unearned */}
            {earnedBadges.length > 0 && unearnedBadges.length > 0 && (
              <div className="h-6 w-px bg-border mx-1" />
            )}
            
            {/* Unearned badges (grayed out) */}
            {unearnedBadges.map((badge) => (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <div className="p-2 rounded-full bg-muted/50 cursor-pointer hover:bg-muted/40 transition-colors text-muted-foreground/40">
                    {badge.icon}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="font-medium text-muted-foreground">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                  <p className="text-xs text-muted-foreground mt-1 italic">Not yet earned</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};
