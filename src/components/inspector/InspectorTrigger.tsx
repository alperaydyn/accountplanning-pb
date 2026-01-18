import { HelpCircle, MousePointer2, Play, MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useInspector } from "@/contexts/InspectorContext";
import { useDemo } from "@/demo/contexts/DemoContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";
import { dashboardDemoScript } from "@/demo/scripts/dashboard";
import { cn } from "@/lib/utils";

export function InspectorTrigger() {
  const { state: inspectorState, toggleInspector, openSidebar } = useInspector();
  const { startDemo, state: demoState } = useDemo();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  if (demoState.isActive) {
    return null;
  }

  const handleStartDashboardDemo = () => {
    if (location.pathname !== dashboardDemoScript.page) {
      navigate(dashboardDemoScript.page);
    }
    startDemo(dashboardDemoScript);
  };

  const handleStartInspector = () => {
    toggleInspector();
  };

  const handleOpenChat = () => {
    openSidebar();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "relative",
            inspectorState.isActive && "bg-primary/20 text-primary"
          )}
        >
          <HelpCircle className="h-5 w-5" />
          {inspectorState.isActive && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleStartInspector}>
          <MousePointer2 className="h-4 w-4 mr-2" />
          {inspectorState.isActive ? "Exit Inspect Mode" : "Inspect Element"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOpenChat}>
          <MessageCircleQuestion className="h-4 w-4 mr-2" />
          Ask a Question
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleStartDashboardDemo}>
          <Play className="h-4 w-4 mr-2" />
          {t.demo.startTour}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
