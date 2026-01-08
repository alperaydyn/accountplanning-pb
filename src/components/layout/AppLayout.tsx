import { useMemo, type ReactNode } from "react";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { useSessionValidator } from "@/hooks/useSessionValidator";

const SIDEBAR_COOKIE_NAME = "sidebar:state";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // Validate session and redirect to login if expired
  useSessionValidator();

  // Memoize once per mount so page navigation doesn't reset the sidebar.
  const defaultOpen = useMemo(() => {
    if (typeof document === "undefined") return false;
    const match = document.cookie.match(new RegExp(`(^| )${SIDEBAR_COOKIE_NAME}=([^;]+)`));
    return match?.[2] === "true";
  }, []);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

