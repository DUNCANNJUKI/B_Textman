import type { ElementType } from "react";
import {
  LayoutDashboard, Smartphone, MessageSquare, Send, KeyRound,
  Users, BarChart3, ScrollText, FileCode2, Settings as SettingsIcon,
  Webhook, Bot, Activity,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth, isAdmin } from "@/lib/auth";
import logo from "@/assets/btextman-logo.png";

const main = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Devices", url: "/devices", icon: Smartphone },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Bulk SMS", url: "/bulk-sms", icon: Send },
];
const dev = [
  { title: "API Keys", url: "/api-keys", icon: KeyRound },
  { title: "Webhooks", url: "/webhooks", icon: Webhook },
  { title: "Android Client", url: "/android-client", icon: Bot },
  { title: "API Docs", url: "/api-docs", icon: FileCode2 },
];
const insights = [
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Message Trace", url: "/message-trace", icon: Activity },
  { title: "Logs", url: "/logs", icon: ScrollText },
];
const adminItems = [{ title: "Clients", url: "/clients", icon: Users }];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { roles } = useAuth();
  const admin = isAdmin(roles);

  const active = (p: string) => pathname === p || pathname.startsWith(p + "/");

  const renderItem = (item: { title: string; url: string; icon: ElementType }) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild isActive={active(item.url)}>
        <NavLink to={item.url} className="flex items-center gap-3">
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <img src={logo} alt="B-TEXTMAN" className="h-9 w-9 rounded-md shadow-glow object-cover" />
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-bold tracking-tight">B-TEXTMAN</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">SMS Gateway</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{main.map(renderItem)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Developer</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{dev.map(renderItem)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Insights</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{insights.map(renderItem)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        {admin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent><SidebarMenu>{adminItems.map(renderItem)}</SidebarMenu></SidebarGroupContent>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderItem({ title: "Settings", url: "/settings", icon: SettingsIcon })}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Mobile</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Download Android APK"
                >
                  <a href="/android/app-latest.apk" download className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4" />
                    {!collapsed && <span>Download Android App</span>}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
