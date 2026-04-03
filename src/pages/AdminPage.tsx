import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getGroupedBookings, confirmBooking, cancelBooking, getBookings, getSiteBookingStats } from '@/store/bookingStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Search, CheckCircle, XCircle, FileText, MapPin, CalendarDays, Users, DollarSign, ChevronDown, ChevronUp, Lock, LogOut, TrendingUp, Building2, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { parks } from '@/data/parks';

function AdminLogin({ onLogin }: { onLogin: () => void }) {
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
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).eq('role', 'admin').maybeSingle();
    if (!roleData) { await supabase.auth.signOut(); setError('You do not have admin access.'); setLoading(false); return; }
    onLogin();
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm border-0 shadow-xl">
        <CardContent className="pt-10 pb-8 px-8">
          <div className="w-14 h-14 rounded-2xl amber-glow flex items-center justify-center mx-auto mb-6">
            <Lock className="h-7 w-7 text-accent-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-center mb-1">Admin Access</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">Sign in with your admin account</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
              <Input type="email" className="mt-1.5" placeholder="admin@boga.org.bw" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} />
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
  const [companySearch, setCompanySearch] = useState('');
  const [siteSearch, setSiteSearch] = useState('');
  const [voucherSearch, setVoucherSearch] = useState('');

  const loadData = async () => {
    try {
      const [g, b, ss] = await Promise.all([getGroupedBookings(), getBookings(), getSiteBookingStats()]);
      setGroups(g);
      setAllBookings(b);
      setSiteStats(ss);
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

  // Company analytics
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

  // Site analytics
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

  // Voucher lookup
  const voucherResults = useMemo(() => {
    if (!voucherSearch) return [];
    return groups.filter((g: any) =>
      g.voucherNo.includes(voucherSearch) ||
      g.bookings.some((b: any) => b.siteVoucherNo?.includes(voucherSearch))
    );
  }, [groups, voucherSearch]);

  // Company detail bookings
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const companyBookings = useMemo(() => {
    if (!selectedCompany) return [];
    return allBookings.filter((b: any) => b.company_name === selectedCompany);
  }, [allBookings, selectedCompany]);

  const handleConfirm = async (voucherNo: string) => { await confirmBooking(voucherNo); await loadData(); toast.success(`Booking ${voucherNo} confirmed`); };
  const handleCancel = async (voucherNo: string) => { await cancelBooking(voucherNo); await loadData(); toast.info(`Booking ${voucherNo} cancelled`); };
  const handleLogout = async () => { await supabase.auth.signOut(); window.location.reload(); };

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
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="text-secondary font-display font-semibold text-sm uppercase tracking-[0.2em] mb-2">Administration</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Booking Dashboard</h1>
            <p className="text-muted-foreground">Manage bookings, analytics, and history.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="mt-2"><LogOut className="h-4 w-4 mr-1.5" /> Sign Out</Button>
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
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
            <TabsTrigger value="vouchers">Voucher Lookup</TabsTrigger>
          </TabsList>

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
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Site Voucher</TableHead>
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
                                      <TableCell className="font-mono text-xs text-muted-foreground">{b.siteVoucherNo || '—'}</TableCell>
                                      <TableCell>{format(new Date(b.arrivalDate), 'dd MMM yyyy')}</TableCell>
                                      <TableCell>{format(new Date(b.departureDate), 'dd MMM yyyy')}</TableCell>
                                      <TableCell className="text-center">{b.nights}</TableCell>
                                      <TableCell className="text-right font-medium">P{b.totalAmount.toLocaleString()}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                              <span className="font-display font-bold text-xl sm:hidden">P{group.grandTotal.toLocaleString()}</span>
                              {group.status === 'pending' && (
                                <div className="flex gap-2 ml-auto">
                                  <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground rounded-lg" onClick={() => handleConfirm(group.voucherNo)}>
                                    <CheckCircle className="h-4 w-4 mr-1.5" /> Confirm
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5 rounded-lg" onClick={() => handleCancel(group.voucherNo)}>
                                    <XCircle className="h-4 w-4 mr-1.5" /> Cancel
                                  </Button>
                                </div>
                              )}
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
                          <TableHead className="text-xs uppercase">Site Voucher</TableHead>
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
                            <TableCell className="font-mono text-xs font-bold">{b.siteVoucherNo || '—'}</TableCell>
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
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).eq('role', 'admin').maybeSingle();
        setAuthed(!!roleData);
      }
      setChecking(false);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { checkSession(); });
    checkSession();
    return () => subscription.unsubscribe();
  }, []);

  if (checking) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Checking access...</p></div>;
  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;
  return <AdminDashboard />;
}
