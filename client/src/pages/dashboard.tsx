import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/components/ui/theme-provider";
import { Link } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { LowStockItems } from "@/components/dashboard/low-stock-items";
import { TopSellingProducts } from "@/components/dashboard/top-selling-products";
import { Button } from "@/components/ui/button";
import { 
  PlusIcon, 
  DollarSignIcon, 
  ShoppingBagIcon, 
  WarehouseIcon, 
  AlertTriangleIcon,
  CreditCardIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  WalletIcon,
  CircleDollarSignIcon,
  PercentIcon,
  BadgePercentIcon
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { useFormatCurrency } from "@/lib/currency";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<{ user: any }>(["/api/auth/user"])?.user;
  const formatCurrency = useFormatCurrency();

  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return response.json();
    },
    refetchOnWindowFocus: true,
    refetchInterval: 10000, // Refresh every 10 seconds for real-time feel
    staleTime: 5000, // Data fresh for only 5 seconds
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-0">
        {/* Enhanced Welcome header with dynamic greeting */}
        <div className="mb-4 md:mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">
            Welcome {currentUser?.name || 'Administrator'} <span className="text-yellow-500">👋</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Here's what's happening with your store today
          </p>
        </div>

        {/* Stats Cards - Responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 md:mb-6">
          <Card className="p-2.5 sm:p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm" data-testid="card-total-sales">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex-shrink-0">
                <ShoppingBagIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Sales</div>
                <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {isLoading ? "..." : formatCurrency(dashboardStats?.todaysRevenue || 0)}
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-2.5 sm:p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm" data-testid="card-net">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                <DollarSignIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Net Profit</div>
                <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {isLoading ? "..." : formatCurrency(dashboardStats?.todaysNet || 0)}
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-2.5 sm:p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm" data-testid="card-total-purchase">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
                <ArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Purchase</div>
                <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {isLoading ? "..." : formatCurrency(dashboardStats?.todaysPurchaseAmount || 0)}
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-2.5 sm:p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm" data-testid="card-sell-return">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex-shrink-0">
                <ArrowDownIcon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Sell Return</div>
                <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {isLoading ? "..." : formatCurrency(dashboardStats?.todaysReturnAmount || 0)}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-2.5 sm:p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm" data-testid="card-cash-in-hand">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                <WalletIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Cash in Hand</div>
                <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {isLoading ? "..." : formatCurrency(dashboardStats?.totalCashInHand || 0)}
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-2.5 sm:p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm" data-testid="card-purchase-due">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex-shrink-0">
                <CircleDollarSignIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Purchase Due</div>
                <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {isLoading ? "..." : formatCurrency(dashboardStats?.todaysPurchaseDueAmount || 0)}
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-2.5 sm:p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm" data-testid="card-purchase-return">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex-shrink-0">
                <ArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Purchase Return</div>
                <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {isLoading ? "..." : formatCurrency(dashboardStats?.todaysPurchaseReturnAmount || 0)}
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-2.5 sm:p-3 md:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm" data-testid="card-expense">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
                <BadgePercentIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Expense</div>
                <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {isLoading ? "..." : formatCurrency(dashboardStats?.todaysExpenses || 0)}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sales Chart */}
        <div className="mb-4 md:mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100">Sales Last 30 Days</h3>
          </div>
          <div className="h-48 sm:h-56 md:h-64 lg:h-72">
            <SalesChart />
          </div>
        </div>

        {/* Recent Sales and Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4" data-testid="section-recent-sales">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 md:mb-4">Recent Sales</h3>
            <div className="max-h-64 md:max-h-80 overflow-auto">
              <RecentSales />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4" data-testid="section-top-products">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 md:mb-4">Top Products</h3>
            <div className="max-h-64 md:max-h-80 overflow-auto">
              <TopSellingProducts />
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-4 md:mb-6" data-testid="section-low-stock">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 md:mb-4">Low Stock Items</h3>
          <div className="max-h-64 md:max-h-80 overflow-auto">
            <LowStockItems />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/20 dark:border-primary/30 rounded-lg p-3 sm:p-4 mb-4 md:mb-6" data-testid="section-quick-actions">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-primary dark:text-primary mb-2">Cash Register Management</h3>
          <p className="text-xs sm:text-sm text-primary/80 dark:text-primary/70 mb-3">Manage cash register operations and view transaction history</p>
          <Link href="/cash-register-management">
            <Button className="bg-primary hover:bg-primary/90 text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 text-white" data-testid="button-cash-register">
              Open Cash Register
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
