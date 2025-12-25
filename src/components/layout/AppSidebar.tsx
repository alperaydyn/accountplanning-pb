import { useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, Settings, Building2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { currentUser } from "@/data/portfolio";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Actions Agenda", url: "/agenda", icon: Calendar },
];

const settingsNavItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const NavItem = ({ item }: { item: typeof mainNavItems[0] }) => {
    const active = isActive(item.url);
    
    const linkContent = (
      <NavLink
        to={item.url}
        end={item.url === "/"}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors w-full ${
          isCollapsed ? "justify-center px-0" : ""
        }`}
        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!isCollapsed && <span>{item.title}</span>}
      </NavLink>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <SidebarMenuButton asChild isActive={active} className="h-10 w-10 p-0 mx-auto">
              {linkContent}
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <SidebarMenuButton asChild isActive={active}>
        {linkContent}
      </SidebarMenuButton>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className={`border-b border-sidebar-border ${isCollapsed ? "p-2" : "p-3"}`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground text-sm">Account Planning</span>
              <span className="text-xs text-sidebar-foreground/70">Banking Suite</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={isCollapsed ? "px-1" : "px-2"}>
        <SidebarGroup className="py-4">
          {!isCollapsed && (
            <div className="px-3 mb-2">
              <span className="text-sidebar-foreground/50 text-xs uppercase tracking-wider font-medium">
                Main Menu
              </span>
            </div>
          )}
          <SidebarGroupContent>
            <SidebarMenu className={isCollapsed ? "gap-1" : "gap-0.5"}>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title} className={isCollapsed ? "flex justify-center" : ""}>
                  <NavItem item={item} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-2">
          {!isCollapsed && (
            <div className="px-3 mb-2">
              <span className="text-sidebar-foreground/50 text-xs uppercase tracking-wider font-medium">
                System
              </span>
            </div>
          )}
          <SidebarGroupContent>
            <SidebarMenu className={isCollapsed ? "gap-1" : "gap-0.5"}>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title} className={isCollapsed ? "flex justify-center" : ""}>
                  <NavItem item={item} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`border-t border-sidebar-border ${isCollapsed ? "p-2" : "p-3"}`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-sidebar-accent-foreground">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">{currentUser.name}</span>
              <span className="text-xs text-sidebar-foreground/70">{currentUser.portfolioName}</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
