import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Zap, 
  Calculator as CalculatorIcon, 
  Database as DatabaseIcon, 
  DollarSign as DollarSignIcon, 
  Package as PackageIcon,
  Palette,
  Layout
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BrandingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Branding State
  const [branding, setBranding] = useState({
    appName: 'Nebula POS',
    logoIcon: 'Zap',
    logoColor: 'from-indigo-500 to-purple-600',
    primaryColor: '262 83% 58%' // Default to a nice purple
  });

  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch Branding on load
  const { data: fetchedBranding, isLoading } = useQuery({
    queryKey: ["/api/branding"],
    queryFn: async () => {
      const res = await fetch("/api/branding", { cache: 'no-store' });
      if (!res.ok) throw new Error("Failed to fetch branding");
      return res.json();
    }
  });

  // Sync state with fetched data
  useEffect(() => {
    if (fetchedBranding) {
      setBranding(fetchedBranding);
    }
  }, [fetchedBranding]);

  const handleUpdateBranding = async () => {
    setIsUpdating(true);
    try {
      const res = await apiRequest('PUT', '/api/branding', branding);
      if (res.ok) {
        toast({
          title: "Branding Updated",
          description: "Refresh the application to see all changes.",
        });
        
        // Invalidate branding queries
        queryClient.invalidateQueries({ queryKey: ["/api/branding"] });
        
        // Reload after a short delay to ensure assets are refreshed
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update branding",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Palette className="h-8 w-8 text-indigo-600" />
            App Branding
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Customize the identity of your POS system including name, logo, and theme colors.
          </p>
        </div>

        <Card className="bg-white dark:bg-gray-800 shadow-xl border-indigo-100 dark:border-indigo-900 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-b">
            <CardTitle className="text-xl flex items-center gap-2">
              <Layout className="h-5 w-5 text-indigo-600" />
              Brand Identity Configuration
            </CardTitle>
            <CardDescription>
              Any changes here will be reflected across the sidebar, header, and login pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            {/* App Name Section */}
            <div className="space-y-4">
              <Label htmlFor="appName" className="text-sm font-bold uppercase tracking-wider text-gray-500">Application Name</Label>
              <div className="relative group">
                <Input 
                  id="appName" 
                  value={branding.appName}
                  onChange={(e) => setBranding({...branding, appName: e.target.value})}
                  className="font-bold text-lg h-12 border-indigo-200 dark:border-indigo-800 focus:ring-4 focus:ring-indigo-500/10 transition-all rounded-xl"
                  placeholder="Enter application name..."
                />
              </div>
              <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-500" />
                Powered By {branding.appName || 'POS'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Logo Color Section */}
              <div className="space-y-4">
                 <Label className="text-sm font-bold uppercase tracking-wider text-gray-500">Logo Background Color</Label>
                 <div className="flex flex-wrap gap-4 pt-2">
                    {[
                      { name: "Nebula (Indigo-Purple)", value: "from-indigo-500 to-purple-600" },
                      { name: "Sky (Blue-Cyan)", value: "from-blue-400 to-cyan-500" },
                      { name: "Sunset (Orange-Rose)", value: "from-orange-500 to-rose-600" },
                      { name: "Nature (Green-Teal)", value: "from-green-500 to-teal-500" },
                      { name: "Midnight (Slate-Zinc)", value: "from-slate-800 to-zinc-950" },
                      { name: "Gold (Amber-Yellow)", value: "from-amber-400 to-yellow-600" }
                    ].map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setBranding({...branding, logoColor: color.value})}
                        className={cn(
                          "h-10 w-10 rounded-full bg-gradient-to-br transition-all hover:scale-125 hover:shadow-lg ring-offset-2",
                          color.value,
                          branding.logoColor === color.value && "ring-4 ring-indigo-500 scale-110 shadow-md"
                        )}
                        title={color.name}
                      />
                    ))}
                 </div>
              </div>

              {/* Logo Icon Section */}
              <div className="space-y-4">
                 <Label className="text-sm font-bold uppercase tracking-wider text-gray-500">App Icon</Label>
                 <div className="flex flex-wrap gap-3 pt-1">
                   {[
                     { name: "Zap", icon: Zap },
                     { name: "Calculator", icon: CalculatorIcon },
                     { name: "Database", icon: DatabaseIcon },
                     { name: "Dollar", icon: DollarSignIcon },
                     { name: "Package", icon: PackageIcon }
                   ].map((ict) => (
                     <button
                       key={ict.name}
                       onClick={() => setBranding({...branding, logoIcon: ict.name})}
                       className={cn(
                         "flex h-12 w-12 items-center justify-center rounded-xl border-2 border-gray-100 dark:border-gray-800 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200",
                         branding.logoIcon === ict.name && "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 shadow-sm"
                       )}
                     >
                       <ict.icon className="h-6 w-6" />
                     </button>
                   ))}
                 </div>
              </div>
            </div>

            {/* App Theme Color Section */}
            <div className="space-y-4">
               <Label className="text-sm font-bold uppercase tracking-wider text-gray-500">Main Application Theme Color (Sidebar/Buttons)</Label>
               <div className="flex flex-wrap gap-4 pt-2">
                 {[
                   { name: "Nebula Purple", value: "262 83% 58%" },
                   { name: "Ocean Blue", value: "221 83% 53%" },
                   { name: "Fire Red", value: "0 84.2% 60.2%" },
                   { name: "Emerald Green", value: "142 71% 45%" },
                   { name: "Dark Slate", value: "222 47% 11%" },
                   { name: "Midnight Black", value: "240 10% 3.9%" }
                 ].map((color) => (
                   <button
                     key={color.value}
                     onClick={() => setBranding({...branding, primaryColor: color.value})}
                     className={cn(
                       "h-12 w-12 rounded-xl transition-all hover:scale-110 hover:shadow-lg ring-offset-2 border-2",
                       branding.primaryColor === color.value ? "ring-4 ring-indigo-500 border-white" : "border-transparent"
                     )}
                     style={{ backgroundColor: `hsl(${color.value})` }}
                     title={color.name}
                   />
                 ))}
               </div>
               <p className="text-xs text-muted-foreground italic mt-2">
                 This color will be applied to the Sidebar, Primary Buttons, and Accent elements across the system.
               </p>
            </div>

            <div className="pt-8 border-t border-indigo-50 dark:border-indigo-950">
              <Label className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-6 block">Real-time Interface Preview</Label>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-gray-50/50 dark:bg-black/20 p-8 rounded-3xl border-2 border-dashed border-indigo-100 dark:border-indigo-900">
                {/* Logo Preview */}
                <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Logo Context</span>
                  <div className="flex items-center">
                    <div className={cn(
                      "rounded-full w-20 h-20 flex items-center justify-center mr-6 shadow-2xl bg-gradient-to-br transform hover:rotate-12 transition-all duration-500",
                      branding.logoColor
                    )}>
                       {branding.logoIcon === 'Zap' && <Zap className="h-10 w-10 text-white" />}
                       {branding.logoIcon === 'Calculator' && <CalculatorIcon className="h-10 w-10 text-white" />}
                       {branding.logoIcon === 'Database' && <DatabaseIcon className="h-10 w-10 text-white" />}
                       {branding.logoIcon === 'Dollar' && <DollarSignIcon className="h-10 w-10 text-white" />}
                       {branding.logoIcon === 'Package' && <PackageIcon className="h-10 w-10 text-white" />}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-1">
                          {branding.appName}
                      </p>
                      <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Professional Edition</p>
                    </div>
                  </div>
                </div>

                {/* Sidebar Preview */}
                <div className="flex flex-col rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                  <span className="text-[10px] font-bold text-gray-400 bg-white dark:bg-gray-900 p-2 text-center uppercase tracking-widest border-b">Sidebar Context</span>
                  <div className="flex h-48">
                    <div 
                      className="w-16 flex flex-col items-center pt-4 gap-4 transition-colors duration-500"
                      style={{ backgroundColor: `hsl(${branding.primaryColor})` }}
                    >
                       <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                         {branding.logoIcon === 'Zap' && <Zap className="h-4 w-4 text-white" />}
                         {branding.logoIcon === 'Calculator' && <CalculatorIcon className="h-4 w-4 text-white" />}
                         {branding.logoIcon === 'Database' && <DatabaseIcon className="h-4 w-4 text-white" />}
                         {branding.logoIcon === 'Dollar' && <DollarSignIcon className="h-4 w-4 text-white" />}
                         {branding.logoIcon === 'Package' && <PackageIcon className="h-4 w-4 text-white" />}
                       </div>
                       <div className="w-8 h-1 bg-white/20 rounded-full" />
                       <div className="w-8 h-8 rounded-lg bg-white/10" />
                       <div className="w-8 h-8 rounded-lg bg-white/30 border border-white/20 shadow-inner shadow-white/10" />
                       <div className="w-8 h-8 rounded-lg bg-white/10" />
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-950 p-4 space-y-3">
                       <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                       <div className="h-24 w-full bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center justify-center">
                          <Button size="sm" style={{ backgroundColor: `hsl(${branding.primaryColor})` }} className="shadow-lg transform scale-90">
                             Sample Button
                          </Button>
                       </div>
                       <div className="h-4 w-1/2 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleUpdateBranding}
                disabled={isUpdating}
                className="px-12 py-6 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl hover:shadow-indigo-500/20 transition-all rounded-xl"
              >
                {isUpdating ? (
                  <>Saving Changes...</>
                ) : (
                  <>Apply Branding</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
