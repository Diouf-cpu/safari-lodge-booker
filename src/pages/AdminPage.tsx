import { useState, useMemo } from 'react';
import { getGroupedBookings, confirmBooking, cancelBooking, getBookings } from '@/store/bookingStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Search, CheckCircle, XCircle, FileText, Users, MapPin, DollarSign, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { parks, companies } from '@/data/parks';

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [parkFilter, setParkFilter] = useState<string>('all');
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
    companies: new Set(allBookings.map(b => b.companyName)).size,
  }), [allBookings]);

  const handleConfirm = (voucherNo: string) => {
    confirmBooking(voucherNo);
    setRefreshKey(k => k + 1);
    toast.success(`Booking ${voucherNo} confirmed`);
  };

  const handleCancel = (voucherNo: string) => {
    cancelBooking(voucherNo);
    setRefreshKey(k => k + 1);
    toast.info(`Booking ${voucherNo} cancelled`);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-success text-success-foreground">Confirmed</Badge>;
      case 'pending': return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage all campsite bookings, confirm payments, and view history.</p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: FileText, label: 'Total Bookings', value: stats.total, color: 'text-primary' },
            { icon: CheckCircle, label: 'Confirmed', value: stats.confirmed, color: 'text-success' },
            { icon: CalendarDays, label: 'Pending', value: stats.pending, color: 'text-warning' },
            { icon: DollarSign, label: 'Total Revenue', value: `P${stats.revenue.toLocaleString()}`, color: 'text-safari-gold' },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label}>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                {years.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={parkFilter} onValueChange={setParkFilter}>
              <SelectTrigger><SelectValue placeholder="Park" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parks</SelectItem>
                {parks.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        {filteredGroups.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No bookings found. Bookings made on the Book a Site page will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map(group => (
              <Card key={group.voucherNo}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="font-serif text-lg flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        {group.companyName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Voucher: <span className="font-mono">{group.voucherNo}</span> • {format(new Date(group.createdAt), 'dd MMM yyyy')}
                        {group.contactEmail && ` • ${group.contactEmail}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {statusBadge(group.status)}
                      <span className="font-bold text-lg">P{group.grandTotal.toLocaleString()}</span>
                      {group.status === 'pending' && (
                        <>
                          <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleConfirm(group.voucherNo)}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Confirm
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleCancel(group.voucherNo)}>
                            <XCircle className="h-4 w-4 mr-1" /> Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Park</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Arrival</TableHead>
                        <TableHead>Departure</TableHead>
                        <TableHead>Nights</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.bookings.map(b => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">{b.parkName}</TableCell>
                          <TableCell>{b.siteName}</TableCell>
                          <TableCell>{format(new Date(b.arrivalDate), 'dd MMM yyyy')}</TableCell>
                          <TableCell>{format(new Date(b.departureDate), 'dd MMM yyyy')}</TableCell>
                          <TableCell>{b.nights}</TableCell>
                          <TableCell className="text-right font-medium">P{b.totalAmount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
