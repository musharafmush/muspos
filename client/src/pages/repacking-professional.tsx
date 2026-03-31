import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { apiRequest } from "@/lib/queryClient";
import {
  PackageIcon,
  BarChart3Icon,
  DollarSignIcon,
  ClipboardIcon,
  SaveIcon,
  HelpCircleIcon,
  PrinterIcon,
  X,
  Search,
  Mic,
  ShoppingCart,
  Warehouse,
} from "lucide-react";

// Types
type Product = {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  cost?: number;
  mrp?: number;
  wholesalePrice?: number;
  weight?: number;
  weightUnit?: string;
  stockQuantity: number;
  active: boolean;
};

const repackingFormSchema = z.object({
  issueDate: z.string().min(1, "Issue date is required"),
  issueNo: z.string().optional(),
  repackNo: z.string().optional(),
  bulkProductId: z.number().min(1, "Please select a bulk product"),
  repackQuantity: z.number().min(1, "Number of packs must be at least 1"),
  unitWeight: z.number().min(0.01, "Weight per pack must be at least 0.01"),
  weightUnit: z.enum(["g", "kg"]),
  costPrice: z.number().min(0, "Cost price must be non-negative"),
  sellingPrice: z.number().min(0, "Selling price must be non-negative"),
  wholesalePrice: z.number().min(0, "Wholesale price must be non-negative").optional(),
  mrp: z.number().min(0, "MRP must be non-negative"),
  newProductName: z.string().min(1, "Product name is required"),
  newProductSku: z.string().min(1, "SKU is required"),
  newProductBarcode: z.string().optional(),
});

type RepackingFormValues = z.infer<typeof repackingFormSchema>;

