import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createWaitlistRequest } from '@/store/reservationStore';
import { toast } from 'sonner';
import { Users, Clock } from 'lucide-react';

interface Props {
  trigger?: React.ReactNode;
  siteId: string;
  siteName: string;
  parkId: string;
  parkName: string;
  arrivalDate: string;
  departureDate: string;
  bookingId?: string | null;
}

export function WaitlistDialog({ trigger, siteId, siteName, parkId, parkName, arrivalDate, departureDate, bookingId }: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'waitlist' | 'share'>('waitlist');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name || !email || !phone) {
      toast.error('Please fill in name, email, and phone');
      return;
    }
    setSubmitting(true);
    try {
      await createWaitlistRequest({
        booking_id: bookingId || null,
        site_id: siteId, site_name: siteName, park_id: parkId, park_name: parkName,
        arrival_date: arrivalDate, departure_date: departureDate,
        request_type: type,
        requester_name: name, requester_email: email, requester_phone: phone,
        message,
      });
      toast.success(type === 'waitlist' ? 'Added to waitlist — staff will contact you if a slot opens.' : 'Share request submitted — staff will get in touch.');
      setOpen(false);
      setName(''); setEmail(''); setPhone(''); setMessage('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit request');
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button size="sm" variant="outline"><Clock className="h-3.5 w-3.5 mr-1.5" /> Join waitlist</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request a slot — {siteName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            Dates: <strong>{arrivalDate}</strong> → <strong>{departureDate}</strong>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Request type</Label>
            <RadioGroup value={type} onValueChange={(v: any) => setType(v)} className="grid grid-cols-2 gap-2">
              <label className={`flex items-start gap-2 rounded-lg border p-3 cursor-pointer ${type === 'waitlist' ? 'border-secondary bg-secondary/5' : ''}`}>
                <RadioGroupItem value="waitlist" />
                <div>
                  <div className="text-sm font-medium flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Waitlist</div>
                  <div className="text-xs text-muted-foreground">Promoted if booking is cancelled</div>
                </div>
              </label>
              <label className={`flex items-start gap-2 rounded-lg border p-3 cursor-pointer ${type === 'share' ? 'border-secondary bg-secondary/5' : ''}`}>
                <RadioGroupItem value="share" />
                <div>
                  <div className="text-sm font-medium flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Share site</div>
                  <div className="text-xs text-muted-foreground">Split cost with original booker</div>
                </div>
              </label>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Your name / company</Label>
              <Input className="mt-1.5" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input type="email" className="mt-1.5" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone</Label>
              <Input type="tel" className="mt-1.5" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Message (optional)</Label>
            <Textarea className="mt-1.5" rows={2} value={message} onChange={e => setMessage(e.target.value)} placeholder="Anything staff should know..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting} className="amber-glow text-accent-foreground border-0">
            {submitting ? 'Submitting...' : 'Submit request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
