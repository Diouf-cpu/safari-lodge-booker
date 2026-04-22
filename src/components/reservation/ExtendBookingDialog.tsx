import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Clock, AlertTriangle } from 'lucide-react';
import { extendBooking, EXTENSION_DAYS } from '@/store/operationsStore';
import { format } from 'date-fns';

/**
 * Dialog for granting the one-time +EXTENSION_DAYS extension on a pending booking.
 * Backend enforces the "once only" rule — this dialog clearly warns the staff.
 */
export function ExtendBookingDialog({
  open, onOpenChange, voucherNo, companyName, currentExpiry, alreadyExtended, onExtended,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  voucherNo: string;
  companyName: string;
  currentExpiry: string | null;
  alreadyExtended: boolean;
  onExtended: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleExtend = async () => {
    setSaving(true);
    try {
      const r = await extendBooking(voucherNo);
      if (!r.ok) { toast.error(r.reason || 'Could not extend'); return; }
      toast.success(`Extended by ${EXTENSION_DAYS} days. New expiry: ${format(new Date(r.newExpiresAt!), 'dd MMM yyyy')}. This was the last extension.`);
      onExtended();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to extend');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Extend Booking — #{voucherNo}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>
            Grant <strong>{companyName}</strong> an extra <strong>{EXTENSION_DAYS} days</strong> to pay.
          </p>
          {currentExpiry && (
            <div className="rounded-lg bg-muted/50 p-3 flex justify-between">
              <span className="text-muted-foreground">Current expiry</span>
              <span className="font-medium">{format(new Date(currentExpiry), 'dd MMM yyyy HH:mm')}</span>
            </div>
          )}
          {alreadyExtended ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-destructive text-xs">
                This booking has already been extended once. No further extensions are allowed by policy.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs">
                This is a <strong>one-time</strong> extension. After today the booking cannot be extended again — it will auto-cancel on the new expiry date if unpaid.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleExtend}
            disabled={saving || alreadyExtended}
            className="amber-glow text-accent-foreground border-0"
          >
            {saving ? 'Extending…' : `Grant +${EXTENSION_DAYS} days`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
