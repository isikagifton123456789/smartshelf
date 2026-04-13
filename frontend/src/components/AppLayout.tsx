import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("smartshelf-dark") === "true";
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("smartshelf-dark", String(darkMode));
  }, [darkMode]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-4">
            <SidebarTrigger className="mr-3" />
            <span className="text-sm font-medium text-muted-foreground">Expiry Monitoring System</span>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
