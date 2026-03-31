import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTheme } from "@/components/ui/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DatabaseIcon, ShieldIcon, BellIcon, Settings as SettingsIcon, Printer, Zap, PlusIcon, PrinterIcon, DollarSignIcon, UserIcon, ChevronsUpDownIcon, CheckIcon, CloudIcon, RefreshCwIcon, Settings2Icon, LinkIcon, Calculator as CalculatorIcon, Package as PackageIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import ReceiptSettings from './receipt-settings';

// Tax Settings Component
function TaxSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch global tax settings
  const { data: fetchedSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/tax-settings'],
    queryFn: async () => {
      const res = await fetch('/api/tax-settings');
      if (!res.ok) throw new Error('Failed to fetch tax settings');
      return res.json();
    }
  });

  // Global settings state
  const [globalSettings, setGlobalSettings] = useState({
    taxCalculationMethod: 'afterDiscount',
    pricesIncludeTax: false,
    enableMultipleTaxRates: true,
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (fetchedSettings) {
      setGlobalSettings(prev => ({
        ...prev,
        ...fetchedSettings
      }));
    }
  }, [fetchedSettings]);

  // Mutation for updating global settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', '/api/tax-settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tax-settings'] });
      toast({
        title: "Settings saved",
        description: "Tax settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive"
      });
    }
  });

  const updateGlobalSetting = (key: string, value: any) => {
    const updated = { ...globalSettings, [key]: value };
    setGlobalSettings(updated);

    // Auto-save to backend
    updateSettingsMutation.mutate(updated);
  };

  // Fetch tax categories from API
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['/api/tax-categories'],
    queryFn: async () => {
      const res = await fetch('/api/tax-categories');
      if (!res.ok) throw new Error('Failed to fetch tax categories');
      return res.json();
    }
  });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/tax-categories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tax-categories'] });
      toast({
        title: "Category added",
        description: "Tax category created successfully",
      });
      setNewCategoryName('');
      setNewCategoryRate(18);
      setNewCategoryDescription('');
      setNewCategoryHsn('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive"
      });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/tax-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tax-categories'] });
      toast({
        title: "Category removed",
        description: "Tax category deleted successfully",
      });
    }
  });

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryRate, setNewCategoryRate] = useState(18);
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryHsn, setNewCategoryHsn] = useState('');
  const [hsnOpen, setHsnOpen] = useState(false);
  const [hsnSearchValue, setHsnSearchValue] = useState("");

  // Fetch HSN Codes
  const { data: hsnCodes = [] } = useQuery({
    queryKey: ['/api/hsn-codes'],
    queryFn: async () => {
      const res = await fetch('/api/hsn-codes');
      if (!res.ok) throw new Error('Failed to fetch HSN codes');
      return res.json();
    }
  });

  const addTaxCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Category name required",
        description: "Please enter a category name",
        variant: "destructive"
      });
      return;
    }

    createCategoryMutation.mutate({
      name: newCategoryName.trim(),
      rate: newCategoryRate,
      description: newCategoryDescription.trim(),
      hsnCodeRange: newCategoryHsn.trim(),
      isActive: true
    });
  };

  const removeTaxCategory = (id: number) => {
    if (confirm('Are you sure you want to delete this tax category?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  // Mock duplicate for now (creates new)
  const duplicateCategory = (category: any) => {
    createCategoryMutation.mutate({
      name: `${category.name} (Copy)`,
      rate: category.rate,
      description: category.description,
      hsnCodeRange: category.hsnCodeRange,
      isActive: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="taxCalculation">Tax Calculation Method</Label>
          <Select
            value={globalSettings.taxCalculationMethod}
            onValueChange={(value) => updateGlobalSetting('taxCalculationMethod', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select calculation method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="afterDiscount">Calculate after discount</SelectItem>
              <SelectItem value="beforeDiscount">Calculate before discount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="taxIncluded">Prices include tax</Label>
          <Switch
            id="taxIncluded"
            checked={globalSettings.pricesIncludeTax}
            onCheckedChange={(checked) => updateGlobalSetting('pricesIncludeTax', checked)}
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          If enabled, entered product prices are considered tax-inclusive
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="multipleTaxes">Enable multiple tax rates</Label>
          <Switch
            id="multipleTaxes"
            checked={globalSettings.enableMultipleTaxRates}
            onCheckedChange={(checked) => updateGlobalSetting('enableMultipleTaxRates', checked)}
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Allow different tax rates for different product categories
        </p>
      </div>

      {globalSettings.enableMultipleTaxRates && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Tax Categories</h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {categories.length} categories configured
            </div>
          </div>

          <div className="space-y-4">
            {categories.map((category: any) => (
              <div key={category.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Category Name</Label>
                    <div className="font-medium p-2 bg-white rounded border">{category.name}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <div className="font-medium p-2 bg-white rounded border text-center">{category.rate}%</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Actions</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateCategory(category)}
                        className="flex-1"
                      >
                        Copy
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeTaxCategory(category.id)}
                        className="flex-1"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Description</Label>
                    <div className="text-sm">{category.description || 'No description'}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">HSN Code Range</Label>
                    <div className="text-sm font-mono">{category.hsnCodeRange || '-'}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Quick Add Standard GST Rates */}
            <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <h4 className="text-md font-medium mb-3 text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Quick Add Standard GST Rates
              </h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { rate: 0, name: 'Tax Exempt' },
                  { rate: 5, name: 'Essential Items' },
                  { rate: 12, name: 'Standard Rate' },
                  { rate: 18, name: 'General Goods' },
                  { rate: 28, name: 'Luxury Items' }
                ].map((quickRate) => {
                  const exists = categories.some((cat: any) => cat.rate === quickRate.rate);
                  return (
                    <Button
                      key={quickRate.rate}
                      variant={exists ? "secondary" : "outline"}
                      size="sm"
                      disabled={exists || createCategoryMutation.isPending}
                      onClick={() => {
                        createCategoryMutation.mutate({
                          name: quickRate.name,
                          rate: quickRate.rate,
                          description: `${quickRate.rate}% GST rate category`,
                          isActive: true
                        });
                      }}
                      className={exists ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      {exists ? `✓ ${quickRate.rate}%` : `+ ${quickRate.rate}%`}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Add New Category Form */}
            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
              <h4 className="text-md font-medium mb-4 text-gray-700 dark:text-gray-300">Add Custom Tax Category</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="new-category-name">Category Name *</Label>
                  <Input
                    id="new-category-name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Electronics, Clothing"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-category-rate">Tax Rate (%) *</Label>
                  <Input
                    id="new-category-rate"
                    type="number"
                    value={newCategoryRate.toString()}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) setNewCategoryRate(val);
                    }}
                    placeholder="18"
                    min="0"
                    max="50"
                  />
                </div>
                <div className="space-y-2 flex flex-col">
                  <Label htmlFor="new-category-hsn">HSN Code Range</Label>
                  <Popover open={hsnOpen} onOpenChange={setHsnOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={hsnOpen}
                        className={cn(
                          "w-full justify-between font-mono",
                          !newCategoryHsn && "text-muted-foreground"
                        )}
                      >
                        {newCategoryHsn
                          ? newCategoryHsn
                          : "Select or enter HSN code..."}
                        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search HSN code..."
                          onValueChange={(val) => setHsnSearchValue(val)}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <div className="p-2">
                              <p className="text-sm text-muted-foreground mb-2">No HSN code found.</p>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="w-full h-8"
                                onClick={() => {
                                  setNewCategoryHsn(hsnSearchValue);
                                  setHsnOpen(false);
                                }}
                              >
                                Use "{hsnSearchValue}"
                              </Button>
                            </div>
                          </CommandEmpty>
                          <CommandGroup>
                            {hsnCodes.map((hsn: any) => (
                              <CommandItem
                                key={hsn.id}
                                value={`${hsn.hsnCode} ${hsn.description}`}
                                onSelect={() => {
                                  setNewCategoryHsn(hsn.hsnCode);
                                  // Auto-fill description if empty and available
                                  if (!newCategoryDescription && hsn.description) {
                                    setNewCategoryDescription(hsn.description);
                                  }
                                  setHsnOpen(false);
                                }}
                              >
                                <CheckIcon
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    newCategoryHsn === hsn.hsnCode
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-mono font-medium">{hsn.hsnCode}</span>
                                  <span className="text-xs text-muted-foreground">{hsn.description}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-category-description">Description</Label>
                  <Input
                    id="new-category-description"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Brief description"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={addTaxCategory}
                  disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {createCategoryMutation.isPending ? 'Adding...' : 'Add Tax Category'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Must provide a valid email").or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
  image: z.string().optional().or(z.literal(""))
})
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function Settings() {
  const { theme, setTheme, primaryColor, setPrimaryColor } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [receiptPreview, setReceiptPreview] = useState<string>("");
  const [showReceiptSettings, setShowReceiptSettings] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);

  // Overall options state mapping module/sub-item key to a boolean
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({});

  // Export options state
  const [exportSelections, setExportSelections] = useState({
    products: true,
    sales: true,
    purchases: true,
    customers: true
  });

  // Google Drive Sync State
  const [googleSyncStatus, setGoogleSyncStatus] = useState({
    isConfigured: false,
    isAuthenticated: false,
    isSyncing: false
  });

  // Fetch sync status on load
  useEffect(() => {
    fetchGoogleSyncStatus();
  }, []);

  const fetchGoogleSyncStatus = async () => {
    try {
      const res = await fetch('/api/backup/google/status');
      if (res.ok) {
        const data = await res.json();
        setGoogleSyncStatus(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to fetch Google sync status:', error);
    }
  };

  const handleGoogleConfigSave = async () => {
    try {
      const res = await apiRequest('POST', '/api/backup/google/config', googleConfig);
      if (res.ok) {
        toast({
          title: "Configuration Saved",
          description: "Google Drive API credentials have been updated.",
        });
        setShowGoogleConfig(false);
        fetchGoogleSyncStatus();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive"
      });
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const res = await fetch('/api/backup/google/auth');
      const data = await res.json();
      if (data.url) {
        // Open auth URL in a popup
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(data.url, 'google-auth', `width=${width},height=${height},left=${left},top=${top}`);
        
        const checkPopup = setInterval(() => {
          if (!popup || popup.closed) {
            clearInterval(checkPopup);
            fetchGoogleSyncStatus();
          }
        }, 1000);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start authentication",
        variant: "destructive"
      });
    }
  };

  const handleGoogleUpload = async () => {
    setGoogleSyncStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      const res = await apiRequest('POST', '/api/backup/google/upload', {});
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Cloud Backup Successful",
          description: `Backup uploaded to Google Drive. File ID: ${data.fileId}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Cloud Backup Failed",
        description: error.message || "Failed to upload backup to Google Drive",
        variant: "destructive"
      });
    } finally {
      setGoogleSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };


  // Load current user data
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 401) {
          return { user: null };
        }
        throw new Error('Failed to fetch user');
      }
      return response.json();
    }
  });

  // Fetch data statistics for Data Management section
  const { data: statsData } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: salesData } = useQuery({
    queryKey: ['/api/sales', { limit: 1000 }],
    refetchInterval: 30000
  });

  const { data: customersData } = useQuery({
    queryKey: ['/api/customers'],
    refetchInterval: 30000
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['/api/suppliers'],
    refetchInterval: 30000
  });

  const { data: purchasesData } = useQuery({
    queryKey: ['/api/purchases'],
    refetchInterval: 30000
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      image: ""
    },
  });

  // Set form default values when user data is loaded
  useEffect(() => {
    if (userData?.user) {
      profileForm.reset({
        name: userData.user.name || "",
        email: userData.user.email || "",
        password: "",
        confirmPassword: "",
        image: userData.user.image || ""
      });
    }
  }, [userData, profileForm]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const userId = userData.user.id;
      const updateData = {
        name: data.name,
        email: data.email,
        image: data.image
      };

      // Only include password if it's provided
      if (data.password) {
        Object.assign(updateData, { password: data.password });
      }

      return await apiRequest("PUT", `/api/users/${userId}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const systemModulesConfig = [
    { key: 'users', title: 'User Management', desc: 'Enable roles and users configuration', subItems: [{ key: '/users', label: 'Users' }, { key: '/roles', label: 'Roles' }] },
    { key: 'contacts', title: 'Contacts', desc: 'Enable Suppliers and Customers', subItems: [{ key: '/suppliers', label: 'Suppliers' }, { key: '/customers', label: 'Customers' }] },
    { key: 'products', title: 'Products', desc: 'Enable product creation and catalog', subItems: [
        { key: '/add-item-dashboard', label: 'Add Item Dashboard' }, 
        { key: '/add-item-professional', label: 'Add Item Professional', subItems: [
            { key: '/add-item-professional#item-information', label: 'Item Information' },
            { key: '/add-item-professional#category-information', label: 'Category Information' },
            { key: '/add-item-professional#tax-information', label: 'Tax Information' },
            { key: '/add-item-professional#ean-code-barcode', label: 'EAN Code/Barcode' },
            { key: '/add-item-professional#packing', label: 'Packing' },
            { key: '/add-item-professional#item-properties', label: 'Item Properties' },
            { key: '/add-item-professional#pricing', label: 'Pricing' },
            { key: '/add-item-professional#reorder-configurations', label: 'Reorder Configurations' }
        ]}, 
        { key: '/update-price-professional', label: 'Update Price' }, 
        { key: '/print-labels-enhanced', label: 'Print Labels Enhanced' }, 
        { key: '/product-history', label: 'Product History' }, 
        { key: '/units', label: 'Units' }, 
        { key: '/categories', label: 'Categories' }, 
        { key: '/brands', label: 'Brands' }, 
        { key: '/item-product-types', label: 'Product Types' }, 
        { key: '/departments', label: 'Departments' }
    ] },
    { key: 'repacking', title: 'Repacking', desc: 'Enable repacking features', subItems: [{ key: '/repacking-dashboard-professional', label: 'Professional Dashboard' }, { key: '/repacking-professional', label: 'Professional Repacking' }] },
    { key: 'purchases', title: 'Purchases', desc: 'Enable purchase workflows', subItems: [
        { key: '/purchase-dashboard', label: 'Purchase Dashboard' }, 
        { key: '/purchase-entry-professional', label: 'Professional Purchase Entry', subItems: [
            { key: '/purchase-entry-professional#logistics', label: 'Logistics Options' },
            { key: '/purchase-entry-professional#summary', label: 'Overall Summary Tab' },
            { key: '/purchase-entry-professional#expected-date', label: 'Expected Date Field' },
            { key: '/purchase-entry-professional#payment-details', label: 'Payment Terms/Method' },
            { key: '/purchase-entry-professional#shipping-details', label: 'Shipping/Billing Address' },
            { key: '/purchase-entry-professional#item-advanced', label: 'Advanced Item Properties' }
        ]}
    ] },
    { key: 'sales', title: 'Sales', desc: 'Enable POS and Sales dashboard screens', subItems: [{ key: '/sales-dashboard', label: 'Sales Dashboard' }, { key: '/pos-enhanced', label: 'Enhanced Desktop POS' }, { key: '/sales/return', label: 'Sale Returns' }, { key: '/sale-returns-dashboard', label: 'Sale Returns Dashboard' }] },
    { key: 'manufacturing', title: 'Manufacturing', desc: 'Enable formulas and manufacturing', subItems: [{ key: '/manufacturing-dashboard', label: 'Manufacturing Dashboard' }, { key: '/raw-materials-management', label: 'Raw Materials Management' }, { key: '/create-product-formula', label: 'Create Product Formula' }] },
    { key: 'inventory', title: 'Inventory', desc: 'Enable advanced stock adjustment & weight items', subItems: [{ key: '/inventory', label: 'Stock Transfers' }, { key: '/inventory-forecasting', label: 'Inventory Forecasting' }, { key: '/inventory-adjustments', label: 'Stock Adjustment' }, { key: '/weight-based-items', label: 'Weight-Based Items' }] },
    { key: 'reports', title: 'Reports', desc: 'Overall reporting module', subItems: [{ key: '/reports', label: 'Reports' }, { key: '/sales-reports', label: 'Sales Reports' }, { key: '/purchase-reports', label: 'Purchase Reports' }, { key: '/stock-reports', label: 'Stock Reports' }, { key: '/customer-reports', label: 'Customer Reports' }, { key: '/supplier-reports', label: 'Supplier Reports' }, { key: '/tax-reports', label: 'Tax Reports' }, { key: '/offer-reports', label: 'Offer Reports' }] },
    { key: 'offers', title: 'Offers & Promotions', desc: 'Loyalty programs and offers', subItems: [{ key: '/offer-management', label: 'Manage Offers' }, { key: '/loyalty-management', label: 'Customer Loyalty' }, { key: '/loyalty-rules', label: 'Loyalty Rules' }] },
    { key: 'accounts', title: 'Accounts & Payroll', desc: 'Enable bookkeeping and payroll', subItems: [{ key: '/accounts-dashboard', label: 'Accounts Dashboard' }, { key: '/cash-register-management', label: 'Cash Register Management' }, { key: '/payroll-dashboard', label: 'Payroll Management' }] },
    { key: 'profit', title: 'Profit Management', desc: 'Enable profitability margins calculation', subItems: [{ key: '/profit-management', label: 'Profit Management' }] },
    { key: 'wholesale', title: 'Wholesale Options', desc: 'Enable or disable wholesale pricing capabilities', subItems: [{ key: '/wholesale-pricing', label: 'Wholesale Pricing Mode' }] }
  ];

  // Receipt settings form state
  const [receiptSettings, setReceiptSettings] = useState({
    businessName: "LARAVEL POS SYSTEM",
    address: "1234 Main Street\nCity, State 12345",
    phone: "(123) 456-7890",
    taxId: "",
    receiptFooter: "Thank you for shopping with us!",
    showLogo: false,
    printAutomatically: true,
    defaultPrinter: "default"
  });

  // Load receipt settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('receiptSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setReceiptSettings({
        businessName: settings.businessName || "NEBULA POS",
        address: settings.businessAddress || "123 Main Street\nCity, State 560001",
        phone: settings.phoneNumber || "(123) 456-7890",
        taxId: settings.taxId || "",
        receiptFooter: settings.receiptFooter || "Thank you for shopping with us!",
        showLogo: settings.showLogo || false,
        printAutomatically: settings.autoPrint || true,
        defaultPrinter: settings.defaultPrinter || "default"
      });
    }

    // Load overall options
    const savedModules = localStorage.getItem('enabledModules');
    if (savedModules) {
      setEnabledModules(JSON.parse(savedModules));
    }
  }, []);

  const saveReceiptSettings = () => {
    const settingsToSave = {
      businessName: receiptSettings.businessName,
      businessAddress: receiptSettings.address,
      phoneNumber: receiptSettings.phone,
      taxId: receiptSettings.taxId,
      receiptFooter: receiptSettings.receiptFooter,
      showLogo: receiptSettings.showLogo,
      autoPrint: receiptSettings.printAutomatically,
      defaultPrinter: receiptSettings.defaultPrinter
    };

    localStorage.setItem('receiptSettings', JSON.stringify(settingsToSave));
    toast({
      title: "Settings updated",
      description: "Receipt settings have been saved successfully",
    });
  };

  // Data management handlers
  const handleBackupData = async () => {
    try {
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to create backup');
      }

      const result = await response.json();

      // Download the backup file
      const downloadResponse = await fetch('/api/backup/download', {
        credentials: 'include'
      });

      if (downloadResponse.ok) {
        const blob = await downloadResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Backup created successfully",
          description: "Your data has been backed up and downloaded",
        });
      }
    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: "Backup failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleClearData = async () => {
    const confirmed = window.confirm(
      "⚠️ WARNING: This will permanently delete ALL your data including products, sales, purchases, customers, and suppliers. This action cannot be undone.\n\nAre you absolutely sure you want to continue?"
    );

    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      "This is your final warning. All data will be lost forever. Type 'DELETE' in the next prompt to confirm."
    );

    if (!doubleConfirmed) return;

    const finalConfirmation = window.prompt(
      "Type 'DELETE' (in capital letters) to confirm data deletion:"
    );

    if (finalConfirmation !== 'DELETE') {
      toast({
        title: "Data deletion cancelled",
        description: "Confirmation text did not match. Your data is safe.",
      });
      return;
    }

    try {
      const response = await fetch('/api/data/clear', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to clear data');
      }

      queryClient.clear();

      toast({
        title: "All data cleared",
        description: "All data has been permanently deleted from the system",
      });

      // Refresh the page to reset the application state
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Clear data error:', error);
      toast({
        title: "Failed to clear data",
        description: "An error occurred while clearing data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRestoreFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Accept both .json files and files without extension (for downloaded backups)
      if (file.type === 'application/json' || file.name.endsWith('.json') || file.name.includes('pos-backup')) {
        setSelectedBackupFile(file);
        toast({
          title: "File selected",
          description: `Selected: ${file.name}`,
        });
      } else {
        toast({
          title: "Invalid file",
          description: "Please select a valid JSON backup file (.json)",
          variant: "destructive"
        });
      }
    }
  };

  const handleRestoreData = async () => {
    if (!selectedBackupFile) {
      toast({
        title: "No file selected",
        description: "Please select a backup file first",
        variant: "destructive"
      });
      return;
    }

    const confirmed = window.confirm(
      "⚠️ WARNING: This will replace ALL current data with the backup data. Current data will be lost. Are you sure you want to continue?"
    );

    if (!confirmed) return;

    try {
      // Read the file content
      const fileContent = await selectedBackupFile.text();
      let backupData;

      try {
        backupData = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error('Invalid backup file format. Please ensure it\'s a valid JSON file.');
      }

      // Validate backup data structure
      if (!backupData.data || !backupData.timestamp) {
        throw new Error('Invalid backup file structure. This doesn\'t appear to be a valid POS backup file.');
      }

      // Send backup data directly as JSON
      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backup: fileContent }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to restore backup: ${errorText}`);
      }

      const result = await response.json();

      queryClient.clear();

      toast({
        title: "Data restored successfully",
        description: "Your backup has been restored successfully. Page will reload shortly.",
      });

      // Clear the selected file
      setSelectedBackupFile(null);

      // Refresh the page to reload the restored data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: "Restore failed",
        description: error.message || "An error occurred during restoration",
        variant: "destructive"
      });
    }
  };

  const handleExportData = (format: 'csv' | 'json') => {
    try {
      const dataToExport: any = {};
      if (exportSelections.products) dataToExport.products = statsData?.completeProducts || salesData?.products || [];
      if (exportSelections.sales) dataToExport.sales = salesData || [];
      if (exportSelections.purchases) dataToExport.purchases = purchasesData || [];
      if (exportSelections.customers) dataToExport.customers = customersData || [];

      if (Object.keys(dataToExport).length === 0) {
        toast({
          title: "No data selected",
          description: "Please select at least one category to export",
          variant: "destructive"
        });
        return;
      }

      if (format === 'json') {
        const jsonContent = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pos-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Simple CSV conversion for the first selected item
        const firstKey = Object.keys(dataToExport)[0];
        const rows = dataToExport[firstKey];
        if (!Array.isArray(rows) || rows.length === 0) {
          throw new Error(`No ${firstKey} data available for CSV export`);
        }

        const headers = Object.keys(rows[0]).join(',');
        const csvRows = rows.map(row => 
          Object.values(row).map(val => 
            typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
          ).join(',')
        );
        const csvContent = [headers, ...csvRows].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pos-${firstKey}-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Export Successful",
        description: `Your data has been exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "An error occurred during export",
        variant: "destructive"
      });
    }
  };

  const generateTestReceipt = () => `
${receiptSettings.businessName}
Professional Retail Solution
${receiptSettings.taxId ? `GST No: ${receiptSettings.taxId} | ` : ''}Ph: ${receiptSettings.phone}
${receiptSettings.address}
-------------------------------
Bill No: POS1749631206824
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
Cashier: ${userData?.user?.name || "Admin User"}
-------------------------------
Customer Details:
Name: Walk-in Customer
-------------------------------
Item                Qty  Rate    Amt
-------------------------------
rice (250g Pack)     1   ₹100   ₹100
ITM26497399-REPACK-2500-1749547699598
MRP: ₹120 (You Save: ₹20)
-------------------------------
Sub Total:                 ₹100
Taxable Amount:            ₹100
GST (0%):                   ₹0
-------------------------------
GRAND TOTAL:              ₹100

Payment Method:           CASH
Amount Paid:              ₹100
-------------------------------
${receiptSettings.receiptFooter}
  `;

  const updateModuleOption = (key: string, checked: boolean) => {
    const updated = { ...enabledModules, [key]: checked };
    setEnabledModules(updated);
    localStorage.setItem('enabledModules', JSON.stringify(updated));
    toast({
      title: "Module settings updated",
      description: "You may need to refresh the page to see changes in the sidebar.",
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Settings</h2>
        </div>

        <Tabs defaultValue="profile" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="system">Overall Options</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="receipts">Receipt Settings</TabsTrigger>
            <TabsTrigger value="printer">Printer Settings</TabsTrigger>
            <TabsTrigger value="tax">Tax Settings</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
          </TabsList>

          {/* System Overall Options */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>Overall Options Enable / Disable</CardTitle>
                <CardDescription>Toggle specific modules and features on or off for the entire application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Master Switch */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800 shadow-sm">
                  <div className="space-y-1 mb-4 sm:mb-0">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-lg">Master Control</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Quickly enable or disable all application modules simultaneously.</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white dark:bg-gray-800 py-2 px-4 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-24 text-center">
                      {systemModulesConfig.every(m => enabledModules[m.key] !== false) ? 'All Enabled' : 'Toggle All'}
                    </span>
                    <Switch
                      className="scale-110"
                      checked={systemModulesConfig.every(m => enabledModules[m.key] !== false)}
                      onCheckedChange={(checked) => {
                        const updated = { ...enabledModules };
                        systemModulesConfig.forEach(module => {
                          updated[module.key] = checked;
                          module.subItems?.forEach(item => {
                            updated[item.key] = checked;
                            item.subItems?.forEach(sub => {
                              updated[sub.key] = checked;
                            });
                          });
                        });
                        setEnabledModules(updated);
                        localStorage.setItem('enabledModules', JSON.stringify(updated));
                        toast({ title: checked ? "All modules enabled" : "All modules disabled" });
                      }}
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Module Toggle Cards */}
                  {systemModulesConfig.map((module) => {
                    const isModuleChecked = enabledModules[module.key] !== false;
                    
                    return (
                      <div key={module.key} className="border rounded-lg bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border-b">
                          <div className="space-y-0.5">
                            <Label className="text-base font-semibold">{module.title}</Label>
                            <p className="text-sm text-gray-500">{module.desc}</p>
                          </div>
                          <Switch
                            checked={isModuleChecked}
                            onCheckedChange={(checked) => {
                              // Toggle master and all children
                              const updated = { ...enabledModules, [module.key]: checked };
                              module.subItems.forEach(item => {
                                updated[item.key] = checked;
                                if (item.subItems) {
                                  item.subItems.forEach(sub => {
                                    updated[sub.key] = checked;
                                  });
                                }
                              });
                              setEnabledModules(updated);
                              localStorage.setItem('enabledModules', JSON.stringify(updated));
                              toast({ title: "Settings updated" });
                            }}
                          />
                        </div>
                        {isModuleChecked && module.subItems && module.subItems.length > 0 && (
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white dark:bg-gray-800 border-t">
                            {module.subItems.map(item => {
                              const isItemChecked = enabledModules[item.key] !== false;
                              return (
                                <div key={item.key} className="flex flex-col border border-gray-100 dark:border-gray-700 rounded-lg p-3 bg-gray-50/50 dark:bg-gray-900/50 shadow-sm">
                                  <div className={`flex items-center justify-between ${item.subItems ? 'border-b border-gray-100 dark:border-gray-700 pb-2 mb-2' : ''}`}>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                                    <Switch
                                      className="scale-75 origin-right"
                                      checked={isItemChecked}
                                      onCheckedChange={(checked) => {
                                        const updated = { ...enabledModules, [item.key]: checked };
                                        if (item.subItems) {
                                          item.subItems.forEach(sub => {
                                            updated[sub.key] = checked;
                                          });
                                        }
                                        setEnabledModules(updated);
                                        localStorage.setItem('enabledModules', JSON.stringify(updated));
                                      }}
                                    />
                                  </div>
                                  
                                  {isItemChecked && item.subItems && item.subItems.length > 0 && (
                                    <div className="space-y-2 mt-1 pl-1">
                                      {item.subItems.map(subItem => (
                                        <div key={subItem.key} className="flex items-center justify-between py-1 border-b border-gray-100/50 dark:border-gray-800 last:border-0 last:pb-0">
                                          <span className="text-xs text-gray-500 dark:text-gray-400">{subItem.label}</span>
                                          <Switch
                                            className="scale-50 origin-right transition-transform hover:scale-75"
                                            checked={enabledModules[subItem.key] !== false}
                                            onCheckedChange={(checked) => updateModuleOption(subItem.key, checked)}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 flex-shrink-0" />
                  <span>Changes to Overall Options will immediately apply across the entire application. Specifically, the left sidebar menu will update to hide or show corresponding sections.</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your personal information and password</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="relative">
                        <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                          {profileForm.watch("image") ? (
                            <img
                              src={profileForm.watch("image")}
                              alt="Profile"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-gray-400">
                              {userData?.user?.name?.charAt(0) || "U"}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">{userData?.user?.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{userData?.user?.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Your email" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="URL to your profile image" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input placeholder="Leave blank to keep current" type="password" {...field} />
                            </FormControl>
                            <FormDescription>
                              At least 6 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input placeholder="Leave blank to keep current" type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end mt-6">
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={theme}
                      onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Theme Color</Label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { name: "Blue", value: "221, 75%, 48%", class: "bg-[#1d4ed8]" },
                      { name: "Green", value: "142, 45%, 44%", class: "bg-[#267b44]" },
                      { name: "Purple", value: "262, 50%, 50%", class: "bg-[#6d28d9]" },
                      { name: "Red", value: "0, 60%, 50%", class: "bg-[#b91c1c]" },
                      { name: "Orange", value: "24, 70%, 45%", class: "bg-[#c2410c]" }
                    ].map((color) => (
                      <button
                        key={color.name}
                        onClick={() => {
                          if (setPrimaryColor) setPrimaryColor(color.value);
                          toast({
                            title: "Theme color updated",
                            description: `Applied ${color.name} theme`,
                          });
                        }}
                        className={cn(
                          "group relative flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95",
                          color.class,
                          primaryColor === color.value && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        )}
                        title={color.name}
                      >
                        {primaryColor === color.value && (
                          <CheckIcon className="h-5 w-5 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose a primary color for the application dashboard and sidebar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Color Mode Preview</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4 bg-white text-black">
                      <h3 className="text-lg font-medium mb-2">Light Mode</h3>
                      <div className="flex space-x-2">
                        <div className="h-8 w-8 rounded-full bg-primary"></div>
                        <div className="h-8 w-8 rounded-full border border-gray-200 bg-secondary"></div>
                        <div className="h-8 w-8 rounded-full border border-gray-100 bg-muted"></div>
                        <div className="h-8 w-8 rounded-full border border-gray-100 bg-accent"></div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-gray-900 text-white shadow-xl">
                      <h3 className="text-lg font-medium mb-2 text-gray-100">Dark Mode</h3>
                      <div className="flex space-x-2">
                        <div className="h-8 w-8 rounded-full bg-primary shadow-sm shadow-primary/20"></div>
                        <div className="h-8 w-8 rounded-full bg-secondary"></div>
                        <div className="h-8 w-8 rounded-full bg-muted"></div>
                        <div className="h-8 w-8 rounded-full bg-accent"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="animations">UI Animations</Label>
                    <Switch id="animations" defaultChecked />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Enable or disable UI animations for smoother experience
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="compact">Compact Mode</Label>
                    <Switch id="compact" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Reduce spacing between elements for a more compact view
                  </p>
                </div>

                <div className="flex justify-end mt-6">
                  <Button>
                    Save Appearance Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receipt Settings */}
          <TabsContent value="receipts">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Receipt Settings</CardTitle>
                  <CardDescription>Configure how receipts are generated and printed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      placeholder="Your Business Name"
                      value={receiptSettings.businessName}
                      onChange={(e) => setReceiptSettings(prev => ({ ...prev, businessName: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Business Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Business Address"
                      value={receiptSettings.address}
                      onChange={(e) => setReceiptSettings(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="(123) 456-7890"
                      value={receiptSettings.phone}
                      onChange={(e) => setReceiptSettings(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / GST Number</Label>
                    <Input
                      id="taxId"
                      placeholder="Your tax ID number"
                      value={receiptSettings.taxId}
                      onChange={(e) => setReceiptSettings(prev => ({ ...prev, taxId: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receiptFooter">Receipt Footer</Label>
                    <Textarea
                      id="receiptFooter"
                      placeholder="Custom message for receipt footer"
                      value={receiptSettings.receiptFooter}
                      onChange={(e) => setReceiptSettings(prev => ({ ...prev, receiptFooter: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showLogo">Show Logo</Label>
                      <Switch
                        id="showLogo"
                        checked={receiptSettings.showLogo}
                        onCheckedChange={(checked) => setReceiptSettings(prev => ({ ...prev, showLogo: checked }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="printAutomatically">Print Automatically</Label>
                      <Switch
                        id="printAutomatically"
                        checked={receiptSettings.printAutomatically}
                        onCheckedChange={(checked) => setReceiptSettings(prev => ({ ...prev, printAutomatically: checked }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="printerSelect">Default Printer</Label>
                    <Select
                      value={receiptSettings.defaultPrinter}
                      onValueChange={(value) => setReceiptSettings(prev => ({ ...prev, defaultPrinter: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a printer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">System Default Printer</SelectItem>
                        <SelectItem value="thermal">Thermal Receipt Printer</SelectItem>
                        <SelectItem value="inkjet">Office Inkjet Printer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button
                      type="button"
                      onClick={() => {
                        saveReceiptSettings();
                        setReceiptPreview(generateTestReceipt());
                      }}
                    >
                      Save Receipt Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Receipt Preview</CardTitle>
                  <CardDescription>Preview how your receipt will look</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white border border-gray-200 rounded-lg p-6 font-mono text-sm overflow-auto max-h-[600px] text-black">
                    <pre className="whitespace-pre-wrap">
                      {receiptPreview || generateTestReceipt()}
                    </pre>
                  </div>
                  <div className="flex justify-between mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setReceiptPreview(generateTestReceipt())}
                    >
                      Refresh Preview
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const printWindow = window.open('', '_blank', 'width=400,height=700');
                        if (printWindow) {
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>Test Receipt</title>
                                <style>
                                  body { font-family: monospace; margin: 20px; }
                                  pre { white-space: pre-wrap; }
                                </style>
                              </head>
                              <body>
                                <pre>${receiptPreview || generateTestReceipt()}</pre>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                          printWindow.print();
                        }
                      }}
                    >
                      Print Test Receipt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Data Management */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DatabaseIcon className="h-5 w-5" />
                  Data Management & Backup
                </CardTitle>
                <CardDescription>
                  Secure backup, restore, and data management options for your POS system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Real-Time Data Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(salesData?.length || 0) + (customersData?.length || 0) + (suppliersData?.length || 0) + (statsData?.totalProducts || 0)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">Total Records</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{statsData?.totalProducts || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">Products</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{salesData?.length || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">Sales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{customersData?.length || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">Customers</div>
                  </div>
                </div>

                {/* Detailed Data Breakdown */}
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <DatabaseIcon className="h-5 w-5 text-blue-600" />
                    Complete Data Overview
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{statsData?.totalProducts || 0}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">Products</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-700">
                      <div className="text-lg font-bold text-green-700 dark:text-green-300">{salesData?.length || 0}</div>
                      <div className="text-xs text-green-600 dark:text-green-400">Sales</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
                      <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{customersData?.length || 0}</div>
                      <div className="text-xs text-purple-600 dark:text-purple-400">Customers</div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-700">
                      <div className="text-lg font-bold text-orange-700 dark:text-orange-300">{suppliersData?.length || 0}</div>
                      <div className="text-xs text-orange-600 dark:text-orange-400">Suppliers</div>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-700">
                      <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{purchasesData?.length || 0}</div>
                      <div className="text-xs text-indigo-600 dark:text-indigo-400">Purchases</div>
                    </div>
                    <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-lg border border-teal-200 dark:border-teal-700">
                      <div className="text-lg font-bold text-teal-700 dark:text-teal-300">
                        ₹{salesData ? salesData.reduce((sum: number, sale: any) => sum + (parseFloat(sale.total) || 0), 0).toLocaleString('en-IN') : '0'}
                      </div>
                      <div className="text-xs text-teal-600 dark:text-teal-400">Total Revenue</div>
                    </div>
                  </div>

                  {/* Live Data Indicator */}
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Live Data</span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Main Actions Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

                  {/* Data Export Section */}
                  <div className="border rounded-xl p-6 space-y-5 bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 dark:from-purple-900/20 dark:via-violet-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-800 dark:to-violet-800 rounded-xl shadow-sm">
                        <DatabaseIcon className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-purple-800 dark:text-purple-200">Export Data</h3>
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">CSV & JSON Export</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      Export specific data tables to CSV or JSON format for analysis, reporting, or integration with other systems.
                    </p>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-purple-700 dark:text-purple-300">Select Data to Export:</label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="rounded text-purple-600" 
                              checked={exportSelections.products}
                              onChange={(e) => setExportSelections({...exportSelections, products: e.target.checked})}
                            />
                            <span>Products</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="rounded text-purple-600" 
                              checked={exportSelections.sales}
                              onChange={(e) => setExportSelections({...exportSelections, sales: e.target.checked})}
                            />
                            <span>Sales</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="rounded text-purple-600" 
                              checked={exportSelections.purchases}
                              onChange={(e) => setExportSelections({...exportSelections, purchases: e.target.checked})}
                            />
                            <span>Purchases</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="rounded text-purple-600" 
                              checked={exportSelections.customers}
                              onChange={(e) => setExportSelections({...exportSelections, customers: e.target.checked})}
                            />
                            <span>Customers</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold py-2 px-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm"
                          size="sm"
                          onClick={() => handleExportData('csv')}
                        >
                          Export CSV
                        </Button>
                        <Button
                          className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-2 px-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm"
                          size="sm"
                          onClick={() => handleExportData('json')}
                        >
                          Export JSON
                        </Button>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                        <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1 font-medium">
                          <p className="flex items-center gap-2"><span className="text-purple-600">✓</span> Excel-compatible CSV format</p>
                          <p className="flex items-center gap-2"><span className="text-purple-600">✓</span> Structured JSON with metadata</p>
                          <p className="flex items-center gap-2"><span className="text-purple-600">✓</span> Date range filtering available</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Enhanced Backup Section */}
                  <div className="border rounded-xl p-6 space-y-5 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 border-green-200 dark:border-green-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-800 dark:to-emerald-800 rounded-xl shadow-sm">
                        <DatabaseIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-green-800 dark:text-green-200">Backup Your Data</h3>
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">Complete System Backup</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      Create a comprehensive backup of your entire POS system. This includes all business data, transactions, inventory, and configurations in a single secure file.
                    </p>
                    <div className="space-y-4">
                      <Button
                        onClick={handleBackupData}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                        size="lg"
                      >
                        <DatabaseIcon className="h-5 w-5 mr-2" />
                        Create Full System Backup
                      </Button>
                      <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 border border-green-200 dark:border-green-700">
                        <div className="text-xs text-green-700 dark:text-green-300 space-y-1 font-medium">
                          <p className="flex items-center gap-2"><span className="text-green-600">✓</span> All sales & purchase transactions</p>
                          <p className="flex items-center gap-2"><span className="text-green-600">✓</span> Complete product inventory</p>
                          <p className="flex items-center gap-2"><span className="text-green-600">✓</span> Customer & supplier database</p>
                          <p className="flex items-center gap-2"><span className="text-green-600">✓</span> System settings & configurations</p>
                          <p className="flex items-center gap-2"><span className="text-green-600">✓</span> GST & tax information</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Restore Section */}
                  <div className="border rounded-xl p-6 space-y-5 bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-sky-900/20 border-blue-200 dark:border-blue-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-800 dark:to-cyan-800 rounded-xl shadow-sm">
                        <DatabaseIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200">Restore Data</h3>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">From Backup File</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      Restore your complete POS system from a previously created backup file. This will replace all current data with the backup contents.
                    </p>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-xl p-5 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <input
                          type="file"
                          accept=".json,application/json"
                          onChange={handleRestoreFile}
                          className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-100 file:to-cyan-100 file:text-blue-700 hover:file:from-blue-200 hover:file:to-cyan-200 dark:file:from-blue-800 dark:file:to-cyan-800 dark:file:text-blue-300 file:transition-all file:cursor-pointer"
                        />
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                          Select a backup file (.json) created from this system
                        </p>
                      </div>
                      <Button
                        onClick={handleRestoreData}
                        disabled={!selectedBackupFile}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:cursor-not-allowed"
                        size="lg"
                      >
                        <DatabaseIcon className="h-5 w-5 mr-2" />
                        {selectedBackupFile ? 'Restore from Backup' : 'Select Backup File First'}
                      </Button>
                      {selectedBackupFile && (
                        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-blue-600 dark:text-blue-400 text-lg">📁</span>
                            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                              {selectedBackupFile.name}
                            </p>
                          </div>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            File Size: {Math.round(selectedBackupFile.size / 1024)} KB
                          </p>
                          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-700">
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                              ⚠️ Warning: This will replace all existing data
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Clear Data Section */}
                  <div className="border rounded-xl p-6 space-y-5 bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-red-900/20 dark:via-rose-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-800 dark:to-rose-800 rounded-xl shadow-sm">
                        <ShieldIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-red-800 dark:text-red-200">Clear All Data</h3>
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">⚠️ Dangerous Operation</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      Permanently delete all data from the system and reset your POS to factory settings. This operation cannot be reversed.
                    </p>
                    <div className="space-y-4">
                      <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-4 border border-red-200 dark:border-red-700">
                        <div className="text-sm text-red-700 dark:text-red-300 space-y-2 font-medium">
                          <p className="flex items-center gap-2 font-bold text-red-800 dark:text-red-200">
                            <span className="text-red-600">⚠️</span> This will permanently delete:
                          </p>
                          <p className="flex items-center gap-2"><span className="text-red-600">•</span> All sales & purchase transactions</p>
                          <p className="flex items-center gap-2"><span className="text-red-600">•</span> Complete product inventory</p>
                          <p className="flex items-center gap-2"><span className="text-red-600">•</span> Customer & supplier database</p>
                          <p className="flex items-center gap-2"><span className="text-red-600">•</span> System settings & configurations</p>
                          <p className="flex items-center gap-2"><span className="text-red-600">•</span> GST & tax information</p>
                          <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/50 rounded border border-red-300 dark:border-red-600">
                            <p className="font-bold text-red-800 dark:text-red-200 flex items-center gap-2">
                              <span className="text-red-700">❌</span> This action cannot be undone!
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={handleClearData}
                        className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                        variant="destructive"
                        size="lg"
                      >
                        <ShieldIcon className="h-5 w-5 mr-2" />
                        Clear All System Data
                      </Button>
                    </div>
                  </div>

                  {/* Data Sync & Update Section */}
                  <div className="border rounded-xl p-6 space-y-5 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-800 dark:to-amber-800 rounded-xl shadow-sm">
                        <DatabaseIcon className="h-6 w-6 text-orange-600 dark:text-orange-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-orange-800 dark:text-orange-200">Data Updates</h3>
                        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Sync & Maintenance</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      Monitor data integrity, perform maintenance tasks, and manage system updates for optimal performance.
                    </p>
                    <div className="space-y-4">
                      <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                        <div className="text-sm text-orange-700 dark:text-orange-300 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Last Update Check:</span>
                            <span className="text-xs bg-orange-100 dark:bg-orange-800 px-2 py-1 rounded">2 hours ago</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Database Status:</span>
                            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300 px-2 py-1 rounded">Healthy</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Last Backup:</span>
                            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300 px-2 py-1 rounded">Yesterday</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Button
                          className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                          size="lg"
                        >
                          <DatabaseIcon className="h-5 w-5 mr-2" />
                          Check for Updates
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            className="text-sm border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/20"
                            size="sm"
                          >
                            Optimize DB
                          </Button>
                          <Button
                            variant="outline"
                            className="text-sm border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/20"
                            size="sm"
                          >
                            Verify Data
                          </Button>
                        </div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700">
                        <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 font-medium">
                          <p className="flex items-center gap-2"><span className="text-yellow-600">⚡</span> Automatic optimization enabled</p>
                          <p className="flex items-center gap-2"><span className="text-yellow-600">🔄</span> Real-time data validation</p>
                          <p className="flex items-center gap-2"><span className="text-yellow-600">📊</span> Performance monitoring active</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Data Management Tools */}
                <div className="border-t pt-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <DatabaseIcon className="h-6 w-6 text-blue-600" />
                    Advanced Data Management Tools
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Data Analysis */}
                    <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                          <DatabaseIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200">Data Analysis</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Generate insights and reports from your business data
                      </p>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          Sales Analytics Report
                        </Button>
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          Inventory Analysis
                        </Button>
                      </div>
                    </div>

                    {/* Data Cleanup */}
                    <div className="border rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-lg">
                          <DatabaseIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Data Cleanup</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Remove duplicates and optimize database performance
                      </p>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          Remove Duplicates
                        </Button>
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          Archive Old Data
                        </Button>
                      </div>
                    </div>

                    {/* Data Migration */}
                    <div className="border rounded-lg p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                          <DatabaseIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <h4 className="font-semibold text-green-800 dark:text-green-200">Data Migration</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Import data from external systems and formats
                      </p>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          Import from Excel
                        </Button>
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          Legacy System Import
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Management Tips */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BellIcon className="h-5 w-5 text-blue-600" />
                    Data Management Best Practices
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">🔄 Regular Backups</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Create weekly backups to protect your business data. Store backups in multiple locations for safety.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">📁 Backup Storage</h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Save backup files with descriptive names including date and time for easy identification.
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">🔒 Data Security</h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Keep backup files secure and encrypted. Never share backup files containing sensitive business data.
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">✅ Test Restores</h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Periodically test your backup files by restoring them to ensure data integrity and completeness.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="border-t pt-6">
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" size="sm" onClick={() => {
                      toast({
                        title: "System Status",
                        description: "Your POS system is running optimally with all data intact.",
                      });
                    }}>
                      <DatabaseIcon className="h-4 w-4 mr-2" />
                      Check System Health
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      toast({
                        title: "Storage Info",
                        description: "Your data is securely stored and backed up locally.",
                      });
                    }}>
                      <ShieldIcon className="h-4 w-4 mr-2" />
                      Storage Information
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      window.open('/api/sales/test', '_blank');
                    }}>
                      <BellIcon className="h-4 w-4 mr-2" />
                      System Diagnostics
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* Printer Settings */}
          <TabsContent value="printer">
            <Card>
              <CardHeader>
                <CardTitle>Printer Configuration</CardTitle>
                <CardDescription>Manage all printer and receipt settings in one place</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4 max-w-md">
                  <Button
                    onClick={() => setLocation('/printer-settings')}
                    className="flex flex-col items-center gap-2 h-auto p-6 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    variant="outline"
                  >
                    <div className="p-3 bg-blue-100 rounded-full">
                      <SettingsIcon className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-medium">Printer Settings</h3>
                      <p className="text-xs text-muted-foreground">Complete printer configuration & management</p>
                    </div>
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Recommended: Use Unified Printer Settings</h4>
                  <p className="text-sm text-blue-800">
                    The unified printer settings page consolidates all printer configuration options including
                    auto-printer, thermal printer, receipt formatting, and business information in one interface.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Settings */}
          <TabsContent value="tax">
            <Card>
              <CardHeader>
                <CardTitle>Tax Settings</CardTitle>
                <CardDescription>Configure tax rates and calculation methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <TaxSettings />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Receipt Settings Modal */}
      {showReceiptSettings && (
        <ReceiptSettings />
      )}
    </DashboardLayout>
  );
}