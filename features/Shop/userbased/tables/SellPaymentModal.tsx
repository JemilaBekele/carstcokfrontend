/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import {
  addSellPayment,
  getSellPaymentHistory
} from '@/service/Sell';

interface SellPaymentModalProps {
  open: boolean;
  onClose: () => void;
  sellId: string;
  invoiceNo?: string;
  total?: number;
}

export const SellPaymentModal: React.FC<SellPaymentModalProps> = ({
  open,
  onClose,
  sellId,
  invoiceNo,
  total
}) => {

  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [summary, setSummary] = useState<any>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getSellPaymentHistory(sellId);
      setSummary(res.data.sell);
    } catch (error) {
      console.error(error);
    }
  }, [sellId]); // ✅ Added dependency array with sellId

  useEffect(() => {
    if (open) fetchSummary();
  }, [fetchSummary, open]);

  const handleAddPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Enter valid amount');
      return;
    }

    // ✅ Validate payment doesn't exceed remaining balance
    const currentBalance = summary?.balance || 0;
    if (Number(paymentAmount) > currentBalance) {
      toast.error(`Payment amount cannot exceed remaining balance of ${currentBalance}`);
      return;
    }

    setLoading(true);

    try {
      await addSellPayment(sellId, {
        amount: Number(paymentAmount),
        notes: paymentNotes
      });

      toast.success('Payment added successfully');

      // ✅ Check if invoice is now fully paid
      const newTotalPaid = (summary?.totalPaid || 0) + Number(paymentAmount);
      if (newTotalPaid >= (total || summary?.grandTotal || 0)) {
        toast.success('Invoice is now fully paid!');
        // Close modal after successful full payment
        onClose();
      }

      setPaymentAmount('');
      setPaymentNotes('');

      await fetchSummary(); // Refresh the summary

    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Payment failed'
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Calculate if Add Payment button should be disabled
  const isAddPaymentDisabled = () => {
    if (loading) return true;
    if (!paymentAmount || Number(paymentAmount) <= 0) return true;
    const currentBalance = summary?.balance || 0;
    if (Number(paymentAmount) > currentBalance) return true;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>

        <DialogHeader>
          <DialogTitle>Sell Payment</DialogTitle>
          <DialogDescription>
            Invoice #{invoiceNo}
          </DialogDescription>
        </DialogHeader>

        {/* =====================
            Summary
        ===================== */}

        <div className="space-y-3">
          <div>
            <Label>Grand Total</Label>
            <Input value={total || summary?.grandTotal || 0} disabled />
          </div>

          <div>
            <Label>Total Paid</Label>
            <Input value={summary?.totalPaid || 0} disabled />
          </div>

          <div>
            <Label>Remaining Balance</Label>
            <Input 
              value={summary?.balance || 0} 
              disabled 
              className="font-bold text-blue-600"
            />
          </div>
        </div>

        {/* =====================
            Add Payment
        ===================== */}

        <div className="space-y-3 mt-4">
          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              placeholder={`Max: ${summary?.balance || 0}`}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
            {summary?.balance > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Maximum payable amount: ${summary?.balance}
              </p>
            )}
          </div>

      
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddPayment}
            disabled={isAddPaymentDisabled()}
          >
            {loading ? 'Saving...' : 'Add Payment'}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};