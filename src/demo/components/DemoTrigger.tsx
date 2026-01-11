import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, HelpCircle } from "lucide-react";
import { useDemo } from "../contexts/DemoContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { dashboardDemoScript } from "../scripts/dashboard";

export function DemoTrigger() {
  const { startDemo, state } = useDemo();
  const { t } = useLanguage();

  if (state.isActive) {
    return null;
  }

  const handleStartDashboardDemo = () => {
    startDemo(dashboardDemoScript);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleStartDashboardDemo}>
          <Play className="h-4 w-4 mr-2" />
          {t.demo.startTour}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
