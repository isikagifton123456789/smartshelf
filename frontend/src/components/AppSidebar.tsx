import {
  LayoutDashboard,
  PackagePlus,
  Bell,
  Moon,
  Sun,
  ShieldCheck,
  LogOut,
  User,
  ShoppingCart,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function AppSidebar({ darkMode, toggleDarkMode }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, show: true },
    { title: "Orders", url: "/orders", icon: ShoppingCart, show: true },
    { title: "Add Product", url: "/add-product", icon: PackagePlus, show: user?.role === "shopkeeper" },
    { title: "Notifications", url: "/notifications", icon: Bell, show: true },
  ].filter((i) => i.show);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border">
            <ShieldCheck className="h-7 w-7 text-sidebar-primary shrink-0" />
            {!collapsed && (
              <span className="text-lg font-bold font-display text-sidebar-accent-foreground">SmartShelf</span>
            )}
          </div>

          {/* User info */}
          {!collapsed && user && (
            <div className="flex items-center gap-2 px-4 py-3 border-b border-sidebar-border">
              <User className="h-4 w-4 text-sidebar-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{user.name}</p>
                <p className="text-[10px] text-sidebar-foreground capitalize">{user.role}</p>
              </div>
            </div>
          )}

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-sidebar-accent/60"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        <div className="border-t border-sidebar-border p-3 space-y-1">
          <button
            onClick={toggleDarkMode}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!collapsed && <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
