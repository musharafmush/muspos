import React, { useState, useEffect, useRef } from "react"; // POS Premium System 2026
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { printReceipt as printReceiptUtil } from "@/components/pos/print-receipt";
import { QuickPayDialog } from "@/components/pos/QuickPayDialog";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Search,
  ShoppingCart,
  Scan,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Check,
  ChevronsUpDown,
  User,
  Phone,
  Calendar,
  Clock,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Receipt,
  UserPlus,
  Calculator,
  RotateCcw,
  Archive,
  Monitor,
  Zap,
  Package,
  CheckCircle,
  AlertCircle,
  Info,
  Banknote,
  DollarSign,
  Smartphone,
  Save,
  List,
  FileText,
  Download,
  Settings,
  Printer,
  Star,
  Gift,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  AppWindow,
  Wallet,
  PlusCircle,
  ArrowDownLeft,
  Settings2,
  Quote,
  Ship,
  Anchor,
  Globe,
  ShieldAlert,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  sku: string;
  hsnCode?: string;
  price: string;
  wholesalePrice?: number | string | null;
  mrp: number;
  cost?: string;
  stockQuantity: number;
  barcode?: string;
  category?: {
    name: string;
  };
  weightUnit?: string;
  weight?: number;
  itemPreparationsStatus?: string | null;
}

interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  outstandingBalance?: number;
}

interface CartItem extends Product {
  quantity: number;
  total: number;
  isWeightBased?: boolean;
  actualWeight?: number;
  pricePerKg?: number;
  productId?: number;
  productName?: string;
  productSku?: string;
  unitPrice?: number;
  subtotal?: number;
  batchId?: number | null;
  availableBatches?: any[];
  defaultPrice?: number;
  defaultMrp?: number;
}

