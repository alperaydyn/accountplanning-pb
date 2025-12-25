import { Package, CreditCard, Wallet, PiggyBank, Users, Factory, Landmark } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Customer } from "@/types";

interface PrincipalityScoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  totalBalance: number;
}

interface ScoreAxis {
  name: string;
  icon: React.ReactNode;
  score: number;
  description: string;
  volume: number;
}

const generateScoreBreakdown = (customer: Customer, totalBalance: number): ScoreAxis[] => {
  // Generate realistic breakdown scores that average to principality score
  const baseScore = customer.principalityScore;
  const variance = 15;
  
  const productsScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * variance * 2) - variance));
  const transactionalScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * variance * 2) - variance));
  const liabilitiesScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * variance * 2) - variance));
  const assetsScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * variance * 2) - variance));

  return [
    {
      name: "Products",
      icon: <Package className="h-4 w-4" />,
      score: productsScore,
      description: "Share of loans, guarantees, insurance",
      volume: Math.floor(totalBalance * 0.35),
    },
    {
      name: "Transactional Services",
      icon: <CreditCard className="h-4 w-4" />,
      score: transactionalScore,
      description: "Share of monthly payment volume",
      volume: Math.floor(totalBalance * 0.45),
    },
    {
      name: "Liabilities",
      icon: <PiggyBank className="h-4 w-4" />,
      score: liabilitiesScore,
      description: "Share of deposits and other liabilities",
      volume: Math.floor(totalBalance * 0.25),
    },
    {
      name: "Assets / Share of Wallet",
      icon: <Wallet className="h-4 w-4" />,
      score: assetsScore,
      description: "Share of drawn short and long term debt",
      volume: Math.floor(totalBalance * 0.30),
    },
  ];
};

const getProgressColor = (score: number) => {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-warning";
  return "bg-destructive";
};

export const PrincipalityScoreModal = ({
  open,
  onOpenChange,
  customer,
  totalBalance,
}: PrincipalityScoreModalProps) => {
  const axes = generateScoreBreakdown(customer, totalBalance);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Principality Score Breakdown</DialogTitle>
        </DialogHeader>

        {/* Customer Info Header */}
        <div className="grid grid-cols-3 gap-4 py-4 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Segment</p>
              <p className="font-medium">{customer.segment}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Factory className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Sector</p>
              <p className="font-medium">{customer.sector}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="font-medium">₺{totalBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Main Score */}
        <div className="py-4">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-4xl font-bold text-primary">{customer.principalityScore}%</span>
            <span className="text-sm text-muted-foreground">
              Measures how much of the banking relationship is concentrated at our bank for {customer.name}.
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Principality Score is a metric that quantifies how much of the banking relationship is concentrated at our bank by measuring performance across four axes:
          </p>
        </div>

        {/* Four Axes Breakdown */}
        <div className="grid grid-cols-4 gap-4 py-4">
          {axes.map((axis) => (
            <div key={axis.name} className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {axis.icon}
                <span className="font-medium">{axis.name}</span>
              </div>
              <p className="text-2xl font-bold">{axis.score}%</p>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${getProgressColor(axis.score)}`}
                  style={{ width: `${axis.score}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-tight">{axis.description}</p>
              <p className="text-sm font-medium">₺{axis.volume.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Explanation */}
        <div className="py-4 border-t">
          <p className="text-xs text-muted-foreground leading-relaxed">
            The four axes (Products, Transactional Services, Liabilities, and Assets) measure how much of {customer.name}'s financial activity is captured by our bank. The Principality Score aggregates these axes to determine how central our bank is as the main bank, providing a score from 0-100 that indicates the extent of {customer.name}'s banking relationship concentrated at our institution.
          </p>
        </div>

        {/* OK Button */}
        <div className="flex justify-center pt-2">
          <Button onClick={() => onOpenChange(false)} className="px-8">
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
