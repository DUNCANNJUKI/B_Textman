import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/components/ThemeProvider";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AppLayout() {
  const { user, signOut, roles } = useAuth();
  const { theme, setTheme } = useTheme();
  const initials = (user?.email?.[0] ?? "U").toUpperCase();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border flex items-center px-4 gap-2 sticky top-0 bg-background/80 backdrop-blur z-30">
            <SidebarTrigger />
            <div className="flex-1" />
            <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 h-9">
                  <Avatar className="h-7 w-7"><AvatarFallback className="text-xs bg-primary/15 text-primary">{initials}</AvatarFallback></Avatar>
                  <span className="hidden sm:inline text-sm">{user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  {roles.join(", ") || "client_user"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
}