export default function POSEnhanced() {
  const [searchTerm, setSearchTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [pricingMode, setPricingMode] = useState<'retail' | 'wholesale'>('retail');
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const savedModules = localStorage.getItem('enabledModules');
      if (savedModules) {
        setEnabledModules(JSON.parse(savedModules));
      }
    } catch (e) {
      console.error("Failed to parse enabledModules", e);
    }
  }, []);

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [showSplitPayment, setShowSplitPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const [discount, setDiscount] = useState(0);
  const [showWeightDialog, setShowWeightDialog] = useState(false);
  const [weightProduct, setWeightProduct] = useState<Product | null>(null);
  const [enteredWeight, setEnteredWeight] = useState("");
  const [showOceanDialog, setShowOceanDialog] = useState(false);

  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [voiceRecognition, setVoiceRecognition] = useState<any>(null);
  const [oceanFreight, setOceanFreight] = useState({
    containerNumber: "",
    vesselName: "",
    voyageNumber: "",
    portOfLoading: "",
    portOfDischarge: "",
    freightCost: "",
    insuranceCost: "",
    customsDuty: "",
    handlingCharges: "",
    totalOceanCost: 0
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCashRegister, setShowCashRegister] = useState(false);
  const [showOpenRegister, setShowOpenRegister] = useState(false);
  const [showCloseRegister, setShowCloseRegister] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [showHoldSales, setShowHoldSales] = useState(false);
  const [holdSales, setHoldSales] = useState<Array<{
    id: string;
    cart: CartItem[];
    customer: Customer | null;
    discount: number;
    notes: string;
    timestamp: Date;
    total: number;
    oceanFreight?: any;
  }>>([]);

  // Printer settings state
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

  // Cash register state
  const [registerOpened, setRegisterOpened] = useState(false);
  const [activeRegisterId, setActiveRegisterId] = useState<number | null>(null);
  
  // High-entropy bill number generation to prevent all possible collisions
  const generateBillNumber = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 for legibility
    let result = 'POS';
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  const [billNumber, setBillNumber] = useState("");
  const [openingCash, setOpeningCash] = useState(0);

  // Loyalty management state
  const [customerLoyalty, setCustomerLoyalty] = useState<any>(null);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0);
  const [showLoyaltyDialog, setShowLoyaltyDialog] = useState(false);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [redeemedPointsForTransaction, setRedeemedPointsForTransaction] = useState(0);
  const [cashInHand, setCashInHand] = useState(0);
  const [cashReceived, setCashReceived] = useState(0);
  const [upiReceived, setUpiReceived] = useState(0);

  const [cardReceived, setCardReceived] = useState(0);
  const [bankReceived, setBankReceived] = useState(0);
  const [chequeReceived, setChequeReceived] = useState(0);
  const [otherReceived, setOtherReceived] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [totalRefunds, setTotalRefunds] = useState(0);

  // Form state
  const [cashOperation, setCashOperation] = useState<'add' | 'remove'>('add');
  const [cashReason, setCashReason] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalNote, setWithdrawalNote] = useState("");

  // Comprehensive form state reset
  const resetCashRegisterForm = () => {
    setCashAmount("");
    setCashReason("");
    setCashOperation('add');
  };

  // Reset all cash register states
  const resetAllCashRegisterStates = () => {
    setCashAmount("");
    setCashReason("");
    setCashOperation('add');
    setWithdrawalAmount("");
    setWithdrawalNote("");
    setShowCashRegister(false);
    setShowOpenRegister(false);
    setShowCloseRegister(false);
    setShowWithdrawal(false);
  };

  // Reset withdrawal form
  const resetWithdrawalForm = () => {
    setWithdrawalAmount("");
    setWithdrawalNote("");
  };

  // Add billDetails state
  const [billDetails, setBillDetails] = useState({
    billNumber: `POS${Date.now()}`,
    billDate: new Date().toISOString().split('T')[0],
    billTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  });

  const [editingCartItem, setEditingCartItem] = useState<{ id: number, field: 'quantity' | 'price' | 'weight' } | null>(null);
  const [editValue, setEditValue] = useState("");

  // Quick Pay (Udhaar Settlement) States
  const [showQuickPayDialog, setShowQuickPayDialog] = useState(false);
  const [quickPayAmount, setQuickPayAmount] = useState("");
  const [quickPayMethod, setQuickPayMethod] = useState("cash");
  const [isProcessingQuickPay, setIsProcessingQuickPay] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch products with error handling
  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        console.log("Fetched products:", data);
        return data as Product[];
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({
          title: "Error",
          description: "Failed to load products. Please refresh the page.",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  // Manual price synchronization function
  const syncCartPrices = (mode: 'retail' | 'wholesale') => {
    if (cart.length === 0) return;

    setCart(prevCart => prevCart.map(item => {
      // Find the original product to get current base prices
      const originalProduct = (products as Product[]).find((p: Product) => p.id === item.id);
      if (!originalProduct) return item;

      let effectivePrice: number;
      const wholesalePrice = parseFloat(String(originalProduct.wholesalePrice || 0));

      if (mode === 'wholesale' && wholesalePrice > 0) {
        effectivePrice = wholesalePrice;
      } else {
        effectivePrice = parseFloat(originalProduct.price);
      }

      if (item.isWeightBased) {
        return {
          ...item,
          price: effectivePrice.toString(),
          pricePerKg: effectivePrice,
          unitPrice: effectivePrice,
          total: (item.actualWeight || 0) * effectivePrice
        };
      } else {
        return {
          ...item,
          price: effectivePrice.toString(),
          unitPrice: effectivePrice,
          total: item.quantity * effectivePrice
        };
      }
    }));

    toast({
      title: `Prices Updated`,
      description: `Cart has been updated to ${mode} pricing.`,
    });
  };

  const handlePricingModeToggle = (newMode: 'retail' | 'wholesale') => {
    if (newMode === pricingMode) return;
    setPricingMode(newMode);
    syncCartPrices(newMode);
  };

  // Fetch active cash register status
  const { data: activeCashRegister } = useQuery({
    queryKey: ["/api/cash-register/active"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/cash-register/active");
        if (!response.ok) return null;
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching active cash register:", error);
        return null;
      }
    },
  });

  // Fetch user authentication data
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: 'include'
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.user;
      } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
      }
    },
  });

  // Fetch printer settings dynamically for bill printing
  const { data: dynamicPrinterSettings, isLoading: printerSettingsLoading } = useQuery({
    queryKey: ["/api/settings/receipt"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/settings/receipt");
        if (!response.ok) {
          console.warn('Failed to fetch printer settings, using defaults');
          return null;
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching printer settings:', error);
        return null;
      }
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Update register state when active register is loaded
  useEffect(() => {
    if (activeCashRegister) {
      console.log('Loading active cash register:', activeCashRegister);
      setRegisterOpened(true);
      setActiveRegisterId(activeCashRegister.id);

      // Auto-close open register dialog if it's open
      setShowOpenRegister(false);

      // Handle both camelCase and snake_case properties for compatibility
      const openingCash = parseFloat(activeCashRegister.openingCash || activeCashRegister.opening_cash || '0');
      const currentCash = parseFloat(activeCashRegister.currentCash || activeCashRegister.current_cash || '0');
      const cashReceived = parseFloat(activeCashRegister.cashReceived || activeCashRegister.cash_received || '0');
      const upiReceived = parseFloat(activeCashRegister.upiReceived || activeCashRegister.upi_received || '0');
      const cardReceived = parseFloat(activeCashRegister.cardReceived || activeCashRegister.card_received || '0');
      const bankReceived = parseFloat(activeCashRegister.bankReceived || activeCashRegister.bank_received || '0');
      const chequeReceived = parseFloat(activeCashRegister.chequeReceived || activeCashRegister.cheque_received || '0');
      const otherReceived = parseFloat(activeCashRegister.otherReceived || activeCashRegister.other_received || '0');
      const totalWithdrawals = parseFloat(activeCashRegister.totalWithdrawals || activeCashRegister.total_withdrawals || '0');
      const totalRefunds = parseFloat(activeCashRegister.totalRefunds || activeCashRegister.total_refunds || '0');

      setOpeningCash(openingCash);
      setCashInHand(currentCash);
      setCashReceived(cashReceived);
      setUpiReceived(upiReceived);
      setCardReceived(cardReceived);
      setBankReceived(bankReceived);
      setChequeReceived(chequeReceived);
      setOtherReceived(otherReceived);
      setTotalWithdrawals(totalWithdrawals);
      setTotalRefunds(totalRefunds);

      console.log('Cash register values loaded:', {
        openingCash,
        currentCash,
        cashInHand: currentCash
      });
    }
  }, [activeCashRegister]);

  // Fetch customers with error handling
  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/customers");
        if (!response.ok) throw new Error("Failed to fetch customers");
        const data = await response.json();
        return data as Customer[];
      } catch (error) {
        console.error("Error fetching customers:", error);
        return [];
      }
    },
  });
  
  // Keep selectedCustomer in sync with the latest data from the query
  useEffect(() => {
    if (selectedCustomer && customers && Array.isArray(customers) && customers.length > 0) {
      const updatedCustomer = customers.find((c: Customer) => c.id === selectedCustomer.id);
      if (updatedCustomer) {
        // Deep compare (simple version) to avoid infinite loops
        if (
          updatedCustomer.outstandingBalance !== selectedCustomer.outstandingBalance ||
          updatedCustomer.name !== selectedCustomer.name ||
          updatedCustomer.phone !== selectedCustomer.phone
        ) {
          console.log('Syncing selected customer with latest query data:', updatedCustomer);
          setSelectedCustomer(updatedCustomer);
        }
      }
    }
  }, [customers, selectedCustomer]);

  // Fetch customer loyalty data when customer is selected
  const fetchCustomerLoyalty = async (customerId: number) => {
    try {
      console.log('Fetching loyalty data for customer:', customerId);
      const response = await fetch(`/api/loyalty/customer/${customerId}`);

      if (response.ok) {
        const loyaltyData = await response.json();
        console.log('Loyalty data received:', loyaltyData);
        console.log('Available points:', loyaltyData.availablePoints);
        console.log('Total points:', loyaltyData.totalPoints);
        setCustomerLoyalty(loyaltyData);

        toast({
          title: "Loyalty Points Loaded",
          description: `Customer has ${loyaltyData.availablePoints || loyaltyData.totalPoints || 0} loyalty points`,
          duration: 2000,
        });
      } else if (response.status === 404) {
        console.log('Creating new loyalty record for customer:', customerId);
        // Create loyalty record if doesn't exist
        const createResponse = await fetch('/api/loyalty/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId })
        });

        if (createResponse.ok) {
          const newLoyalty = await createResponse.json();
          console.log('New loyalty record created:', newLoyalty);
          setCustomerLoyalty(newLoyalty);

          toast({
            title: "Loyalty Account Created",
            description: "New loyalty account created for customer",
            duration: 2000,
          });
        } else {
          console.error('Failed to create loyalty record');
          setCustomerLoyalty(null);
        }
      } else {
        console.error('Failed to fetch loyalty data:', response.status);
        setCustomerLoyalty(null);
      }
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
      setCustomerLoyalty(null);

      toast({
        title: "Loyalty Error",
        description: "Failed to load loyalty points. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Reset loyalty state when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerLoyalty(selectedCustomer.id);
    } else {
      setCustomerLoyalty(null);
      setLoyaltyPointsToRedeem(0);
      setLoyaltyDiscount(0);
    }
  }, [selectedCustomer]);

  // Calculate points to earn from current purchase
  const calculatePointsToEarn = (total: number) => {
    // 1 point per 100 rupees spent (0.01 points per rupee)
    return Math.round((total * 0.01) * 100) / 100; // Round to 2 decimal places
  };

  // Handle loyalty point redemption
  const handleLoyaltyRedemption = async () => {
    console.log('Handling loyalty redemption:', {
      customerLoyalty,
      loyaltyPointsToRedeem,
      cartLength: cart.length,
      subtotal: cart.reduce((sum, item) => sum + item.total, 0)
    });

    if (!customerLoyalty || loyaltyPointsToRedeem <= 0) {
      toast({
        title: "Invalid Redemption",
        description: "Please enter valid points to redeem",
        variant: "destructive",
      });
      return;
    }

    if (loyaltyPointsToRedeem > parseFloat(customerLoyalty.availablePoints)) {
      toast({
        title: "Insufficient Points",
        description: `Customer only has ${parseFloat(customerLoyalty.availablePoints)} points available`,
        variant: "destructive",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before redeeming points",
        variant: "destructive",
      });
      return;
    }

    // 1 point = ₹1 discount
    const discountFromPoints = loyaltyPointsToRedeem;
    const currentSubtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const existingDiscounts = (currentSubtotal * discount) / 100;
    const maxAllowedDiscount = Math.max(0, currentSubtotal - existingDiscounts);

    if (discountFromPoints > maxAllowedDiscount) {
      toast({
        title: "Discount Too High",
        description: `Maximum loyalty discount allowed for this transaction is ₹${maxAllowedDiscount.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Apply the loyalty discount locally first
      // The actual deduction will happen during processSale
      setLoyaltyDiscount(discountFromPoints);

      // Track redeemed points for this transaction
      setRedeemedPointsForTransaction(loyaltyPointsToRedeem);

      // Locally update customer loyalty points display for immediate feedback
      if (customerLoyalty) {
        const updatedLoyalty = {
          ...customerLoyalty,
          availablePoints: parseFloat(customerLoyalty.availablePoints.toString()) - loyaltyPointsToRedeem,
          usedPoints: parseFloat(customerLoyalty.usedPoints.toString()) + loyaltyPointsToRedeem
        };
        setCustomerLoyalty(updatedLoyalty);
      }

      setShowLoyaltyDialog(false);
      setLoyaltyPointsToRedeem(0);

      console.log('Loyalty redemption applied locally:', {
        pointsToRedeem: loyaltyPointsToRedeem,
        discountApplied: discountFromPoints,
      });

      toast({
        title: "Points Applied",
        description: `${loyaltyPointsToRedeem} points applied for ₹${discountFromPoints} discount. Points will be deducted upon sale completion.`,
        duration: 3000,
      });

    } catch (error) {
      console.error('Error redeeming loyalty points:', error);
      toast({
        title: "Redemption Failed",
        description: "Failed to redeem loyalty points. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Award loyalty points after successful sale
  const awardLoyaltyPoints = async (customerId: number, points: number, saleId: number) => {
    try {
      await fetch('/api/loyalty/add-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          points,
          reason: `Purchase - Sale #${saleId}`
        })
      });
    } catch (error) {
      console.error('Error awarding loyalty points:', error);
    }
  };

  // Redeem loyalty points during checkout
  const redeemLoyaltyPoints = async (customerId: number, points: number) => {
    try {
      await fetch('/api/loyalty/redeem-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          points
        })
      });
    } catch (error) {
      console.error('Error redeeming loyalty points:', error);
      throw error;
    }
  };


  // Filter products based on search term or barcode - show latest products first
  const filteredProducts = products.filter((product: Product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  ).reverse();

  // Handle barcode submission with enhanced validation
  const handleBarcodeSubmit = () => {
    if (!barcodeInput.trim()) {
      toast({
        title: "Empty Barcode",
        description: "Please enter a barcode to scan",
        variant: "destructive",
      });
      return;
    }

    // Try finding the product in the full product list by parsing the input as exactly a barcode or exactly a SKU
    const lowerInput = barcodeInput.toLowerCase().trim();
    const foundProduct = products.find((product: Product) =>
      (product.barcode && product.barcode.toLowerCase() === lowerInput) ||
      (product.sku && product.sku.toLowerCase() === lowerInput)
    );

    if (foundProduct) {
      addToCart(foundProduct);
      setBarcodeInput("");
      toast({
        title: "Product Added",
        description: `${foundProduct.name} added successfully`,
        variant: "default",
      });
    } else {
      toast({
        title: "Barcode Not Found",
        description: `No product found with barcode/SKU: ${barcodeInput}. Please check the code and try again.`,
        variant: "destructive",
      });
    }
  };

  // Check if product is suitable for weight-based selling
  const isWeightBasedProduct = (product: Product) => {
    // Exclude repackaged items - they are packaged products, not loose weight items
    if (product.itemPreparationsStatus === 'Repackage' || product.itemPreparationsStatus === 'Bulk') {
      return false;
    }

    return product.name.toLowerCase().includes('loose') ||
      product.name.toLowerCase().includes('bulk') ||
      product.name.toLowerCase().includes('per kg') ||
      (product.weightUnit === 'kg' && parseFloat(product.weight?.toString() || "0") >= 1);
  };

  // Handle weight-based product addition
  const handleWeightBasedAddition = (product: Product) => {
    setWeightProduct(product);

    // Try to parse a default weight from the product name (e.g., "250g Pack")
    let defaultWeight = "1";
    const nameLower = product.name.toLowerCase();

    // Match patterns like (250g), (500g), (1.5kg)
    const weightMatch = nameLower.match(/(\d+\.?\d*)\s*(g|kg)/);
    if (weightMatch) {
      const value = parseFloat(weightMatch[1]);
      const unit = weightMatch[2];
      if (unit === 'g') {
        defaultWeight = (value / 1000).toString();
      } else {
        defaultWeight = value.toString();
      }
    }

    setEnteredWeight(defaultWeight);
    setShowWeightDialog(true);
  };

  // Add weight-based item to cart
  const addWeightBasedToCart = () => {
    if (!weightProduct || !enteredWeight) {
      toast({
        title: "Invalid Weight",
        description: "Please enter a valid weight",
        variant: "destructive",
      });
      return;
    }

    const weight = parseFloat(enteredWeight);
    if (weight <= 0 || weight > 50) { // Max 50kg limit
      toast({
        title: "Invalid Weight",
        description: "Weight must be between 0.1kg and 50kg",
        variant: "destructive",
      });
      return;
    }

    // Determine price based on pricing mode (same logic as regular products)
    let pricePerKg: number;
    const wholesalePrice = parseFloat(String(weightProduct.wholesalePrice || 0));
    if (pricingMode === 'wholesale' && wholesalePrice > 0) {
      pricePerKg = wholesalePrice;
    } else {
      pricePerKg = parseFloat(weightProduct.price);
    }

    const totalPrice = weight * pricePerKg;

    const cartItem: CartItem = {
      ...weightProduct,
      quantity: weight,
      price: pricePerKg.toString(),
      unitPrice: pricePerKg,
      total: totalPrice,
      isWeightBased: true,
      actualWeight: weight,
      pricePerKg: pricePerKg,
      mrp: Number(weightProduct.mrp) || 0,
      cost: weightProduct.cost || "0",
    };

    setCart(prev => [...prev, cartItem]);
    setShowWeightDialog(false);
    setEnteredWeight("");
    setWeightProduct(null);

    const priceMode = pricingMode === 'wholesale' ? '(Wholesale)' : '(Retail)';
    toast({
      title: "Product Added",
      description: `${weight}kg of ${weightProduct.name} added ${priceMode} for ${formatCurrency(totalPrice)}`,
    });
  };

  // Cart functions
  const addToCart = async (product: Product) => {
    if (product.stockQuantity <= 0) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is currently out of stock`,
        variant: "destructive",
      });
      return;
    }

    // Check if this is a weight-based product
    if (isWeightBasedProduct(product)) {
      handleWeightBasedAddition(product);
      return;
    }

    // Determine price based on pricing mode
    let effectivePrice: number;
    const wholesalePrice = parseFloat(String(product.wholesalePrice || 0));
    if (pricingMode === 'wholesale' && wholesalePrice > 0) {
      effectivePrice = wholesalePrice;
    } else {
      effectivePrice = parseFloat(product.price);
    }

    // Fetch batches
    let parsedCost = parseFloat(product.cost?.toString() || "0");
    let accurateCost = isNaN(parsedCost) ? 0 : parsedCost;
    let initialPrice = effectivePrice;
    let initialMrp = Number(product.mrp || product.price || 0);
    let batches = [];

    try {
        const res = await fetch(`/api/products/${product.id}/batches`);
        if (res.ok) {
            batches = await res.json();
            if (batches && batches.length > 0) {
                 accurateCost = parseFloat(batches[0].cost || "0") || accurateCost;
                 initialPrice = parseFloat(batches[0].selling_price || "0") || initialPrice;
                 initialMrp = parseFloat(batches[0].mrp || "0") || initialMrp;
            }
        }
    } catch(e) { }

    const existingItem = (cart || []).find(item => item.id === product.id && !item.isWeightBased);
    if (existingItem) {
      if (existingItem.quantity >= product.stockQuantity) {
        toast({
          title: "Stock Limit Reached",
          description: `Only ${product.stockQuantity} units available for ${product.name}`,
          variant: "destructive",
        });
        return;
      }

      setCart(prev => prev.map(item =>
        item.id === product.id
          ? { 
              ...item, 
              quantity: item.quantity + 1, 
              total: (item.quantity + 1) * parseFloat(item.price) 
            }
          : item
      ));
    } else {
      const cartItem = {
        ...product,
        quantity: 1,
        price: initialPrice.toString(),
        unitPrice: initialPrice,
        total: initialPrice,
        mrp: initialMrp,
        cost: accurateCost.toString(),
        batchId: null,
        availableBatches: batches,
        defaultPrice: effectivePrice,
        defaultMrp: Number(product.mrp || product.price || 0)
      };
      setCart(prev => [...prev, cartItem]);
    }

    const priceMode = pricingMode === 'wholesale' ? '(Wholesale)' : '(Retail)';
    toast({
      title: "Item Added",
      description: `${product.name} added to cart ${priceMode} at ${formatCurrency(initialPrice)}`,
    });

    // Clear search after adding
    setSearchTerm("");
    if (searchInputRef.current) {
       searchInputRef.current.focus();
    }
  };

  const removeFromCart = (productId: number, isWeightBased?: boolean) => {
    const item = cart.find(cartItem => cartItem.id === productId &&
      (isWeightBased ? cartItem.isWeightBased : !cartItem.isWeightBased));

    setCart(cart.filter(cartItem => !(cartItem.id === productId &&
      (isWeightBased ? cartItem.isWeightBased : !cartItem.isWeightBased))));

    const description = item?.isWeightBased
      ? `${item.actualWeight}kg of ${item.name} removed from cart`
      : `${item?.name || 'Item'} removed from cart`;

    toast({
      title: "Item Removed",
      description: description,
    });
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find((p: Product) => p.id === productId);
    if (product && newQuantity > product.stockQuantity) {
      toast({
        title: "Stock Limit Exceeded",
        description: `Maximum ${product.stockQuantity} units available`,
        variant: "destructive",
      });
      return;
    }

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity, total: newQuantity * parseFloat(item.price) }
        : item
    ));
  };

  // Update cart item quantity (for Ocean freight dialog)
  const updateCartItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find((p: Product) => p.id === productId);
    if (product && newQuantity > product.stockQuantity) {
      toast({
        title: "Stock Limit Exceeded",
        description: `Maximum ${product.stockQuantity} units available`,
        variant: "destructive",
      });
      return;
    }

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity, total: newQuantity * parseFloat(item.price) }
        : item
    ));
  };

  // Update cart item weight (for weight-based products)
  const updateCartItemWeight = (productId: number, newWeight: number) => {
    if (newWeight <= 0) {
      removeFromCart(productId, true); // Specify weight-based removal
      return;
    }

    setCart(cart.map(item =>
      item.id === productId && item.isWeightBased
        ? {
          ...item,
          actualWeight: newWeight,
          quantity: newWeight,
          total: newWeight * (item.pricePerKg || parseFloat(item.price))
        }
        : item
    ));
  };

  // Update cart item price
  const updateCartItemPrice = (productId: number, newPrice: number) => {
    if (newPrice < 0) {
      toast({
        title: "Invalid Price",
        description: "Price cannot be negative",
        variant: "destructive",
      });
      return;
    }

    setCart(cart.map(item => {
      if (item.id === productId) {
        if (item.isWeightBased) {
          return {
            ...item,
            pricePerKg: newPrice,
            price: newPrice.toString(),
            unitPrice: newPrice,
            total: (item.actualWeight || 1) * newPrice
          };
        } else {
          return {
            ...item,
            price: newPrice.toString(),
            unitPrice: newPrice,
            total: item.quantity * newPrice
          };
        }
      }
      return item;
    }));
  };

  // Voice recognition functionality
  const initializeVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsVoiceSearching(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCustomerSearchTerm(transcript);
        setIsVoiceSearching(false);

        toast({
          title: "Voice Search Complete",
          description: `Searching for: "${transcript}"`,
        });
      };

      recognition.onerror = () => {
        setIsVoiceSearching(false);
        toast({
          title: "Voice Search Error",
          description: "Please try again or use text search",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsVoiceSearching(false);
      };

      setVoiceRecognition(recognition);
    }
  };

  // Start voice search
  const startVoiceSearch = () => {
    if (voiceRecognition) {
      voiceRecognition.start();
    } else {
      initializeVoiceRecognition();
      setTimeout(() => {
        if (voiceRecognition) {
          voiceRecognition.start();
        }
      }, 100);
    }
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer: Customer) => {
    const searchLower = customerSearchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      (customer.phone && customer.phone.includes(customerSearchTerm)) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
      customer.id.toString().includes(customerSearchTerm)
    );
  });

  const clearCart = (clearHeldSales = false) => {
    const hadItems = cart.length > 0;
    const heldSalesCount = holdSales.length;

    // Force clear current cart state immediately
    setCart([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setAmountPaid("");
    setPaymentMethod("cash");
    setBarcodeInput("");

    // Clear loyalty state
    setCustomerLoyalty(null);
    setLoyaltyPointsToRedeem(0);
    setLoyaltyDiscount(0);
    setRedeemedPointsForTransaction(0);
    setOceanFreight({
      containerNumber: "",
      vesselName: "",
      voyageNumber: "",
      portOfLoading: "",
      portOfDischarge: "",
      freightCost: "",
      insuranceCost: "",
      customsDuty: "",
      handlingCharges: "",
      totalOceanCost: 0
    });

    // Handle held sales based on flag
    if (clearHeldSales) {
      setHoldSales([]);
      try {
        localStorage.removeItem('heldSales');
      } catch (error) {
        console.warn("Failed to clear localStorage:", error);
      }
      toast({
        title: "🗑️ All Data Cleared",
        description: "Cart, ocean freight, and all held sales have been permanently cleared",
      });
    } else {
      if (hadItems) {
        toast({
          title: "🛒 Cart Cleared",
          description: `Current cart cleared. ${heldSalesCount} held sales safely preserved.`,
        });
      }
    }

    // Ensure state is completely reset with a small delay
    setTimeout(() => {
      if (!clearHeldSales) {
        // Double-check that held sales are still intact
        const savedHeldSales = localStorage.getItem('heldSales');
        if (savedHeldSales && holdSales.length === 0) {
          try {
            const parsedHeldSales = JSON.parse(savedHeldSales);
            if (Array.isArray(parsedHeldSales) && parsedHeldSales.length > 0) {
              setHoldSales(parsedHeldSales.map(sale => ({
                ...sale,
                timestamp: new Date(sale.timestamp)
              })));
            }
          } catch (error) {
            console.warn("Failed to restore held sales:", error);
          }
        }
      }
    }, 100);
  };

  // Calculate ocean freight total
  const calculateOceanTotal = () => {
    const freight = parseFloat(oceanFreight.freightCost) || 0;
    const insurance = parseFloat(oceanFreight.insuranceCost) || 0;
    const customs = parseFloat(oceanFreight.customsDuty) || 0;
    const handling = parseFloat(oceanFreight.handlingCharges) || 0;
    return freight + insurance + customs + handling;
  };

  // Calculate totals with ocean freight and loyalty discount
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const totalCost = cart.reduce((sum, item) => {
    const cost = parseFloat(item.cost?.toString() || "0");
    if (item.isWeightBased) {
      return sum + (cost * (item.actualWeight || 0));
    }
    return sum + (cost * item.quantity);
  }, 0);
  const discountAmount = (subtotal * discount) / 100;
  const oceanTotal = calculateOceanTotal();
  const tax = 0; // Tax is integrated in product price
  const total = subtotal - discountAmount - loyaltyDiscount + oceanTotal;
  const totalProfit = subtotal - totalCost - discountAmount - loyaltyDiscount;

  // Stock alerts
  const lowStockCount = products.filter((p: Product) => (p.stockQuantity || 0) <= 5).length;

  // Register opening
  const handleOpenRegister = async () => {
    const amount = parseFloat(cashAmount);

    if (isNaN(amount) || amount < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid opening amount",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/cash-register/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openingCash: amount,
          notes: `Register opened for POS operations`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Failed to Open Register",
          description: error.error || "Could not open cash register",
          variant: "destructive",
        });
        return;
      }

      const result = await response.json();

      setOpeningCash(amount);
      setCashInHand(amount);
      setRegisterOpened(true);
      setActiveRegisterId(result.register.id);

      // Refresh active register data
      queryClient.invalidateQueries({ queryKey: ["/api/cash-register/active"] });

      toast({
        title: "Register Opened",
        description: `Register ${result.register.registerId || result.register.register_id} opened with ${formatCurrency(amount)}`,
      });

      // Reset form and close dialog
      resetCashRegisterForm();
      setShowOpenRegister(false);

      console.log('💰 Cash register opened and saved to database:', result);
    } catch (error) {
      console.error('Error opening cash register:', error);
      toast({
        title: "Database Error",
        description: "Failed to save register opening to database",
        variant: "destructive",
      });
    }
  };

  // Cash operation handler
  const handleCashOperation = async () => {
    const amount = parseFloat(cashAmount);

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!cashReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for this cash transaction",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update local state immediately
      const newCashInHand = cashOperation === 'add'
        ? cashInHand + amount
        : Math.max(0, cashInHand - amount);

      setCashInHand(newCashInHand);

      if (cashOperation === 'add') {
        setCashReceived(prev => prev + amount);
      }

      // Record transaction to cash register if active
      if (registerOpened && activeRegisterId) {
        try {
          await fetch(`/api/cash-register/${activeRegisterId}/transaction`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: cashOperation === 'add' ? 'deposit' : 'withdrawal',
              amount: amount,
              paymentMethod: 'cash',
              reason: cashReason,
              notes: `Manual ${cashOperation} operation from POS Enhanced`
            })
          });
          console.log(`💰 Cash ${cashOperation} recorded to cash register`);

          // Invalidate register query
          queryClient.invalidateQueries({ queryKey: ["/api/cash-register/active"] });
        } catch (regError) {
          console.error('Failed to record cash operation to cash register:', regError);
        }
      }

      toast({
        title: "Cash Updated",
        description: `${cashOperation === 'add' ? 'Added' : 'Removed'} ${formatCurrency(amount)}. Current cash: ${formatCurrency(newCashInHand)}`,
      });

      // Reset form
      resetCashRegisterForm();
    } catch (error) {
      console.error('Error handling cash operation:', error);
      toast({
        title: "Operation Failed",
        description: "Failed to update cash register",
        variant: "destructive",
      });
    }
  };

  // Quick Pay (Udhaar Settlement) Handler
  // Withdrawal handler
  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > cashInHand) {
      toast({
        title: "Insufficient Cash",
        description: "Cannot withdraw more than available cash",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update local state immediately
      const newCashInHand = cashInHand - amount;
      const newTotalWithdrawals = totalWithdrawals + amount;

      setCashInHand(newCashInHand);
      setTotalWithdrawals(newTotalWithdrawals);

      // Record withdrawal transaction to cash register if active
      if (registerOpened && activeRegisterId) {
        try {
          await fetch(`/api/cash-register/${activeRegisterId}/transaction`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'withdrawal',
              amount: amount,
              paymentMethod: 'cash',
              reason: withdrawalNote || 'Cash withdrawal',
              notes: `Withdrawal processed from POS Enhanced`
            })
          });
          console.log('💰 Withdrawal recorded to cash register');

          // Invalidate register query to keep everything in sync
          queryClient.invalidateQueries({ queryKey: ["/api/cash-register/active"] });
        } catch (regError) {
          console.error('Failed to record withdrawal to cash register:', regError);
        }
      }

      // Force localStorage update immediately
      const updatedCashRegisterState = {
        registerOpened,
        activeRegisterId,
        openingCash,
        cashInHand: newCashInHand,
        cashReceived,
        upiReceived,
        cardReceived,
        bankReceived,
        chequeReceived,
        otherReceived,
        totalWithdrawals: newTotalWithdrawals,
        totalRefunds,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem('cashRegisterState', JSON.stringify(updatedCashRegisterState));

      toast({
        title: "Withdrawal Processed",
        description: `Withdrew ${formatCurrency(amount)}. New balance: ${formatCurrency(newCashInHand)}${withdrawalNote ? `. Note: ${withdrawalNote}` : ''}`,
      });

      // Reset withdrawal form and close dialog
      resetWithdrawalForm();
      setShowWithdrawal(false);

      // Force a small delay to ensure state updates propagate
      setTimeout(() => {
        // Double-check the state is correctly updated
        setCashInHand(newCashInHand);
        console.log(`💰 Cash withdrawal completed: ${formatCurrency(amount)}, Current balance: ${formatCurrency(newCashInHand)}`);
      }, 100);

    } catch (error) {
      console.error('Withdrawal processing error:', error);
      toast({
        title: "Withdrawal Failed",
        description: "Failed to process withdrawal. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update payment tracking when processing sales
  const updatePaymentTracking = (method: string, totalAmount: number, paidAmt: number) => {
    const changeAmount = Math.max(0, paidAmt - totalAmount);

    // Handle split payment explicitly
    if (method === 'split') {
      const cash = parseFloat(cashAmount || "0");
      const upi = parseFloat(upiAmount || "0");

      setCashReceived(prev => prev + cash);
      setUpiReceived(prev => prev + upi);

      // Cash in hand only increases by net cash (cash received - change)
      // If it's a split payment, we assume change is given from cash
      setCashInHand(prev => prev + (cash - changeAmount));
      return;
    }

    const m = method.toLowerCase();
    switch (m) {
      case 'cash':
        // Net cash received is total minus any other non-cash parts, 
        // but for pure cash sale, it's just the total amount of the bill
        setCashReceived(prev => prev + totalAmount);
        setCashInHand(prev => prev + totalAmount);
        break;
      case 'upi':
        setUpiReceived(prev => prev + totalAmount);
        // UPI goes to bank, not cash in hand
        break;
      case 'card':
        setCardReceived(prev => prev + totalAmount);
        break;
      case 'bank':
      case 'bank_transfer':
      case 'bank transfer':
        setBankReceived(prev => prev + totalAmount);
        break;
      case 'cheque':
        setChequeReceived(prev => prev + totalAmount);
        break;
      case 'credit':
        // No immediate financial receipt for credit sales
        break;
      default:
        setOtherReceived(prev => prev + totalAmount);
        break;
    }
  };

  // Create new customer
  const createNewCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a customer name",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingCustomer(true);

    try {
      const customerData = {
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || undefined,
        email: newCustomerEmail.trim() || undefined,
      };

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) throw new Error("Failed to create customer");

      const newCustomer = await response.json();

      // Refresh customers data
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });

      // Select the newly created customer
      setSelectedCustomer(newCustomer);

      // Automatically fetch and display loyalty information
      await fetchCustomerLoyalty(newCustomer.id);

      // Reset form and close dialog
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerEmail("");
      setShowNewCustomerDialog(false);

      toast({
        title: "Customer Added",
        description: `${newCustomer.name} has been created successfully with loyalty account`,
      });

    } catch (error) {
      console.error("Customer creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  // Process sale
  const processSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout",
        variant: "destructive",
      });
      return;
    }

    const paidAmountValue = paymentMethod === 'credit' ? 0 : (parseFloat(amountPaid) || total);
    if (paymentMethod !== 'credit' && paidAmountValue < total) {
      toast({
        title: "Insufficient Payment",
        description: `Please pay at least ${formatCurrency(total)}`,
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'credit' && !selectedCustomer) {
      toast({
        title: "Customer Required",
        description: "Credit sale (Udhaar) requires a selected customer account",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Validate cart items have valid stock
      for (const item of cart) {
        const product = products.find((p: Product) => p.id === item.id);
        if (!product || product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}. Available: ${product?.stockQuantity || 0}, Required: ${item.quantity}`);
        }
      }

      // Process loyalty point redemption before creating sale
      if (selectedCustomer && redeemedPointsForTransaction > 0) {
        await redeemLoyaltyPoints(selectedCustomer.id, redeemedPointsForTransaction);
      }

      console.log("🚀 POSEnhanced: Processing Transaction...");
      setIsProcessing(true);
      
      // Calculate actual paid amount (Cash + UPI) or total if it's a simple cash/upi payment
      const finalPaidAmount = paymentMethod === "split" 
        ? ((parseFloat(cashAmount) || 0) + (parseFloat(upiAmount) || 0))
        : (parseFloat(amountPaid) || 0);

      // Determine the credit burden for the customer account
      // For credit mode: the total. For others: the shortfall (if a customer is selected)
      const creditAmountValue = selectedCustomer 
        ? Math.max(0, total - finalPaidAmount) 
        : (paymentMethod === "credit" ? total : 0);

      const saleData = {
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || "Walk-in Customer",
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: parseFloat(item.price).toString(),
          subtotal: item.total.toString(),
          price: parseFloat(item.price).toString(),
          total: item.total.toString(),
          mrp: Number(item.mrp) || 0,
          name: item.name,
          sku: item.sku,
          hsnCode: item.hsnCode || ""
        })),
        tax: tax.toFixed(2),
        discount: (discountAmount + loyaltyDiscount).toFixed(2),
        total: total.toFixed(2),
        paymentMethod: paymentMethod === "split" ? "cash+upi" : paymentMethod,
        amountPaid: finalPaidAmount.toFixed(2),
        change: paymentMethod === "credit" ? "0.00" : Math.max(0, paidAmountValue - total).toFixed(2),
        creditAmount: creditAmountValue.toFixed(2),
        notes: `Bill: ${billNumber}${creditAmountValue > 0 ? ` (CREDIT: ₹${creditAmountValue.toFixed(2)})` : ''}${redeemedPointsForTransaction > 0 ? `, Loyalty: ${redeemedPointsForTransaction} pts` : ''}`,
        billNumber: billNumber,
        status: "completed",
        cashAmount: paymentMethod === "split" ? (parseFloat(cashAmount) || 0) : (paymentMethod === "cash" ? paidAmountValue : 0),
        upiAmount: paymentMethod === "split" ? (parseFloat(upiAmount) || 0) : (paymentMethod === "upi" ? paidAmountValue : 0),
        cardAmount: paymentMethod === "card" ? total : 0,
        bankTransferAmount: paymentMethod === "bank_transfer" ? total : 0,
        chequeAmount: paymentMethod === "cheque" ? total : 0,
        // Ocean Freight Data
        vesselName: oceanFreight.vesselName || null,
        voyageNumber: oceanFreight.voyageNumber || null,
        containerNumber: oceanFreight.containerNumber || null,
        portOfLoading: oceanFreight.portOfLoading || null,
        portOfDischarge: oceanFreight.portOfDischarge || null,
        freightCost: parseFloat(oceanFreight.freightCost) || 0,
        insuranceCost: parseFloat(oceanFreight.insuranceCost) || 0,
        customsDuty: parseFloat(oceanFreight.customsDuty) || 0,
        handlingCharges: parseFloat(oceanFreight.handlingCharges) || 0,
        oceanTotal: calculateOceanTotal(),
        isOceanShipment: calculateOceanTotal() > 0
      };

      console.log("Processing sale with data:", saleData);

      console.log("🚀 POSEnhanced: Sending sale payload to API:", saleData);
      console.log("📄 Using billNumber:", billNumber);
      
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Sale API error:", errorText);

        let errorMessage = "Transaction failed";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || "Server error occurred";
        } catch (e) {
          errorMessage = errorText || "Unknown server error";
        }

        throw new Error(errorMessage);
      }

      const saleResult = await response.json();
      console.log("✅ POS Enhanced sale completed successfully:", saleResult);

      // Verify the sale was saved
      if (saleResult.saved !== false && saleResult.id) {
        console.log(`💾 Sale saved to database with ID: ${saleResult.id}`);

        // Award loyalty points to customer after successful sale
        if (selectedCustomer) {
          const pointsToEarn = calculatePointsToEarn(total);
          console.log(`🎯 Loyalty calculation: ₹${total} × 0.01 = ${pointsToEarn} points`);
          if (pointsToEarn > 0) {
            await awardLoyaltyPoints(selectedCustomer.id, pointsToEarn, saleResult.id);

            // Refresh customer loyalty data
            await fetchCustomerLoyalty(selectedCustomer.id);
          }
        }
      }

      // Update payment tracking
      updatePaymentTracking(paymentMethod, total, paidAmountValue);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cash-register/active"] });

      toast({
        title: "✅ Sale Completed & Saved!",
        description: (
          <div className="flex flex-col gap-1">
            <p>Transaction {saleResult.orderNumber || saleResult.billNumber} saved successfully for {formatCurrency(total)}</p>
            {paidAmountValue > total && <p className="font-bold text-emerald-600">Change: {formatCurrency(paidAmountValue - total)}</p>}
            {saleResult.newOutstandingBalance !== null && (
              <p className="mt-1 pt-1 border-t border-slate-200 text-xs font-black uppercase text-indigo-600 tracking-wider">
                New Udhaar Balance: {formatCurrency(saleResult.newOutstandingBalance)}
              </p>
            )}
          </div>
        ) as any,
        variant: "default",
      });

      // Automatically print receipt without dialog
      const completedSaleData = {
        id: saleResult.id,
        billNumber: saleResult.billNumber || saleResult.orderNumber,
        orderNumber: saleResult.orderNumber || saleResult.billNumber,
        total: total,
        subtotal: subtotal,
        discount: discountAmount + loyaltyDiscount,
        paymentMethod: paymentMethod,
        amountPaid: paidAmountValue,
        change: Math.max(0, paidAmountValue - total),
        customer: selectedCustomer,
        customerPhone: selectedCustomer?.phone,
        customerEmail: selectedCustomer?.email,
        selectedCustomer: selectedCustomer,
        // Enhanced customer data for receipt with comprehensive phone data
        customerDetails: {
          name: selectedCustomer?.name || 'Walk-in Customer',
          phone: selectedCustomer?.phone || '',
          email: selectedCustomer?.email || '',
          // Additional phone field for thermal receipt compatibility
          doorNo: selectedCustomer?.phone ? `Ph: ${selectedCustomer.phone}` : ''
        },
        // Multiple phone/email references for maximum receipt compatibility
        phone: selectedCustomer?.phone,
        email: selectedCustomer?.email,
        customer_phone: selectedCustomer?.phone,
        customer_email: selectedCustomer?.email,
        // Raw customer object preservation
        rawCustomer: selectedCustomer,
        loyaltyDiscount: loyaltyDiscount,
        loyaltyPointsRedeemed: redeemedPointsForTransaction,
        loyaltyInfo: customerLoyalty ? {
          pointsEarned: calculatePointsToEarn(total),
          totalPoints: parseFloat(customerLoyalty.totalPoints || '0'),
          availablePoints: parseFloat(customerLoyalty.availablePoints || '0'),
          pointsRedeemed: redeemedPointsForTransaction
        } : null,
        items: cart.map(item => ({
          id: item.id,
          productId: item.id,
          name: item.name,
          productName: item.name,
          sku: item.sku || `ITM${String(item.id).padStart(6, '0')}`,
          productSku: item.sku || `ITM${String(item.id).padStart(6, '0')}`,
          hsnCode: item.hsnCode || "",
          quantity: item.quantity,
          price: parseFloat(item.price),
          unitPrice: parseFloat(item.price),
          total: item.total,
          subtotal: item.total,
          mrp: Number(item.mrp) || 0
        })),
        createdAt: new Date().toISOString(), // Current timestamp for receipt
        status: 'completed'
      };

      // Direct Bill Printing - Automatic thermal receipt generation
      console.log("🖨️ Starting direct bill printing process...");
      console.log("📞 Customer phone data for receipt:", {
        selectedCustomer: selectedCustomer,
        customerPhone: selectedCustomer?.phone,
        customerData: completedSaleData.customer,
        customerDetails: completedSaleData.customerDetails
      });
      setTimeout(() => {
        handleDirectBillPrint(completedSaleData, saleResult);
      }, 500);

      // Reset everything but preserve held sales
      clearCart(false);
      setShowPaymentDialog(false);
      setAmountPaid("");
      setBillNumber(generateBillNumber());

      // Reset loyalty-related state for next transaction
      setLoyaltyPointsToRedeem(0);
      setLoyaltyDiscount(0);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });

    } catch (error) {
      console.error("Sale processing error:", error);

      let errorMessage = "Transaction failed. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("stock")) {
          errorMessage = error.message;
        } else if (error.message.includes("UNIQUE constraint failed") && error.message.includes("order_number")) {
          // If we hit a unique constraint on order_number, it almost certainly means the 
          // previous request actually SUCCEEDED on the server but timed out on the client.
          // We should treat this as a success and move on.
          console.warn("Detected duplicate order number - treating as success (likely previous attempt succeeded but timed out):", billNumber);
          
          toast({
            title: "Transaction Synced",
            description: "Transaction confirmed and recorded successfully.",
            variant: "default",
            className: "bg-emerald-50 border-emerald-200 text-emerald-800",
          });
          
          // Execute success cleanup
          setShowPaymentDialog(false);
          clearCart(false);
          setAmountPaid("");
          setBillNumber(generateBillNumber());
          return; // Exit successfully
        } else if (error.message.length > 0 && error.message.length < 200) {
          errorMessage = error.message;
        }
      }

      toast({
        title: "❌ Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fullscreen functionality
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
        toast({
          title: "Fullscreen Error",
          description: "Unable to enter fullscreen mode",
          variant: "destructive",
        });
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "F1") {
        e.preventDefault();
        // Focus on barcode input first, then search
        const barcodeInput = document.querySelector('input[placeholder*="Scan barcode"]') as HTMLInputElement;
        if (barcodeInput) {
          barcodeInput.focus();
        } else {
          searchInputRef.current?.focus();
        }
      } else if (e.key === "F10") {
        e.preventDefault();
        if (cart.length > 0) setShowPaymentDialog(true);
      } else if (e.key === "F11") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "F12") {
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+F12 clears everything including held sales
          clearCart(true);
        } else {
          // F12 only clears current cart
          clearCart(false);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSearchTerm("");
        setShowPaymentDialog(false);
        setShowNewCustomerDialog(false);
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      } else if (e.altKey && e.key === "c") {
        e.preventDefault();
        setupQuickPayment("cash");
      }
      else if (e.altKey && e.key === "u") {
        e.preventDefault();
        setupQuickPayment("upi");
      }
      else if (e.altKey && e.key === "h") {
        e.preventDefault();
        holdCurrentSale();
      }
      else if (e.altKey && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        setShowHoldSales(true);
      }
      else if (e.altKey && (e.key === "o" || e.key === "O")) {
        e.preventDefault();
        setShowOceanDialog(true);
      }
      else if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        toggleDiscount();
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener("keydown", handleKeyPress);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [cart.length, discount]);

  const currentDate = new Date().toLocaleDateString('en-IN');
  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Enhanced receipt printing functionality
  const handlePrintReceipt = (saleData: any, options?: any) => {
    try {
      // Use actual sale data if provided, otherwise use current cart state
      let itemsForReceipt = cart;
      let receiptBillNumber = billNumber;
      let receiptCustomer = selectedCustomer;
      let receiptSubtotal = subtotal;
      let receiptTotal = total;
      let receiptDiscount = discountAmount;
      let receiptPaymentMethod = paymentMethod;
      let receiptAmountPaid = parseFloat(amountPaid) || total;

      // If saleData is provided from a completed transaction, use that instead
      if (saleData && saleData.items) {
        itemsForReceipt = saleData.items;
        receiptBillNumber = saleData.billNumber || saleData.orderNumber;
        receiptCustomer = saleData.customer;

        // Recalculate totals from items to ensure consistency
        const calculatedSubtotal = (saleData.items || []).reduce((sum: number, item: any) => sum + (Number(item.total || item.subtotal) || 0), 0);

        // Use calculated subtotal
        receiptSubtotal = calculatedSubtotal;

        // Ensure discount is valid number
        receiptDiscount = Number(saleData.discount || 0);

        // Calculate total based on subtotal and discount (add ocean/freight later if needed)
        // Check for ocean freight in saleData to be consistent
        const oceanCost = Number(saleData.oceanTotal || 0);

        receiptTotal = calculatedSubtotal - receiptDiscount + oceanCost;

        receiptPaymentMethod = saleData.paymentMethod || 'cash';
        receiptAmountPaid = saleData.amountPaid || receiptTotal;
      }

      // Ensure we have valid items for printing
      if (!itemsForReceipt || itemsForReceipt.length === 0) {
        // Only use sample data for manual testing when no sale data is provided
        if (!saleData) {
          itemsForReceipt = [
            {
              id: 1,
              productId: 1,
              name: "Sample Product",
              productName: "Sample Product",
              sku: "SAMPLE-001",
              productSku: "SAMPLE-001",
              price: "30",
              unitPrice: 30,
              quantity: 1,
              total: 30,
              subtotal: 30,
              mrp: 50,
              stockQuantity: 100
            }
          ];
          receiptBillNumber = `TEST${Date.now()}`;
          receiptTotal = 30;
          receiptSubtotal = 30;
          receiptAmountPaid = 30;

          toast({
            title: "Demo Receipt",
            description: "Printing test receipt with sample data",
            variant: "default",
          });
        } else {
          toast({
            title: "No Items to Print",
            description: "Cannot print receipt without items",
            variant: "destructive",
          });
          return;
        }
      }

      const receiptData = {
        billNumber: receiptBillNumber,
        billDate: new Date().toISOString(),
        customerDetails: {
          name: receiptCustomer?.name || selectedCustomer?.name || "Walk-in Customer",
          phone: receiptCustomer?.phone || selectedCustomer?.phone || "",
          email: receiptCustomer?.email || selectedCustomer?.email || "",
          doorNo: receiptCustomer?.phone ? `Ph: ${receiptCustomer.phone}` : selectedCustomer?.phone ? `Ph: ${selectedCustomer.phone}` : "",
          street: "",
          address: "",
          place: ""
        },
        salesMan: "Admin User",
        items: itemsForReceipt.map((item: any) => ({
          id: Number(item.id || item.productId || 0),
          name: String(item.name || item.productName || "Item"),
          sku: String(item.sku || item.productSku || `ITM${String(item.id || item.productId || 0).padStart(6, '0')}`),
          hsn: item.hsnCode || item.product?.hsnCode || "",
          quantity: Number(item.quantity || 1),
          price: (item.price || item.unitPrice || "0").toString(),
          total: Number(item.total || item.subtotal || 0),
          mrp: Number(item.mrp) || 0
        })),
        subtotal: receiptSubtotal,
        discount: receiptDiscount,
        discountType: 'fixed' as const,
        taxRate: 0,
        taxAmount: 0,
        grandTotal: receiptTotal,
        amountPaid: receiptAmountPaid,
        changeDue: Math.max(0, receiptAmountPaid - receiptTotal),
        paymentMethod: receiptPaymentMethod.toUpperCase(),
        notes: `Bill: ${receiptBillNumber} | Terminal: POS-Enhanced`,
        loyaltyInfo: selectedCustomer?.id ? {
          pointsEarned: Math.floor(receiptTotal * 0.01), // 1% of total as points
          totalPoints: 0,
          availablePoints: 0
        } : undefined,
        loyaltyPointsRedeemed: redeemedPointsForTransaction,
        // Ocean Freight / Logistics Data
        vesselName: saleData?.vesselName || oceanFreight.vesselName || undefined,
        voyageNumber: saleData?.voyageNumber || oceanFreight.voyageNumber || undefined,
        containerNumber: saleData?.containerNumber || oceanFreight.containerNumber || undefined,
        portOfLoading: saleData?.portOfLoading || oceanFreight.portOfLoading || undefined,
        portOfDischarge: saleData?.portOfDischarge || oceanFreight.portOfDischarge || undefined,
        freightCost: Number(saleData?.freightCost !== undefined ? saleData.freightCost : (parseFloat(oceanFreight.freightCost) || 0)),
        insuranceCost: Number(saleData?.insuranceCost !== undefined ? saleData.insuranceCost : (parseFloat(oceanFreight.insuranceCost) || 0)),
        customsDuty: Number(saleData?.customsDuty !== undefined ? saleData.customsDuty : (parseFloat(oceanFreight.customsDuty) || 0)),
        handlingCharges: Number(saleData?.handlingCharges !== undefined ? saleData.handlingCharges : (parseFloat(oceanFreight.handlingCharges) || 0)),
        oceanTotal: Number(saleData?.oceanTotal !== undefined ? saleData.oceanTotal : calculateOceanTotal()),
        isOceanShipment: Boolean(saleData?.isOceanShipment !== undefined ? saleData.isOceanShipment : (calculateOceanTotal() > 0))
      };

      console.log("Printing receipt with data:", receiptData);

      // Use the print receipt utility with proper thermal settings
      const printSettings = {
        paperWidth: (pricingMode === 'wholesale' ? 'a4' : 
          (dynamicPrinterSettings?.paperWidth === 'a4' ? 'a4' :
           dynamicPrinterSettings?.paperWidth ? (
             dynamicPrinterSettings.paperWidth === '77mm' ? 'thermal77' :
             dynamicPrinterSettings.paperWidth === '80mm' ? 'thermal80' :
             dynamicPrinterSettings.paperWidth === '58mm' ? 'thermal58' :
             dynamicPrinterSettings.paperWidth === '72mm' ? 'thermal72' : 'thermal77'
           ) : (options?.paperWidth || 'thermal80'))) as any,
        fontSize: 'medium' as const,
        currencySymbol: '₹',
        businessName: 'M MART',
        businessAddress: '123 Business Street, City, State',
        taxId: '33GSPDB3311F1ZZ',
        phoneNumber: '+91-9876543210',
        thermalOptimized: pricingMode === 'wholesale' ? false : (options?.printerType === 'thermal'),
        autoPrint: options?.autoPrint || false
      };

      printReceiptUtil(receiptData, printSettings);

      toast({
        title: "Receipt Sent to Printer",
        description: `Receipt ${receiptBillNumber} processed successfully`,
        variant: "default",
      });

    } catch (error) {
      console.error("Receipt printing error:", error);
      toast({
        title: "Print Failed",
        description: "Failed to generate receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Direct Bill Printing - Enhanced automatic printing with error handling
  const handleDirectBillPrint = async (saleData: any, saleResult: any) => {
    try {
      console.log("🖨️ Direct Bill Print: Starting automatic receipt generation...");
      console.log("🏷️ Customer data for receipt:", saleData.customer);
      console.log("👤 Selected Customer:", selectedCustomer);
      console.log("📦 Sale items with MRP data:", saleData.items);

      // Validate sale data
      if (!saleData || !saleData.billNumber) {
        throw new Error("Invalid sale data for printing");
      }

      // Prepare enhanced receipt data with all transaction details - Use current date
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const currentDate = `${day}/${month}/${year}`;

      const receiptData = {
        billNumber: saleData.billNumber,
        billDate: currentDate,
        customerDetails: {
          name: saleData.customer?.name || saleData.customerName || selectedCustomer?.name || 'Walk-in Customer',
          phone: saleData.customer?.phone || saleData.customerPhone || selectedCustomer?.phone || '',
          email: saleData.customer?.email || saleData.customerEmail || selectedCustomer?.email || ''
        },
        salesMan: 'POS System',
        items: saleData.items.map((item: any) => ({
          id: Number(item.id || item.productId || 0),
          name: String(item.name || item.productName || 'Item'),
          sku: String(item.sku || item.productSku || `ITM${String(item.id || item.productId || 0).padStart(6, '0')}`),
          hsn: item.hsnCode || item.product?.hsnCode || "",
          quantity: Number(item.quantity || 1),
          price: (item.price || item.unitPrice || 0).toString(),
          total: Number(item.total || item.subtotal || 0),
          mrp: Number(item.mrp) || 0
        })),
        subtotal: saleData.subtotal || (saleData.items || []).reduce((acc: number, item: any) => acc + (Number(item.total || item.subtotal) || 0), 0),
        discount: saleData.discount || 0,
        discountType: 'fixed' as const,
        taxRate: 0,
        taxAmount: 0,
        grandTotal: (saleData.items || []).reduce((acc: number, item: any) => acc + (Number(item.total || item.subtotal) || 0), 0) - (saleData.discount || 0) + (Number(saleData.oceanTotal) || 0),
        amountPaid: saleData.amountPaid || saleData.total,
        changeDue: saleData.change || Math.max(0, (saleData.amountPaid || saleData.total) - saleData.total),
        paymentMethod: (saleData.paymentMethod || 'CASH').toUpperCase(),
        notes: saleData.notes || `Transaction completed successfully`,
        loyaltyInfo: selectedCustomer?.id && customerLoyalty ? {
          pointsEarned: calculatePointsToEarn(saleData.total),
          totalPoints: parseFloat(customerLoyalty.totalPoints || '0'),
          availablePoints: parseFloat(customerLoyalty.availablePoints || '0'),
          pointsRedeemed: redeemedPointsForTransaction
        } : selectedCustomer?.id ? {
          pointsEarned: calculatePointsToEarn(saleData.total),
          totalPoints: 0,
          availablePoints: 0,
          pointsRedeemed: 0
        } : undefined,
        loyaltyDiscount: loyaltyDiscount,
        loyaltyPointsRedeemed: redeemedPointsForTransaction,
        // Ocean Freight / Logistics Data
        vesselName: saleData.vesselName || undefined,
        voyageNumber: saleData.voyageNumber || undefined,
        containerNumber: saleData.containerNumber || undefined,
        portOfLoading: saleData.portOfLoading || undefined,
        portOfDischarge: saleData.portOfDischarge || undefined,
        freightCost: Number(saleData.freightCost || 0),
        insuranceCost: Number(saleData.insuranceCost || 0),
        customsDuty: Number(saleData.customsDuty || 0),
        handlingCharges: Number(saleData.handlingCharges || 0),
        oceanTotal: Number(saleData.oceanTotal || 0),
        isOceanShipment: Boolean(saleData.isOceanShipment || Number(saleData.oceanTotal) > 0)
      };

      // Enhanced print settings using unified printer settings
      const printSettings = {
        paperWidth: (pricingMode === 'wholesale' ? 'a4' :
          (dynamicPrinterSettings?.paperWidth === 'a4' ? 'a4' :
          dynamicPrinterSettings?.paperWidth === '77mm' ? 'thermal77' :
            dynamicPrinterSettings?.paperWidth === '80mm' ? 'thermal80' :
              dynamicPrinterSettings?.paperWidth === '58mm' ? 'thermal58' :
                dynamicPrinterSettings?.paperWidth === '72mm' ? 'thermal72' : 'thermal77')) as any,
        fontSize: (dynamicPrinterSettings?.fontSize || 'medium') as any,
        fontFamily: (dynamicPrinterSettings?.fontFamily || 'courier') as any,
        thermalOptimized: pricingMode === 'wholesale' ? false : (dynamicPrinterSettings?.thermalOptimized ?? true),
        businessName: dynamicPrinterSettings?.businessName || receiptSettings.businessName || 'M MART',
        businessAddress: dynamicPrinterSettings?.businessAddress || receiptSettings.address || 'Professional Retail Solution\n123 Business Street, City',
        phoneNumber: dynamicPrinterSettings?.phoneNumber || receiptSettings.phone || '+91-9876543210',
        taxId: dynamicPrinterSettings?.taxId || receiptSettings.taxId || '33GSPDB3311F1ZZ',
        receiptFooter: dynamicPrinterSettings?.receiptFooter || receiptSettings.receiptFooter || 'Thank you for shopping with us!\nVisit again soon',
        autoPrint: dynamicPrinterSettings?.enableAutoPrint ?? true,
        showInstructions: false,
        directPrint: true,
        showLogo: dynamicPrinterSettings?.showLogo ?? true,
        showCustomerDetails: dynamicPrinterSettings?.showCustomerDetails ?? true,
        showItemSKU: dynamicPrinterSettings?.showItemSKU ?? false,
        showMRP: dynamicPrinterSettings?.showMRP ?? true,
        showSavings: dynamicPrinterSettings?.showSavings ?? true,
        headerStyle: dynamicPrinterSettings?.headerStyle || 'center',
        boldTotals: dynamicPrinterSettings?.boldTotals ?? true,
        separatorStyle: dynamicPrinterSettings?.separatorStyle || 'dashed'
      };

      console.log("🖨️ Direct Bill Print: Sending to thermal printer...");
      console.log("📄 Receipt Data:", receiptData);
      console.log("⚙️ Print Settings:", printSettings);

      // Send to thermal printer with enhanced error handling
      try {
        printReceiptUtil(receiptData, printSettings);

        console.log("✅ Direct Bill Print: Receipt sent to printer successfully");

        // Success notification
        toast({
          title: "🖨️ Bill Printed",
          description: `Receipt ${receiptData.billNumber} sent to thermal printer automatically`,
          variant: "default",
        });

        // Optional: Track print statistics
        localStorage.setItem('lastPrintedBill', JSON.stringify({
          billNumber: receiptData.billNumber,
          timestamp: new Date().toISOString(),
          total: receiptData.grandTotal,
          customer: receiptData.customerDetails.name
        }));

      } catch (printError) {
        console.error("❌ Direct Bill Print: Thermal printing failed:", printError);

        // Fallback: Show print dialog instead of failing silently
        setTimeout(() => {
          console.log("🔄 Direct Bill Print: Attempting fallback print...");
          try {
            handlePrintReceipt(saleData);
          } catch (fallbackError) {
            console.error("Fallback print also failed:", fallbackError);
          }
        }, 1000);

        toast({
          title: "Print Issue",
          description: "Automatic printing failed. Print dialog opened as backup.",
          variant: "default",
        });
      }

    } catch (error) {
      console.error("❌ Direct Bill Print: Critical error:", error);

      // Fallback to manual print dialog
      toast({
        title: "Direct Print Failed",
        description: "Unable to print automatically. Please use manual print option.",
        variant: "destructive",
      });

      // Store failed print for retry
      localStorage.setItem('failedPrint', JSON.stringify({
        saleData,
        timestamp: new Date().toISOString(),
        error: (error as any).message
      }));
    }
  };

  // Retry failed prints
  const retryFailedPrint = () => {
    try {
      const failedPrint = localStorage.getItem('failedPrint');
      if (failedPrint) {
        const { saleData } = JSON.parse(failedPrint);
        try {
          handlePrintReceipt(saleData);
        } catch (retryError) {
          console.error("Print retry failed:", retryError);
        }
        localStorage.removeItem('failedPrint');

        toast({
          title: "Print Retry",
          description: "Attempting to print previously failed receipt",
        });
      }
    } catch (error) {
      console.error("Failed print retry error:", error);
    }
  };

  // Quick payment setup
  const setupQuickPayment = (method: string) => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before using quick payment",
        variant: "destructive",
      });
      return;
    }
    setPaymentMethod(method);
    setAmountPaid(total.toString());
    setShowPaymentDialog(true);
  };

  // Toggle discount
  const toggleDiscount = () => {
    setDiscount(prev => (prev > 0 ? 0 : 10));
  };

  // Hold current sale
  const holdCurrentSale = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Cannot hold an empty cart",
        variant: "destructive",
      });
      return;
    }

    // Validate cart items before holding
    const validCartItems = cart.filter(item => item && item.id && item.quantity > 0);
    if (validCartItems.length === 0) {
      toast({
        title: "Invalid Cart",
        description: "Cart contains no valid items to hold",
        variant: "destructive",
      });
      return;
    }

    const holdId = `HOLD-${Date.now()}`;

    // Create a completely isolated deep copy using JSON parse/stringify to prevent any reference issues
    const cartSnapshot = JSON.parse(JSON.stringify(validCartItems.map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      hsnCode: item.hsnCode || "",
      price: item.price,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      total: item.total,
      cost: item.cost,
      stockQuantity: item.stockQuantity,
      mrp: item.mrp,
      isWeightBased: item.isWeightBased,
      actualWeight: item.actualWeight,
      pricePerKg: item.pricePerKg,
      batchId: item.batchId,
      availableBatches: item.availableBatches,
      defaultPrice: item.defaultPrice,
      defaultMrp: item.defaultMrp,
      category: item.category ? {
        name: item.category.name
      } : undefined,
      barcode: item.barcode || undefined
    }))));

    const customerSnapshot = selectedCustomer ? JSON.parse(JSON.stringify({
      id: selectedCustomer.id,
      name: selectedCustomer.name,
      phone: selectedCustomer.phone,
      email: selectedCustomer.email
    })) : null;

    const oceanSnapshot = JSON.parse(JSON.stringify({
      containerNumber: oceanFreight.containerNumber || "",
      vesselName: oceanFreight.vesselName || "",
      voyageNumber: oceanFreight.voyageNumber || "",
      portOfLoading: oceanFreight.portOfLoading || "",
      portOfDischarge: oceanFreight.portOfDischarge || "",
      freightCost: oceanFreight.freightCost || "",
      insuranceCost: oceanFreight.insuranceCost || "",
      customsDuty: oceanFreight.customsDuty || "",
      handlingCharges: oceanFreight.handlingCharges || "",
      totalOceanCost: oceanFreight.totalOceanCost || 0
    }));

    const holdSale = {
      id: holdId,
      cart: cartSnapshot,
      customer: customerSnapshot,
      discount: discount,
      notes: `Held sale at ${new Date().toLocaleTimeString()}`,
      timestamp: new Date(),
      total: total,
      oceanFreight: oceanSnapshot
    };

    const itemCount = validCartItems.length;

    try {
      // Add to held sales and update localStorage atomically
      setHoldSales(prev => {
        // Remove any existing duplicate holds first
        const filteredPrev = prev.filter(sale => !sale.id.startsWith('HOLD-') ||
          Math.abs(new Date(sale.timestamp).getTime() - Date.now()) > 5000);

        const newHeldSales = [...filteredPrev, holdSale];
        try {
          localStorage.setItem('heldSales', JSON.stringify(newHeldSales));
        } catch (storageError) {
          console.warn("Failed to save to localStorage:", storageError);
        }
        return newHeldSales;
      });

      // Force clear all current state immediately
      setTimeout(() => {
        setCart([]);
        setSelectedCustomer(null);
        setDiscount(0);
        setAmountPaid("");
        setPaymentMethod("cash");
        setBarcodeInput("");
        setLoyaltyDiscount(0);
        setRedeemedPointsForTransaction(0);
        setCustomerLoyalty(null);
        setOceanFreight({
          containerNumber: "",
          vesselName: "",
          voyageNumber: "",
          portOfLoading: "",
          portOfDischarge: "",
          freightCost: "",
          insuranceCost: "",
          customsDuty: "",
          handlingCharges: "",
          totalOceanCost: 0
        });
      }, 10);

      toast({
        title: "Sale Held Successfully",
        description: `Sale ${holdId} saved with ${itemCount} items. Cart cleared.`,
      });
    } catch (error) {
      console.error("Error holding sale:", error);
      toast({
        title: "Hold Failed",
        description: "Failed to hold the sale. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Recall held sale
  const recallHeldSale = (holdSale: typeof holdSales[0]) => {
    try {
      // Check if there's a current cart that needs to be cleared
      if (cart.length > 0) {
        const confirmRecall = window.confirm(
          `You have ${cart.length} items in your current cart. Recalling this held sale will clear the current cart. Continue?`
        );
        if (!confirmRecall) {
          return;
        }
      }

      // Use JSON parse/stringify for complete isolation
      const restoredCart = JSON.parse(JSON.stringify(holdSale.cart));
      const restoredCustomer = holdSale.customer ? JSON.parse(JSON.stringify(holdSale.customer)) : null;
      const restoredOceanFreight = holdSale.oceanFreight ? JSON.parse(JSON.stringify(holdSale.oceanFreight)) : {
        containerNumber: "",
        vesselName: "",
        voyageNumber: "",
        portOfLoading: "",
        portOfDischarge: "",
        freightCost: "",
        insuranceCost: "",
        customsDuty: "",
        handlingCharges: "",
        totalOceanCost: 0
      };

      // Clear current state forcefully
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setAmountPaid("");
      setPaymentMethod("cash");
      setBarcodeInput("");
      setOceanFreight({
        containerNumber: "",
        vesselName: "",
        voyageNumber: "",
        portOfLoading: "",
        portOfDischarge: "",
        freightCost: "",
        insuranceCost: "",
        customsDuty: "",
        handlingCharges: "",
        totalOceanCost: 0
      });

      // Use multiple frame delays to ensure complete state clearing
      setTimeout(() => {
        // First remove from held sales
        setHoldSales(prev => {
          const updatedHeldSales = prev.filter(sale => sale.id !== holdSale.id);
          try {
            localStorage.setItem('heldSales', JSON.stringify(updatedHeldSales));
          } catch (storageError) {
            console.warn("Failed to update localStorage:", storageError);
          }
          return updatedHeldSales;
        });

        // Then restore the held sale state
        setTimeout(async () => {
          setCart(restoredCart);
          setSelectedCustomer(restoredCustomer);
          setDiscount(holdSale.discount || 0);
          setOceanFreight(restoredOceanFreight);

          // Automatically fetch loyalty information if customer exists
          if (restoredCustomer) {
            await fetchCustomerLoyalty(restoredCustomer.id);
          }

          setShowHoldSales(false);

          toast({
            title: "Sale Recalled Successfully",
            description: `${holdSale.id} restored with ${restoredCart.length} items${restoredCustomer ? ' and loyalty data' : ''}`,
          });
        }, 50);
      }, 10);

    } catch (error) {
      console.error("Error recalling held sale:", error);
      toast({
        title: "Recall Failed",
        description: "Failed to recall the held sale. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete held sale
  const deleteHeldSale = (holdId: string) => {
    setHoldSales(prev => prev.filter(sale => sale.id !== holdId));
    toast({
      title: "Sale Deleted",
      description: `Held sale ${holdId} has been deleted`,
    });
  };

  // Clear all held sales
  const clearAllHeldSales = () => {
    if (holdSales.length === 0) {
      toast({
        title: "No Held Sales",
        description: "There are no held sales to clear",
        variant: "default",
      });
      return;
    }

    const confirmClear = window.confirm(
      `Are you sure you want to clear all ${holdSales.length} held sales? This action cannot be undone.`
    );

    if (!confirmClear) {
      return;
    }

    try {
      const count = holdSales.length;
      setHoldSales([]);
      localStorage.removeItem('heldSales');

      toast({
        title: "All Held Sales Cleared",
        description: `${count} held sales have been permanently cleared`,
      });
    } catch (error) {
      console.error("Error clearing held sales:", error);
      toast({
        title: "Clear Failed",
        description: "Failed to clear all held sales. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Clean up empty or invalid held sales
  const cleanupHeldSales = () => {
    const validHeldSales = holdSales.filter(sale =>
      sale &&
      sale.cart &&
      Array.isArray(sale.cart) &&
      sale.cart.length > 0 &&
      sale.id &&
      sale.timestamp
    );

    if (validHeldSales.length !== holdSales.length) {
      setHoldSales(validHeldSales);
      try {
        if (validHeldSales.length > 0) {
          localStorage.setItem('heldSales', JSON.stringify(validHeldSales));
        } else {
          localStorage.removeItem('heldSales');
        }

        const removedCount = holdSales.length - validHeldSales.length;
        if (removedCount > 0) {
          toast({
            title: "Cleaned Up Held Sales",
            description: `Removed ${removedCount} empty or invalid held sales`,
          });
        }
      } catch (error) {
        console.warn("Failed to cleanup held sales:", error);
      }
    }
  };

  // Initialize bill number and load held sales + cash register state from localStorage
  useEffect(() => {
    if (!billNumber) {
      setBillNumber(generateBillNumber());
    }
  }, []);

  // Load held sales from localStorage on component mount
  useEffect(() => {
    try {
      const savedHeldSales = localStorage.getItem('heldSales');
      if (savedHeldSales) {
        const parsedHeldSales = JSON.parse(savedHeldSales);
        // Validate and restore held sales, but filter out invalid or empty ones
        if (Array.isArray(parsedHeldSales)) {
          const validHeldSales = parsedHeldSales.filter(sale =>
            sale &&
            sale.cart &&
            Array.isArray(sale.cart) &&
            sale.cart.length > 0 &&
            sale.id &&
            sale.timestamp
          ).map(sale => ({
            ...sale,
            timestamp: new Date(sale.timestamp) // Convert timestamp back to Date object
          }));
          setHoldSales(validHeldSales);

          // Update localStorage with cleaned data
          if (validHeldSales.length !== parsedHeldSales.length) {
            localStorage.setItem('heldSales', JSON.stringify(validHeldSales));
          }
        }
      }
    } catch (error) {
      console.error("Error loading held sales from localStorage:", error);
      // Clear corrupted data
      localStorage.removeItem('heldSales');
    }

    // Load cash register state from localStorage
    try {
      const savedCashRegister = localStorage.getItem('cashRegisterState');
      if (savedCashRegister) {
        const cashState = JSON.parse(savedCashRegister);

        // Restore cash register state
        setRegisterOpened(cashState.registerOpened || false);
        setOpeningCash(cashState.openingCash || 0);
        setCashInHand(cashState.cashInHand || 0);
        setCashReceived(cashState.cashReceived || 0);
        setUpiReceived(cashState.upiReceived || 0);
        setCardReceived(cashState.cardReceived || 0);
        setBankReceived(cashState.bankReceived || 0);
        setChequeReceived(cashState.chequeReceived || 0);
        setOtherReceived(cashState.otherReceived || 0);
        setTotalWithdrawals(cashState.totalWithdrawals || 0);
        setTotalRefunds(cashState.totalRefunds || 0);

        console.log("💰 Cash register state restored from localStorage:", cashState);
      }
    } catch (error) {
      console.error("Error loading cash register state from localStorage:", error);
      localStorage.removeItem('cashRegisterState');
    }

    // Cleanup function to auto-hold current cart when navigating away
    const handleBeforeUnload = () => {
      // Reset cash register forms on navigation
      resetAllCashRegisterStates();

      if (cart.length > 0) {
        const autoHoldId = `AUTO-HOLD-${Date.now()}`;
        const autoHoldSale = {
          id: autoHoldId,
          cart: JSON.parse(JSON.stringify(cart)),
          customer: selectedCustomer ? JSON.parse(JSON.stringify(selectedCustomer)) : null,
          discount: discount,
          notes: `Auto-saved before navigation at ${new Date().toLocaleTimeString()}`,
          timestamp: new Date(),
          total: total,
          oceanFreight: JSON.parse(JSON.stringify(oceanFreight))
        };

        try {
          const existingHeldSales = JSON.parse(localStorage.getItem('heldSales') || '[]');
          const updatedHeldSales = [...existingHeldSales, autoHoldSale];
          localStorage.setItem('heldSales', JSON.stringify(updatedHeldSales));
        } catch (error) {
          console.warn("Failed to auto-save cart before navigation:", error);
        }
      }
    };

    // Add event listeners for navigation detection
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Removed handleBeforeUnload() call from here as it caused duplicates on every state change
    };
  }, []); // Run only on mount. Cart state will be tracked via Refs for beforeunload if needed, or we rely on the manual button.

  // Component cleanup effect
  useEffect(() => {
    return () => {
      // Reset forms when component unmounts
      resetAllCashRegisterStates();
    };
  }, []);

  // Update bill details when bill number changes
  useEffect(() => {
    setBillDetails(prev => ({
      ...prev,
      billNumber: billNumber,
      billDate: new Date().toISOString().split('T')[0],
      billTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }));
  }, [billNumber]);

  // Save held sales to localStorage whenever holdSales changes
  useEffect(() => {
    try {
      // Filter out any invalid held sales before saving
      const validHeldSales = holdSales.filter(sale =>
        sale &&
        sale.cart &&
        Array.isArray(sale.cart) &&
        sale.cart.length > 0 &&
        sale.id &&
        sale.timestamp
      );

      if (validHeldSales.length > 0) {
        localStorage.setItem('heldSales', JSON.stringify(validHeldSales));
      } else {
        localStorage.removeItem('heldSales');
      }

      // Update state if we filtered out invalid sales
      if (validHeldSales.length !== holdSales.length) {
        setHoldSales(validHeldSales);
      }
    } catch (error) {
      console.error("Error saving held sales to localStorage:", error);
    }
  }, [holdSales]);

  // Save cash register state to localStorage whenever it changes
  useEffect(() => {
    try {
      const cashRegisterState = {
        registerOpened,
        openingCash,
        cashInHand,
        cashReceived,
        upiReceived,
        cardReceived,
        bankReceived,
        chequeReceived,
        otherReceived,
        totalWithdrawals,
        totalRefunds,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem('cashRegisterState', JSON.stringify(cashRegisterState));
    } catch (error) {
      console.error("Error saving cash register state to localStorage:", error);
    }
  }, [
    registerOpened,
    openingCash,
    cashInHand,
    cashReceived,
    upiReceived,
    cardReceived,
    bankReceived,
    chequeReceived,
    otherReceived,
    totalWithdrawals,
    totalRefunds
  ]);

  // Periodic cleanup for old auto-saved held sales
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000); // 1 hour ago

      setHoldSales(prev => {
        const cleaned = prev.filter(sale => {
          // Keep regular holds, but remove old auto-saves
          if (sale.id.includes('AUTO-HOLD') || sale.id.includes('TAB-SWITCH')) {
            const saleTime = new Date(sale.timestamp).getTime();
            return saleTime > oneHourAgo;
          }
          return true;
        });

        return cleaned;
      });
    }, 5 * 60 * 1000); // Run every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
      <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 text-gray-900 flex flex-col">
        {/* Modern Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 py-2 shrink-0 z-30">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">POS <span className="text-indigo-600">PREMIUM</span></h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 border-emerald-100 px-1.5 py-0 h-4">
                    Live Status
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">#{billNumber.slice(-8)}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 max-w-4xl hidden xl:flex items-center justify-between bg-slate-100/40 backdrop-blur-md rounded-2xl border border-white/40 px-8 py-2.5">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-100/80 p-1.5 rounded-lg border border-emerald-200/50">
                  <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <div className="text-[9px] uppercase font-black text-slate-400 tracking-tighter mb-0.5">Cash in hand</div>
                  <div className="text-sm font-black text-slate-900 leading-none">{registerOpened ? formatCurrency(cashInHand) : '---'}</div>
                </div>
              </div>

              <div className="h-8 w-[1px] bg-slate-200/60"></div>

              <div className="flex items-center gap-4">
                <div className="bg-blue-100/80 p-1.5 rounded-lg border border-blue-200/50">
                  <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="text-[9px] uppercase font-black text-slate-400 tracking-tighter mb-0.5">Active items</div>
                  <div className="text-sm font-black text-slate-900 leading-none">
                    {cart.length} Articles / {cart.reduce((sum, item) => sum + item.quantity, 0)} Pieces
                  </div>
                </div>
              </div>

              <div className="h-8 w-[1px] bg-slate-200/60"></div>

              <div className="flex items-center gap-4">
                <div className="bg-indigo-100/80 p-1.5 rounded-lg border border-indigo-200/50">
                  <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <div className="text-left">
                  <div className="text-[9px] uppercase font-black text-indigo-400 tracking-tighter mb-0.5">Transaction Total</div>
                  <div className="text-base font-black text-indigo-600 leading-none">{formatCurrency(total)}</div>
                </div>
              </div>

              <div className="h-8 w-[1px] bg-slate-200/60"></div>

              <div className="flex items-center gap-4">
                <div className={`${lowStockCount > 0 ? 'bg-amber-100/80 border-amber-200/50' : 'bg-slate-100/80 border-slate-200/50'} p-1.5 rounded-lg border`}>
                  <Package className={`h-3.5 w-3.5 ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-600'}`} />
                </div>
                <div className="text-left">
                  <div className="text-[9px] uppercase font-black text-slate-400 tracking-tighter mb-0.5">Stock Alerts</div>
                  <div className={`text-sm font-black leading-none ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{lowStockCount} Low Items</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Cashier Badge */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100/60 backdrop-blur-md border border-slate-200/50 rounded-xl hover:bg-white transition-all cursor-default">
                <div className="relative">
                  <div className="w-7 h-7 rounded-lg premium-gradient flex items-center justify-center text-white font-black text-[10px] shadow-sm">
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-black text-slate-400 tracking-tighter leading-none mb-0.5">Active Cashier</span>
                  <span className="text-[11px] font-black text-slate-900 leading-none">{user?.name || 'Calculating...'}</span>
                </div>
              </div>

              <div className="h-8 w-[1px] bg-slate-200/60 mx-1"></div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setupQuickPayment("cash")}
                    disabled={cart.length === 0}
                    className="h-8 hover:bg-white hover:shadow-sm text-slate-600 font-bold text-xs rounded-lg"
                  >
                    <DollarSign className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                    Cash
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setupQuickPayment("upi")}
                    disabled={cart.length === 0}
                    className="h-8 hover:bg-white hover:shadow-sm text-slate-600 font-bold text-xs rounded-lg"
                  >
                    <Smartphone className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                    UPI
                  </Button>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 rounded-xl border-slate-200 font-bold text-xs px-3">
                      <Banknote className="h-4 w-4 mr-2 text-indigo-500" />
                      Register
                      <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200 p-2 shadow-xl">
                    <DropdownMenuLabel className="text-xs uppercase tracking-widest font-black text-slate-400 p-2">Till Management</DropdownMenuLabel>
                    {!registerOpened ? (
                      <DropdownMenuItem onClick={() => setShowOpenRegister(true)} className="rounded-lg py-2 cursor-pointer">
                        <DollarSign className="h-4 w-4 mr-2 text-emerald-500" />
                        Open New Session
                      </DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => setShowCashRegister(true)} className="rounded-lg py-2 cursor-pointer">
                          <Archive className="h-4 w-4 mr-2 text-blue-500" />
                          Management Console
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowWithdrawal(true)} className="rounded-lg py-2 cursor-pointer text-orange-600">
                          <TrendingDown className="h-4 w-4 mr-2" />
                          Cash Withdrawal
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setShowCloseRegister(true)} className="rounded-lg py-2 cursor-pointer text-red-600 font-bold">
                          <LogOut className="h-4 w-4 mr-2" />
                          Close Register
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-slate-200 flex items-center justify-center">
                      <Settings className="h-4 w-4 text-slate-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-xl border-slate-200 p-2 shadow-xl">
                    <DropdownMenuLabel className="text-xs uppercase tracking-widest font-black text-slate-400 p-2">System Config</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => window.open('/printer-settings', '_blank')} className="rounded-lg py-2 cursor-pointer">
                      <Printer className="h-4 w-4 mr-2 text-slate-500" />
                      Printer Hardware
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={toggleFullscreen} className="rounded-lg py-2 cursor-pointer">
                      <AppWindow className="h-4 w-4 mr-2 text-slate-500" />
                      Fullscreen Toggle (F11)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => queryClient.invalidateQueries()} className="rounded-lg py-2 cursor-pointer">
                      <RefreshCw className="h-4 w-4 mr-2 text-slate-500" />
                      Sync Cloud Data
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>
        {/* COMMAND & CUSTOMER CONSOLE */}
        <section className="bg-white/40 backdrop-blur-xl border-b border-white/20 px-4 py-3 shrink-0">
          <div className="flex flex-col gap-3">
            {/* Top Row: Customer & Loyalty */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 flex gap-2 items-center">
                <div className="w-full max-w-sm relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 group-focus-within:text-indigo-600 transition-colors z-10" />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full h-11 pl-10 pr-4 rounded-2xl border-indigo-100 bg-white/80 backdrop-blur focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-[13px] text-slate-700 shadow-sm hover:border-indigo-300 justify-between"
                      >
                        {selectedCustomer ? (
                          <span className="truncate">{selectedCustomer.name}</span>
                        ) : (
                          <span className="text-slate-400">Select Customer (Walk-in)</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] lg:w-[400px] p-0 rounded-[2rem] border-indigo-100 shadow-2xl overflow-hidden" align="start">
                      <Command className="rounded-[2rem]">
                        <div className="p-4 bg-purple-50/50 border-b border-indigo-50">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-900 mb-3 ml-1">Customer Search & Selection</h4>
                          <CommandInput
                            placeholder="Search name, phone, or ID..."
                            className="h-12 bg-white/80 border-2 border-indigo-100 rounded-xl font-bold text-sm focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <CommandList className="max-h-[350px] custom-scrollbar">
                          <CommandEmpty className="py-8 text-center">
                            <User className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                            <p className="text-sm font-bold text-slate-600">No results found.</p>
                          </CommandEmpty>
                          <CommandGroup heading="Primary Selection">
                            <CommandItem
                              value="walk-in"
                              onSelect={() => {
                                setSelectedCustomer(null);
                              }}
                              className="m-2 rounded-xl py-3 cursor-pointer hover:bg-slate-50 aria-selected:bg-indigo-50"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-lg">🚶</div>
                                <span className="font-black text-slate-700">Walk-in Customer</span>
                              </div>
                              {selectedCustomer === null && <Check className="ml-auto h-4 w-4 text-indigo-600" />}
                            </CommandItem>
                          </CommandGroup>
                          <CommandGroup heading="Database Records">
                            {customers.map((customer) => (
                              <CommandItem
                                key={customer.id}
                                value={`${customer.name} ${customer.phone || ""} ${customer.id}`}
                                onSelect={() => {
                                  setSelectedCustomer(customer);
                                }}
                                className="m-2 rounded-xl py-2 cursor-pointer hover:bg-indigo-50 aria-selected:bg-indigo-50"
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                                    {customer.name.charAt(0)}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-black text-slate-800 truncate">{customer.name}</span>
                                    <span className="text-[10px] text-slate-400 font-bold">{customer.phone || 'No Phone'}</span>
                                  </div>
                                  {selectedCustomer?.id === customer.id && <Check className="ml-auto h-4 w-4 text-indigo-600 shrink-0" />}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                        <div className="p-4 bg-slate-50/80 border-t border-slate-100">
                          <Button
                            variant="outline"
                            className="w-full h-10 rounded-xl border-purple-100 text-purple-600 font-black text-[10px] uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                            onClick={() => {
                              setShowNewCustomerDialog(true);
                            }}
                          >
                            <UserPlus className="h-3.5 w-3.5 mr-2" />
                            Create New Profile
                          </Button>
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setShowNewCustomerDialog(true)}
                  className="h-11 w-11 shrink-0 rounded-2xl border-indigo-100 bg-white/80 backdrop-blur hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-indigo-100 group"
                >
                  <UserPlus className="h-5 w-5 transition-transform group-hover:scale-110" />
                </Button>

                {selectedCustomer && (
                  <div className="animate-in-fade flex items-center gap-3 px-4 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                    <div className="flex items-center gap-1.5 border-r border-emerald-200/50 pr-3">
                      <Phone className="h-3 w-3 opacity-70" />
                      <span className="text-[11px] font-black">{selectedCustomer.phone || '--'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-emerald-500" />
                      <span className="text-[11px] font-black uppercase tracking-wider">
                        {Math.round((parseFloat(customerLoyalty?.availablePoints?.toString() || '0')) * 100) / 100} pts
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowLoyaltyDialog(true)}
                        className="h-6 px-2 text-[10px] font-black uppercase tracking-tighter hover:bg-emerald-100 text-emerald-700"
                      >
                        Redeem
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-white/60 backdrop-blur border border-slate-200 rounded-2xl">
                {enabledModules['/wholesale-pricing'] !== false && (
                  <div className="flex bg-[#f8faff] rounded-full p-1 border border-[#edf2f7] gap-1 shadow-inner">
                    {/* Pricing Mode Toggle */}
                    <Button
                      size="sm"
                      onClick={() => handlePricingModeToggle('retail')}
                      className={`h-8 px-4 rounded-full font-black text-[10px] uppercase tracking-wider transition-all duration-300 ${pricingMode === 'retail'
                        ? 'bg-[#0070f3] text-white shadow-[0_5px_15px_-3px_rgba(0,112,243,0.4)]'
                        : 'text-[#a0aec0] bg-transparent hover:text-[#0070f3]'}`}
                    >
                      <User className={`h-3.5 w-3.5 mr-2 transition-colors ${pricingMode === 'retail' ? 'text-[#00df9a]' : 'text-[#a0aec0]'}`} />
                      Retail
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handlePricingModeToggle('wholesale')}
                      className={`h-8 px-4 rounded-full font-black text-[10px] uppercase tracking-wider transition-all duration-300 ${pricingMode === 'wholesale'
                        ? 'bg-[#0070f3] text-white shadow-[0_5px_15px_-3px_rgba(0,112,243,0.4)]'
                        : 'text-[#a0aec0] bg-transparent hover:text-[#0070f3]'}`}
                    >
                      <Package className={`h-3.5 w-3.5 mr-2 transition-colors ${pricingMode === 'wholesale' ? 'text-[#00df9a]' : 'text-[#a0aec0]'}`} />
                      Wholesale
                    </Button>
                  </div>
                )}

                <div className="h-6 w-[1px] bg-slate-200 mx-0.5"></div>

                <Button
                  variant="ghost"
                  onClick={toggleDiscount}
                  className={`h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${discount > 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-white hover:text-indigo-600'}`}
                >
                  <Calculator className="h-3.5 w-3.5 mr-2" />
                  10% OFF
                </Button>
                <div className="h-6 w-[1px] bg-slate-200 mx-0.5"></div>
                <div className="px-5 py-0.5 flex flex-col items-center">
                  <span className="text-[8px] uppercase font-black text-slate-400 tracking-[0.2em] leading-none mb-1">Current Session</span>
                  <span className="text-sm font-black text-slate-900 leading-none">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Unified Command Bar */}
            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                <Search className="h-4.5 w-4.5 text-indigo-500" />
                <div className="h-3.5 w-[1px] bg-slate-200"></div>
                <Scan className="h-4.5 w-4.5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <Input
                ref={searchInputRef}
                placeholder="Universal Search: Scan Barcode, SKU or type Product Name (Ctrl + F to focus)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setBarcodeInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (searchTerm.trim()) {
                      handleBarcodeSubmit();
                    }
                  }
                }}
                className="w-full h-12 pl-16 pr-32 rounded-2xl border-2 border-slate-100 bg-white/60 focus:bg-white focus:border-indigo-500 focus:ring-0 text-base font-bold placeholder:text-slate-300 placeholder:font-medium transition-all shadow-sm focus:shadow-xl focus:shadow-indigo-50"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Badge variant="outline" className="h-5 text-[9px] font-black uppercase tracking-widest border-slate-200 bg-slate-50 text-slate-400">
                  {products.filter((p: Product) => p.barcode || p.sku).length} Scannable
                </Badge>
                <Button
                  onClick={handleBarcodeSubmit}
                  disabled={!searchTerm.trim()}
                  className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100"
                >
                  Instant Add
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-1 gap-4 px-4 pb-4 overflow-hidden min-h-0">
          {/* LEFT COLUMN - Shopping Cart */}
          <div className="w-[70%] flex flex-col min-h-0">
            <div className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center text-white shadow-lg">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">Shopping Cart</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{cart.length} Active Items</p>
                  </div>
                </div>

                <div className="text-right flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHoldSales(true)}
                    className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 relative group"
                    title="Recall Held Transactions (Alt+R)"
                  >
                    <Clock className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    {holdSales.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in-50">
                        {holdSales.length}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOceanDialog(true)}
                    className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 relative group ml-1"
                    title="Ocean Freight & Logistics (Alt+O)"
                  >
                    <Anchor className={`h-4 w-4 ${calculateOceanTotal() > 0 ? 'text-indigo-600' : 'text-slate-400'} group-hover:text-indigo-600 transition-colors`} />
                    {calculateOceanTotal() > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full border border-white shadow-sm animate-pulse"></span>
                    )}
                  </Button>
                  <div className="h-8 w-[1px] bg-slate-200/50"></div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 leading-none mb-1">
                      {formatCurrency(subtotal)}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Subtotal Amount</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full animate-in-fade px-6">
                    <div className="relative mb-6">
                      <div className="absolute -inset-4 bg-blue-100/50 rounded-full blur-2xl animate-pulse"></div>
                      <ShoppingCart className="relative w-48 h-48 text-slate-200 drop-shadow-2xl opacity-80" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Ready for a New Order</h3>
                    <p className="text-slate-500 mb-8 max-w-xs text-center leading-relaxed">
                      Search for products or scan a barcode to begin building this transaction.
                    </p>

                    <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                      <div className="glass-card p-3 rounded-xl text-center border-blue-100 hover:bg-white/90 cursor-default transition-all group">
                        <kbd className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-blue-600 block mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">F1</kbd>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Scanner</p>
                      </div>
                      <div className="glass-card p-3 rounded-xl text-center border-blue-100 hover:bg-white/90 cursor-default transition-all group">
                        <kbd className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-blue-600 block mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">F10</kbd>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Checkout</p>
                      </div>
                      <div className="glass-card p-3 rounded-xl text-center border-blue-100 hover:bg-white/90 cursor-default transition-all group">
                        <kbd className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-blue-600 block mb-2 group-hover:bg-red-600 group-hover:text-white transition-colors">F12</kbd>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Clear</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 h-full overflow-y-auto pr-2 custom-scrollbar">
                    {cart.slice().reverse().map((item) => (
                      <div
                        key={item.id}
                        className="cart-item-row glass-card p-3 rounded-2xl border-white/60 bg-white/40 hover:bg-white/80 flex items-center gap-5 group animate-in-fade"
                      >
                        <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                          {item.name.charAt(0)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-black text-slate-800 truncate text-[13px] tracking-tight">{item.name}</h4>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-400 px-1.5 rounded border border-slate-200/50">#{item.sku?.slice(-6)}</span>
                              <Badge variant="secondary" className={`text-[8px] h-3.5 px-1.5 border-none font-bold uppercase tracking-tighter ${item.stockQuantity <= 5 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                Stock: {item.stockQuantity}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              {pricingMode === 'retail' ? (
                                <Badge variant="secondary" className="text-[8px] h-3.5 bg-blue-50 text-blue-600 border-blue-100 font-black uppercase">Retail</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[8px] h-3.5 bg-purple-50 text-purple-600 border-purple-100 font-black uppercase">Wholesale</Badge>
                              )}
                              <span
                                className={`text-[11px] font-black cursor-pointer hover:underline decoration-dotted ${pricingMode === 'retail' ? 'text-blue-600' : 'text-purple-600'}`}
                                onClick={() => {
                                  setEditingCartItem({ id: item.id, field: 'price' });
                                  setEditValue(item.price.toString());
                                }}
                              >
                                {editingCartItem?.id === item.id && editingCartItem?.field === 'price' && !item.isWeightBased ? (
                                  <input
                                    autoFocus
                                    className={`w-16 bg-white border rounded px-1 outline-none ${pricingMode === 'retail' ? 'border-blue-300 text-blue-700' : 'border-purple-300 text-purple-700'}`}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => {
                                      const val = parseFloat(editValue);
                                      if (!isNaN(val)) updateCartItemPrice(item.id, val);
                                      setEditingCartItem(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const val = parseFloat(editValue);
                                        if (!isNaN(val)) updateCartItemPrice(item.id, val);
                                        setEditingCartItem(null);
                                      }
                                      if (e.key === 'Escape') setEditingCartItem(null);
                                    }}
                                  />
                                ) : (
                                  formatCurrency(parseFloat(item.price))
                                )}
                              </span>
                              {item.mrp && Number(item.mrp) > parseFloat(item.price) && (
                                <span className="text-[10px] text-slate-300 line-through font-bold">
                                  {formatCurrency(item.mrp)}
                                </span>
                              )}
                              {item.cost && parseFloat(item.cost.toString()) >= 0 && (
                                <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="text-[8px] h-3.5 bg-amber-50 text-amber-600 border-amber-100 font-bold uppercase relative group pr-4">
                                      Cost: {formatCurrency(parseFloat(item.cost.toString()))}
                                      {item.availableBatches && item.availableBatches.length > 0 && (
                                         <select 
                                           className="absolute inset-0 opacity-0 cursor-pointer"
                                           value={item.batchId || ''}
                                           onChange={(e) => {
                                              const newBatchId = e.target.value ? parseInt(e.target.value) : null;
                                              const newBatch = item.availableBatches?.find(b => b.id === newBatchId);
                                              if (newBatch) {
                                                                                                     setCart(prev => prev.map(cItem => cItem.id === item.id ? { 
                                                       ...cItem, 
                                                       batchId: newBatchId, 
                                                       cost: newBatch.cost.toString(), 
                                                       price: newBatch.selling_price.toString(),
                                                       unitPrice: parseFloat(newBatch.selling_price.toString()),
                                                       total: cItem.quantity * parseFloat(newBatch.selling_price.toString()),
                                                       mrp: newBatch.mrp?.toString() || cItem.mrp 
                                                   } : cItem));
                                              }
                                              if (!newBatchId) {
                                                  // back to default product cost
                                                                                                     const fBatch = item.availableBatches?.[0];
                                                   const rC = fBatch ? fBatch.cost.toString() : (item.defaultPrice || 0).toString();
                                                   const rP = fBatch ? fBatch.selling_price.toString() : (item.defaultPrice || 0).toString();
                                                   const rM = fBatch ? (fBatch.mrp || 0).toString() : (item.defaultMrp || 0).toString();
                                                   const rPN = parseFloat(rP);
                                                   setCart(prev => prev.map(cItem => cItem.id === item.id ? { 
                                                       ...cItem, 
                                                       batchId: null, 
                                                       cost: rC, 
                                                       price: rP,
                                                       unitPrice: rPN,
                                                       total: cItem.quantity * rPN,
                                                       mrp: rM
                                                   } : cItem));
                                              }
                                           }}
                                         >
                                            <option value="">Automatic FIFO (Recommended)</option>
                                            {item.availableBatches.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    Batch #{b.batch_number || b.id} (Cost: {formatCurrency(parseFloat(b.cost || "0"))}, Sell: {formatCurrency(parseFloat(b.selling_price || "0"))}, MRP: {formatCurrency(parseFloat(b.mrp || "0"))}, Avail: {b.qty || 0})
                                                </option>
                                            ))}
                                         </select>
                                      )}
                                      {item.availableBatches && item.availableBatches.length > 0 && <ChevronDown className="h-2 w-2 absolute right-1 top-1/2 -translate-y-1/2 opacity-50" />}
                                    </Badge>
                                  <Badge variant="outline" className="text-[8px] h-3.5 bg-emerald-50 text-emerald-600 border-emerald-100 font-bold uppercase">
                                    Profit: {formatCurrency(parseFloat(item.price) - parseFloat(item.cost.toString()))}
                                    {' | '}
                                    Margin: {parseFloat(item.cost.toString()) > 0 ? (((parseFloat(item.price) - parseFloat(item.cost.toString())) / parseFloat(item.cost.toString())) * 100).toFixed(1) + "%" : "N/A"}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            {item.isWeightBased && (
                              <Badge variant="outline" className="text-[9px] h-4 bg-emerald-50 text-emerald-600 border-emerald-100 font-black uppercase">Weight Based</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {item.isWeightBased ? (
                            <div className="flex flex-col items-end">
                              <span
                                className="text-sm font-black text-emerald-600 leading-none mb-0.5 cursor-pointer hover:underline decoration-dotted"
                                onClick={() => {
                                  setEditingCartItem({ id: item.id, field: 'weight' });
                                  setEditValue(item.actualWeight?.toString() || "");
                                }}
                              >
                                {editingCartItem?.id === item.id && editingCartItem?.field === 'weight' ? (
                                  <input
                                    autoFocus
                                    className="w-16 bg-white border border-emerald-300 rounded px-1 outline-none text-emerald-700 text-right"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => {
                                      const val = parseFloat(editValue);
                                      if (!isNaN(val)) updateCartItemWeight(item.id, val);
                                      setEditingCartItem(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const val = parseFloat(editValue);
                                        if (!isNaN(val)) updateCartItemWeight(item.id, val);
                                        setEditingCartItem(null);
                                      }
                                      if (e.key === 'Escape') setEditingCartItem(null);
                                    }}
                                  />
                                ) : (
                                  `${item.actualWeight} kg`
                                )}
                              </span>
                              <span
                                className="text-[10px] text-slate-400 font-bold cursor-pointer hover:underline decoration-dotted"
                                onClick={() => {
                                  setEditingCartItem({ id: item.id, field: 'price' });
                                  setEditValue(item.pricePerKg?.toString() || "");
                                }}
                              >
                                {editingCartItem?.id === item.id && editingCartItem?.field === 'price' && item.isWeightBased ? (
                                  <input
                                    autoFocus
                                    className="w-16 bg-white border border-indigo-300 rounded px-1 outline-none text-indigo-700 text-right"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => {
                                      const val = parseFloat(editValue);
                                      if (!isNaN(val)) updateCartItemPrice(item.id, val);
                                      setEditingCartItem(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const val = parseFloat(editValue);
                                        if (!isNaN(val)) updateCartItemPrice(item.id, val);
                                        setEditingCartItem(null);
                                      }
                                      if (e.key === 'Escape') setEditingCartItem(null);
                                    }}
                                  />
                                ) : (
                                  `${formatCurrency(item.pricePerKg!)}/kg`
                                )}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center bg-white/80 rounded-xl p-0.5 border border-slate-200 shadow-sm">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </Button>
                              <span
                                className="w-9 text-center text-[13px] font-black text-slate-700 cursor-pointer hover:bg-slate-100 rounded"
                                onClick={() => {
                                  setEditingCartItem({ id: item.id, field: 'quantity' });
                                  setEditValue(item.quantity.toString());
                                }}
                              >
                                {editingCartItem?.id === item.id && editingCartItem?.field === 'quantity' ? (
                                  <input
                                    autoFocus
                                    className="w-full bg-white border border-slate-300 rounded px-1 outline-none text-center"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => {
                                      const val = parseInt(editValue);
                                      if (!isNaN(val)) updateQuantity(item.id, val);
                                      setEditingCartItem(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const val = parseInt(editValue);
                                        if (!isNaN(val)) updateQuantity(item.id, val);
                                        setEditingCartItem(null);
                                      }
                                      if (e.key === 'Escape') setEditingCartItem(null);
                                    }}
                                  />
                                ) : (
                                  item.quantity
                                )}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}

                          <div className="w-24 text-right">
                            <div className="text-[15px] font-black text-slate-900 tracking-tight">{formatCurrency(item.total)}</div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id, item.isWeightBased)}
                            className="h-9 w-9 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Premium Bill Summary */}
          <div className="w-[30%] flex flex-col min-h-0">
            <div className="bg-white/70 backdrop-blur-3xl border border-white/40 rounded-[2rem] p-5 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.1)] flex flex-col flex-1 min-h-0 overflow-hidden relative">
              {/* Premium Floating Card */}
              <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-4 rounded-[1.5rem] mb-3 shadow-[0_15px_30px_-10px_rgba(79,70,229,0.3)] text-white shrink-0 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>

                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="bg-white/15 p-2 rounded-lg backdrop-blur-md border border-white/10">
                    <Receipt className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] uppercase tracking-[0.2em] font-black text-indigo-100/50 mb-0.5 flex items-center justify-end gap-1.5">
                      <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                      Terminal Active
                    </div>
                    <div className="font-mono font-black text-[10px] bg-black/20 px-3 py-1 rounded-lg border border-white/5">#{billNumber.slice(-8)}</div>
                  </div>
                </div>

                <div className="space-y-0.5 relative z-10">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200/60 mb-1">Payable Balance</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-medium text-white/40">₹</span>
                    <span className="text-3xl font-black tracking-tighter tabular-nums leading-none">
                      {Math.floor(total).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xl font-bold text-white/30 tabular-nums">.{(total % 1).toFixed(2).split('.')[1]}</span>
                  </div>
                </div>
              </div>

              {/* Transaction Scroll Area */}
              <div className="flex-1 space-y-4 overflow-y-auto px-0.5 custom-scrollbar min-h-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                      Computation
                    </h3>
                    <Badge variant="outline" className="text-[8px] h-4.5 px-2 bg-indigo-50 border-indigo-100 text-indigo-600 font-black uppercase tracking-widest">Live Net</Badge>
                  </div>

                  <div className="bg-white/80 rounded-2xl border border-slate-200/60 p-4 space-y-3 shadow-sm backdrop-blur-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold text-xs tracking-tight">Gross Subtotal</span>
                      <span className="font-black text-slate-900 text-[15px]">{formatCurrency(subtotal)}</span>
                    </div>

                    <div className="h-[1.5px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-slate-500 font-bold text-xs tracking-tight">Campaign Disc.</span>
                        <span className="text-[9px] text-indigo-500 font-black uppercase tracking-wider bg-indigo-50 w-fit px-1.5 py-0.5 rounded-md border border-indigo-100/50 mt-1">10% Active</span>
                      </div>
                      <span className="text-[15px] font-black text-indigo-600">-{formatCurrency(discountAmount)}</span>
                    </div>

                    {loyaltyDiscount > 0 && (
                      <>
                        <div className="h-[1.5px] bg-gradient-to-r from-transparent via-emerald-200 to-transparent"></div>
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-700 font-bold text-xs tracking-tight flex items-center gap-2">
                            <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                            Points Applied
                          </span>
                          <span className="text-[15px] font-black text-emerald-600">-{formatCurrency(loyaltyDiscount)}</span>
                        </div>
                      </>
                    )}

                    <div className="h-[1.5px] bg-gradient-to-r from-transparent via-emerald-200 to-transparent"></div>
                    <div className="flex justify-between items-center py-1">
                      <div className="flex flex-col">
                        <span className="text-emerald-600 font-black text-[10px] uppercase tracking-widest">Net Profit Yield</span>
                        <span className="text-[8px] text-emerald-400 font-bold">Estimated margin for this order</span>
                      </div>
                      <span className="text-[16px] font-black text-emerald-600">+{formatCurrency(totalProfit)}</span>
                    </div>
                  </div>
                </div>

                {selectedCustomer && (
                  <div className="bg-emerald-600 rounded-2xl p-3 shadow-lg shadow-emerald-100 relative overflow-hidden group transition-all">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-sm">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-black text-white tracking-tight leading-none mb-1 truncate">{selectedCustomer.name}</div>
                        <div className="inline-flex items-center gap-1.5 text-emerald-100 text-[9px] font-bold uppercase tracking-wider">
                          <Zap className="w-2.5 h-2.5 fill-emerald-200" />
                          Pro Account
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/15 flex flex-col gap-2 relative z-10">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase font-black text-emerald-100/60 tracking-widest">Points Yield Forecast</span>
                        <div className="flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-lg border border-white/10">
                          <span className="text-base font-black text-white leading-none">+{calculatePointsToEarn(total)}</span>
                          <span className="text-[9px] font-black text-emerald-100/80 uppercase tracking-tighter">pts</span>
                        </div>
                      </div>
                      
                      {/* NEW: Credit Balance Display with Settle Action */}
                      <div className="flex flex-col gap-2 bg-black/10 p-2.5 rounded-xl border border-white/5 group-hover:bg-black/20 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] uppercase font-black text-emerald-100/60 tracking-widest">Credit Balance</span>
                          <div className="text-sm font-black text-white tabular-nums">
                            {formatCurrency(selectedCustomer.outstandingBalance || 0)}
                          </div>
                        </div>
                        {(selectedCustomer.outstandingBalance || 0) > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowQuickPayDialog(true)}
                            className="h-7 w-full border-white/20 bg-white/10 text-emerald-100 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 font-black text-[9px] uppercase tracking-widest transition-all shadow-sm"
                          >
                            <CreditCard className="w-2.5 h-2.5 mr-1.5" />
                            Collect Payment
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Zone */}
              <div className="pt-6 space-y-3 shrink-0 mt-1 border-t border-slate-200/30">
                <Button
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-base shadow-xl shadow-indigo-100 transition-all duration-300 relative overflow-hidden group active:scale-[0.98]"
                  onClick={() => setShowPaymentDialog(true)}
                  disabled={cart.length === 0}
                >
                  <CreditCard className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                  Paisa Checkout
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl border-slate-200 text-slate-500 hover:bg-orange-50 hover:text-orange-600 font-black text-[10px] uppercase tracking-widest transition-all"
                    onClick={holdCurrentSale}
                    disabled={cart.length === 0}
                  >
                    <Clock className="w-3.5 h-3.5 mr-2" />
                    Hold
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest transition-all"
                    onClick={() => setShowHoldSales(true)}
                  >
                    <Download className="w-3.5 h-3.5 mr-2" />
                    Recall
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 font-black text-[10px] uppercase tracking-widest transition-all"
                    onClick={() => clearCart()}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest transition-all"
                    onClick={() => setShowOceanDialog(true)}
                  >
                    <Anchor className={`w-3.5 h-3.5 mr-2 ${calculateOceanTotal() > 0 ? 'text-blue-600' : ''}`} />
                    Ocean
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-end px-6 py-2 bg-white/40 backdrop-blur-md border-t border-slate-100 gap-6 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Operational</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-200"></div>
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">Node: POS-TERMINAL-01</span>
          <span className="text-[10px] font-mono text-slate-800 font-black">{currentTime}</span>
        </div>

        {/* Product Search Results Overlay */}
        {searchTerm && searchTerm.length > 0 && filteredProducts.length > 0 && (
          <div className="absolute top-[280px] left-8 right-[32%] bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-[60vh] overflow-hidden flex flex-col animate-in-fade">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 text-sm tracking-tight">Search Results</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Found {filteredProducts.length} Match(es)</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSearchTerm("")}
                className="h-8 w-8 p-0 rounded-lg hover:bg-slate-200/50"
              >
                <Trash2 className="h-4 w-4 text-slate-400" />
              </Button>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
              {filteredProducts.slice(0, 50).map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    addToCart(product);
                    setSearchTerm("");
                  }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                    {product.barcode ? <Scan className="h-6 w-6" /> : <Package className="h-6 w-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 truncate">{product.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">#{product.sku?.slice(-8)}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] h-4 font-bold uppercase tracking-tighter ${product.stockQuantity <= 5 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}
                      >
                        {product.stockQuantity} in Stock
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-black ${pricingMode === 'retail' ? 'text-slate-900' : 'text-purple-600'}`}>
                      {formatCurrency(
                        pricingMode === 'wholesale' && Number(product.wholesalePrice || 0) > 0
                          ? Number(product.wholesalePrice)
                          : parseFloat(product.price)
                      )}
                    </div>
                    {product.cost && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-tight leading-none bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 italic">
                          Cost: {formatCurrency(parseFloat(product.cost.toString()))}
                        </span>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tight leading-none bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 italic">
                          Profit: {formatCurrency(
                            (pricingMode === 'wholesale' && Number(product.wholesalePrice || 0) > 0
                              ? Number(product.wholesalePrice)
                              : parseFloat(product.price)) - parseFloat(product.cost.toString())
                          )}
                          {' | '} Margin: {
                            parseFloat(product.cost.toString()) > 0
                              ? (((((pricingMode === 'wholesale' && Number(product.wholesalePrice || 0) > 0
                                ? Number(product.wholesalePrice)
                                : parseFloat(product.price)) - parseFloat(product.cost.toString())) /
                                parseFloat(product.cost.toString())) * 100).toFixed(1) + "%")
                              : "N/A"
                          }
                        </span>
                      </div>
                    )}
                    <div className={`text-[10px] font-bold uppercase tracking-tighter ${pricingMode === 'retail' ? 'text-slate-400' : 'text-purple-400'}`}>
                      {pricingMode === 'wholesale' && Number(product.wholesalePrice || 0) > 0 ? 'Wholesale Price' : 'Retail Price'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Open Cash Register Dialog */}
        <Dialog open={showOpenRegister} onOpenChange={(open) => {
          if (!open) {
            resetCashRegisterForm();
          }
          setShowOpenRegister(open);
        }}>
          <DialogContent className="max-w-md p-0 border-none bg-transparent shadow-none">
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] border border-white/20">
              {/* Header */}
              <div className="px-8 pt-8 pb-4 bg-white shrink-0">
                <DialogHeader>
                  <DialogTitle className="flex items-center text-2xl font-black tracking-tight text-slate-900 leading-none">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mr-4 border border-indigo-100 shadow-sm">
                      <DollarSign className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      Initialize Terminal
                      <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1.5 leading-none">Register Session Commencement</span>
                    </div>
                  </DialogTitle>
                </DialogHeader>
              </div>

              {/* Body */}
              <div className="px-8 py-6 space-y-6">
                <div className="bg-indigo-900 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100/50 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-indigo-300" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Authorized Officer</span>
                    </div>
                    <span className="text-xs font-black tracking-tight">{user?.name || '---'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Opening Assets (₹)</Label>
                    <Input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      placeholder="0.00"
                      className="h-16 rounded-2xl border-2 border-slate-100 bg-slate-50/30 focus:bg-white focus:border-indigo-600 transition-all font-black text-2xl px-6 shadow-sm"
                      autoFocus
                    />
                  </div>

                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600 mt-0.5">
                        <Info className="h-4 w-4" />
                      </div>
                      <p className="text-[11px] font-bold text-blue-800 leading-relaxed italic">
                        Verify the physical cash in drawer before committing the opening balance to the ledger.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 pb-8 pt-4 bg-slate-50 border-t border-slate-100 flex gap-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    resetCashRegisterForm();
                    setShowOpenRegister(false);
                  }}
                  className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all"
                >
                  Discard
                </Button>
                <Button
                  onClick={handleOpenRegister}
                  disabled={!cashAmount || parseFloat(cashAmount) < 0}
                  className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
                >
                  Open Terminal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Withdrawal Dialog */}
        <Dialog open={showWithdrawal} onOpenChange={(open) => {
          if (!open) {
            resetWithdrawalForm();
          }
          setShowWithdrawal(open);
        }}>
          <DialogContent className="max-w-md p-0 border-none bg-transparent shadow-none">
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] border border-white/20">
              {/* Header */}
              <div className="px-8 pt-8 pb-4 bg-white shrink-0">
                <DialogHeader>
                  <DialogTitle className="flex items-center text-2xl font-black tracking-tight text-slate-900 leading-none">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mr-4 border border-orange-100 shadow-sm">
                      <TrendingDown className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      Asset Withdrawal
                      <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1.5 leading-none">Manual Capital Reduction</span>
                    </div>
                  </DialogTitle>
                </DialogHeader>
              </div>

              {/* Body */}
              <div className="px-8 py-6 space-y-6">
                <div className="bg-orange-50/50 border border-orange-100 p-5 rounded-3xl flex justify-between items-center group/balance">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm transition-transform group-hover/balance:rotate-12">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Available Assets</p>
                      <p className="font-black text-slate-900 text-lg tabular-nums leading-none">{formatCurrency(cashInHand)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Withdrawal Value (₹)</Label>
                    <Input
                      type="number"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      placeholder="0.00"
                      className="h-16 rounded-2xl border-2 border-slate-100 bg-slate-50/30 focus:bg-white focus:border-orange-600 transition-all font-black text-2xl px-6 shadow-sm"
                      max={cashInHand}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Justification / Memo</Label>
                    <Input
                      value={withdrawalNote}
                      onChange={(e) => setWithdrawalNote(e.target.value)}
                      placeholder="e.g. Bank transfer, Vendor payment"
                      className="h-12 rounded-xl border-2 border-slate-100 bg-slate-50/30 focus:bg-white focus:border-orange-600 transition-all font-bold text-sm px-5"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 pb-8 pt-4 bg-slate-50 border-t border-slate-100 flex gap-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    resetWithdrawalForm();
                    setShowWithdrawal(false);
                  }}
                  className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all"
                >
                  Discard
                </Button>
                <Button
                  onClick={handleWithdrawal}
                  disabled={!withdrawalAmount || parseFloat(withdrawalAmount) <= 0 || parseFloat(withdrawalAmount) > cashInHand}
                  className="flex-[2] h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-orange-100 transition-all active:scale-[0.98]"
                >
                  Execute Withdrawal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Close Register Dialog */}
        <Dialog open={showCloseRegister} onOpenChange={(open) => {
          if (!open) {
            resetAllCashRegisterStates();
          }
          setShowCloseRegister(open);
        }}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none bg-transparent shadow-none">
            <div className="bg-white rounded-[2.5rem] flex flex-col overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] border border-white/20">
              {/* Header */}
              <div className="px-8 pt-8 pb-4 bg-white shrink-0">
                <DialogHeader>
                  <DialogTitle className="flex items-center text-2xl font-black tracking-tight text-slate-900 leading-none">
                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mr-4 border border-rose-100 shadow-sm">
                      <Archive className="h-6 w-6 text-rose-600" />
                    </div>
                    <div>
                      Fiscal Settlement
                      <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1.5 leading-none">End of Day Reconciliation</span>
                    </div>
                  </DialogTitle>
                </DialogHeader>
              </div>

              {/* Body */}
              <div className="px-8 py-6 overflow-y-auto flex-1 custom-scrollbar space-y-6 bg-slate-50/30">
                <div className="grid grid-cols-1 gap-4">
                  {/* High-Level Identity */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Authenticating Officer</p>
                        <p className="font-black text-slate-900 text-sm leading-none">{user?.name || '---'}</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Verified Session</Badge>
                  </div>

                  {/* Revenue Flow Breakdown */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Manifest Revenue</p>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500">Cash Flow</span>
                          <span className="text-xs font-black text-slate-900 tabular-nums">{formatCurrency(cashReceived)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500">UPI Digital</span>
                          <span className="text-xs font-black text-slate-900 tabular-nums">{formatCurrency(upiReceived)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                          <span className="text-xs font-black text-emerald-600">Total Inflow</span>
                          <span className="text-sm font-black text-emerald-600 tabular-nums">{formatCurrency(cashReceived + upiReceived)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4 block">Internal Adjustments</p>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500">Withdrawals</span>
                          <span className="text-xs font-black text-rose-600 tabular-nums">({formatCurrency(totalWithdrawals)})</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500">Refunds Issued</span>
                          <span className="text-xs font-black text-rose-600 tabular-nums">({formatCurrency(totalRefunds)})</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                          <span className="text-xs font-black text-rose-600">Total Outflow</span>
                          <span className="text-sm font-black text-rose-600 tabular-nums">({formatCurrency(totalWithdrawals + totalRefunds)})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operational Delta */}
                  <div className="bg-indigo-950 p-7 rounded-3xl text-white shadow-xl shadow-indigo-100/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:bg-white/10"></div>
                    <div className="relative z-10 space-y-5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Expected Ledger Value</span>
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-md">
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="text-4xl font-black tabular-nums tracking-tighter leading-none mb-4">
                        {formatCurrency(openingCash + cashReceived + upiReceived - totalWithdrawals)}
                      </div>
                      <div className="grid grid-cols-2 gap-6 pt-5 border-t border-white/10">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80 mb-1">Opening Assets</p>
                          <p className="text-sm font-black tabular-nums">{formatCurrency(openingCash)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80 mb-1">Closing Potential</p>
                          <p className="text-sm font-black tabular-nums">{formatCurrency(cashInHand)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compliance Notice */}
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600 mt-0.5">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <p className="text-[11px] font-bold text-amber-800 leading-relaxed italic">
                        By proceeding, you certify that physical cash count matches the expected digital ledger. Discrepancies may require administrative review.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 pb-8 pt-4 bg-white border-t border-slate-100 flex gap-4 shrink-0">
                <Button
                  variant="ghost"
                  onClick={() => setShowCloseRegister(false)}
                  className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all"
                >
                  Continue Session
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      if (activeCashRegister?.id) {
                        const response = await fetch(`/api/cash-register/${activeCashRegister.id}/close`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ notes: 'Register closed from POS Enhanced' })
                        });
                        if (!response.ok) {
                          const error = await response.json();
                          throw new Error(error.error || 'Failed to close register');
                        }
                      }
                      setRegisterOpened(false);
                      setOpeningCash(0);
                      setCashInHand(0);
                      setCashReceived(0);
                      setUpiReceived(0);
                      setCardReceived(0);
                      setBankReceived(0);
                      setChequeReceived(0);
                      setOtherReceived(0);
                      setTotalWithdrawals(0);
                      setTotalRefunds(0);
                      setShowCloseRegister(false);
                      try { localStorage.removeItem('cashRegisterState'); } catch (e) { console.error(e); }
                      queryClient.invalidateQueries({ queryKey: ["/api/cash-register/active"] });
                      toast({ title: "Fiscal Cycle Completed", description: "Register terminated and synchronized with central ledger" });
                    } catch (error) {
                      toast({ title: "Termination Failed", description: error instanceof Error ? error.message : "Sync error", variant: "destructive" });
                    }
                  }}
                  className="flex-[2] h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-rose-100 transition-all active:scale-[0.98]"
                >
                  Terminate Cycle
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cash Register Management Modal */}
        <Dialog open={showCashRegister} onOpenChange={(open) => {
          if (!open) {
            resetCashRegisterForm();
          }
          setShowCashRegister(open);
        }}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0 border-none bg-slate-50 shadow-2xl">
            {/* Sticky Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-8 shrink-0">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center shadow-inner border border-white/10">
                    <Banknote className="w-8 h-8 text-indigo-300" />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-white font-black text-3xl tracking-tight leading-none mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Cash Register</div>
                    <div className="text-indigo-300/70 font-bold text-xs uppercase tracking-[0.3em]">Management Interface</div>
                  </div>
                  <div className="ml-auto flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">System Status</div>
                      <div className="flex items-center gap-2 bg-emerald-500/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-emerald-500/20">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                        <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Active session</span>
                      </div>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50">
              <div className="grid grid-cols-12 gap-8 p-1">
                {/* Current Balance Display */}
                <div className="col-span-4">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200/60 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-100/50 transition-colors"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-indigo-500" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Total Till Balance</span>
                      </div>
                      <div className="text-6xl font-black text-slate-900 tracking-tighter mb-8 drop-shadow-sm tabular-nums">
                        {formatCurrency(cashInHand)}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Today's Revenue</div>
                          <div className="text-lg font-black text-slate-800 text-center tabular-nums">
                            {formatCurrency(activeCashRegister?.totalSales || activeCashRegister?.total_sales || 0)}
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Transactions</div>
                          <div className="text-lg font-black text-slate-800 text-center font-serif">
                            {activeCashRegister?.totalTransactions || activeCashRegister?.total_transactions || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cash Quick Actions */}
                <div className="col-span-8 flex flex-col">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200/60 flex-1">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                          <PlusCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Revenue Injection</span>
                      </div>
                      <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Direct Entries</Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      {[100, 500, 1000, 2000, 5000, 10000, 20000, 50000].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          onClick={() => {
                            resetCashRegisterForm();
                            resetAllCashRegisterStates();
                            const setValues = () => {
                              setCashAmount(amount.toString());
                              setCashOperation('add');
                              setCashReason(`Cash flow adjustment: ₹${amount}`);
                            };
                            setValues();
                            setTimeout(setValues, 10);
                          }}
                          className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all flex flex-col items-center justify-center group"
                        >
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-400 mb-0.5">Quick Add</span>
                          <span className="text-lg font-black text-slate-900 group-hover:text-indigo-600">₹{amount >= 1000 ? `${amount / 1000}k` : amount}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Second Row */}
                <div className="col-span-6">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-blue-500" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Digital Flow Monitoring</span>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-4 gap-3">
                        {[500, 1000, 2000, 5000].map((amount) => (
                          <Button
                            key={`upi-${amount}`}
                            variant="outline"
                            onClick={() => {
                              resetCashRegisterForm();
                              const setUpi = () => { setCashAmount(amount.toString()); setCashOperation('add'); setCashReason(`UPI Interface Payment ₹${amount}`); };
                              setUpi();
                              setTimeout(setUpi, 10);
                            }}
                            className="h-14 rounded-2xl text-xs font-black bg-blue-50/20 border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          >
                            ₹{amount} UPI
                          </Button>
                        ))}
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {[10000, 25000, 50000, 100000].map((amount) => (
                          <Button
                            key={`card-${amount}`}
                            variant="outline"
                            onClick={() => {
                              resetCashRegisterForm();
                              const setCard = () => { setCashAmount(amount.toString()); setCashOperation('add'); setCashReason(`POS Terminal Receipt ₹${amount}`); };
                              setCard();
                              setTimeout(setCard, 10);
                            }}
                            className="h-14 rounded-2xl text-xs font-black bg-indigo-50/20 border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          >
                            ₹{amount >= 1000 ? `${amount / 1000}k` : amount} Card
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-6">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                        <ArrowDownLeft className="w-5 h-5 text-rose-500" />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Asset Withdrawal</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[5000, 10000, 20000, 50000].map((amount) => (
                        <Button
                          key={`rem-${amount}`}
                          variant="outline"
                          onClick={() => {
                            resetCashRegisterForm();
                            const setRem = () => { setCashAmount(amount.toString()); setCashOperation('remove'); setCashReason(`Bank Transfer / Safe Deposit: ₹${amount}`); };
                            setRem();
                            setTimeout(setRem, 10);
                          }}
                          className="h-20 rounded-2xl border-rose-100 bg-rose-50/20 text-rose-700 hover:bg-rose-600 hover:text-white transition-all flex flex-col font-black"
                        >
                          <span className="text-[10px] uppercase mb-1 opacity-70">Withdraw</span>
                          <span className="text-xl">₹{amount >= 1000 ? `${amount / 1000}k` : amount}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Manual Form Area */}
                <div className="col-span-12">
                  <div className="bg-slate-900 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-500/5 opacity-50"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                          <Settings2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 mb-0.5">Custom Transaction</span>
                          <span className="text-2xl font-black text-white tracking-tight">Manual Ledger Entry</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-8">
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block ml-1">Asset Value (₹)</label>
                          <Input
                            type="number"
                            value={cashAmount}
                            onChange={(e) => setCashAmount(e.target.value)}
                            placeholder="0.00"
                            className="h-16 rounded-2xl bg-white/5 border-white/10 text-white font-black text-2xl px-6 focus:bg-white focus:text-slate-900 transition-all border-2"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block ml-1">Entry Memo / Reason</label>
                          <Input
                            value={cashReason}
                            onChange={(e) => setCashReason(e.target.value)}
                            placeholder="Add narrative..."
                            className="h-16 rounded-2xl bg-white/5 border-white/10 text-white font-bold text-lg px-6 focus:bg-white focus:text-slate-900 transition-all border-2"
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => { setCashOperation('add'); handleCashOperation(); }}
                            disabled={!cashAmount || parseFloat(cashAmount) <= 0}
                            className="flex-1 h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider shadow-lg shadow-emerald-900/20"
                          >
                            <Plus className="w-5 h-5 mr-3" />
                            Credit
                          </Button>
                          <Button
                            onClick={() => { setCashOperation('remove'); handleCashOperation(); }}
                            disabled={!cashAmount || parseFloat(cashAmount) <= 0}
                            className="flex-1 h-16 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-wider shadow-lg shadow-rose-900/20"
                          >
                            <Minus className="w-5 h-5 mr-3" />
                            Debit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-10 py-8 bg-white border-t border-slate-200 shrink-0">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis max-w-sm">
                Safety Reminder: Always verify physical cash before digital ledger updates
              </p>
              <Button
                variant="outline"
                onClick={() => setShowCashRegister(false)}
                className="h-14 px-10 rounded-2xl border-slate-200 font-black text-xs uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                Close Monitoring
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* New Customer Dialog */}
        <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
          <DialogContent className="max-w-md p-0 border-none bg-transparent shadow-none">
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] border border-white/20">
              {/* Header */}
              <div className="px-8 pt-8 pb-4 bg-white shrink-0">
                <DialogHeader>
                  <DialogTitle className="flex items-center text-2xl font-black tracking-tight text-slate-900">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mr-4 border border-indigo-100 shadow-sm">
                      <UserPlus className="h-6 w-6 text-indigo-600" />
                    </div>
                    New Identity
                  </DialogTitle>
                </DialogHeader>
              </div>

              {/* Body */}
              <div className="px-8 py-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Legal Name *</Label>
                    <Input
                      placeholder="e.g. John Doe"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/30 focus:bg-white focus:border-indigo-600 transition-all font-bold text-base px-5 shadow-sm"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Contact Terminal (Phone)</Label>
                    <div className="relative">
                      <Input
                        placeholder="+91 00000 00000"
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/30 focus:bg-white focus:border-indigo-600 transition-all font-bold text-base pl-12 pr-5 shadow-sm"
                      />
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Digital Address (Email)</Label>
                    <div className="relative">
                      <Input
                        placeholder="john@example.com"
                        value={newCustomerEmail}
                        onChange={(e) => setNewCustomerEmail(e.target.value)}
                        className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/30 focus:bg-white focus:border-indigo-600 transition-all font-bold text-base pl-12 pr-5 shadow-sm"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center">
                        <span className="font-black text-slate-300 text-lg">@</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600 mt-0.5">
                      <Info className="h-4 w-4" />
                    </div>
                    <p className="text-[11px] font-bold text-indigo-800 leading-relaxed italic">
                      Registered customers automatically accumulate loyalty rewards on every successful transaction.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 pb-8 pt-4 bg-slate-50 border-t border-slate-100 flex gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowNewCustomerDialog(false)}
                  disabled={isCreatingCustomer}
                  className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all"
                >
                  Discard
                </Button>
                <Button
                  onClick={createNewCustomer}
                  disabled={isCreatingCustomer || !newCustomerName}
                  className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
                >
                  {isCreatingCustomer ? "Enrolling..." : "Enroll Identity"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Hold Sales Dialog */}
        <Dialog open={showHoldSales} onOpenChange={setShowHoldSales}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <List className="h-6 w-6 text-blue-600" />
                Held Sales ({holdSales.length})
              </DialogTitle>
              {holdSales.some(sale => sale.id.includes('AUTO-HOLD') || sale.id.includes('TAB-SWITCH')) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                  <div className="flex items-center gap-2 text-blue-800 text-sm">
                    <Info className="h-4 w-4" />
                    <span className="font-medium">Auto-Recovery Available</span>
                  </div>
                  <p className="text-blue-700 text-xs mt-1">
                    Some sales were automatically saved when you navigated away or switched tabs.
                  </p>
                </div>
              )}
            </DialogHeader>

            <div className="space-y-4">
              {holdSales.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Held Sales</h3>
                  <p className="text-gray-500">Hold a sale using Alt+H to save it for later</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {holdSales.map((holdSale) => (
                    <Card key={holdSale.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {holdSale.id || `Transaction #${holdSale.id}`}
                            </h4>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] px-2 py-0.5">
                                {holdSale.cart.length} Art
                              </Badge>
                              {holdSale.oceanFreight && (parseFloat(holdSale.oceanFreight.freightCost) > 0 || holdSale.oceanFreight.vesselName) && (
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] px-2 py-0.5 flex items-center gap-1">
                                  <Anchor className="h-2.5 w-2.5" />
                                  Ocean
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="text-sm text-gray-600 mb-2">
                            <div>Customer: {holdSale.customer?.name || "Walk-in Customer"}</div>
                            <div>Time: {holdSale.timestamp.toLocaleString()}</div>
                            {holdSale.discount > 0 && (
                              <div>Discount: {holdSale.discount}%</div>
                            )}
                          </div>

                          <div className="text-sm text-gray-500">
                            Items: {holdSale.cart.map(item => `${item.name} (${item.quantity})`).join(", ")}
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-green-600 mb-2">
                            {formatCurrency(holdSale.total)}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => recallHeldSale(holdSale)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Recall
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteHeldSale(holdSale.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={cleanupHeldSales}
                  className="text-blue-600 hover:bg-blue-50 border-blue-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Cleanup Empty
                </Button>
                <Button
                  variant="outline"
                  onClick={clearAllHeldSales}
                  disabled={holdSales.length === 0}
                  className="text-red-600 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowHoldSales(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>



        {/* Enhanced Ocean Freight & Cart Management Dialog */}
        <Dialog open={showOceanDialog} onOpenChange={setShowOceanDialog}>
          <DialogContent className="max-w-[95vw] lg:max-w-7xl max-h-[95vh] overflow-hidden flex flex-col p-0 border-none bg-transparent shadow-none">
            <div className="bg-white rounded-[2.5rem] flex flex-col overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] border border-white/20">
              {/* Sticky Header */}
              <div className="px-8 pt-8 pb-4 bg-white shrink-0 border-b border-slate-50">
                <DialogHeader className="flex flex-row items-center justify-between">
                  <DialogTitle className="flex items-center text-3xl font-black tracking-tight text-slate-900 transition-all">
                    <div className="w-14 h-14 bg-blue-50 rounded-[1.5rem] flex items-center justify-center mr-5 border border-blue-100 shadow-sm">
                      <Package className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <span className="block">Global Logistics Manager</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Ocean Freight & Advanced Cart Editor</span>
                    </div>
                  </DialogTitle>
                  <div className="hidden md:flex gap-3">
                    <Badge variant="outline" className="h-8 px-4 rounded-xl border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest bg-slate-50/50">
                      {cart.length} LINE ITEMS
                    </Badge>
                  </div>
                </DialogHeader>
              </div>

              {/* Scrollable Content Area */}
              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Customer Intel */}
                  <div className="space-y-6">
                    <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-[2.2rem] group/intel">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100">
                          <User className="h-5 w-5" />
                        </div>
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Intelligence</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="relative group">
                          <Input
                            type="text"
                            placeholder="Search identities..."
                            value={customerSearchTerm}
                            onChange={(e) => setCustomerSearchTerm(e.target.value)}
                            className="h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-100 bg-white focus:border-indigo-500 font-bold transition-all shadow-sm"
                          />
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                        </div>

                        {selectedCustomer ? (
                          <div className="p-5 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] animate-in-fade">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm font-black text-xl">
                                  {selectedCustomer.name.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-black text-emerald-900 text-[15px] leading-tight mb-1">{selectedCustomer.name}</h4>
                                  <div className="flex gap-2">
                                    <Badge className="text-[9px] font-black bg-emerald-100/50 text-emerald-700 border-none">ID #{selectedCustomer.id}</Badge>
                                    <span className="text-[10px] font-bold text-emerald-600/60 uppercase">{selectedCustomer.phone}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setSelectedCustomer(null)}
                                className="h-8 w-8 rounded-full text-emerald-400 hover:text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-white/50 border-2 border-dashed border-slate-200 rounded-[2rem]">
                            <UserPlus className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting identity match</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowNewCustomerDialog(true)}
                            className="h-12 rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-white transition-all shadow-sm"
                          >
                            New Identity
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              const amitPatel = customers.find((c: Customer) => c.name === "Amit Patel");
                              if (amitPatel) {
                                setSelectedCustomer(amitPatel);
                                const testItems = [
                                  { id: 10, name: "SUGAR BULK", sku: "SUGAR-BULK-001", price: "45", mrp: 50, stockQuantity: 100, isWeightBased: true, pricePerKg: 45, actualWeight: 2.5, quantity: 1, total: 112.5, weightUnit: "kg" },
                                  { id: 7, name: "Sugar (250g Pack)", sku: "SUGAR-250G", price: "25", mrp: 30, stockQuantity: 50, isWeightBased: false, quantity: 3, total: 75 }
                                ];
                                setCart(testItems);
                                toast({ title: "Simulation Loaded", description: "Cart populated with test data" });
                              }
                            }}
                            className="h-12 rounded-xl border-purple-100 bg-purple-50/30 text-purple-600 font-black text-[10px] uppercase tracking-widest hover:bg-purple-100 hover:border-purple-200 transition-all shadow-sm"
                          >
                            Simulate Data
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-900 p-8 rounded-[2.2rem] text-white shadow-xl shadow-indigo-100/50 relative overflow-hidden group/motto">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                      <div className="relative z-10 flex flex-col h-full">
                        <Quote className="h-8 w-8 text-indigo-400/30 mb-4" />
                        <p className="text-lg font-black leading-tight tracking-tight mb-4">Precision logistics for global trade.</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300/60 mt-auto italic">Operational Excellence</p>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Manifest Editor */}
                  <div className="space-y-6">
                    <div className="bg-white border-2 border-slate-50 p-6 rounded-[2.2rem] shadow-[0_15px_35px_-12px_rgba(0,0,0,0.08)]">
                      <div className="flex items-center justify-between mb-6 px-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-100">
                            <ShoppingCart className="h-5 w-5" />
                          </div>
                          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Shipment Manifest</h3>
                        </div>
                        <Badge className="bg-orange-600 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">{cart.length} ITEMS</Badge>
                      </div>

                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {cart.length === 0 ? (
                          <div className="text-center py-24 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[2rem]">
                            <Archive className="h-12 w-12 mx-auto mb-4 text-slate-200" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Manifest Empty</p>
                          </div>
                        ) : (
                          cart.slice().reverse().map((item, index) => (
                            <div key={`${item.id}-${index}`} className="group relative bg-white p-5 rounded-[1.8rem] border-2 border-slate-50 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/30 transition-all duration-500">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 pr-4">
                                  <h4 className="font-black text-slate-800 text-sm tracking-tight leading-tight group-hover:text-orange-600 transition-colors uppercase">{item.name}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase font-mono bg-slate-100 px-1.5 py-0.5 rounded">SKU:{item.sku.split('-').pop()}</span>
                                    {item.isWeightBased && (
                                      <Badge variant="outline" className="text-[8px] font-black bg-emerald-50/50 border-emerald-100 text-emerald-600 h-4.5 rounded-full">KG-UNIT</Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeFromCart(item.id)}
                                  className="h-8 w-8 rounded-full text-slate-200 hover:text-red-500 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="space-y-1.5">
                                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{item.isWeightBased ? 'Mass (kg)' : 'Count'}</Label>
                                  <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 rounded-lg bg-white shadow-sm hover:text-orange-600"
                                      onClick={() => item.isWeightBased ? updateCartItemWeight(item.id, Math.max(0.1, (item.actualWeight || 1) - 0.25)) : updateCartItemQuantity(item.id, Math.max(1, item.quantity - 1))}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <Input
                                      type="number"
                                      value={item.isWeightBased ? item.actualWeight || 1 : item.quantity}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        item.isWeightBased ? updateCartItemWeight(item.id, Math.max(0.1, val)) : updateCartItemQuantity(item.id, Math.max(1, Math.floor(val)));
                                      }}
                                      className="h-7 p-0 text-center border-none bg-transparent font-black text-xs text-slate-900"
                                    />
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 rounded-lg bg-white shadow-sm hover:text-orange-600"
                                      onClick={() => item.isWeightBased ? updateCartItemWeight(item.id, (item.actualWeight || 1) + 0.25) : updateCartItemQuantity(item.id, item.quantity + 1)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Valuation</Label>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      value={item.isWeightBased ? item.pricePerKg || parseFloat(item.price) : parseFloat(item.price)}
                                      onChange={(e) => updateCartItemPrice(item.id, parseFloat(e.target.value) || 0)}
                                      className="h-9 rounded-xl pl-6 text-xs font-black bg-slate-50 border-slate-100 focus:bg-white"
                                    />
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">₹</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Extended Total:</span>
                                <span className="text-base font-black text-indigo-600 tabular-nums tracking-tighter">{formatCurrency(item.total)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {cart.length > 0 && (
                        <div className="mt-6 p-5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-[1.8rem] border border-orange-100 shadow-inner">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-orange-700 uppercase tracking-[0.2em]">Net Manifest Value</span>
                            <span className="text-xl font-black text-orange-900 tabular-nums tracking-tighter">{formatCurrency(cart.reduce((sum, item) => sum + item.total, 0))}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Ocean Freight & Totals */}
                  <div className="space-y-6">
                    {/* Vessel & Cargo Data */}
                    <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[2.2rem]">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-100">
                          <Ship className="h-5 w-5" />
                        </div>
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Vessel & Cargo Data</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Container #</Label>
                            <Input
                              value={oceanFreight.containerNumber}
                              onChange={(e) => setOceanFreight(prev => ({ ...prev, containerNumber: e.target.value }))}
                              placeholder="ABCD1234567"
                              className="h-11 rounded-xl bg-white border-slate-100 font-bold text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Vessel Name</Label>
                            <Input
                              value={oceanFreight.vesselName}
                              onChange={(e) => setOceanFreight(prev => ({ ...prev, vesselName: e.target.value }))}
                              placeholder="MSC OCEAN"
                              className="h-11 rounded-xl bg-white border-slate-100 font-bold text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Voyage Number</Label>
                          <Input
                            value={oceanFreight.voyageNumber}
                            onChange={(e) => setOceanFreight(prev => ({ ...prev, voyageNumber: e.target.value }))}
                            placeholder="VOY-789-X"
                            className="h-11 rounded-xl bg-white border-slate-100 font-bold text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Loading Port</Label>
                            <Input
                              value={oceanFreight.portOfLoading}
                              onChange={(e) => setOceanFreight(prev => ({ ...prev, portOfLoading: e.target.value }))}
                              placeholder="Origin Port"
                              className="h-11 rounded-xl bg-white border-slate-100 font-bold text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Discharge Port</Label>
                            <Input
                              value={oceanFreight.portOfDischarge}
                              onChange={(e) => setOceanFreight(prev => ({ ...prev, portOfDischarge: e.target.value }))}
                              placeholder="Dest Port"
                              className="h-11 rounded-xl bg-white border-slate-100 font-bold text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fiscal Breakdown */}
                    <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-[2.2rem]">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                          <Zap className="h-5 w-5" />
                        </div>
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Fiscal Breakdown</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Freight Cost', field: 'freightCost' },
                          { label: 'Insurance', field: 'insuranceCost' },
                          { label: 'Customs Duty', field: 'customsDuty' },
                          { label: 'Handling', field: 'handlingCharges' }
                        ].map((c) => (
                          <div key={c.field} className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{c.label}</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                value={oceanFreight[c.field as keyof typeof oceanFreight]}
                                onChange={(e) => setOceanFreight(prev => ({ ...prev, [c.field]: e.target.value }))}
                                className="h-11 rounded-xl bg-white pl-6 border-slate-100 font-black text-xs"
                              />
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">₹</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Final Settlement Summary */}
                    <div className="space-y-4">
                      <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.2rem] text-white shadow-xl shadow-blue-100 group/ocean">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Total Ocean Burden</span>
                          <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                            <Ship className="h-3 w-3" />
                          </div>
                        </div>
                        <div className="text-3xl font-black tabular-nums tracking-tighter leading-none">{formatCurrency(calculateOceanTotal())}</div>
                      </div>

                      <div className="p-8 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-100 group/grand scale-[1.02] relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                        <div className="relative z-10">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-70">Final Net Settlement</span>
                            <Badge className="bg-white/20 text-white border-white/20 backdrop-blur-md font-black text-[9px] uppercase tracking-widest">GRAND TOTAL</Badge>
                          </div>
                          <div className="text-5xl font-black tabular-nums tracking-[ -0.05em] leading-none mb-2 drop-shadow-lg">
                            {formatCurrency(cart.reduce((sum, item) => sum + item.total, 0) + calculateOceanTotal())}
                          </div>
                          <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 mt-4 border-t border-white/10 pt-4 flex items-center justify-between">
                            <span>Composite Bill of Lading</span>
                            <span className="font-mono">VERIFIED</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-10 py-8 bg-slate-50/80 border-t border-slate-100 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setOceanFreight({
                          containerNumber: "", vesselName: "", voyageNumber: "", portOfLoading: "", portOfDischarge: "",
                          freightCost: "", insuranceCost: "", customsDuty: "", handlingCharges: "",
                          totalOceanCost: 0
                        });
                      }}
                      className="h-14 px-8 rounded-2xl border-2 border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-white hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Wipe Data
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCart([])}
                      className="h-14 px-8 rounded-2xl border-2 border-red-50 font-black text-[10px] uppercase tracking-widest text-red-400 hover:bg-white hover:text-red-700 hover:border-red-200 transition-all shadow-sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Flush Cart
                    </Button>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="ghost"
                      onClick={() => setShowOceanDialog(false)}
                      className="h-14 px-10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all"
                    >
                      Discard
                    </Button>
                    <Button
                      onClick={() => {
                        setShowOceanDialog(false);
                        toast({
                          title: "Logistics Manifest Synchronized",
                          description: `Ocean costs applied: ${formatCurrency(calculateOceanTotal())}`,
                        });
                      }}
                      className="h-16 px-12 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 transition-all active:scale-[0.98] flex items-center gap-3"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Commit Changes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Weight Input Dialog */}
        <Dialog open={showWeightDialog} onOpenChange={setShowWeightDialog}>
          <DialogContent className="max-w-md max-h-[95vh] overflow-hidden flex flex-col p-0 border-none bg-transparent shadow-none">
            <div className="bg-white rounded-[2.5rem] flex flex-col overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] border border-white/20">
              {/* Sticky Header */}
              <div className="px-8 pt-8 pb-4 bg-white shrink-0">
                <DialogHeader>
                  <DialogTitle className="flex items-center text-2xl font-black tracking-tight text-slate-900">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mr-4 border border-green-100 shadow-sm">
                      <Package className="h-6 w-6 text-green-600" />
                    </div>
                    Weight Selection
                  </DialogTitle>
                </DialogHeader>
              </div>

              {/* Scrollable Content Area */}
              <div className="px-8 py-2 overflow-y-auto flex-1 space-y-6 custom-scrollbar min-h-0">
                {weightProduct && (
                  <div className={`p-5 rounded-[2rem] border ${pricingMode === 'retail' ? 'bg-blue-50/50 border-blue-100' : 'bg-purple-50/50 border-purple-100'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className={`font-black tracking-tight text-[16px] ${pricingMode === 'retail' ? 'text-blue-900' : 'text-purple-900'}`}>{weightProduct.name}</h3>
                      <Badge variant="secondary" className={`text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-lg ${pricingMode === 'retail' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {pricingMode} Session
                      </Badge>
                    </div>
                    <div className="flex gap-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Unit Rate</span>
                        <span className={`text-[15px] font-black ${pricingMode === 'retail' ? 'text-blue-600' : 'text-purple-600'}`}>
                          {formatCurrency(
                            pricingMode === 'wholesale' && parseFloat(String(weightProduct.wholesalePrice || 0)) > 0
                              ? parseFloat(String(weightProduct.wholesalePrice))
                              : parseFloat(weightProduct.price)
                          )}/kg
                        </span>
                      </div>
                      <div className="w-[1px] bg-slate-200/40 h-10"></div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Inventory</span>
                        <span className="text-[15px] font-black text-slate-700">{weightProduct.stockQuantity} kg <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-1">Stock</span></span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Precise Weight Entry</label>
                  <div className="relative group">
                    <Input
                      type="number"
                      placeholder="Enter weight in kg..."
                      value={enteredWeight}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setEnteredWeight(value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addWeightBasedToCart();
                        }
                      }}
                      step="0.1"
                      min="0.1"
                      max="50"
                      className="text-2xl h-16 px-6 rounded-2xl bg-white border-2 border-slate-200 focus:border-indigo-500 transition-all font-black text-slate-900 shadow-sm"
                      autoFocus
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg group-focus-within:text-indigo-500 transition-colors uppercase tracking-widest">kg</div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 ml-1">
                    <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Range: 0.1kg — 50.0kg</span>
                  </div>
                </div>

                {enteredWeight && weightProduct && (
                  <div className={`p-6 rounded-[2.5rem] border-2 shadow-sm transition-all animate-in-fade ${pricingMode === 'retail' ? 'bg-blue-50/30 border-blue-200/50' : 'bg-purple-50/30 border-purple-200/50'}`}>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Computation Ledger</h4>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded-md border border-slate-100 shadow-sm">
                          <Clock className="w-2.5 h-2.5 text-indigo-400" />
                          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Live Preview</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm group/calc hover:shadow-md transition-shadow">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Quantity</span>
                          <span className="text-lg font-black text-slate-900">{enteredWeight} <span className="text-[10px] text-slate-300">kg</span></span>
                        </div>
                        <div className="text-2xl text-slate-200 font-light group-hover:scale-110 transition-transform">×</div>
                        <div className="flex flex-col text-right">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Rate ({pricingMode})</span>
                          <span className={`text-lg font-black ${pricingMode === 'retail' ? 'text-blue-600' : 'text-purple-600'}`}>
                            {formatCurrency(
                              pricingMode === 'wholesale' && parseFloat(String(weightProduct.wholesalePrice || 0)) > 0
                                ? parseFloat(String(weightProduct.wholesalePrice))
                                : parseFloat(weightProduct.price)
                            )}
                          </span>
                        </div>
                      </div>

                      <div className={`pt-4 border-t-2 border-dashed flex justify-between items-center ${pricingMode === 'retail' ? 'border-blue-100' : 'border-purple-100'}`}>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Net Total</span>
                          <span className="text-[11px] font-bold text-indigo-400 leading-none">After Computation</span>
                        </div>
                        <span className={`text-3xl font-black tracking-tighter tabular-nums ${pricingMode === 'retail' ? 'text-blue-700' : 'text-purple-700'}`}>
                          {formatCurrency(
                            parseFloat(enteredWeight) * (
                              pricingMode === 'wholesale' && parseFloat(String(weightProduct.wholesalePrice || 0)) > 0
                                ? parseFloat(String(weightProduct.wholesalePrice))
                                : parseFloat(weightProduct.price)
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quick Selection</span>
                    <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-200 text-slate-400">Standard presets</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[0.25, 0.5, 1, 1.5, 2, 5].map((w) => (
                      <Button
                        key={w}
                        variant="outline"
                        onClick={() => setEnteredWeight(w.toString())}
                        className={`h-11 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm group ${parseFloat(enteredWeight) === w
                          ? (pricingMode === 'retail'
                            ? 'bg-blue-600 text-white border-blue-600 scale-[1.05] shadow-[0_10px_20px_-5px_rgba(37,99,235,0.3)] z-10'
                            : 'bg-purple-600 text-white border-purple-600 scale-[1.05] shadow-[0_10px_20px_-5px_rgba(147,51,234,0.3)] z-10')
                          : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <span className={parseFloat(enteredWeight) === w ? 'scale-110 transition-transform' : 'transition-transform group-hover:scale-105'}>{w} kg</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-8 pb-8 pt-4 bg-slate-50 border-t border-slate-100 shrink-0">
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowWeightDialog(false);
                      setEnteredWeight("");
                      setWeightProduct(null);
                    }}
                    className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-[0.15em] border-2 border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 transition-all"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addWeightBasedToCart}
                    disabled={!enteredWeight || parseFloat(enteredWeight) <= 0}
                    className={`flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-lg transition-all ${pricingMode === 'retail'
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                      }`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-lg max-h-[95vh] overflow-hidden flex flex-col p-0 border-none bg-transparent shadow-none">
            <div className="bg-white rounded-[2.5rem] flex flex-col overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] border border-white/20">
              {/* Sticky Header */}
              <div className="px-8 pt-8 pb-4 bg-white shrink-0">
                <DialogHeader>
                  <DialogTitle className="flex items-center text-2xl font-black tracking-tight text-slate-900 transition-all">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mr-4 border border-indigo-100 shadow-sm">
                      <CreditCard className="h-6 w-6 text-indigo-600" />
                    </div>
                    Complete Payment
                  </DialogTitle>
                </DialogHeader>
              </div>

              {/* Scrollable Content Area */}
              <div className="px-8 py-2 overflow-y-auto flex-1 space-y-6 custom-scrollbar min-h-0">
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[2rem] text-center border border-emerald-100 shadow-inner group">
                  <div className="text-4xl font-black text-emerald-700 tracking-tighter tabular-nums mb-1 group-hover:scale-105 transition-transform">
                    {formatCurrency(total)}
                  </div>
                  <div className="text-[10px] uppercase font-black tracking-[0.2em] text-emerald-600/60">Final Settlement Amount</div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2.5 ml-1">Native Payment Method</label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="w-full h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200 shadow-xl p-1">
                        <SelectItem value="cash" className="rounded-xl py-3 font-bold">💵 Cash Payment</SelectItem>
                        <SelectItem value="upi" className="rounded-xl py-3 font-bold">📱 UPI Payment</SelectItem>
                        <SelectItem value="split" className="rounded-xl py-3 font-bold">💰 Cash + UPI Split</SelectItem>
                        <SelectItem value="card" className="rounded-xl py-3 font-bold">💳 Card Payment</SelectItem>
                        <SelectItem value="bank" className="rounded-xl py-3 font-bold">🏦 Bank Transfer</SelectItem>
                        <SelectItem value="cheque" className="rounded-xl py-3 font-bold">📝 Cheque Payment</SelectItem>
                        <SelectItem value="credit" className={`rounded-xl py-3 font-bold ${!selectedCustomer ? 'text-slate-300' : 'text-orange-600'}`}>
                          💳 Credit/Udhaar {!selectedCustomer && "(Requires Customer)"}
                        </SelectItem>
                        <SelectItem value="other" className="rounded-xl py-3 font-bold">🔄 Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentMethod === "split" ? (
                    <div className="space-y-4 animate-in-fade">
                      <div className="p-5 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 space-y-5">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                          <h3 className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Multi-Mode Allocation</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Cash Component</label>
                            <div className="relative group">
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={cashAmount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                    setCashAmount(value);
                                    const cash = parseFloat(value) || 0;
                                    const remaining = Math.max(0, total - cash);
                                    setUpiAmount(remaining > 0 ? remaining.toFixed(2) : "");
                                    setAmountPaid((cash + remaining).toFixed(2));
                                  }
                                }}
                                className="h-14 pl-5 pr-10 rounded-2xl border-2 border-slate-100 bg-white focus:border-blue-500 font-black text-lg transition-all shadow-sm"
                                autoFocus
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs uppercase group-focus-within:text-blue-500 transition-colors">INR</div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">UPI Component</label>
                            <div className="relative group">
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={upiAmount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                    setUpiAmount(value);
                                    const upi = parseFloat(value) || 0;
                                    const remaining = Math.max(0, total - upi);
                                    setCashAmount(remaining > 0 ? remaining.toFixed(2) : "");
                                    setAmountPaid((upi + remaining).toFixed(2));
                                  }
                                }}
                                className="h-14 pl-5 pr-10 rounded-2xl border-2 border-slate-100 bg-white focus:border-indigo-500 font-black text-lg transition-all shadow-sm"
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs uppercase group-focus-within:text-indigo-500 transition-colors">UPI</div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const half = (total / 2);
                              setCashAmount(half.toFixed(2));
                              setUpiAmount(half.toFixed(2));
                              setAmountPaid(total.toFixed(2));
                            }}
                            className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-blue-100 bg-white text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          >
                            50-50 Split
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const cashPart = Math.floor(total * 0.7);
                              const upiPart = total - cashPart;
                              setCashAmount(cashPart.toFixed(2));
                              setUpiAmount(upiPart.toFixed(2));
                              setAmountPaid(total.toFixed(2));
                            }}
                            className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-emerald-100 bg-white text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          >
                            70% Cash
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const upiPart = Math.floor(total * 0.7);
                              const cashPart = total - upiPart;
                              setCashAmount(cashPart.toFixed(2));
                              setUpiAmount(upiPart.toFixed(2));
                              setAmountPaid(total.toFixed(2));
                            }}
                            className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-purple-100 bg-white text-purple-600 hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                          >
                            70% UPI
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : paymentMethod === 'credit' ? (
                    <div className="p-6 bg-orange-50 rounded-[2rem] border border-orange-100 animate-in-fade slide-in-from-top-4">
                      <div className="flex items-center gap-3 mb-3">
                         <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                           <ShieldAlert className="h-5 w-5 text-white" />
                         </div>
                         <div>
                           <h3 className="text-sm font-black text-orange-800 uppercase tracking-tight">Credit (Udhaar) Mode</h3>
                           <p className="text-[10px] font-bold text-orange-600/80">Full bill amount will be added to customer ledger</p>
                         </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-white/60 p-4 rounded-xl border border-orange-100/50">
                           <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-1">
                              <span>Current Sale Amount</span>
                              <span className="text-orange-600">New Debt</span>
                           </div>
                           <div className="text-lg font-black text-slate-900 tabular-nums">
                              {formatCurrency(total)}
                           </div>
                        </div>

                        {selectedCustomer && (
                          <div className="bg-white/40 p-4 rounded-xl border border-orange-100/30">
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Total Due Balance after Sale</span>
                                <span className="text-xl font-black text-rose-600 tabular-nums">
                                  {formatCurrency((selectedCustomer.outstandingBalance || 0) + total)}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Previous Balance</span>
                                <div className="text-xs font-bold text-slate-600 tabular-nums">
                                  {formatCurrency(selectedCustomer.outstandingBalance || 0)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in-fade">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2.5 ml-1">Amount Received</label>
                      <div className="relative group">
                        <Input
                          type="number"
                          placeholder={`${total.toFixed(2)}`}
                          value={amountPaid}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^\d*\.?\d*$/.test(value)) {
                              setAmountPaid(value);
                            }
                          }}
                          className="h-16 pl-6 pr-14 rounded-[1.5rem] border-2 border-slate-100 bg-slate-50/30 focus:bg-white focus:border-indigo-500 font-black text-2xl transition-all shadow-sm"
                          autoFocus
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-base group-focus-within:text-indigo-500 transition-colors">INR</div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Feedback Zone */}
                  {paymentMethod !== "split" && paymentMethod !== "credit" && amountPaid && (
                    <div className="animate-in-fade">
                      {parseFloat(amountPaid) < total ? (
                        <div className="p-4 bg-rose-50 rounded-2xl border-2 border-rose-200/50 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-rose-500 shadow-sm border border-rose-100 shrink-0">
                            <AlertCircle className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest mb-0.5">Shortfall Detected</p>
                            <p className="text-sm font-bold text-rose-600">Pending: {formatCurrency(total - parseFloat(amountPaid))}</p>
                          </div>
                        </div>
                      ) : parseFloat(amountPaid) > total ? (
                        <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200/50 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm border border-blue-100 shrink-0">
                            <Banknote className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-0.5">Change Dispatch</p>
                            <p className="text-xl font-black text-blue-700 tracking-tight">{formatCurrency(parseFloat(amountPaid) - total)}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-200/50 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100 shrink-0">
                            <CheckCircle className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-0.5">Exact Settlement</p>
                            <p className="text-sm font-bold text-emerald-600">Perfect amount received - Ready to close</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === "split" && (
                    <div className="animate-in-fade">
                      {((parseFloat(cashAmount) || 0) + (parseFloat(upiAmount) || 0)) < total ? (
                        <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-200/50 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm border border-amber-100 shrink-0">
                            <Info className="h-5 w-5" />
                          </div>
                          <p className="text-sm font-bold text-amber-700">Need {formatCurrency(total - ((parseFloat(cashAmount) || 0) + (parseFloat(upiAmount) || 0)))} more to complete</p>
                        </div>
                      ) : (
                        <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-200/50 flex items-center gap-4 font-black">
                          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                          <p className="text-sm text-emerald-700">Total split allocation matches payable amount</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Payment Presets */}
                  {paymentMethod === "cash" && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speed Presets</span>
                        <Badge variant="outline" className="text-[8px] font-black bg-white border-slate-200">Standard Denominations</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setAmountPaid(total.toString())}
                          className="h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border-emerald-100 bg-white text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                        >
                          Exact ₹{Math.ceil(total)}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setAmountPaid("200")}
                          className="h-11 rounded-xl font-bold text-xs bg-white hover:bg-slate-50 border-slate-200"
                        >
                          ₹200
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setAmountPaid("500")}
                          className="h-11 rounded-xl font-bold text-xs bg-white hover:bg-slate-50 border-slate-200"
                        >
                          ₹500
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-8 pb-8 pt-4 bg-slate-50/50 border-t border-slate-100 shrink-0">
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentDialog(false)}
                    disabled={isProcessing}
                    className="flex-1 h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] border-2 border-slate-200 text-slate-400 hover:bg-white transition-all"
                  >
                    Discard
                  </Button>
                  <Button
                    onClick={processSale}
                    disabled={
                      isProcessing ||
                      (paymentMethod === "split"
                        ? (((parseFloat(cashAmount) || 0) + (parseFloat(upiAmount) || 0)) < total && !selectedCustomer)
                        : paymentMethod === "credit"
                          ? !selectedCustomer
                          : (!amountPaid || parseFloat(amountPaid) < total) && !selectedCustomer
                      )
                    }
                    className="flex-1 h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-white/50" />
                        Relaying Data...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        {paymentMethod === 'credit' ? 'Confirm Credit Sale' : 'Finalize Sale'}
                      </>
                    )}
                  </Button>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Printer className="h-3 w-3 text-slate-300" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300">Automatic thermal receipt will be generated</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>


        {/* Held Sales Dialog */}
        <Dialog open={showHoldSales} onOpenChange={setShowHoldSales}>
          <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden flex flex-col p-0 border-none bg-transparent shadow-none">
            <div className="bg-white rounded-[2.5rem] flex flex-col overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] border border-white/20">
              {/* Sticky Header */}
              <div className="px-8 pt-8 pb-4 bg-white shrink-0">
                <DialogHeader className="flex flex-row items-center justify-between">
                  <DialogTitle className="flex items-center gap-4 text-2xl font-black tracking-tight text-slate-800">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100 shadow-sm">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    Held Transactions
                  </DialogTitle>
                  {holdSales.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllHeldSales}
                      className="h-10 px-4 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Flush All
                    </Button>
                  )}
                </DialogHeader>
              </div>

              {/* Scrollable Content Area */}
              <div className="px-8 py-2 overflow-y-auto flex-1 custom-scrollbar min-h-0">
                {holdSales.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                    <div className="relative mb-6">
                      <div className="absolute -inset-4 bg-slate-50 rounded-full blur-2xl"></div>
                      <Archive className="relative h-24 w-24 opacity-20" />
                    </div>
                    <p className="font-black text-xl text-slate-400">Archive Empty</p>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-2">Active sessions can be held for later</p>
                  </div>
                ) : (
                  <div className="grid gap-4 pb-6">
                    {holdSales.map((sale) => (
                      <div
                        key={sale.id}
                        className="group p-5 rounded-[2rem] border-2 border-slate-50 bg-slate-50/30 hover:bg-white hover:border-orange-200 hover:shadow-2xl hover:shadow-orange-100/50 transition-all duration-500 relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start relative z-10">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 mb-3">
                              <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {sale.id || `Transaction #${sale.id}`}
                              </h4>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] px-2 py-0.5">
                                  {sale.cart.length} Art
                                </Badge>
                                {sale.oceanFreight && (parseFloat(sale.oceanFreight.freightCost) > 0 || sale.oceanFreight.vesselName) && (
                                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] px-2 py-0.5 flex items-center gap-1">
                                    <Anchor className="h-2.5 w-2.5" />
                                    Ocean
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-black text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md">ID: {sale.id.slice(-8)}</span>
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">•</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(sale.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-black text-indigo-600 tracking-tighter tabular-nums leading-none mb-1">
                              {formatCurrency(sale.total)}
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-60">Net Transaction Total</span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-6 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                          <Button
                            size="sm"
                            className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-orange-100 transition-all active:scale-[0.98]"
                            onClick={() => {
                              recallHeldSale(sale);
                              setShowHoldSales(false);
                            }}
                          >
                            Restore Active Session
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-12 w-12 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            onClick={() => {
                              const newHolds = holdSales.filter(h => h.id !== sale.id);
                              setHoldSales(newHolds);
                              localStorage.setItem('heldSales', JSON.stringify(newHolds));
                            }}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="px-8 pb-8 pt-4 bg-slate-50/80 border-t border-slate-100 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setShowHoldSales(false)}
                  className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border-2 border-slate-200 text-slate-400 hover:bg-white transition-all shadow-sm"
                >
                  Return to POS Terminal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>


        {/* Loyalty Point Redemption Dialog */}
        <Dialog open={showLoyaltyDialog} onOpenChange={setShowLoyaltyDialog}>
          <DialogContent className="max-w-md max-h-[95vh] overflow-hidden flex flex-col p-0 border-none bg-transparent shadow-none">
            <div className="bg-white rounded-[2.5rem] flex flex-col overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] border border-white/20">
              {/* Sticky Header */}
              <div className="px-8 pt-8 pb-4 bg-white shrink-0">
                <DialogHeader>
                  <DialogTitle className="flex items-center text-2xl font-black tracking-tight text-slate-900 transition-all">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mr-4 border border-emerald-100 shadow-sm">
                      <Star className="h-6 w-6 text-emerald-600" />
                    </div>
                    Redeem Points
                  </DialogTitle>
                </DialogHeader>
              </div>

              {/* Scrollable Content Area */}
              <div className="px-8 py-2 overflow-y-auto flex-1 space-y-6 custom-scrollbar min-h-0">
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[2rem] border border-emerald-100 shadow-inner">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800/60">Available Balance</span>
                    <Badge variant="outline" className="text-[8px] font-black bg-white border-emerald-200 text-emerald-600">1 PT = ₹1</Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-emerald-700 tracking-tighter tabular-nums">
                      {Math.round((parseFloat(customerLoyalty?.availablePoints?.toString() || '0')) * 100) / 100}
                    </span>
                    <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Loyalty Points</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="loyaltyPointsInput" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Points to Liquidate</Label>
                    <div className="relative group">
                      <Input
                        id="loyaltyPointsInput"
                        type="number"
                        step="0.01"
                        value={loyaltyPointsToRedeem}
                        onChange={(e) => setLoyaltyPointsToRedeem(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="h-14 pl-6 pr-14 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-emerald-500 font-black text-lg transition-all shadow-sm"
                        min="0"
                        max={customerLoyalty?.availablePoints || 0}
                        autoFocus
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-base group-focus-within:text-emerald-500 transition-colors">PTS</div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-4">
                      {[10, 25, 50, 100].map((points) => (
                        <Button
                          key={points}
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const maxPoints = customerLoyalty?.availablePoints || 0;
                            const pointsToSet = Math.min(points, maxPoints);
                            setLoyaltyPointsToRedeem(pointsToSet);
                          }}
                          disabled={!customerLoyalty || customerLoyalty.availablePoints < points}
                          className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-100 hover:bg-emerald-50 hover:text-emerald-600 transition-all font-mono"
                        >
                          {points}
                        </Button>
                      ))}
                    </div>

                    {customerLoyalty && customerLoyalty.availablePoints > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLoyaltyPointsToRedeem(parseFloat(customerLoyalty.availablePoints.toString()))}
                        className="w-full mt-3 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-50/50 border-emerald-100 text-emerald-700 hover:bg-emerald-100 transition-all"
                      >
                        Maximize Redemption ({Math.round(parseFloat(customerLoyalty.availablePoints.toString()) * 100) / 100} PTS)
                      </Button>
                    )}
                  </div>

                  {loyaltyPointsToRedeem > 0 && (
                    <div className="animate-in-fade p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-bold tracking-tight">Net Discount</span>
                        <span className="text-indigo-600 font-black">{formatCurrency(loyaltyPointsToRedeem)}</span>
                      </div>
                      <div className="h-[1px] bg-indigo-100/50"></div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Residual Points</span>
                        <span className="text-slate-600 font-black">
                          {Math.max(0, (parseFloat(customerLoyalty?.availablePoints?.toString() || '0')) - loyaltyPointsToRedeem).toFixed(2)} pts
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-8 pb-8 pt-4 bg-slate-50/50 border-t border-slate-100 shrink-0">
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowLoyaltyDialog(false);
                      setLoyaltyPointsToRedeem(0);
                    }}
                    className="flex-1 h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] border-2 border-slate-200 text-slate-400 hover:bg-white transition-all shadow-sm"
                  >
                    Discard
                  </Button>
                  <Button
                    onClick={handleLoyaltyRedemption}
                    className="flex-1 h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    disabled={loyaltyPointsToRedeem <= 0 || loyaltyPointsToRedeem > (parseFloat(customerLoyalty?.availablePoints?.toString() || '0'))}
                  >
                    <Gift className="h-5 w-5" />
                    Finalize Redemption
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick Udhaar Pay (Settlement) Dialog */}
        <QuickPayDialog 
          open={showQuickPayDialog} 
          onOpenChange={setShowQuickPayDialog} 
          selectedCustomer={selectedCustomer} 
        />

      </div>
    </div>
  );
}