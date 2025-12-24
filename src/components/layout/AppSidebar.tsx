import { useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, Settings, Building2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
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

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Building2 className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground text-sm">Account Planning</span>
            <span className="text-xs text-sidebar-foreground/70">Banking Suite</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs uppercase tracking-wider">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs uppercase tracking-wider">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-medium text-sidebar-accent-foreground">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-sidebar-foreground">{currentUser.name}</span>
            <span className="text-xs text-sidebar-foreground/70">{currentUser.portfolioName}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
