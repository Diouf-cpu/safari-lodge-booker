import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { confirmBookingWithPayment, PAYMENT_METHODS, PaymentMethod } from '@/store/operationsStore';

/**
 * Dialog shown when reservation staff click "Confirm Payment" on a pending booking.
 * Captures payment method + reference, marks the booking confirmed/paid, writes audit log.
 */
export function ConfirmPaymentDialog({
  open, onOpenChange, voucherNo, companyName, amount, onConfirmed,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  voucherNo: string;
  companyName: string;
  amount: number;
  onConfirmed: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await confirmBookingWithPayment(voucherNo, method, reference || undefined);
      toast.success(`Booking ${voucherNo} confirmed (${method})`);
      onConfirmed();
      onOpenChange(false);
      setReference('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to confirm payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Confirm Payment — #{voucherNo}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span className="font-medium">{companyName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-display font-bold">P{amount.toLocaleString()}</span></div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Payment method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Reference (optional)
            </Label>
            <Input
              className="mt-1.5"
              placeholder="Transaction ID, cheque no., last-4 of card..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-success hover:bg-success/90 text-success-foreground"
          >
            {saving ? 'Saving…' : 'Confirm payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
