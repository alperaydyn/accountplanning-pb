import { useMemo, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { useSessionValidator } from "@/hooks/useSessionValidator";
import { useAuth } from "@/contexts/AuthContext";
import { DemoProvider } from "@/demo/contexts/DemoContext";
import { DemoOverlay, DemoTooltip, DemoControls } from "@/demo/components";
import { InspectorProvider } from "@/contexts/InspectorContext";
import { InspectorOverlay, InspectorSidebar } from "@/components/inspector";
const SIDEBAR_COOKIE_NAME = "sidebar:state";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { authError, user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Validate session and redirect to login if expired
  useSessionValidator();

  // Watch for auth errors and redirect
  useEffect(() => {
    if (!loading && authError && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authError, user, loading, navigate]);

  // Memoize once per mount so page navigation doesn't reset the sidebar.
  const defaultOpen = useMemo(() => {
    if (typeof document === "undefined") return false;
    const match = document.cookie.match(new RegExp(`(^| )${SIDEBAR_COOKIE_NAME}=([^;]+)`));
    return match?.[2] === "true";
  }, []);

  return (
    <InspectorProvider>
      <DemoProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <AppHeader />
              <main className="flex-1 p-6 overflow-auto">{children}</main>
            </div>
          </div>
        </SidebarProvider>
        <DemoOverlay />
        <DemoTooltip />
        <DemoControls />
        <InspectorOverlay />
        <InspectorSidebar />
      </DemoProvider>
    </InspectorProvider>
  );
}

