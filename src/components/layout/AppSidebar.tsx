import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { NavLink } from "@/components/NavLink";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

type SidebarItem = {
  title: string;
  url: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const { user, signOut } = useAuth();
  const { t } = useLanguage();

  const [isSigningOut, setIsSigningOut] = useState(false);

  const mainNavItems: SidebarItem[] = [
    { title: t.nav.dashboard, url: "/", icon: LayoutDashboard },
    { title: t.nav.customers, url: "/customers", icon: Users },
    { title: t.nav.actionsAgenda, url: "/agenda", icon: Calendar },
    { title: t.nav.aiAssistant, url: "/ai-assistant", icon: Sparkles },
    { title: t.nav.thresholds, url: "/thresholds", icon: Target },
  ];

  const settingsNavItems: SidebarItem[] = [{ title: t.nav.settings, url: "/settings", icon: Settings }];

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const userInitials = userName
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isActiveRoute = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      // Mark that logout is in progress to prevent Auth page redirect flicker
      sessionStorage.setItem('logout_in_progress', 'true');
      await signOut();
      // Navigate within the SPA (avoids hard-reload flicker)
      navigate("/auth", { replace: true });
    } catch (e) {
      console.error("Logout error:", e);
      sessionStorage.removeItem('logout_in_progress');
      toast.error("Logout failed. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const MenuLink = ({ item }: { item: SidebarItem }) => {
    const active = isActiveRoute(item.url);

    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={isCollapsed ? item.title : undefined}
          className={cn(isCollapsed && "justify-center")}
        >
          <NavLink to={item.url} end={item.url === "/"} className="flex items-center gap-2 w-full">
            <item.icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className={cn("border-b border-sidebar-border", isCollapsed ? "p-2" : "p-3")}>
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
          <img
            src="/favicon.png"
            alt="Account Planning"
            className="h-9 w-9 rounded-lg shrink-0"
            loading="lazy"
          />
          {!isCollapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-sidebar-foreground text-sm">Account Planning</span>
              <span className="text-xs text-sidebar-foreground/70">Portfolio Management</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={cn(isCollapsed ? "px-1" : "px-2")}>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-wider">{t.nav.mainMenu}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <MenuLink key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="uppercase tracking-wider">{t.nav.system}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <MenuLink key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn("border-t border-sidebar-border", isCollapsed ? "p-2" : "p-3")}>
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3 px-1")}
        >
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-sidebar-accent-foreground">{userInitials}</span>
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground truncate">{userName}</span>
              <span className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</span>
            </div>
          )}
        </div>

        <SidebarMenu className={cn(isCollapsed && "items-center")}>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip={t.auth.logout}
              disabled={isSigningOut}
              className={cn(isCollapsed && "justify-center")}
            >
              {isSigningOut ? <Loader2 className="animate-spin" /> : <LogOut />}
              {!isCollapsed && <span>{t.auth.logout}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

