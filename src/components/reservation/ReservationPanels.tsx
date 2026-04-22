import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  AppNotification, getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification,
  Member, getMembers, addMember, updateMember, deleteMember, memberStatus,
  WaitlistRequest, getWaitlistRequests, updateWaitlistStatus,
  sweepBookingExpiryNotifications, sweepMemberRenewalNotifications,
  createBogaReserveBooking, BOGA_PER_PERSON_RATE,
} from '@/store/reservationStore';
import { parks } from '@/data/parks';
import { toast } from 'sonner';
import { Bell, BellRing, AlertTriangle, Trash2, CheckCheck, Plus, UserPlus, Users, Tent, Mail } from 'lucide-react';

// =====================================================
// NOTIFICATIONS PANEL
// =====================================================
export function NotificationsPanel() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      // Run sweeps so the feed stays fresh
      await Promise.all([sweepBookingExpiryNotifications(), sweepMemberRenewalNotifications()]);
      const list = await getNotifications();
      setItems(list);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(n =>
    filter === 'all' ? true :
    filter === 'unread' ? !n.read :
    n.type.startsWith(filter)
  );

  const unreadCount = items.filter(n => !n.read).length;

  const sevColor = (s: string) => s === 'critical' ? 'bg-destructive/10 text-destructive border-destructive/20'
    : s === 'warning' ? 'bg-warning/10 text-warning-foreground border-warning/20'
    : 'bg-muted text-foreground border-border';

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <BellRing className="h-5 w-5 text-secondary" /> Notifications
              {unreadCount > 0 && <Badge className="bg-destructive text-destructive-foreground">{unreadCount} new</Badge>}
            </h2>
            <p className="text-sm text-muted-foreground">Booking expiries, waitlist & share requests, and member renewals</p>
          </div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="booking_expiring">Booking expiries</SelectItem>
                <SelectItem value="waitlist_request">Waitlist</SelectItem>
                <SelectItem value="share_request">Share requests</SelectItem>
                <SelectItem value="member_renewal">Member renewals</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={async () => { await markAllNotificationsRead(); load(); }}>
              <CheckCheck className="h-4 w-4 mr-1.5" /> Mark all read
            </Button>
          </div>
        </div>

        {loading ? <p className="text-muted-foreground text-sm">Loading notifications...</p> :
         filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No notifications</p>
          </div>
         ) : (
          <div className="space-y-2">
            {filtered.map(n => (
              <div key={n.id} className={`rounded-xl border p-4 flex items-start gap-3 ${!n.read ? 'bg-muted/30' : ''}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${sevColor(n.severity)}`}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm">{n.title}</h4>
                    {!n.read && <Badge variant="outline" className="text-[10px] py-0">NEW</Badge>}
                    <span className="text-xs text-muted-foreground ml-auto">{format(new Date(n.created_at), 'dd MMM HH:mm')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                </div>
                <div className="flex gap-1">
                  {!n.read && <Button size="sm" variant="ghost" onClick={async () => { await markNotificationRead(n.id); load(); }}>Read</Button>}
                  <Button size="sm" variant="ghost" onClick={async () => { await deleteNotification(n.id); load(); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
         )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// WAITLIST & SHARE REQUESTS PANEL
// =====================================================
export function WaitlistPanel() {
  const [items, setItems] = useState<WaitlistRequest[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setItems(await getWaitlistRequests()); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(w => filter === 'all' ? true : w.status === 'pending');

  const setStatus = async (id: string, status: WaitlistRequest['status']) => {
    await updateWaitlistStatus(id, status);
    toast.success(`Marked as ${status}`);
    load();
  };

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary" /> Waitlist & share requests
            </h2>
            <p className="text-sm text-muted-foreground">Clients asking for cancelled slots or to share booked sites</p>
          </div>
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending only</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? <p className="text-muted-foreground text-sm">Loading...</p> : filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground"><Users className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>No requests</p></div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Site & dates</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map(w => (
                  <TableRow key={w.id}>
                    <TableCell>
                      <Badge className={w.request_type === 'share' ? 'bg-accent text-accent-foreground' : 'bg-secondary/20 text-foreground'}>
                        {w.request_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{w.requester_name}</div>
                      {w.message && <div className="text-xs text-muted-foreground italic mt-0.5 max-w-xs truncate">"{w.message}"</div>}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{w.site_name}</div>
                      <div className="text-xs text-muted-foreground">{w.arrival_date} → {w.departure_date}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>{w.requester_email}</div>
                      <div className="text-muted-foreground">{w.requester_phone}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={w.status === 'pending' ? 'outline' : 'default'} className="text-xs capitalize">{w.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {w.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => setStatus(w.id, 'promoted')}>Promote</Button>
                          <Button size="sm" variant="outline" onClick={() => setStatus(w.id, 'accepted')}>Accept</Button>
                          <Button size="sm" variant="ghost" onClick={() => setStatus(w.id, 'declined')}>Decline</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// MEMBERS PANEL
// =====================================================
export function MembersPanel() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', country: '',
    subscription_start: format(new Date(), 'yyyy-MM-dd'),
    subscription_end: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd'),
    notes: '' });

  const load = async () => {
    setLoading(true);
    try { setMembers(await getMembers()); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = members.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  );

  const counts = useMemo(() => {
    let active = 0, soon = 0, expired = 0;
    members.forEach(m => {
      const s = memberStatus(m.subscription_end);
      if (s === 'active') active++;
      else if (s === 'expiring_soon') soon++;
      else expired++;
    });
    return { active, soon, expired };
  }, [members]);

  const submit = async () => {
    if (!form.name || !form.email) { toast.error('Name and email required'); return; }
    try {
      await addMember({ ...form, email: form.email.toLowerCase().trim(), phone: form.phone || null, country: form.country || null, notes: form.notes || null });
      toast.success('Member added');
      setShowAdd(false);
      setForm({ ...form, name: '', email: '', phone: '', country: '', notes: '' });
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const renew = async (m: Member) => {
    const newEnd = new Date(m.subscription_end);
    newEnd.setFullYear(newEnd.getFullYear() + 1);
    if (newEnd < new Date()) newEnd.setTime(new Date().setFullYear(new Date().getFullYear() + 1));
    await updateMember(m.id, { subscription_end: format(newEnd, 'yyyy-MM-dd'), status: 'active' });
    toast.success('Subscription renewed +1 year');
    load();
  };

  const remove = async (m: Member) => {
    if (!confirm(`Remove ${m.name}?`)) return;
    await deleteMember(m.id);
    toast.info('Member removed');
    load();
  };

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-5 flex-wrap gap-2">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-secondary" /> Annual subscribers
            </h2>
            <p className="text-sm text-muted-foreground">Members on annual subscription. Expired members are blocked from booking.</p>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)} className="amber-glow text-accent-foreground border-0">
            <Plus className="h-4 w-4 mr-1.5" /> {showAdd ? 'Cancel' : 'Add member'}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl border p-3 text-center"><p className="text-xs text-muted-foreground uppercase">Active</p><p className="text-2xl font-display font-bold text-success">{counts.active}</p></div>
          <div className="rounded-xl border p-3 text-center"><p className="text-xs text-muted-foreground uppercase">Expiring soon</p><p className="text-2xl font-display font-bold text-warning">{counts.soon}</p></div>
          <div className="rounded-xl border p-3 text-center"><p className="text-xs text-muted-foreground uppercase">Expired</p><p className="text-2xl font-display font-bold text-destructive">{counts.expired}</p></div>
        </div>

        {showAdd && (
          <div className="rounded-xl border bg-muted/30 p-4 mb-5 grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1"><Label className="text-xs uppercase">Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="col-span-2 sm:col-span-1"><Label className="text-xs uppercase">Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label className="text-xs uppercase">Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label className="text-xs uppercase">Country</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></div>
            <div><Label className="text-xs uppercase">Subscription start</Label><Input type="date" value={form.subscription_start} onChange={e => setForm({ ...form, subscription_start: e.target.value })} /></div>
            <div><Label className="text-xs uppercase">Subscription end</Label><Input type="date" value={form.subscription_end} onChange={e => setForm({ ...form, subscription_end: e.target.value })} /></div>
            <div className="col-span-2"><Label className="text-xs uppercase">Notes</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <Button className="col-span-2 amber-glow text-accent-foreground border-0" onClick={submit}>Save member</Button>
          </div>
        )}

        <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="mb-3" />

        {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map(m => {
                  const status = memberStatus(m.subscription_end);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-xs"><div>{m.email}</div><div className="text-muted-foreground">{m.phone}</div></TableCell>
                      <TableCell className="text-sm">{m.country || '—'}</TableCell>
                      <TableCell className="text-xs">{m.subscription_start} → <strong>{m.subscription_end}</strong></TableCell>
                      <TableCell>
                        <Badge className={status === 'active' ? 'bg-success text-success-foreground' : status === 'expiring_soon' ? 'bg-warning text-warning-foreground' : 'bg-destructive text-destructive-foreground'}>
                          {status === 'expiring_soon' ? 'expiring soon' : status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => renew(m)}>Renew +1yr</Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(m)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No members yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// BOGA RESERVE — Individual booking form (per-person, per-night)
// =====================================================
export function BogaReserveBookingForm({ onBooked }: { onBooked: () => void }) {
  const bogaPark = parks.find(p => p.id === 'boga-reserve')!;
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('Botswana');
  const [idNumber, setIdNumber] = useState('');
  const [siteId, setSiteId] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const site = bogaPark.sites.find(s => s.id === siteId);
  const nights = arrivalDate && departureDate
    ? Math.max(0, Math.round((new Date(departureDate).getTime() - new Date(arrivalDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const total = nights * guestCount * BOGA_PER_PERSON_RATE;

  const valid = fullName && email && phone && idNumber && siteId && nights > 0 && guestCount >= 1;

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    try {
      const r = await createBogaReserveBooking({
        fullName, email, phone, nationality, idNumber,
        siteId, siteName: site!.name, arrivalDate, departureDate, guestCount,
      });
      toast.success(`Booking created — voucher ${r.voucherNo} (P${r.total.toLocaleString()})`);
      setFullName(''); setEmail(''); setPhone(''); setIdNumber(''); setSiteId('');
      setArrivalDate(''); setDepartureDate(''); setGuestCount(1);
      onBooked();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl amber-glow flex items-center justify-center"><Tent className="h-5 w-5 text-accent-foreground" /></div>
          <div>
            <h3 className="font-display text-lg font-bold">BOGA Reserve Camp — Maun (individuals)</h3>
            <p className="text-sm text-muted-foreground">Per-person, per-night pricing • P{BOGA_PER_PERSON_RATE} pp/night</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Full name</Label><Input className="mt-1.5" value={fullName} onChange={e => setFullName(e.target.value)} /></div>
          <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">ID / Passport</Label><Input className="mt-1.5" value={idNumber} onChange={e => setIdNumber(e.target.value)} /></div>
          <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label><Input className="mt-1.5" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone</Label><Input className="mt-1.5" type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Nationality</Label><Input className="mt-1.5" value={nationality} onChange={e => setNationality(e.target.value)} /></div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Camp site</Label>
            <Select value={siteId} onValueChange={setSiteId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select camp" /></SelectTrigger>
              <SelectContent>{bogaPark.sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Arrival</Label><Input className="mt-1.5" type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} /></div>
          <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Departure</Label><Input className="mt-1.5" type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} min={arrivalDate} /></div>
          <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Guests</Label><Input className="mt-1.5" type="number" min={1} value={guestCount} onChange={e => setGuestCount(Math.max(1, Number(e.target.value) || 1))} /></div>
        </div>

        {nights > 0 && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 mb-4">
            <span className="text-sm text-muted-foreground">{guestCount} guest{guestCount > 1 ? 's' : ''} × {nights} night{nights > 1 ? 's' : ''} × P{BOGA_PER_PERSON_RATE}</span>
            <span className="font-display font-bold text-xl">P{total.toLocaleString()}</span>
          </div>
        )}

        <Button onClick={submit} disabled={!valid || submitting} className="w-full amber-glow text-accent-foreground border-0 font-semibold py-5">
          {submitting ? 'Creating...' : 'Create individual booking'}
        </Button>
      </CardContent>
    </Card>
  );
}
