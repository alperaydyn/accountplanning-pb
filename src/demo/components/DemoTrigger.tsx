import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, HelpCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDemo } from "../contexts/DemoContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { dashboardDemoScript } from "../scripts/dashboard";

export function DemoTrigger() {
  const { startDemo, state } = useDemo();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  if (state.isActive) {
    return null;
  }

  const handleStartDashboardDemo = () => {
    // Navigate to the script's page if not already there
    if (location.pathname !== dashboardDemoScript.page) {
      navigate(dashboardDemoScript.page);
    }
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
