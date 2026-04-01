import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parks, RATE_PER_NIGHT, companies } from '@/data/parks';
import { addBookingGroup, isDateRangeAvailable } from '@/store/bookingStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, CalendarCheck, MapPin, ArrowRight } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { InvoicePreview } from '@/components/InvoicePreview';

interface BookingItem {
  parkId: string;
  siteId: string;
  arrivalDate: string;
  departureDate: string;
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

  const resolvedCompany = companyName === '__other__' ? customCompany : companyName;

  const updateItem = (index: number, field: keyof BookingItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'parkId') updated[index].siteId = '';
    setItems(updated);
  };

  const addItem = () => setItems([...items, { parkId: '', siteId: '', arrivalDate: '', departureDate: '' }]);
  const removeItem = (index: number) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)); };

  const itemDetails = useMemo(() => items.map(item => {
    const park = parks.find(p => p.id === item.parkId);
    const site = park?.sites.find(s => s.id === item.siteId);
    const nights = item.arrivalDate && item.departureDate
      ? Math.max(0, differenceInDays(new Date(item.departureDate), new Date(item.arrivalDate))) : 0;
    const total = nights * RATE_PER_NIGHT;
    const available = item.siteId && item.arrivalDate && item.departureDate && nights > 0
      ? isDateRangeAvailable(item.siteId, item.arrivalDate, item.departureDate) : null;
    return { park, site, nights, total, available };
  }), [items]);

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

  const handleSubmit = () => {
    if (!allValid) return;
    const bookingItems = items.map((item, i) => ({
      parkId: item.parkId, parkName: itemDetails[i].park!.name,
      siteId: item.siteId, siteName: itemDetails[i].site!.name,
      arrivalDate: item.arrivalDate, departureDate: item.departureDate,
      nights: itemDetails[i].nights, ratePerNight: RATE_PER_NIGHT, totalAmount: itemDetails[i].total,
    }));
    const group = addBookingGroup(resolvedCompany, contactEmail, contactPhone, bookingItems);
    setSubmittedVoucher(group.voucherNo);
    setShowInvoice(false);
    setSubmitted(true);
    toast.success('Booking submitted successfully!');
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

        {/* Company */}
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

        {/* Sites */}
        <div className="space-y-4 mb-6">
          <h2 className="font-display text-lg font-semibold">Camping Sites</h2>
          {items.map((item, index) => {
            const detail = itemDetails[index];
            const park = parks.find(p => p.id === item.parkId);
            const site = park?.sites.find(s => s.id === item.siteId);
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
                    <div>
                      <Label className="text-xs text-muted-foreground">Arrival Date</Label>
                      <Input type="date" className="mt-1" value={item.arrivalDate} onChange={e => updateItem(index, 'arrivalDate', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Departure Date</Label>
                      <Input type="date" className="mt-1" value={item.departureDate} onChange={e => updateItem(index, 'departureDate', e.target.value)} />
                    </div>
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

        {/* Summary */}
        <Card className="border-0 shadow-xl bg-card">
          <CardContent className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Grand Total</p>
              <p className="text-4xl font-display font-extrabold">P{grandTotal.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{items.length} site{items.length > 1 ? 's' : ''} • {itemDetails.reduce((s, d) => s + d.nights, 0)} night{itemDetails.reduce((s, d) => s + d.nights, 0) > 1 ? 's' : ''}</p>
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
