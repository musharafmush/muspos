import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Building2, 
  FileText, 
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Printer,
  Store,
  Calculator,
  ArrowLeft,
  DollarSign,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { printGSTInvoice } from "@/components/purchase/gst-invoice-pdf";
import type { Purchase } from "@shared/schema";

function FreeQtyEditCell({ item, onUpdate }: { item: any; onUpdate: (newFreeQty: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(0);
  const { toast } = useToast();

  const freeQty = Number(item.freeQty || item.free_qty || 0);

  const handleUpdate = async (newFreeQty: number) => {
    try {
      const response = await fetch(`/api/purchase-items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ freeQty: newFreeQty }),
      });

      if (response.ok) {
        toast({
          title: "Free Qty Updated",
          description: `Free quantity updated to ${newFreeQty}`,
        });
        onUpdate(newFreeQty);
      } else {
        throw new Error('Failed to update free quantity');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update free quantity",
        variant: "destructive",
      });
      setTempValue(freeQty);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        type="number"
        min="0"
        value={tempValue}
        onChange={(e) => setTempValue(Number(e.target.value) || 0)}
        className="w-16 h-8 text-xs text-center"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleUpdate(tempValue);
          } else if (e.key === 'Escape') {
            setTempValue(freeQty);
            setEditing(false);
          }
        }}
        onBlur={() => {
          if (tempValue !== freeQty) {
            handleUpdate(tempValue);
          } else {
            setEditing(false);
          }
        }}
        autoFocus
      />
    );
  }

  return (
    <div 
      className="cursor-pointer hover:bg-green-100 rounded px-2 py-1 transition-colors"
      onClick={() => {
        setTempValue(freeQty);
        setEditing(true);
      }}
      title="Click to edit free quantity"
    >
      {freeQty > 0 ? (
        <span className="font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full text-sm">
          {freeQty}
        </span>
      ) : (
        <span className="text-gray-400 hover:text-green-600">
          + Add Free
        </span>
      )}
    </div>
  );
}

function getPaymentStatusBadge(purchase: any) {
  const totalAmount = parseFloat(purchase.totalAmount?.toString() || purchase.total?.toString() || "0");
  const paidAmount = parseFloat(purchase.paidAmount?.toString() || "0");
  const paymentStatus = purchase.paymentStatus;
  
  if (paymentStatus === "paid" || (totalAmount > 0 && paidAmount >= totalAmount)) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
        <CheckCircle className="w-3 h-3 mr-1" />
        Paid
      </Badge>
    );
  }
  
  if (paymentStatus === "partial" || (paidAmount > 0 && paidAmount < totalAmount)) {
    const percentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
        <DollarSign className="w-3 h-3 mr-1" />
        Partial ({percentage}%)
      </Badge>
    );
  }
  
  if (paymentStatus === "overdue") {
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
        <XCircle className="w-3 h-3 mr-1" />
        Overdue
      </Badge>
    );
  }
  
  return (
    <Badge variant="destructive" className="bg-orange-100 text-orange-800 border-orange-300">
      <AlertCircle className="w-3 h-3 mr-1" />
      Due Payment
    </Badge>
  );
}

function getStatusBadge(status: string) {
  const statusConfig = {
    pending: { 
      variant: "secondary" as const, 
      icon: Clock, 
      color: "text-yellow-600 bg-yellow-100",
      label: "Pending"
    },
    completed: { 
      variant: "default" as const, 
      icon: CheckCircle, 
      color: "text-green-600 bg-green-100",
      label: "Completed"
    },
    cancelled: { 
      variant: "destructive" as const, 
      icon: XCircle, 
      color: "text-red-600 bg-red-100",
      label: "Cancelled"
    },
    received: { 
      variant: "default" as const, 
      icon: Package, 
      color: "text-blue-600 bg-blue-100",
      label: "Received"
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </div>
  );
}

interface PurchaseOrderDetailsProps {
  id?: string;
}

export default function PurchaseOrderDetails({ id }: PurchaseOrderDetailsProps) {
  const [, setLocation] = useLocation();
  const purchaseId = id;
  const { toast } = useToast();

  const { data: purchase, isLoading, error } = useQuery({
    queryKey: ["/api/purchases", purchaseId],
    queryFn: async () => {
      const response = await fetch(`/api/purchases/${purchaseId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch purchase details');
      }
      return response.json();
    },
    enabled: !!purchaseId,
  });

  const handlePrintInvoice = () => {
    if (purchase) {
      printGSTInvoice(purchase);
      toast({
        title: "Invoice Generated",
        description: "GST Invoice PDF has been downloaded",
      });
    }
  };

  const handleEdit = () => {
    setLocation(`/purchase-entry-professional?edit=${purchaseId}`);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading purchase order details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !purchase) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Purchase Order Not Found</h2>
            <p className="text-gray-600 mb-4">The purchase order you're looking for doesn't exist or couldn't be loaded.</p>
            <Link href="/purchase-dashboard">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Purchase Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const items = purchase.purchaseItems || purchase.items || [];
  const totalAmount = parseFloat(purchase.totalAmount?.toString() || purchase.total?.toString() || "0");
  const paidAmount = parseFloat(purchase.paidAmount?.toString() || "0");
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/purchase-dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Purchase Order Details
              </h1>
              <p className="text-gray-600">Complete information about this purchase order</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Order
            </Button>
            <Button onClick={handlePrintInvoice}>
              <Printer className="w-4 h-4 mr-2" />
              Print Invoice
            </Button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-600">Order Number</label>
              <p className="text-xl font-bold text-blue-800 mt-1">
                {purchase.orderNumber || `PO-${purchase.id}`}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Order Status</label>
              <div className="mt-1">
                {getStatusBadge(purchase.status || "pending")}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Payment Status</label>
              <div className="mt-1">
                {getPaymentStatusBadge(purchase)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Order Date</label>
              <p className="text-lg font-semibold mt-1">
                {purchase.orderDate 
                  ? format(new Date(purchase.orderDate), 'dd/MM/yyyy') 
                  : 'N/A'
                }
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Total Amount</label>
              <p className="text-xl font-bold text-green-600 mt-1">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
              <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                Supplier Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Supplier Name</label>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">
                      {purchase.supplier?.name || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <label className="text-xs text-gray-500">Email</label>
                      <p className="text-sm font-medium">{purchase.supplier?.email || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <label className="text-xs text-gray-500">Phone</label>
                      <p className="text-sm font-medium">{purchase.supplier?.phone || "Not provided"}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <label className="text-xs text-gray-500">Address</label>
                    <p className="text-sm font-medium">{purchase.supplier?.address || "Not provided"}</p>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="text-xs font-medium text-blue-600 uppercase tracking-wide">GSTIN</label>
                  <p className="text-base font-mono font-bold text-blue-800 mt-1">
                    {purchase.supplier?.gstin || purchase.supplier?.taxNumber || "Not provided"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
              <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Store className="w-4 h-4 text-white" />
                </div>
                Your Business
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Business Name</label>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">Awesome Shop</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <label className="text-xs text-gray-500">Address</label>
                    <p className="text-sm font-medium">123 Business Street, Commercial Area</p>
                    <p className="text-sm text-gray-600">Chennai, Tamil Nadu - 600001</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <label className="text-xs font-medium text-green-600 uppercase tracking-wide">GSTIN</label>
                    <p className="text-sm font-mono font-bold text-green-800 mt-1">33ABCDE1234F1Z5</p>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <label className="text-xs text-gray-500">Invoice Date</label>
                      <p className="text-sm font-medium">{format(new Date(), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-blue-600" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Reference No:</label>
                <p className="text-base font-semibold mt-1">
                  {purchase.orderNumber || `#PO${purchase.id}`}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Order Date:</label>
                <p className="text-base font-semibold mt-1">
                  {purchase.orderDate 
                    ? format(new Date(purchase.orderDate), 'dd/MM/yyyy') 
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Purchase Status:</label>
                <p className="text-base font-semibold mt-1">
                  {purchase.status?.charAt(0).toUpperCase() + purchase.status?.slice(1) || 'Pending'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Payment Status:</label>
                <div className="mt-1">
                  {getPaymentStatusBadge(purchase)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Remaining Amount:</label>
                <p className={`text-base font-semibold mt-1 ${remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatCurrency(remainingAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardHeader className="bg-green-50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Purchase Items</h3>
                  <p className="text-sm text-green-600">
                    {items.length} item(s) in this order
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Order #{purchase.orderNumber || purchase.id}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {items.length > 0 ? (
              <div className="overflow-x-auto">
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow className="bg-blue-50 border-b-2">
                      <TableHead className="w-12 text-center font-semibold">No</TableHead>
                      <TableHead className="min-w-[120px] font-semibold">Product</TableHead>
                      <TableHead className="w-20 text-center font-semibold">Qty</TableHead>
                      <TableHead className="w-20 text-center font-semibold text-green-700">
                        <div className="flex items-center justify-center gap-1">
                          <span>Free Qty</span>
                        </div>
                      </TableHead>
                      <TableHead className="w-24 text-center font-semibold">Unit Cost</TableHead>
                      <TableHead className="w-24 text-center font-semibold">Amount</TableHead>
                      <TableHead className="w-20 text-center font-semibold">Tax %</TableHead>
                      <TableHead className="w-24 text-center font-semibold">Net Amount</TableHead>
                      <TableHead className="w-20 text-center font-semibold">Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item: any, index: number) => {
                      const quantity = Number(item.receivedQty || item.received_qty || item.quantity || 0);
                      const unitCost = parseFloat(item.unitCost || item.unit_cost || item.cost || "0");
                      const amount = parseFloat(item.amount || item.subtotal || item.total || (quantity * unitCost).toString());
                      const taxPercent = parseFloat(item.taxPercentage || item.tax_percentage || item.taxPercent || "0");
                      const netAmount = parseFloat(item.netAmount || item.net_amount || amount.toString());

                      return (
                        <TableRow key={item.id || index} className="hover:bg-gray-50">
                          <TableCell className="text-center font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">
                                {item.product?.name || item.product_name || item.productName || `Product #${item.productId || item.product_id || ''}`}
                              </div>
                              <div className="text-xs text-gray-500">
                                SKU: {item.product?.sku || item.product_sku || item.code || 'N/A'}
                              </div>
                              {item.description && (
                                <div className="text-xs text-gray-600">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-semibold text-blue-600 text-lg">
                              {quantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <FreeQtyEditCell 
                              item={item} 
                              onUpdate={(newFreeQty) => {
                                item.freeQty = newFreeQty;
                                item.free_qty = newFreeQty;
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="font-semibold text-gray-900">
                              {formatCurrency(unitCost)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="font-semibold text-blue-700">
                              {formatCurrency(amount)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {taxPercent > 0 ? (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {taxPercent}%
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="font-bold text-green-700 text-base">
                              {formatCurrency(netAmount)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs">
                              {item.unit || 'PCS'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Items Found</h4>
                    <p className="text-gray-600 max-w-md">
                      This purchase order doesn't have any items or they couldn't be loaded.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2 border-purple-200">
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="w-5 h-5 text-purple-600" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Stock Impact Summary
                  </h4>
                  {(() => {
                    const totalReceived = items.reduce((sum: number, item: any) => sum + Number(item.receivedQty || item.received_qty || item.quantity || 0), 0);
                    const totalFree = items.reduce((sum: number, item: any) => sum + Number(item.freeQty || item.free_qty || 0), 0);
                    const totalStock = totalReceived + totalFree;
                    
                    return (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span>Received Units:</span>
                          <span className="font-semibold text-blue-600">{totalReceived}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Free Units:</span>
                          <span className="font-semibold text-green-600">{totalFree}</span>
                        </div>
                        <div className="col-span-2 flex justify-between pt-2 border-t border-green-300">
                          <span className="font-medium">Total Stock Added:</span>
                          <span className="font-bold text-green-800">{totalStock}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Sub Total:</span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(parseFloat(purchase.subTotal?.toString() || totalAmount.toString()))}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Tax Amount:</span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(parseFloat(purchase.taxAmount?.toString() || "0"))}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Freight Cost:</span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(parseFloat(purchase.freightCost?.toString() || "0"))}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Other Charges:</span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(parseFloat(purchase.otherCharges?.toString() || "0"))}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-semibold text-red-600">
                    -{formatCurrency(parseFloat(purchase.discountAmount?.toString() || "0"))}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-3 mt-3">
                  <span className="text-lg font-bold text-blue-800">Grand Total:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200">
            <CardHeader className="bg-orange-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 text-orange-600" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Paid Amount:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(paidAmount)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Remaining Amount:</span>
                  <span className={`font-semibold ${remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatCurrency(remainingAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold text-gray-800 capitalize">
                    {purchase.paymentMethod || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Payment Status:</span>
                  {getPaymentStatusBadge(purchase)}
                </div>
                
                {purchase.dueDate && (
                  <div className="flex justify-between items-center py-2 border-t border-gray-200 mt-2">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-semibold text-gray-800">
                      {format(new Date(purchase.dueDate), 'dd/MM/yyyy')}
                    </span>
                  </div>
                )}

                {remainingAmount > 0 && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      {formatCurrency(remainingAmount)} payment is pending for this purchase order.
                    </p>
                  </div>
                )}

                {remainingAmount === 0 && paidAmount > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      This purchase order has been fully paid.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {purchase.notes && (
          <Card className="border-2 border-gray-200">
            <CardHeader className="bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-gray-600" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-700 whitespace-pre-wrap">{purchase.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
