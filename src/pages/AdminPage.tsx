import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getGroupedBookings, confirmBooking, cancelBooking, getBookings, getSiteBookingStats, getCompanies, addCompany, deleteCompany, expireOldBookings, getDailySummary, addBookingGroup, isDateRangeAvailable, getBookedDatesForSite } from '@/store/bookingStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Search, CheckCircle, XCircle, FileText, MapPin, CalendarDays, CalendarIcon, Users, DollarSign, ChevronDown, ChevronUp, Lock, LogOut, TrendingUp, Building2, BarChart3, Trash2, Plus, Receipt, FileCheck, UserPlus } from 'lucide-react';
import { format, differenceInDays, eachDayOfInterval, parseISO, startOfDay, isBefore } from 'date-fns';
import { parks, RATE_PER_NIGHT } from '@/data/parks';
import { InvoicePreview } from '@/components/InvoicePreview';
import { cn } from '@/lib/utils';
import bogaLogo from '@/assets/boga-logo.png';

function AdminLogin({ onLogin }: { onLogin: (role: 'admin' | 'accountant') => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }

    // Check for admin or accountant role
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id);
    const roleList = (roles || []).map(r => r.role);

    if (roleList.includes('admin')) {
      onLogin('admin');
    } else if (roleList.includes('accountant')) {
      onLogin('accountant');
    } else {
      await supabase.auth.signOut();
      setError('You do not have admin or accountant access.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm border-0 shadow-xl">
        <CardContent className="pt-10 pb-8 px-8">
          <img src={bogaLogo} alt="BOGA" className="h-16 w-16 object-contain mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-center mb-1">Staff Access</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">Sign in with your staff account</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
              <Input type="email" className="mt-1.5" placeholder="staff@boga.org.bw" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Password</Label>
              <Input type="password" className="mt-1.5" placeholder="Enter password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} />
              {error && <p className="text-xs text-destructive mt-1">{error}</p>}
            </div>
            <Button type="submit" className="w-full amber-glow text-accent-foreground border-0 font-semibold" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function AccountantDashboard() {
  const [summaryDate, setSummaryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [summary, setSummary] = useState<{ groups: any[]; totalRevenue: number }>({ groups: [], totalRevenue: 0 });
  const [allConfirmed, setAllConfirmed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, bookings] = await Promise.all([
        getDailySummary(summaryDate),
        getBookings(),
      ]);
      setSummary(s);
      setAllConfirmed(bookings.filter((b: any) => b.status === 'confirmed'));
      setLoading(false);
    };
    load();
  }, [summaryDate]);

  const totalConfirmedRevenue = allConfirmed.reduce((s, b) => s + Number(b.total_amount), 0);

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.reload(); };

  if (loading) return <div className="min-h-screen pt-24 pb-16 bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="text-secondary font-display font-semibold text-sm uppercase tracking-[0.2em] mb-2">Accountant</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Finance Dashboard</h1>
            <p className="text-muted-foreground">View confirmed payments and daily summaries.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="mt-2"><LogOut className="h-4 w-4 mr-1.5" /> Sign Out</Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-md">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><DollarSign className="h-5 w-5 text-secondary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Confirmed Revenue</p>
                  <p className="text-xl font-display font-bold">P{totalConfirmedRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><CheckCircle className="h-5 w-5 text-secondary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Confirmed Bookings</p>
                  <p className="text-xl font-display font-bold">{allConfirmed.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><Receipt className="h-5 w-5 text-secondary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Daily Summary ({format(new Date(summaryDate), 'dd MMM')})</p>
                  <p className="text-xl font-display font-bold">P{summary.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md mb-6">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <Label className="text-sm font-medium whitespace-nowrap">Daily Summary Date:</Label>
            <Input type="date" value={summaryDate} onChange={e => setSummaryDate(e.target.value)} className="max-w-xs" />
          </CardContent>
        </Card>

        {summary.groups.length > 0 ? (
          <div className="rounded-xl border overflow-hidden bg-card shadow-md mb-8">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs uppercase font-semibold">Voucher</TableHead>
                  <TableHead className="text-xs uppercase font-semibold">Company</TableHead>
                  <TableHead className="text-xs uppercase font-semibold">Confirmed At</TableHead>
                  <TableHead className="text-xs uppercase font-semibold text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.groups.map((g: any) => (
                  <TableRow key={g.voucherNo}>
                    <TableCell className="font-mono text-sm">#{g.voucherNo}</TableCell>
                    <TableCell className="font-semibold">{g.companyName}</TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(g.confirmedAt), 'dd MMM yyyy HH:mm')}</TableCell>
                    <TableCell className="text-right font-bold">P{g.grandTotal.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={3} className="font-display font-bold">Daily Total</TableCell>
                  <TableCell className="text-right font-display font-bold text-lg">P{summary.totalRevenue.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">No confirmed payments for {format(new Date(summaryDate), 'dd MMM yyyy')}.</div>
        )}

        <h2 className="font-display text-xl font-bold mb-4">All Confirmed Bookings</h2>
        <div className="rounded-xl border overflow-hidden bg-card shadow-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs uppercase">Voucher</TableHead>
                <TableHead className="text-xs uppercase">Company</TableHead>
                <TableHead className="text-xs uppercase">Park</TableHead>
                <TableHead className="text-xs uppercase">Site</TableHead>
                <TableHead className="text-xs uppercase">Dates</TableHead>
                <TableHead className="text-xs uppercase text-center">Nights</TableHead>
                <TableHead className="text-xs uppercase text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allConfirmed.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No confirmed bookings yet</TableCell></TableRow>
              ) : allConfirmed.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.voucher_no}</TableCell>
                  <TableCell className="font-semibold">{b.company_name}</TableCell>
                  <TableCell>{b.park_name}</TableCell>
                  <TableCell>{b.site_name}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(b.arrival_date), 'dd MMM')} — {format(new Date(b.departure_date), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-center">{b.nights}</TableCell>
                  <TableCell className="text-right font-medium">P{Number(b.total_amount).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function AdminDatePicker({ label, value, onChange, siteId, minDate }: { label: string; value: string; onChange: (val: string) => void; siteId: string; minDate?: Date }) {
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
    return bookedDates.some(b => b.status === 'confirmed' && date.getTime() === startOfDay(b.date).getTime());
  };

  const modifiers = {
    booked_confirmed: bookedDates.filter(b => b.status === 'confirmed').map(b => b.date),
    booked_pending: bookedDates.filter(b => b.status === 'pending').map(b => b.date),
  };
  const modifiersStyles = {
    booked_confirmed: { backgroundColor: 'hsl(0 72% 51%)', color: 'white', borderRadius: '6px' },
    booked_pending: { backgroundColor: 'hsl(38 92% 50%)', color: 'white', borderRadius: '6px' },
  };

  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal", !value && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(parseISO(value), 'dd MMM yyyy') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value ? parseISO(value) : undefined}
            onSelect={(date) => { if (date) onChange(format(date, 'yyyy-MM-dd')); }}
            disabled={disabledMatcher} modifiers={modifiers} modifiersStyles={modifiersStyles}
            initialFocus className="p-3 pointer-events-auto" />
          <div className="px-3 pb-3 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-destructive inline-block" /> Confirmed</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-warning inline-block" /> Pending</span>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function AdminBookForClient({ onBooked }: { onBooked: () => void }) {
  const bogaPark = parks.find(p => p.id === 'boga-reserve');
  const [clientType, setClientType] = useState<'company' | 'individual'>('company');
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [individualName, setIndividualName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [siteId, setSiteId] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState<boolean | null>(null);

  useEffect(() => { getCompanies().then(setCompanies); }, []);

  const resolvedName = clientType === 'company'
    ? (companyName === '__other__' ? customCompany : companyName)
    : individualName;

  const site = bogaPark?.sites.find(s => s.id === siteId);
  const nights = arrivalDate && departureDate ? Math.max(0, differenceInDays(new Date(departureDate), new Date(arrivalDate))) : 0;
  const total = nights * RATE_PER_NIGHT;

  useEffect(() => {
    if (siteId && arrivalDate && departureDate && nights > 0) {
      isDateRangeAvailable(siteId, arrivalDate, departureDate).then(setAvailability);
    } else {
      setAvailability(null);
    }
  }, [siteId, arrivalDate, departureDate, nights]);

  const allValid = resolvedName && contactEmail && contactPhone && siteId && arrivalDate && departureDate && nights > 0 && availability !== false;

  const handleSubmit = async () => {
    if (!allValid || submitting) return;
    setSubmitting(true);
    try {
      await addBookingGroup(resolvedName, contactEmail, contactPhone, [{
        parkId: 'boga-reserve', parkName: bogaPark!.name,
        siteId, siteName: site!.name,
        arrivalDate, departureDate, nights, ratePerNight: RATE_PER_NIGHT, totalAmount: total,
      }]);
      toast.success('Booking created for client!');
      setCompanyName(''); setCustomCompany(''); setIndividualName('');
      setContactEmail(''); setContactPhone(''); setSiteId('');
      setArrivalDate(''); setDepartureDate('');
      onBooked();
    } catch (err: any) {
      toast.error('Failed: ' + (err.message || 'Unknown error'));
    } finally { setSubmitting(false); }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl amber-glow flex items-center justify-center"><UserPlus className="h-5 w-5 text-accent-foreground" /></div>
          <div>
            <h3 className="font-display text-lg font-bold">Book for Client — BOGA Reserve</h3>
            <p className="text-sm text-muted-foreground">Create a booking on behalf of a walk-in or phone client</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Client Type</Label>
            <Select value={clientType} onValueChange={(v: 'company' | 'individual') => setClientType(v)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {clientType === 'company' ? (
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Company</Label>
              <Select value={companyName} onValueChange={setCompanyName}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  <SelectItem value="__other__">✚ Other company...</SelectItem>
                </SelectContent>
              </Select>
              {companyName === '__other__' && <Input className="mt-2" placeholder="Enter company name" value={customCompany} onChange={e => setCustomCompany(e.target.value)} />}
            </div>
          ) : (
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</Label>
              <Input className="mt-1.5" placeholder="Client full name" value={individualName} onChange={e => setIndividualName(e.target.value)} />
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
            <Input className="mt-1.5" type="email" placeholder="client@email.com" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Phone</Label>
            <Input className="mt-1.5" type="tel" placeholder="+267 ..." value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Camp Site</Label>
            <Select value={siteId} onValueChange={setSiteId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select camp" /></SelectTrigger>
              <SelectContent>
                {bogaPark?.sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <AdminDatePicker label="Arrival Date" value={arrivalDate} onChange={setArrivalDate} siteId={siteId} />
          <AdminDatePicker label="Departure Date" value={departureDate} onChange={setDepartureDate} siteId={siteId}
            minDate={arrivalDate ? new Date(new Date(arrivalDate).getTime() + 86400000) : undefined} />
        </div>

        {nights > 0 && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{nights} night{nights > 1 ? 's' : ''} × P{RATE_PER_NIGHT}</span>
              {availability === false && <Badge variant="destructive" className="text-xs">Unavailable</Badge>}
              {availability === true && <Badge className="bg-success text-success-foreground text-xs">Available ✓</Badge>}
            </div>
            <span className="font-display font-bold text-xl">P{total.toLocaleString()}</span>
          </div>
        )}

        <Button onClick={handleSubmit} disabled={!allValid || submitting} className="w-full amber-glow text-accent-foreground border-0 font-semibold py-5">
          {submitting ? 'Creating...' : 'Create Booking for Client'}
        </Button>
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [parkFilter, setParkFilter] = useState('all');
  const [expandedVoucher, setExpandedVoucher] = useState<string | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [siteStats, setSiteStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const [showBookClient, setShowBookClient] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [siteSearch, setSiteSearch] = useState('');
  const [voucherSearch, setVoucherSearch] = useState('');
  const [companies, setCompanies] = useState<string[]>([]);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [previewGroup, setPreviewGroup] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState<'receipt' | 'voucher'>('receipt');

  const loadData = async () => {
    try {
      const [g, b, ss, c] = await Promise.all([getGroupedBookings(), getBookings(), getSiteBookingStats(), getCompanies()]);
      setGroups(g);
      setAllBookings(b);
      setSiteStats(ss);
      setCompanies(c);
      // Auto-expire old pending bookings
      await expireOldBookings();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const years = useMemo(() => {
    const yrs = new Set(allBookings.map((b: any) => new Date(b.arrival_date).getFullYear()));
    return Array.from(yrs).sort((a, b) => b - a);
  }, [allBookings]);

  const filteredGroups = useMemo(() => {
    return groups.filter((g: any) => {
      const matchSearch = !searchTerm || g.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || g.voucherNo.includes(searchTerm);
      const matchStatus = statusFilter === 'all' || g.status === statusFilter;
      const matchYear = yearFilter === 'all' || g.bookings.some((b: any) => new Date(b.arrivalDate).getFullYear().toString() === yearFilter);
      const matchPark = parkFilter === 'all' || g.bookings.some((b: any) => b.parkId === parkFilter);
      return matchSearch && matchStatus && matchYear && matchPark;
    });
  }, [groups, searchTerm, statusFilter, yearFilter, parkFilter]);

  const stats = useMemo(() => ({
    total: allBookings.length,
    confirmed: allBookings.filter((b: any) => b.status === 'confirmed').length,
    pending: allBookings.filter((b: any) => b.status === 'pending').length,
    cancelled: allBookings.filter((b: any) => b.status === 'cancelled').length,
    revenue: allBookings.filter((b: any) => b.status !== 'cancelled').reduce((s: number, b: any) => s + Number(b.total_amount), 0),
    pendingRevenue: allBookings.filter((b: any) => b.status === 'pending').reduce((s: number, b: any) => s + Number(b.total_amount), 0),
    confirmedRevenue: allBookings.filter((b: any) => b.status === 'confirmed').reduce((s: number, b: any) => s + Number(b.total_amount), 0),
    uniqueCompanies: new Set(allBookings.map((b: any) => b.company_name)).size,
  }), [allBookings]);

  const companyAnalytics = useMemo(() => {
    const map: Record<string, { name: string; bookings: number; sites: Set<string>; revenue: number; pending: number; confirmed: number }> = {};
    allBookings.forEach((b: any) => {
      if (!map[b.company_name]) map[b.company_name] = { name: b.company_name, bookings: 0, sites: new Set(), revenue: 0, pending: 0, confirmed: 0 };
      map[b.company_name].bookings++;
      map[b.company_name].sites.add(b.site_id);
      if (b.status !== 'cancelled') map[b.company_name].revenue += Number(b.total_amount);
      if (b.status === 'pending') map[b.company_name].pending++;
      if (b.status === 'confirmed') map[b.company_name].confirmed++;
    });
    return Object.values(map)
      .map(c => ({ ...c, sites: c.sites.size }))
      .filter(c => !companySearch || c.name.toLowerCase().includes(companySearch.toLowerCase()))
      .sort((a, b) => b.bookings - a.bookings);
  }, [allBookings, companySearch]);

  const siteAnalytics = useMemo(() => {
    const map: Record<string, { siteId: string; siteName: string; parkName: string; companies: Set<string>; bookings: number; revenue: number }> = {};
    allBookings.filter((b: any) => b.status !== 'cancelled').forEach((b: any) => {
      if (!map[b.site_id]) map[b.site_id] = { siteId: b.site_id, siteName: b.site_name, parkName: b.park_name, companies: new Set(), bookings: 0, revenue: 0 };
      map[b.site_id].companies.add(b.company_name);
      map[b.site_id].bookings++;
      map[b.site_id].revenue += Number(b.total_amount);
    });
    return Object.values(map)
      .map(s => ({ ...s, companies: s.companies.size }))
      .filter(s => !siteSearch || s.siteName.toLowerCase().includes(siteSearch.toLowerCase()) || s.parkName.toLowerCase().includes(siteSearch.toLowerCase()))
      .sort((a, b) => b.bookings - a.bookings);
  }, [allBookings, siteSearch]);

  const voucherResults = useMemo(() => {
    if (!voucherSearch) return [];
    return groups.filter((g: any) =>
      g.voucherNo.includes(voucherSearch) ||
      g.bookings.some((b: any) => b.siteVoucherNo?.includes(voucherSearch))
    );
  }, [groups, voucherSearch]);

  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const companyBookings = useMemo(() => {
    if (!selectedCompany) return [];
    return allBookings.filter((b: any) => b.company_name === selectedCompany);
  }, [allBookings, selectedCompany]);

  const handleConfirm = async (voucherNo: string) => {
    await confirmBooking(voucherNo);
    await loadData();
    toast.success(`Booking ${voucherNo} confirmed`);
  };

  const handleCancel = async (voucherNo: string) => {
    await cancelBooking(voucherNo);
    await loadData();
    toast.info(`Booking ${voucherNo} cancelled`);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.reload(); };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;
    await addCompany(newCompanyName.trim());
    setNewCompanyName('');
    const updated = await getCompanies();
    setCompanies(updated);
    toast.success('Company added');
  };

  const handleDeleteCompany = async (name: string) => {
    await deleteCompany(name);
    const updated = await getCompanies();
    setCompanies(updated);
    toast.success('Company removed');
  };

  const openDocPreview = (group: any, mode: 'receipt' | 'voucher') => {
    setPreviewGroup({
      voucherNo: group.voucherNo,
      companyName: group.companyName,
      contactEmail: group.contactEmail,
      contactPhone: group.contactPhone,
      status: group.status,
      items: group.bookings.map((b: any) => ({
        parkName: b.parkName,
        siteName: b.siteName,
        arrivalDate: b.arrivalDate,
        departureDate: b.departureDate,
        nights: b.nights,
        totalAmount: b.totalAmount,
        siteVoucherNo: b.siteVoucherNo,
      })),
      grandTotal: group.grandTotal,
    });
    setPreviewMode(mode);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-success text-success-foreground',
      pending: 'bg-warning text-warning-foreground',
      cancelled: 'bg-destructive text-destructive-foreground',
    };
    return <Badge className={`${styles[status] || ''} text-xs font-medium`}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  if (loading) {
    return <div className="min-h-screen pt-24 pb-16 bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading dashboard...</p></div>;
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-secondary font-display font-semibold text-sm uppercase tracking-[0.2em] mb-2">Administration</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Booking Dashboard</h1>
            <p className="text-muted-foreground">Manage bookings, companies, analytics, and history.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="mt-2"><LogOut className="h-4 w-4 mr-1.5" /> Sign Out</Button>
        </div>

        {/* Book for Client - prominent toggle at top */}
        <div className="mb-8">
          <Button
            onClick={() => setShowBookClient(!showBookClient)}
            className="amber-glow text-accent-foreground border-0 font-semibold px-6 py-3 text-base"
            size="lg"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            {showBookClient ? 'Close Booking Form' : 'Book for Client — BOGA Reserve'}
          </Button>
          {showBookClient && (
            <div className="mt-4">
              <AdminBookForClient onBooked={() => { loadData(); setShowBookClient(false); }} />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: FileText, label: 'Total Bookings', value: stats.total },
            { icon: CheckCircle, label: 'Confirmed', value: stats.confirmed },
            { icon: CalendarDays, label: 'Pending', value: stats.pending },
            { icon: DollarSign, label: 'Total Revenue', value: `P${stats.revenue.toLocaleString()}` },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="border-0 shadow-md">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0"><Icon className="h-5 w-5 text-secondary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className="text-xl font-display font-bold">{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Building2, label: 'Unique Companies', value: stats.uniqueCompanies },
            { icon: TrendingUp, label: 'Confirmed Revenue', value: `P${stats.confirmedRevenue.toLocaleString()}` },
            { icon: BarChart3, label: 'Pending Revenue', value: `P${stats.pendingRevenue.toLocaleString()}` },
            { icon: XCircle, label: 'Cancelled', value: stats.cancelled },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="border-0 shadow-md">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0"><Icon className="h-5 w-5 text-muted-foreground" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className="text-xl font-display font-bold">{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-4xl">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="book-client">Book for Client</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="manage-companies">Manage List</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
            <TabsTrigger value="vouchers">Voucher Lookup</TabsTrigger>
          </TabsList>

          {/* BOOK FOR CLIENT TAB */}
          <TabsContent value="book-client">
            <AdminBookForClient onBooked={loadData} />
          </TabsContent>

          {/* BOOKINGS TAB */}
          <TabsContent value="bookings" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardContent className="pt-5 pb-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search company or voucher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={parkFilter} onValueChange={setParkFilter}>
                  <SelectTrigger><SelectValue placeholder="Park" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Parks</SelectItem>
                    {parks.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {filteredGroups.length === 0 ? (
              <div className="text-center py-24">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4"><FileText className="h-8 w-8 text-muted-foreground/40" /></div>
                <p className="text-muted-foreground font-medium mb-1">No bookings found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGroups.map((group: any) => {
                  const isExpanded = expandedVoucher === group.voucherNo;
                  return (
                    <Card key={group.voucherNo} className="border-0 shadow-md overflow-hidden">
                      <button className="w-full text-left p-5 flex items-center justify-between hover:bg-muted/30 transition-colors" onClick={() => setExpandedVoucher(isExpanded ? null : group.voucherNo)}>
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0"><Users className="h-5 w-5 text-muted-foreground" /></div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display font-semibold truncate">{group.companyName}</span>
                              {statusBadge(group.status)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">#{group.voucherNo} • {format(new Date(group.created_at), 'dd MMM yyyy')} • {group.bookings.length} site{group.bookings.length > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="font-display font-bold text-lg hidden sm:block">P{group.grandTotal.toLocaleString()}</span>
                          {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="border-t">
                          <div className="p-5">
                            <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                              {group.contactEmail && <span>✉ {group.contactEmail}</span>}
                              {group.contactPhone && <span>☎ {group.contactPhone}</span>}
                            </div>
                            <div className="rounded-xl border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Park</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Site</TableHead>
                                    {group.status === 'confirmed' && <TableHead className="font-semibold text-xs uppercase tracking-wider">Site Voucher</TableHead>}
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Arrival</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Departure</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">Nights</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Amount</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {group.bookings.map((b: any) => (
                                    <TableRow key={b.id}>
                                      <TableCell className="font-medium">{b.parkName}</TableCell>
                                      <TableCell>{b.siteName}</TableCell>
                                      {group.status === 'confirmed' && <TableCell className="font-mono text-xs text-muted-foreground">{b.siteVoucherNo || '—'}</TableCell>}
                                      <TableCell>{format(new Date(b.arrivalDate), 'dd MMM yyyy')}</TableCell>
                                      <TableCell>{format(new Date(b.departureDate), 'dd MMM yyyy')}</TableCell>
                                      <TableCell className="text-center">{b.nights}</TableCell>
                                      <TableCell className="text-right font-medium">P{b.totalAmount.toLocaleString()}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t flex-wrap gap-2">
                              <span className="font-display font-bold text-xl sm:hidden">P{group.grandTotal.toLocaleString()}</span>
                              <div className="flex gap-2 flex-wrap">
                                {group.status === 'confirmed' && (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => openDocPreview(group, 'receipt')}>
                                      <Receipt className="h-4 w-4 mr-1.5" /> Receipt
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => openDocPreview(group, 'voucher')}>
                                      <FileCheck className="h-4 w-4 mr-1.5" /> Site Vouchers
                                    </Button>
                                  </>
                                )}
                                {group.status === 'pending' && (
                                  <>
                                    <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground rounded-lg" onClick={() => handleConfirm(group.voucherNo)}>
                                      <CheckCircle className="h-4 w-4 mr-1.5" /> Confirm Payment
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5 rounded-lg" onClick={() => handleCancel(group.voucherNo)}>
                                      <XCircle className="h-4 w-4 mr-1.5" /> Cancel
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* COMPANIES TAB */}
          <TabsContent value="companies" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardContent className="pt-5 pb-4">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search company name..." value={companySearch} onChange={e => { setCompanySearch(e.target.value); setSelectedCompany(null); }} className="pl-10" />
                </div>
              </CardContent>
            </Card>

            {selectedCompany ? (
              <div className="space-y-4">
                <Button variant="outline" size="sm" onClick={() => setSelectedCompany(null)}>← Back to list</Button>
                <Card className="border-0 shadow-md">
                  <CardContent className="pt-6">
                    <h3 className="font-display text-xl font-bold mb-4">{selectedCompany} — Booking History</h3>
                    <div className="rounded-xl border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs uppercase">Voucher</TableHead>
                            <TableHead className="text-xs uppercase">Park</TableHead>
                            <TableHead className="text-xs uppercase">Site</TableHead>
                            <TableHead className="text-xs uppercase">Arrival</TableHead>
                            <TableHead className="text-xs uppercase">Departure</TableHead>
                            <TableHead className="text-xs uppercase text-center">Nights</TableHead>
                            <TableHead className="text-xs uppercase">Status</TableHead>
                            <TableHead className="text-xs uppercase text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {companyBookings.map((b: any) => (
                            <TableRow key={b.id}>
                              <TableCell className="font-mono text-xs">{b.voucher_no}</TableCell>
                              <TableCell>{b.park_name}</TableCell>
                              <TableCell>{b.site_name}</TableCell>
                              <TableCell>{format(new Date(b.arrival_date), 'dd MMM yyyy')}</TableCell>
                              <TableCell>{format(new Date(b.departure_date), 'dd MMM yyyy')}</TableCell>
                              <TableCell className="text-center">{b.nights}</TableCell>
                              <TableCell>{statusBadge(b.status)}</TableCell>
                              <TableCell className="text-right font-medium">P{Number(b.total_amount).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="rounded-xl border overflow-hidden bg-card shadow-md">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs uppercase font-semibold">Company</TableHead>
                      <TableHead className="text-xs uppercase font-semibold text-center">Bookings</TableHead>
                      <TableHead className="text-xs uppercase font-semibold text-center">Sites Used</TableHead>
                      <TableHead className="text-xs uppercase font-semibold text-center">Confirmed</TableHead>
                      <TableHead className="text-xs uppercase font-semibold text-center">Pending</TableHead>
                      <TableHead className="text-xs uppercase font-semibold text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyAnalytics.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No companies found</TableCell></TableRow>
                    ) : companyAnalytics.map(c => (
                      <TableRow key={c.name} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedCompany(c.name)}>
                        <TableCell className="font-semibold">{c.name}</TableCell>
                        <TableCell className="text-center">{c.bookings}</TableCell>
                        <TableCell className="text-center">{c.sites}</TableCell>
                        <TableCell className="text-center">{c.confirmed}</TableCell>
                        <TableCell className="text-center">{c.pending}</TableCell>
                        <TableCell className="text-right font-medium">P{c.revenue.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* MANAGE COMPANIES TAB */}
          <TabsContent value="manage-companies" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <h3 className="font-display text-lg font-bold mb-4">Manage Company List</h3>
                <div className="flex gap-3 mb-6">
                  <Input placeholder="New company name..." value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} className="max-w-sm" />
                  <Button onClick={handleAddCompany} className="amber-glow text-accent-foreground border-0">
                    <Plus className="h-4 w-4 mr-1.5" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {companies.map(name => (
                    <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="font-medium">{name}</span>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => handleDeleteCompany(name)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                      </Button>
                    </div>
                  ))}
                  {companies.length === 0 && <p className="text-muted-foreground text-center py-8">No companies in the list yet.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SITES TAB */}
          <TabsContent value="sites" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardContent className="pt-5 pb-4">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search site or park name..." value={siteSearch} onChange={e => setSiteSearch(e.target.value)} className="pl-10" />
                </div>
              </CardContent>
            </Card>
            <div className="rounded-xl border overflow-hidden bg-card shadow-md">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs uppercase font-semibold">Rank</TableHead>
                    <TableHead className="text-xs uppercase font-semibold">Site</TableHead>
                    <TableHead className="text-xs uppercase font-semibold">Park</TableHead>
                    <TableHead className="text-xs uppercase font-semibold text-center">Bookings</TableHead>
                    <TableHead className="text-xs uppercase font-semibold text-center">Companies</TableHead>
                    <TableHead className="text-xs uppercase font-semibold text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {siteAnalytics.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No site data</TableCell></TableRow>
                  ) : siteAnalytics.map((s, i) => (
                    <TableRow key={s.siteId}>
                      <TableCell>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'amber-glow text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
                      </TableCell>
                      <TableCell className="font-semibold">{s.siteName}</TableCell>
                      <TableCell className="text-muted-foreground">{s.parkName}</TableCell>
                      <TableCell className="text-center">{s.bookings}</TableCell>
                      <TableCell className="text-center">{s.companies}</TableCell>
                      <TableCell className="text-right font-medium">P{s.revenue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* VOUCHER LOOKUP TAB */}
          <TabsContent value="vouchers" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardContent className="pt-5 pb-4">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Enter voucher number (group or site)..." value={voucherSearch} onChange={e => setVoucherSearch(e.target.value)} className="pl-10" />
                </div>
              </CardContent>
            </Card>

            {voucherSearch && voucherResults.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No bookings found for voucher "{voucherSearch}"</p>
              </div>
            )}

            {voucherResults.map((group: any) => (
              <Card key={group.voucherNo} className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg font-bold">{group.companyName}</h3>
                        {statusBadge(group.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">Group Voucher: <span className="font-mono font-bold">#{group.voucherNo}</span> • {format(new Date(group.created_at), 'dd MMM yyyy')}</p>
                      <p className="text-sm text-muted-foreground">✉ {group.contactEmail} • ☎ {group.contactPhone}</p>
                    </div>
                    <span className="font-display text-2xl font-bold">P{group.grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          {group.status === 'confirmed' && <TableHead className="text-xs uppercase">Site Voucher</TableHead>}
                          <TableHead className="text-xs uppercase">Park</TableHead>
                          <TableHead className="text-xs uppercase">Site</TableHead>
                          <TableHead className="text-xs uppercase">Dates</TableHead>
                          <TableHead className="text-xs uppercase text-center">Nights</TableHead>
                          <TableHead className="text-xs uppercase text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.bookings.map((b: any) => (
                          <TableRow key={b.id}>
                            {group.status === 'confirmed' && <TableCell className="font-mono text-xs font-bold">{b.siteVoucherNo || '—'}</TableCell>}
                            <TableCell>{b.parkName}</TableCell>
                            <TableCell>{b.siteName}</TableCell>
                            <TableCell className="text-muted-foreground">{format(new Date(b.arrivalDate), 'dd MMM')} — {format(new Date(b.departureDate), 'dd MMM yyyy')}</TableCell>
                            <TableCell className="text-center">{b.nights}</TableCell>
                            <TableCell className="text-right font-medium">P{b.totalAmount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {previewGroup && (
        <InvoicePreview
          group={previewGroup}
          mode={previewMode}
          onClose={() => setPreviewGroup(null)}
        />
      )}
    </div>
  );
}

export default function AdminPage() {
  const [role, setRole] = useState<'admin' | 'accountant' | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id);
        const roleList = (roles || []).map(r => r.role);
        if (roleList.includes('admin')) setRole('admin');
        else if (roleList.includes('accountant')) setRole('accountant');
      }
      setChecking(false);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { checkSession(); });
    checkSession();
    return () => subscription.unsubscribe();
  }, []);

  if (checking) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Checking access...</p></div>;
  if (!role) return <AdminLogin onLogin={(r) => setRole(r)} />;
  if (role === 'accountant') return <AccountantDashboard />;
  return <AdminDashboard />;
}
