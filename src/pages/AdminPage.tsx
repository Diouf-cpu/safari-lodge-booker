import { useState, useMemo } from 'react';
import { getGroupedBookings, confirmBooking, cancelBooking, getBookings } from '@/store/bookingStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Search, CheckCircle, XCircle, FileText, MapPin, CalendarDays, Users, DollarSign, ChevronDown, ChevronUp, Lock, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { parks } from '@/data/parks';

const ADMIN_PASS = 'boga2024';

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASS) {
      sessionStorage.setItem('boga_admin', 'true');
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm border-0 shadow-xl">
        <CardContent className="pt-10 pb-8 px-8">
          <div className="w-14 h-14 rounded-2xl amber-glow flex items-center justify-center mx-auto mb-6">
            <Lock className="h-7 w-7 text-accent-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-center mb-1">Admin Access</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">Enter the admin password to continue</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Password</Label>
              <Input
                type="password"
                className="mt-1.5"
                placeholder="Enter password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false); }}
              />
              {error && <p className="text-xs text-destructive mt-1">Incorrect password</p>}
            </div>
            <Button type="submit" className="w-full amber-glow text-accent-foreground border-0 font-semibold">
              Sign In
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
  const [refreshKey, setRefreshKey] = useState(0);

  const allBookings = useMemo(() => getBookings(), [refreshKey]);
  const groups = useMemo(() => getGroupedBookings(), [refreshKey]);

  const years = useMemo(() => {
    const yrs = new Set(allBookings.map(b => new Date(b.arrivalDate).getFullYear()));
    return Array.from(yrs).sort((a, b) => b - a);
  }, [allBookings]);

  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      const matchSearch = !searchTerm || g.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || g.voucherNo.includes(searchTerm);
      const matchStatus = statusFilter === 'all' || g.status === statusFilter;
      const matchYear = yearFilter === 'all' || g.bookings.some(b => new Date(b.arrivalDate).getFullYear().toString() === yearFilter);
      const matchPark = parkFilter === 'all' || g.bookings.some(b => b.parkId === parkFilter);
      return matchSearch && matchStatus && matchYear && matchPark;
    });
  }, [groups, searchTerm, statusFilter, yearFilter, parkFilter]);

  const stats = useMemo(() => ({
    total: allBookings.length,
    confirmed: allBookings.filter(b => b.status === 'confirmed').length,
    pending: allBookings.filter(b => b.status === 'pending').length,
    revenue: allBookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.totalAmount, 0),
  }), [allBookings]);

  const handleConfirm = (voucherNo: string) => { confirmBooking(voucherNo); setRefreshKey(k => k + 1); toast.success(`Booking ${voucherNo} confirmed`); };
  const handleCancel = (voucherNo: string) => { cancelBooking(voucherNo); setRefreshKey(k => k + 1); toast.info(`Booking ${voucherNo} cancelled`); };
  const handleLogout = () => { sessionStorage.removeItem('boga_admin'); window.location.reload(); };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-success text-success-foreground',
      pending: 'bg-warning text-warning-foreground',
      cancelled: 'bg-destructive text-destructive-foreground',
    };
    return <Badge className={`${styles[status] || ''} text-xs font-medium`}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="text-secondary font-display font-semibold text-sm uppercase tracking-[0.2em] mb-2">Administration</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Booking Dashboard</h1>
            <p className="text-muted-foreground">Manage bookings, confirm payments, and view history.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="mt-2">
            <LogOut className="h-4 w-4 mr-1.5" /> Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: FileText, label: 'Total Bookings', value: stats.total },
            { icon: CheckCircle, label: 'Confirmed', value: stats.confirmed },
            { icon: CalendarDays, label: 'Pending', value: stats.pending },
            { icon: DollarSign, label: 'Revenue', value: `P${stats.revenue.toLocaleString()}` },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="border-0 shadow-md">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className="text-xl font-display font-bold">{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8 border-0 shadow-md">
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
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium mb-1">No bookings found</p>
            <p className="text-sm text-muted-foreground">Bookings made on the Book Now page will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGroups.map(group => {
              const isExpanded = expandedVoucher === group.voucherNo;
              return (
                <Card key={group.voucherNo} className="border-0 shadow-md overflow-hidden">
                  <button
                    className="w-full text-left p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedVoucher(isExpanded ? null : group.voucherNo)}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-semibold truncate">{group.companyName}</span>
                          {statusBadge(group.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          #{group.voucherNo} • {format(new Date(group.createdAt), 'dd MMM yyyy')} • {group.bookings.length} site{group.bookings.length > 1 ? 's' : ''}
                        </p>
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
                                <TableHead className="font-semibold text-xs uppercase tracking-wider">Arrival</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wider">Departure</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">Nights</TableHead>
                                <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.bookings.map(b => (
                                <TableRow key={b.id}>
                                  <TableCell className="font-medium">{b.parkName}</TableCell>
                                  <TableCell>{b.siteName}</TableCell>
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
                                <CheckCircle className="h-4 w-4 mr-1.5" /> Confirm Payment
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
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('boga_admin') === 'true');

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;
  return <AdminDashboard />;
}
