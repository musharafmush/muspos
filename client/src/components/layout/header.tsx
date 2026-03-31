import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "../theme-toggle";
import { useQuery } from "@tanstack/react-query";
import {
  BellIcon,
  MenuIcon,
  ChevronDownIcon,
  SearchIcon,
  CalendarIcon,
  ShoppingCartIcon,
  PlusIcon,
  CalculatorIcon,
  Zap,
  Store as StoreIcon,
  Database as DatabaseIcon2,
  DollarSign as DollarSignIcon2,
  Package as PackageIcon2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentDate = new Date();

  const { data } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include"
        });
        if (!response.ok) {
          if (response.status === 401) {
            return { user: null };
          }
          throw new Error("Failed to fetch user");
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching user:", error);
        return { user: null };
      }
    }
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Logout successful",
        description: "You have been logged out successfully."
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out.",
        variant: "destructive"
      });
    }
  };

  const currentUser = data?.user;

  // Fetch Branding
  const { data: branding } = useQuery({
    queryKey: ["/api/branding"],
    queryFn: async () => {
      const res = await fetch("/api/branding");
      if (!res.ok) throw new Error("Failed to fetch branding");
      return res.json();
    }
  });

  const appName = branding?.appName || "Nebula POS";
  const logoColor = branding?.logoColor || "from-indigo-500 to-purple-600";
  const logoIcon = branding?.logoIcon || "Zap";

  const renderLogoIcon = (sizeClass: string) => {
    switch (logoIcon) {
      case 'Calculator': return <CalculatorIcon className={cn(sizeClass, "text-white")} />;
      case 'Database': return <DatabaseIcon2 className={cn(sizeClass, "text-white")} />;
      case 'Dollar': return <DollarSignIcon2 className={cn(sizeClass, "text-white")} />;
      case 'Package': return <PackageIcon2 className={cn(sizeClass, "text-white")} />;
      case 'Store': return <StoreIcon className={cn(sizeClass, "text-white")} />;
      default: return <Zap className={cn(sizeClass, "text-white fill-white/20")} />;
    }
  };

  return (
    <header className="bg-primary shadow-sm z-20 text-white sticky top-0">
      <div className="flex items-center justify-between px-3 py-2 md:px-4 md:py-3">
        <div className="flex items-center gap-2 md:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="text-white hover:bg-white/10 h-9 w-9"
            data-testid="button-toggle-sidebar"
          >
            <MenuIcon className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
          
          {/* App name on mobile */}
          <div className="md:hidden flex items-center gap-2">
             <div className={cn(
               "rounded-full w-6 h-6 flex items-center justify-center shadow-lg border border-white/20 bg-gradient-to-br",
               logoColor
             )}>
               {renderLogoIcon("h-3 w-3")}
             </div>
             <span className="font-extrabold text-sm tracking-tight italic">
               {appName}
             </span>
          </div>

          <div className="hidden md:flex items-center">
            <div className="text-sm text-white/80">
              {format(currentDate, "MM/dd/yyyy")}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 md:gap-3">
          <Link href="/pos-enhanced">
            <Button 
              size="sm" 
              className="bg-white/10 hover:bg-white/20 text-white border-0 h-8 px-2 md:px-3"
              data-testid="button-pos"
            >
              <ShoppingCartIcon className="h-4 w-4 md:mr-2" />
              <span className="hidden sm:inline">POS Enhanced</span>
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 h-8 w-8"
            data-testid="button-notifications"
          >
            <BellIcon className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center text-white hover:bg-white/10 h-8 px-1 md:px-2" data-testid="dropdown-user-menu">
                <span className="hidden lg:inline mr-2 font-medium text-sm">{currentUser?.name || 'Admin'}</span>
                <Avatar className="h-7 w-7 md:h-8 md:w-8 border-2 border-white">
                  <AvatarImage src={currentUser?.image || ""} alt="User avatar" />
                  <AvatarFallback className="bg-white/20 text-xs">{currentUser?.name?.charAt(0) || "A"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem data-testid="menu-item-profile">Profile</DropdownMenuItem>
              <DropdownMenuItem data-testid="menu-item-settings">Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} data-testid="menu-item-logout">Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
