import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, CheckCircle, Wallet, User, Phone, Calendar } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  outstandingBalance?: number | null;
  creditLimit?: number | null;
}

interface QuickPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCustomer: Customer | null;
}

export function QuickPayDialog({ open, onOpenChange, selectedCustomer }: QuickPayDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quickPayAmount, setQuickPayAmount] = useState("");
  const [quickPayMethod, setQuickPayMethod] = useState("cash");
  const [isProcessingQuickPay, setIsProcessingQuickPay] = useState(false);

  const handleQuickPay = async () => {
    if (!selectedCustomer) return;
    
    const amount = parseFloat(quickPayAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingQuickPay(true);
    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}/pay-credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paymentMethod: quickPayMethod,
          notes: "Quick settle from POS Terminal"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to record payment");
      }

      const result = await response.json();
      
      // Refresh customer data
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      
      toast({
        title: "✅ Payment Recorded",
        description: `Successfully collected ${formatCurrency(amount)} from ${selectedCustomer.name}`,
      });

      onOpenChange(false);
      setQuickPayAmount("");
    } catch (error: any) {
      console.error("Quick Pay Error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred while processing payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessingQuickPay(false);
    }
  };

  if (!selectedCustomer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-0 rounded-3xl shadow-2xl bg-white/95 backdrop-blur-xl">
        <div className="relative overflow-hidden">
          {/* Decorative Header Background */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 opacity-10" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse" />
          
          <div className="relative px-8 pt-8 pb-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 ring-4 ring-white">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Quick Settlement</DialogTitle>
                <div className="text-slate-500 font-semibold flex items-center gap-2 text-sm mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Collect Credit Payment
                </div>
              </DialogHeader>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-100/50">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                  <User className="w-3 h-3 text-emerald-600" />
                  Client Profile
                </div>
                <div className="text-sm font-bold text-slate-700 truncate">{selectedCustomer.name}</div>
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-2.5 h-2.5" />
                  {selectedCustomer.phone || "No phone"}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 border-2 border-emerald-100/50">
                <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-2">
                  <Calendar className="w-3 h-3" />
                  Pending Balance
                </div>
                <div className="text-lg font-black text-emerald-700">
                  {formatCurrency(Number(selectedCustomer.outstandingBalance || 0))}
                </div>
                <div className="text-[10px] font-bold text-emerald-600/60 mt-0.5">Available for collection</div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Payment Amount</Label>
                  {Number(selectedCustomer.outstandingBalance) > 0 && (
                    <button 
                      onClick={() => setQuickPayAmount(String(selectedCustomer.outstandingBalance))}
                      className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest transition-colors flex items-center gap-1 group"
                    >
                      Settle All <RefreshCw className="w-2.5 h-2.5 group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-2xl font-black text-emerald-300">₹</span>
                  </div>
                  <Input
                    type="number"
                    value={quickPayAmount}
                    onChange={(e) => setQuickPayAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-16 rounded-2xl border-2 border-slate-100 bg-slate-50/30 focus:bg-white focus:border-emerald-600 transition-all font-black text-2xl px-12 shadow-sm"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Collection Method</Label>
                <Select value={quickPayMethod} onValueChange={setQuickPayMethod}>
                  <SelectTrigger className="h-12 rounded-xl border-2 border-slate-100 bg-slate-50/30 focus:border-emerald-600 font-bold transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl p-1">
                    <SelectItem value="cash" className="font-bold">💵 Cash Collection</SelectItem>
                    <SelectItem value="upi" className="font-bold">📱 UPI Transfer</SelectItem>
                    <SelectItem value="card" className="font-bold">💳 Card Swiped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 pt-4 bg-slate-50 border-t border-slate-100 flex gap-4 mt-6">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isProcessingQuickPay}
              className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all"
            >
              Discard
            </Button>
            <Button
              onClick={handleQuickPay}
              disabled={isProcessingQuickPay || !quickPayAmount || parseFloat(quickPayAmount) <= 0}
              className="flex-[2] h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isProcessingQuickPay ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Receive {quickPayMethod.toUpperCase()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
