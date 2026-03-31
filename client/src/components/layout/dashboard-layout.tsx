import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="DashboardLayout-root flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="no-print">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="no-print">
          <Header toggleSidebar={toggleSidebar} />
        </div>
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 md:p-4 lg:p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}

// Add default export for compatibility
export default DashboardLayout;