export default function RepackingProfessional() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Parse integration data from localStorage
  const [integrationData, setIntegrationData] = useState<any>(null);

  // Load integration data from localStorage on component mount
  useEffect(() => {
    console.log('🔄 Component mounted, checking for integration data...');
    const storedData = localStorage.getItem('repackingIntegrationData');
    console.log('🔍 Raw localStorage data:', storedData);

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log('✅ Parsed integration data:', parsedData);

        // Wrap the product data in the expected structure
        const integrationDataStructure = {
          bulkProduct: parsedData,
          newProduct: {}
        };

        console.log('🔍 Bulk product data:', integrationDataStructure.bulkProduct);
        setIntegrationData(integrationDataStructure);

        // Don't clear immediately, wait for form population
        setTimeout(() => {
          localStorage.removeItem('repackingIntegrationData');
          console.log('🗑️ Integration data cleared from localStorage after form population');
        }, 1000);

      } catch (error) {
        console.error('❌ Error parsing integration data:', error);
        localStorage.removeItem('repackingIntegrationData');
      }
    } else {
      console.log('❌ No integration data found in localStorage');
    }
  }, []);

  // Bulk product search functionality
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.product-search-container')) {
        setIsProductSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const data = urlParams.get('data');

    if (data) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(data));
        setIntegrationData(parsedData);
      } catch (error) {
        console.error('Failed to parse integration data:', error);
      }
    }
  }, []);

  // Generate date options for the last 30 days
  const dateOptions = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  });

  const form = useForm<RepackingFormValues>({
    resolver: zodResolver(repackingFormSchema),
    defaultValues: {
      issueDate: new Date().toISOString().split('T')[0],
      issueNo: "",
      repackNo: "",
      bulkProductId: 0,
      repackQuantity: 1,
      unitWeight: 250,
      weightUnit: "g",
      costPrice: 0,
      sellingPrice: 0,
      wholesalePrice: 0,
      mrp: 0,
      newProductName: "",
      newProductSku: "",
      newProductBarcode: "",
    },
  });

  // Populate form when integration data is loaded
  useEffect(() => {
    if (integrationData?.bulkProduct) {
      const bulkProduct = integrationData.bulkProduct;
      console.log('🔄 Populating form with integration data:', bulkProduct);
      console.log('📊 Data types debug:', {
        costPrice: typeof bulkProduct.costPrice,
        sellingPrice: typeof bulkProduct.sellingPrice,
        mrp: typeof bulkProduct.mrp,
        values: {
          cost: bulkProduct.costPrice,
          selling: bulkProduct.sellingPrice,
          mrp: bulkProduct.mrp
        }
      });

      // Convert to numbers and update form values with integration data
      const costPriceNum = Number(bulkProduct.costPrice) || 0;
      const sellingPriceNum = Number(bulkProduct.sellingPrice) || 0;
      const wholesalePriceNum = Number(bulkProduct.wholesalePrice) || 0;
      const mrpNum = Number(bulkProduct.mrp) || 0;

      console.log('🔢 Converted numbers:', {
        costPriceNum,
        sellingPriceNum,
        wholesalePriceNum,
        mrpNum
      });

      // Set the bulk product ID first
      if (bulkProduct.id) {
        form.setValue('bulkProductId', bulkProduct.id);
        console.log('🆔 Set bulkProductId:', bulkProduct.id);
      }

      // Set pricing values as numbers (form expects numeric values)
      form.setValue('costPrice', costPriceNum);
      form.setValue('sellingPrice', sellingPriceNum);
      form.setValue('wholesalePrice', wholesalePriceNum);
      form.setValue('mrp', mrpNum);

      // Set product details
      form.setValue('newProductName', integrationData.newProduct?.itemName || '');
      form.setValue('newProductSku', integrationData.newProduct?.itemCode || '');

      // Force form re-render and ensure values are persisted
      form.trigger(['costPrice', 'sellingPrice', 'wholesalePrice', 'mrp']);

      // Force component re-render after setting values
      setTimeout(() => {
        form.trigger(); // Trigger all fields
        console.log('🔄 Final form values after integration:', {
          costPrice: form.getValues('costPrice'),
          sellingPrice: form.getValues('sellingPrice'),
          wholesalePrice: form.getValues('wholesalePrice'),
          mrp: form.getValues('mrp'),
          bulkProductId: form.getValues('bulkProductId')
        });
      }, 100);
    }
  }, [integrationData, form]);

  // Fetch products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Filter bulk products with search functionality
  const bulkProducts = products.filter((product: Product) =>
    product.stockQuantity > 0 &&
    product.active
  );

  // Advanced product search with multiple criteria
  const filteredBulkProducts = bulkProducts.filter((product: Product) => {
    if (!productSearchTerm) return true;

    const searchLower = productSearchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.sku.toLowerCase().includes(searchLower) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchLower)) ||
      product.price.toString().includes(searchLower) ||
      product.stockQuantity.toString().includes(searchLower)
    );
  });

  // Voice search functionality
  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        toast({
          title: "Voice Search Active",
          description: "Speak the product name you're looking for...",
        });
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setProductSearchTerm(transcript);
        setIsListening(false);

        toast({
          title: "Voice Search Complete",
          description: `Searching for: ${transcript}`,
        });
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: "Voice Search Error",
          description: "Please try again or use text search",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      toast({
        title: "Voice Search Unavailable",
        description: "Please use text search instead",
        variant: "destructive",
      });
    }
  };

  // Auto-populate form when integration data is available
  useEffect(() => {
    console.log('🔄 Auto-populate effect triggered:', {
      hasIntegrationData: !!integrationData,
      productsCount: products?.length || 0
    });

    if (integrationData && products.length > 0) {
      const bulkProduct = integrationData.bulkProduct;
      const newProduct = integrationData.newProduct;
      const isEditMode = bulkProduct.isEditMode;

      console.log('💰 Processing integration data:', {
        isEditMode,
        cost: bulkProduct.cost,
        price: bulkProduct.price,
        mrp: bulkProduct.mrp,
        fullBulkProduct: bulkProduct
      });

      if (isEditMode) {
        // Edit mode - populate form with existing product data
        console.log('✏️ Edit mode detected - populating form with existing product data');

        form.setValue("newProductName", bulkProduct.name);
        form.setValue("newProductSku", bulkProduct.sku);
        form.setValue("costPrice", Number(bulkProduct.cost || bulkProduct.price) || 0);
        form.setValue("sellingPrice", Number(bulkProduct.price) || 0);
        form.setValue("wholesalePrice", Number(bulkProduct.wholesalePrice) || 0);
        form.setValue("mrp", Number(bulkProduct.mrp) || 0);

        if (bulkProduct.weight && bulkProduct.weightUnit) {
          form.setValue("unitWeight", Number(bulkProduct.weight) || 0);
          form.setValue("weightUnit", bulkProduct.weightUnit as "g" | "kg");
        }

        toast({
          title: "Edit Mode Active",
          description: `Editing product: ${bulkProduct.name}`,
        });
      } else {
        // Repack mode - find the bulk product for repacking
        const foundProduct = products.find((p: Product) => p.id === bulkProduct.id);

        if (foundProduct) {
          console.log('✅ Found product for repacking, setting form values...');
          // Pre-fill form with integration data
          form.setValue("bulkProductId", foundProduct.id);
          form.setValue("costPrice", Number(bulkProduct.cost || bulkProduct.price) || 0);
          form.setValue("sellingPrice", Number(bulkProduct.price) || 0);
          form.setValue("wholesalePrice", Number(bulkProduct.wholesalePrice) || 0);
          form.setValue("mrp", Number(bulkProduct.mrp) || 0);

          console.log('💰 Form values set to:', {
            costPrice: Number(bulkProduct.cost || bulkProduct.price) || 0,
            sellingPrice: Number(bulkProduct.price) || 0,
            wholesalePrice: Number(bulkProduct.wholesalePrice) || 0,
            mrp: Number(bulkProduct.mrp) || 0
          });

          if (newProduct.itemName) {
            form.setValue("newProductName", newProduct.itemName);
          }
          if (newProduct.itemCode) {
            form.setValue("newProductSku", newProduct.itemCode);
          }

          // Show success toast
          toast({
            title: "Integration Successful",
            description: `Pre-filled repacking details for ${bulkProduct.name}`,
          });
        } else {
          console.log('❌ Product not found in loaded products list');
        }
      }
    }
  }, [integrationData, products, form, toast]);

  // Auto-generate child product details when bulk product is selected
  useEffect(() => {
    const bulkProductId = form.watch("bulkProductId");
    const unitWeight = form.watch("unitWeight");
    const weightUnit = form.watch("weightUnit");

    if (bulkProductId && unitWeight && weightUnit && products.length > 0) {
      const selectedBulkProduct = products.find((p: Product) => p.id === bulkProductId);

      if (selectedBulkProduct) {
        // Generate child product name based on parent + weight
        const childProductName = `${selectedBulkProduct.name} (${unitWeight}${weightUnit} Pack)`;

        // Generate child SKU based on parent SKU + repack suffix (with timestamp to prevent collisions)
        const timestamp = Date.now().toString().slice(-4);
        const childSku = `${selectedBulkProduct.sku}_RP_${unitWeight}${weightUnit}_${timestamp}`;

        // Generate child barcode based on parent barcode + weight info
        const childBarcode = selectedBulkProduct.barcode ?
          `${selectedBulkProduct.barcode}${unitWeight}${weightUnit}${timestamp}` :
          `${selectedBulkProduct.sku}${unitWeight}${weightUnit}${timestamp}`;

        // Auto-populate child product details
        form.setValue("newProductName", childProductName);
        form.setValue("newProductSku", childSku);
        form.setValue("newProductBarcode", childBarcode);

        // Auto-populate pricing based on weight ratio
        const bulkWeight = Number(selectedBulkProduct.weight) || 1;
        const bulkWeightUnit = selectedBulkProduct.weightUnit || "kg";

        // Convert to same unit for calculation
        let bulkWeightInGrams = bulkWeight;
        if (bulkWeightUnit === "kg") {
          bulkWeightInGrams = bulkWeight * 1000;
        }

        let childWeightInGrams = unitWeight;
        if (weightUnit === "kg") {
          childWeightInGrams = unitWeight * 1000;
        }

        // Calculate proportional pricing
        const weightRatio = childWeightInGrams / bulkWeightInGrams;

        // Use price as fallback for cost if cost is missing (common for retail products)
        const bulkCost = Number(selectedBulkProduct.cost) || Number(selectedBulkProduct.price) || 0;

        const childCostPrice = bulkCost * weightRatio;
        const childSellingPrice = (Number(selectedBulkProduct.price) || 0) * weightRatio;
        const childWholesalePrice = (Number(selectedBulkProduct.wholesalePrice) || 0) * weightRatio;
        const childMRP = (Number(selectedBulkProduct.mrp) || 0) * weightRatio;

        // Update form values - we allow manual override if user explicitly changes them later
        form.setValue("costPrice", Math.round(childCostPrice * 100) / 100);
        form.setValue("sellingPrice", Math.round(childSellingPrice * 100) / 100);
        form.setValue("wholesalePrice", Math.round(childWholesalePrice * 100) / 100);
        form.setValue("mrp", Math.round(childMRP * 100) / 100);
      }
    }
  }, [form.watch("bulkProductId"), form.watch("unitWeight"), form.watch("weightUnit"), form.watch("repackQuantity"), products, form]);

  // Calculate values for conversion summary
  const watchedBulkProductId = form.watch("bulkProductId");
  const watchedRepackQuantity = form.watch("repackQuantity");
  const watchedUnitWeight = form.watch("unitWeight");
  const watchedWeightUnit = form.watch("weightUnit");

  const selectedProduct = products.find((p: Product) => p.id === watchedBulkProductId);
  const repackQuantity = Number(watchedRepackQuantity) || 0;
  const unitWeight = Number(watchedUnitWeight) || 0;
  const weightUnit = watchedWeightUnit || "g";

  const totalRepackWeightInGrams = weightUnit === "kg" ? unitWeight * repackQuantity * 1000 : unitWeight * repackQuantity;
  const bulkWeight = selectedProduct ? (Number(selectedProduct.weight) || 1) : 1;
  const bulkWeightUnit = selectedProduct?.weightUnit || "kg";
  const bulkWeightInGrams = bulkWeightUnit === "kg" ? bulkWeight * 1000 : bulkWeight;
  const bulkUnitsNeededRaw = totalRepackWeightInGrams / bulkWeightInGrams;
  // If the product is "weighable" or we want fractional reduction, use raw. Otherwise use ceil.
  // We'll use raw to support the user's request for partial stock (e.g. 50kg -> 20kg).
  const bulkUnitsNeeded = Math.round(bulkUnitsNeededRaw * 1000) / 1000;
  const currentStock = Number(selectedProduct?.stockQuantity) || 0;

  // Check if we're in edit mode
  const isEditMode = integrationData?.bulkProduct?.isEditMode || false;
  const editProductId = integrationData?.bulkProduct?.id;

  const repackingMutation = useMutation({
    mutationFn: async (data: RepackingFormValues) => {
      if (isEditMode && editProductId) {
        // Update existing product
        const response = await fetch(`/api/products/${editProductId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.newProductName,
            sku: data.newProductSku,
            barcode: data.newProductBarcode,
            cost: data.costPrice,
            price: data.sellingPrice,
            wholesalePrice: data.wholesalePrice,
            mrp: data.mrp,
            weight: data.unitWeight,
            weightUnit: data.weightUnit,
            stockQuantity: data.repackQuantity,
            description: `Updated product: ${data.newProductName}`,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
      } else {
        // Create new repack product
        const response = await fetch("/api/repacking", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            totalRepackWeight: totalRepackWeightInGrams,
            bulkUnitsNeeded,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
      }
    },
    onSuccess: () => {
      if (isEditMode) {
        toast({
          title: "Product Updated",
          description: "Product has been updated successfully"
        });
      } else {
        toast({
          title: "Repack Created",
          description: "Product repack has been created successfully"
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setLocation("/repacking-dashboard-professional");
    },
    onError: (error) => {
      toast({
        title: isEditMode ? "Product Update Failed" : "Repack Creation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RepackingFormValues) => {
    repackingMutation.mutate(data);
  };

  // Keyboard shortcut listener for professional workflow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F6') {
        e.preventDefault();
        form.handleSubmit(onSubmit)();
      }
      if (e.key === 'F12') {
        e.preventDefault();
        setLocation("/");
      }
      if (e.key === 'F11') { // Toggle full screen for professional mode
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [form, onSubmit]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Modern Header with Actions */}
        <div className="bg-white border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <PackageIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {isEditMode ? "Edit Product Detail" : "Repacking Entry"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setLocation("/")}
              >
                Close (F12)
              </Button>
              <Button
                type="button"
                onClick={() => form.handleSubmit(onSubmit)()}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                {isEditMode ? "Update" : "Save"} (F6)
              </Button>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6">
            {/* Main Form Content - Redesigned UI */}
            <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Configuration */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Step 1: Reference & Source Selection */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
                    <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-xs font-bold">1</div>
                      Source & Reference Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                      <FormField
                        control={form.control}
                        name="issueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Issue Date</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-gray-50/50 border-gray-100 h-10 transition-all hover:border-blue-200">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {dateOptions.map((date) => (
                                  <SelectItem key={date} value={date}>{date}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="issueNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Issue Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="REF-001" className="bg-gray-50/50 border-gray-100 h-10 transition-all hover:border-blue-200" />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="repackNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Repack Code</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="RP-001" className="bg-gray-50/50 border-gray-100 h-10 transition-all hover:border-blue-200" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="bulkProductId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Select Source Bulk Product</FormLabel>
                          <div className="relative product-search-container mt-1">
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                  placeholder="Start typing name, barcode or SKU..."
                                  value={productSearchTerm}
                                  onChange={(e) => setProductSearchTerm(e.target.value)}
                                  className="pl-10 bg-gray-50/50 border-gray-100 h-11 rounded-lg focus-visible:ring-blue-500"
                                  onFocus={() => setIsProductSearchOpen(true)}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={startVoiceSearch}
                                className={`h-11 w-11 p-0 rounded-lg transition-all ${isListening ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'hover:bg-blue-50'}`}
                              >
                                <Mic className="h-5 w-5" />
                              </Button>
                            </div>

                            {(isProductSearchOpen || productSearchTerm) && (
                              <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden">
                                <div className="max-h-64 overflow-y-auto">
                                  {filteredBulkProducts.map((p) => (
                                    <div
                                      key={p.id}
                                      className="p-4 hover:bg-blue-50/50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                                      onClick={() => {
                                        field.onChange(p.id);
                                        setIsProductSearchOpen(false);
                                        setProductSearchTerm("");
                                      }}
                                    >
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-gray-900 group-hover:text-blue-700">{p.name}</span>
                                        <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 border-none">STOCK: {p.stockQuantity}</Badge>
                                      </div>
                                      <div className="text-[10px] text-gray-500 font-mono">SKU: {p.sku} • PRICE: ₹{p.price}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {field.value && selectedProduct && (
                              <div className="mt-4 p-4 bg-blue-50/30 border border-blue-100/50 rounded-xl flex items-center justify-between group transition-all hover:bg-blue-50/50">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-blue-600 rounded-lg text-white flex items-center justify-center font-bold shadow-sm">
                                    {selectedProduct.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-blue-900">{selectedProduct.name}</div>
                                    <div className="text-[10px] text-blue-600 font-medium uppercase">SKU: {selectedProduct.sku} • Stock: {selectedProduct.stockQuantity}</div>
                                  </div>
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={() => field.onChange(0)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 font-bold text-xs px-3">
                                  Change Source
                                </Button>
                              </div>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Step 2: Pack Configuration & Analysis */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
                    <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-xs font-bold">2</div>
                      Pack Configuration & Impact
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="repackQuantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Output Quantity (Number of Packs)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 1)} className="bg-gray-50/50 border-gray-100 h-11 text-lg font-bold text-blue-900 focus-visible:ring-blue-500" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="unitWeight"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Weight Per Pack</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="bg-gray-50/50 border-gray-100 h-11 font-bold" />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="weightUnit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Unit</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-gray-50/50 border-gray-100 h-11 transition-all">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="g">Grams (g)</SelectItem>
                                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-110"></div>
                        
                        <div className="flex items-center gap-2 mb-5 text-gray-900 font-bold text-xs tracking-tight uppercase">
                          <BarChart3Icon className="w-4 h-4 text-blue-600" />
                          Stock Impact Summary
                        </div>
                        
                        <div className="space-y-4 relative z-10">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Weight:</span>
                            <span className="text-xl font-black text-gray-900">{(totalRepackWeightInGrams / 1000).toFixed(2)} KG</span>
                          </div>
                          <div className="h-px bg-gray-200/50"></div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Source Deduction:</span>
                            <span className="text-sm font-bold text-blue-600 uppercase">{bulkUnitsNeeded} UNITS</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Remaining Stock:</span>
                            <span className="text-sm font-bold text-gray-900 uppercase">{(currentStock - bulkUnitsNeeded).toFixed(2)} UNITS</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Pricing Configuration */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
                    <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-xs font-bold">3</div>
                      Pricing & Profitability
                    </h3>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      {['costPrice', 'sellingPrice', 'wholesalePrice', 'mrp'].map((key) => (
                        <FormField
                          key={key}
                          control={form.control}
                          name={key as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{key === 'mrp' ? 'Official MRP' : key.replace('Price', ' Price')}</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 font-bold text-xs">₹</span>
                                  <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="pl-7 bg-gray-50/50 border-gray-100 h-10 font-mono text-sm font-bold focus-visible:ring-green-500" />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-center p-6 bg-green-50/50 border border-green-100/50 rounded-2xl">
                      <div className="text-center group">
                        <div className="text-[10px] uppercase font-black text-green-600 tracking-[0.2em] mb-1">Target Margin</div>
                        <div className="text-4xl font-black text-green-700 tracking-tighter transition-all group-hover:scale-105">
                          {form.watch("costPrice") && form.watch("sellingPrice") ? 
                            (((Number(form.watch("sellingPrice")) || 0) - (Number(form.watch("costPrice")) || 0)) / (Number(form.watch("costPrice")) || 1) * 100).toFixed(1) + '%' 
                            : '0.0%'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Automated Info & Sidebar */}
                <div className="space-y-6">
                  {/* Generated Item Details Card */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden sticky top-24">
                    <div className="bg-gray-900 px-6 py-4">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <ClipboardIcon className="w-4 h-4 text-blue-500" />
                          Output Overview
                      </h3>
                    </div>
                    
                    <div className="p-6 space-y-5">
                      <FormField
                        control={form.control}
                        name="newProductName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Child Product Label</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-gray-50 border-gray-100 text-sm font-bold text-gray-900" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-4 pt-2">
                        <FormField
                          control={form.control}
                          name="newProductSku"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Identifier SKU</FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-gray-50 border-gray-100 font-mono text-xs font-medium" />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="newProductBarcode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dynamic Barcode</FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-gray-50 border-gray-100 font-mono text-xs font-medium" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="mt-4 pt-6 border-t border-gray-50">
                        <div className="p-4 bg-blue-600 rounded-xl text-center text-white shadow-md shadow-blue-200">
                          <PackageIcon className="w-8 h-8 opacity-50 mx-auto mb-2" />
                          <div className="text-xs font-bold leading-relaxed mb-1 uppercase tracking-tight">System Notice</div>
                          <p className="text-[10px] opacity-80 leading-relaxed font-medium">
                            Saving will create a new SKU with {watchedRepackQuantity || 0} packs and deduct stock from source.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}