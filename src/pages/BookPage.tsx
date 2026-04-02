import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parks, RATE_PER_NIGHT, companies } from '@/data/parks';
import { addBookingGroup, isDateRangeAvailable, getBookedDatesForSite } from '@/store/bookingStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Plus, Trash2, CalendarCheck, CalendarIcon, ArrowRight } from 'lucide-react';
import { differenceInDays, format, eachDayOfInterval, parseISO, startOfDay, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import { InvoicePreview } from '@/components/InvoicePreview';

interface BookingItem {
  parkId: string;
  siteId: string;
  arrivalDate: string;
  departureDate: string;
}

function DateCalendarPicker({
  label,
  value,
  onChange,
  siteId,
  minDate,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  siteId: string;
  minDate?: Date;
}) {
  const [bookedDates, setBookedDates] = useState<{ date: Date; status: string }[]>([]);
  const today = startOfDay(new Date());

  useEffect(() => {
    if (!siteId) { setBookedDates([]); return; }
    getBookedDatesForSite(siteId).then(booked => {
      const result: { date: Date; status: string }[] = [];
      booked.forEach(b => {
        try {
          const days = eachDayOfInterval({ start: parseISO(b.start), end: parseISO(b.end) });
          days.forEach(d => result.push({ date: d, status: b.status }));
        } catch {}
      });
      setBookedDates(result);
    });
  }, [siteId]);

  const disabledMatcher = (date: Date) => {
    if (isBefore(date, minDate || today)) return true;
    return bookedDates.some(
      b => b.status === 'confirmed' && date.getTime() === startOfDay(b.date).getTime()
    );
  };

  const modifiers = {
    booked_confirmed: bookedDates.filter(b => b.status === 'confirmed').map(b => b.date),
    booked_pending: bookedDates.filter(b => b.status === 'pending').map(b => b.date),
  };

  const modifiersStyles = {
    booked_confirmed: { backgroundColor: 'hsl(0 72% 51%)', color: 'white', borderRadius: '6px' },
    booked_pending: { backgroundColor: 'hsl(38 92% 50%)', color: 'white', borderRadius: '6px' },
  };

  const selected = value ? parseISO(value) : undefined;

  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full mt-1 justify-start text-left font-normal", !value && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(parseISO(value), 'dd MMM yyyy') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => { if (date) onChange(format(date, 'yyyy-MM-dd')); }}
            disabled={disabledMatcher}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
          <div className="px-3 pb-3 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-destructive inline-block" /> Confirmed</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-warning inline-block" /> Pending</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-success inline-block" /> Available</span>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function BookPage() {
  const [searchParams] = useSearchParams();
  const preselectedPark = searchParams.get('park') || '';

  const [companyName, setCompanyName] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [items, setItems] = useState<BookingItem[]>([
    { parkId: preselectedPark, siteId: '', arrivalDate: '', departureDate: '' },
  ]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedVoucher, setSubmittedVoucher] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [availabilityMap, setAvailabilityMap] = useState<Record<number, boolean | null>>({});

  const resolvedCompany = companyName === '__other__' ? customCompany : companyName;

  const updateItem = (index: number, field: keyof BookingItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'parkId') updated[index].siteId = '';
    if (field === 'arrivalDate' && updated[index].departureDate && updated[index].departureDate <= value) {
      updated[index].departureDate = '';
    }
    setItems(updated);
  };

  const addItem = () => setItems([...items, { parkId: '', siteId: '', arrivalDate: '', departureDate: '' }]);
  const removeItem = (index: number) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)); };

  // Check availability async
  useEffect(() => {
    items.forEach((item, index) => {
      if (item.siteId && item.arrivalDate && item.departureDate) {
        const nights = differenceInDays(new Date(item.departureDate), new Date(item.arrivalDate));
        if (nights > 0) {
          isDateRangeAvailable(item.siteId, item.arrivalDate, item.departureDate).then(avail => {
            setAvailabilityMap(prev => ({ ...prev, [index]: avail }));
          });
        }
      } else {
        setAvailabilityMap(prev => ({ ...prev, [index]: null }));
      }
    });
  }, [items]);

  const itemDetails = useMemo(() => items.map((item, index) => {
    const park = parks.find(p => p.id === item.parkId);
    const site = park?.sites.find(s => s.id === item.siteId);
    const nights = item.arrivalDate && item.departureDate
      ? Math.max(0, differenceInDays(new Date(item.departureDate), new Date(item.arrivalDate))) : 0;
    const total = nights * RATE_PER_NIGHT;
    const available = availabilityMap[index] ?? null;
    return { park, site, nights, total, available };
  }), [items, availabilityMap]);

  const grandTotal = itemDetails.reduce((s, d) => s + d.total, 0);
  const allValid = resolvedCompany && contactEmail && contactPhone && items.every((item, i) =>
    item.parkId && item.siteId && item.arrivalDate && item.departureDate &&
    itemDetails[i].nights > 0 && itemDetails[i].available !== false
  );

  const invoiceData = {
    voucherNo: 'PREVIEW',
    companyName: resolvedCompany,
    contactEmail,
    contactPhone,
    items: items.map((item, i) => ({
      parkName: itemDetails[i].park?.name || '',
      siteName: itemDetails[i].site?.name || '',
      arrivalDate: item.arrivalDate,
      departureDate: item.departureDate,
      nights: itemDetails[i].nights,
      totalAmount: itemDetails[i].total,
    })),
    grandTotal,
  };

  const handleSubmit = async () => {
    if (!allValid || submitting) return;
    setSubmitting(true);
    try {
      const bookingItems = items.map((item, i) => ({
        parkId: item.parkId, parkName: itemDetails[i].park!.name,
        siteId: item.siteId, siteName: itemDetails[i].site!.name,
        arrivalDate: item.arrivalDate, departureDate: item.departureDate,
        nights: itemDetails[i].nights, ratePerNight: RATE_PER_NIGHT, totalAmount: itemDetails[i].total,
      }));
      const group = await addBookingGroup(resolvedCompany, contactEmail, contactPhone, bookingItems);
      setSubmittedVoucher(group.voucherNo);
      setShowInvoice(false);
      setSubmitted(true);
      toast.success('Booking submitted successfully!');
    } catch (err: any) {
      toast.error('Failed to submit booking: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-background flex items-center justify-center">
        <div className="max-w-lg w-full mx-4">
          <Card className="border-0 shadow-xl">
            <CardContent className="pt-12 pb-10 text-center px-8">
              <div className="w-16 h-16 rounded-full amber-glow flex items-center justify-center mx-auto mb-6">
                <CalendarCheck className="h-8 w-8 text-accent-foreground" />
              </div>
              <h1 className="font-display text-3xl font-bold mb-3">Booking Submitted!</h1>
              <p className="text-muted-foreground mb-8">Your booking is pending confirmation by BOGA admin.</p>
              <div className="bg-muted rounded-xl p-5 mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Voucher Number</p>
                <p className="text-3xl font-bold font-mono">{submittedVoucher}</p>
              </div>
              <p className="text-sm text-muted-foreground mb-8">
                Company: <strong>{resolvedCompany}</strong> • Total: <strong>P{grandTotal.toLocaleString()}</strong>
              </p>
              <Button onClick={() => { setSubmitted(false); setItems([{ parkId: '', siteId: '', arrivalDate: '', departureDate: '' }]); }} className="amber-glow text-accent-foreground border-0">
                Make Another Booking
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-10">
          <p className="text-secondary font-display font-semibold text-sm uppercase tracking-[0.2em] mb-2">New Booking</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Book Safari Campsites</h1>
          <p className="text-muted-foreground">Select your destinations, choose dates, and get an instant quote. <strong>P{RATE_PER_NIGHT}/night</strong> per site.</p>
        </div>

        <Card className="mb-6 border-0 shadow-md">
          <CardContent className="pt-6">
            <h2 className="font-display text-lg font-semibold mb-4">Company Information</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Company</Label>
                <Select value={companyName} onValueChange={setCompanyName}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>
                    {companies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    <SelectItem value="__other__">Other company...</SelectItem>
                  </SelectContent>
                </Select>
                {companyName === '__other__' && (
                  <Input className="mt-2" placeholder="Enter company name" value={customCompany} onChange={e => setCustomCompany(e.target.value)} />
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
                <Input className="mt-1.5" type="email" placeholder="contact@company.com" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Phone</Label>
                <Input className="mt-1.5" type="tel" placeholder="+267 ..." value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 mb-6">
          <h2 className="font-display text-lg font-semibold">Camping Sites</h2>
          {items.map((item, index) => {
            const detail = itemDetails[index];
            const park = parks.find(p => p.id === item.parkId);
            const site = park?.sites.find(s => s.id === item.siteId);
            const arrivalDate = item.arrivalDate ? new Date(item.arrivalDate) : undefined;
            return (
              <Card key={index} className={`border-0 shadow-md ${detail.available === false ? 'ring-2 ring-destructive' : ''}`}>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="w-6 h-6 rounded-full amber-glow flex items-center justify-center text-xs font-bold text-accent-foreground">{index + 1}</span>
                      Site Reservation
                    </span>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(index)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Park / Reserve</Label>
                      <Select value={item.parkId} onValueChange={v => updateItem(index, 'parkId', v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select park" /></SelectTrigger>
                        <SelectContent>{parks.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Camping Site</Label>
                      <Select value={item.siteId} onValueChange={v => updateItem(index, 'siteId', v)} disabled={!item.parkId}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select site" /></SelectTrigger>
                        <SelectContent>{park?.sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                      {site?.coordinates && <p className="text-[10px] text-muted-foreground mt-1">{site.coordinates}</p>}
                    </div>
                    <DateCalendarPicker
                      label="Arrival Date"
                      value={item.arrivalDate}
                      onChange={v => updateItem(index, 'arrivalDate', v)}
                      siteId={item.siteId}
                    />
                    <DateCalendarPicker
                      label="Departure Date"
                      value={item.departureDate}
                      onChange={v => updateItem(index, 'departureDate', v)}
                      siteId={item.siteId}
                      minDate={arrivalDate ? new Date(arrivalDate.getTime() + 86400000) : undefined}
                    />
                  </div>
                  {(detail.nights > 0 || detail.available !== null) && (
                    <div className="mt-3 flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        {detail.nights > 0 && <span className="text-muted-foreground">{detail.nights} night{detail.nights > 1 ? 's' : ''} × P{RATE_PER_NIGHT}</span>}
                        {detail.available === false && <Badge variant="destructive" className="text-xs">Unavailable</Badge>}
                        {detail.available === true && <Badge className="bg-success text-success-foreground text-xs">Available ✓</Badge>}
                      </div>
                      {detail.total > 0 && <span className="font-display font-bold text-lg">P{detail.total.toLocaleString()}</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button variant="outline" className="w-full mb-8 border-dashed border-2 py-6 text-muted-foreground hover:text-foreground hover:border-secondary" onClick={addItem}>
          <Plus className="h-4 w-4 mr-2" /> Add Another Site
        </Button>

        <Card className="border-0 shadow-xl bg-card">
          <CardContent className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Grand Total</p>
              <p className="text-4xl font-display font-extrabold">P{grandTotal.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{items.length} site{items.length > 1 ? 's' : ''} • {itemDetails.reduce((s, d) => s + d.nights, 0)} nights</p>
            </div>
            <Button size="lg" className="amber-glow text-accent-foreground border-0 px-10 py-6 rounded-xl font-semibold" disabled={!allValid} onClick={() => setShowInvoice(true)}>
              Review Invoice <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {showInvoice && (
        <InvoicePreview group={invoiceData} onClose={() => setShowInvoice(false)} onConfirm={handleSubmit} />
      )}
    </div>
  );
}
