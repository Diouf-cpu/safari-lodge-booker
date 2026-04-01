import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parks, RATE_PER_NIGHT } from '@/data/parks';
import { addBookingGroup, isDateRangeAvailable } from '@/store/bookingStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { companies } from '@/data/parks';
import { toast } from 'sonner';
import { Plus, Trash2, CalendarCheck, MapPin } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

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
  const [submitted, setSubmitted] = useState(false);
  const [submittedVoucher, setSubmittedVoucher] = useState('');

  const resolvedCompany = companyName === '__other__' ? customCompany : companyName;

  const updateItem = (index: number, field: keyof BookingItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'parkId') {
      updated[index].siteId = '';
    }
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { parkId: '', siteId: '', arrivalDate: '', departureDate: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const itemDetails = useMemo(() => {
    return items.map(item => {
      const park = parks.find(p => p.id === item.parkId);
      const site = park?.sites.find(s => s.id === item.siteId);
      const nights = item.arrivalDate && item.departureDate
        ? Math.max(0, differenceInDays(new Date(item.departureDate), new Date(item.arrivalDate)))
        : 0;
      const total = nights * RATE_PER_NIGHT;
      const available = item.siteId && item.arrivalDate && item.departureDate && nights > 0
        ? isDateRangeAvailable(item.siteId, item.arrivalDate, item.departureDate)
        : null;
      return { park, site, nights, total, available };
    });
  }, [items]);

  const grandTotal = itemDetails.reduce((s, d) => s + d.total, 0);
  const allValid = resolvedCompany && contactEmail && contactPhone && items.every((item, i) =>
    item.parkId && item.siteId && item.arrivalDate && item.departureDate &&
    itemDetails[i].nights > 0 && itemDetails[i].available !== false
  );

  const handleSubmit = () => {
    if (!allValid) return;

    const bookingItems = items.map((item, i) => ({
      parkId: item.parkId,
      parkName: itemDetails[i].park!.name,
      siteId: item.siteId,
      siteName: itemDetails[i].site!.name,
      arrivalDate: item.arrivalDate,
      departureDate: item.departureDate,
      nights: itemDetails[i].nights,
      ratePerNight: RATE_PER_NIGHT,
      totalAmount: itemDetails[i].total,
    }));

    const group = addBookingGroup(resolvedCompany, contactEmail, contactPhone, bookingItems);
    setSubmitted(true);
    setSubmittedVoucher(group.voucherNo);
    toast.success('Booking submitted successfully!');
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-background">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="bg-card rounded-2xl border p-12">
            <CalendarCheck className="h-16 w-16 text-success mx-auto mb-6" />
            <h1 className="font-serif text-3xl font-bold mb-4">Booking Submitted!</h1>
            <p className="text-muted-foreground mb-6">
              Your booking has been received and is pending confirmation by BOGA admin.
            </p>
            <div className="bg-muted rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">Voucher Number</p>
              <p className="text-2xl font-bold font-mono">{submittedVoucher}</p>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Company: <strong>{resolvedCompany}</strong> • Total: <strong>P{grandTotal.toLocaleString()}</strong>
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => { setSubmitted(false); setItems([{ parkId: '', siteId: '', arrivalDate: '', departureDate: '' }]); }}>
                New Booking
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">Book Safari Campsites</h1>
          <p className="text-muted-foreground">Select your sites, dates, and company details below. P{RATE_PER_NIGHT}/night per site.</p>
        </div>

        {/* Company Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Company Details</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Company Name</Label>
              <Select value={companyName} onValueChange={setCompanyName}>
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                  <SelectItem value="__other__">Other (type below)</SelectItem>
                </SelectContent>
              </Select>
              {companyName === '__other__' && (
                <Input className="mt-2" placeholder="Enter company name" value={customCompany} onChange={e => setCustomCompany(e.target.value)} />
              )}
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="contact@company.com" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input type="tel" placeholder="+267 ..." value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Booking Items */}
        <div className="space-y-4 mb-8">
          {items.map((item, index) => {
            const detail = itemDetails[index];
            const park = parks.find(p => p.id === item.parkId);
            return (
              <Card key={index} className={detail.available === false ? 'border-destructive' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">Site {index + 1}</span>
                    </div>
                    {items.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label>Park / Reserve</Label>
                      <Select value={item.parkId} onValueChange={v => updateItem(index, 'parkId', v)}>
                        <SelectTrigger><SelectValue placeholder="Select park" /></SelectTrigger>
                        <SelectContent>
                          {parks.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Camping Site</Label>
                      <Select value={item.siteId} onValueChange={v => updateItem(index, 'siteId', v)} disabled={!item.parkId}>
                        <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                        <SelectContent>
                          {park?.sites.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Arrival</Label>
                      <Input type="date" value={item.arrivalDate} onChange={e => updateItem(index, 'arrivalDate', e.target.value)} />
                    </div>
                    <div>
                      <Label>Departure</Label>
                      <Input type="date" value={item.departureDate} onChange={e => updateItem(index, 'departureDate', e.target.value)} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm">
                      {detail.nights > 0 && (
                        <span className="text-muted-foreground">{detail.nights} night{detail.nights > 1 ? 's' : ''}</span>
                      )}
                      {detail.available === false && (
                        <Badge variant="destructive">Dates unavailable</Badge>
                      )}
                      {detail.available === true && (
                        <Badge className="bg-success text-success-foreground">Available</Badge>
                      )}
                    </div>
                    {detail.total > 0 && (
                      <span className="font-semibold">P{detail.total.toLocaleString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button variant="outline" className="w-full mb-8" onClick={addItem}>
          <Plus className="h-4 w-4 mr-2" /> Add Another Site
        </Button>

        {/* Summary */}
        <Card className="mb-8 border-primary">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Grand Total</p>
              <p className="text-3xl font-bold font-serif">P{grandTotal.toLocaleString()}</p>
            </div>
            <Button size="lg" className="safari-gradient border-0 px-8" disabled={!allValid} onClick={handleSubmit}>
              Submit Booking
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
