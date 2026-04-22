import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Replace, AlertCircle } from 'lucide-react';
import { parks } from '@/data/parks';
import { switchBooking } from '@/store/operationsStore';
import { isDateRangeAvailable } from '@/store/bookingStore';

/**
 * Dialog for moving a single booking line to a different site and/or different dates.
 * Voucher number stays the same. Old dates auto-unblock because we update the row in
 * place; original_* fields preserve the audit trail.
 */
export function SwitchBookingDialog({
  open, onOpenChange, booking, onSwitched,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  booking: {
    id: string;
    voucherNo: string;
    parkId: string;
    parkName: string;
    siteId: string;
    siteName: string;
    arrivalDate: string;
    departureDate: string;
  } | null;
  onSwitched: () => void;
}) {
  const [parkId, setParkId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [arrival, setArrival] = useState('');
  const [departure, setDeparture] = useState('');
  const [saving, setSaving] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (booking) {
      setParkId(booking.parkId);
      setSiteId(booking.siteId);
      setArrival(booking.arrivalDate);
      setDeparture(booking.departureDate);
      setAvailable(null);
    }
  }, [booking]);

  const park = useMemo(() => parks.find(p => p.id === parkId), [parkId]);
  const site = useMemo(() => park?.sites.find(s => s.id === siteId), [park, siteId]);

  // Check availability whenever target site/dates change (skip if it's the same row)
  useEffect(() => {
    if (!booking || !siteId || !arrival || !departure) { setAvailable(null); return; }
    if (siteId === booking.siteId && arrival === booking.arrivalDate && departure === booking.departureDate) {
      setAvailable(true); return;
    }
    if (departure <= arrival) { setAvailable(false); return; }
    isDateRangeAvailable(siteId, arrival, departure).then(setAvailable);
  }, [booking, siteId, arrival, departure]);

  if (!booking) return null;

  const noChanges =
    siteId === booking.siteId && arrival === booking.arrivalDate && departure === booking.departureDate;

  const handleSwitch = async () => {
    if (!site || !park) return;
    setSaving(true);
    try {
      await switchBooking(booking.id, {
        parkId: park.id,
        parkName: park.name,
        siteId: site.id,
        siteName: site.name,
        arrivalDate: arrival,
        departureDate: departure,
      });
      toast.success(`Switched. Voucher #${booking.voucherNo} kept. Old dates released.`);
      onSwitched();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to switch');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Replace className="h-5 w-5 text-secondary" />
            Switch Site / Dates — #{booking.voucherNo}
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-lg bg-muted/50 p-3 text-sm mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Currently</p>
          <p className="font-medium">{booking.parkName} · {booking.siteName}</p>
          <p className="text-muted-foreground">{booking.arrivalDate} → {booking.departureDate}</p>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Park / Reserve</Label>
              <Select value={parkId} onValueChange={(v) => { setParkId(v); setSiteId(''); }}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {parks.filter(p => p.id !== 'boga-reserve').map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Site</Label>
              <Select value={siteId} onValueChange={setSiteId} disabled={!park}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select site" /></SelectTrigger>
                <SelectContent>
                  {park?.sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">New arrival</Label>
              <Input type="date" className="mt-1" value={arrival} onChange={e => setArrival(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">New departure</Label>
              <Input type="date" className="mt-1" value={departure} onChange={e => setDeparture(e.target.value)} />
            </div>
          </div>
          {available === false && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <span className="text-destructive">Target site & dates are unavailable.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleSwitch}
            disabled={saving || noChanges || available === false || !arrival || !departure || !siteId}
            className="amber-glow text-accent-foreground border-0"
          >
            {saving ? 'Switching…' : 'Switch booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
