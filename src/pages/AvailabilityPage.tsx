import { useState, useMemo, useEffect } from 'react';
import { parks } from '@/data/parks';
import { getBookedDatesForSite, getSiteBookingStats } from '@/store/bookingStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { WaitlistDialog } from '@/components/WaitlistDialog';
import { MapPin, CalendarDays, ChevronLeft, ChevronRight, TrendingUp, BarChart3 } from 'lucide-react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';

export default function AvailabilityPage() {
  const [selectedPark, setSelectedPark] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookedRanges, setBookedRanges] = useState<{ start: string; end: string; company: string; status: string }[]>([]);
  const [siteStats, setSiteStats] = useState<any[]>([]);

  const park = parks.find(p => p.id === selectedPark);
  const site = park?.sites.find(s => s.id === selectedSite);

  useEffect(() => {
    getSiteBookingStats().then(setSiteStats);
  }, []);

  useEffect(() => {
    if (!selectedSite) { setBookedRanges([]); return; }
    getBookedDatesForSite(selectedSite).then(setBookedRanges);
  }, [selectedSite]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOffset = monthStart.getDay();

  const getDateStatus = (date: Date) => {
    for (const range of bookedRanges) {
      const start = parseISO(range.start);
      const end = parseISO(range.end);
      if (isWithinInterval(date, { start, end: new Date(end.getTime() - 1) })) {
        return { booked: true, company: range.company, status: range.status, rangeStart: range.start, rangeEnd: range.end };
      }
    }
    return { booked: false, company: '', status: '', rangeStart: '', rangeEnd: '' };
  };

  const mostBooked = siteStats.slice(0, 5);
  const totalSites = parks.reduce((s, p) => s + p.sites.length, 0);
  const bookedSites = siteStats.length;
  const availableSites = totalSites - bookedSites;

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-10">
          <p className="text-secondary font-display font-semibold text-sm uppercase tracking-[0.2em] mb-2">Availability</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Check Site Availability</h1>
          <p className="text-muted-foreground">Select a park and camping site to see the booking calendar, or browse site stats below.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-md">
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Sites</p>
              <p className="text-3xl font-display font-bold">{totalSites}</p>
              <p className="text-xs text-muted-foreground">across {parks.length} parks</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Sites With Bookings</p>
              <p className="text-3xl font-display font-bold text-secondary">{bookedSites}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Never Booked</p>
              <p className="text-3xl font-display font-bold text-success">{availableSites}</p>
            </CardContent>
          </Card>
        </div>

        {/* Most Booked Rankings */}
        {mostBooked.length > 0 && (
          <Card className="border-0 shadow-md mb-8">
            <CardContent className="pt-6">
              <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" /> Most Booked Sites
              </h2>
              <div className="space-y-3">
                {mostBooked.map((s: any, i: number) => (
                  <div key={s.siteId} className="flex items-center gap-4">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i < 3 ? 'amber-glow text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{s.siteName}</span>
                        <span className="text-xs text-muted-foreground">({s.parkName})</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div className="bg-secondary rounded-full h-2 transition-all" style={{ width: `${Math.min(100, (s.total / (mostBooked[0]?.total || 1)) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-display font-bold">{s.total}</span>
                      <span className="text-xs text-muted-foreground ml-1">bookings</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendar Section */}
        <Card className="mb-8 border-0 shadow-md">
          <CardContent className="pt-6 grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Park / Reserve</Label>
              <Select value={selectedPark} onValueChange={v => { setSelectedPark(v); setSelectedSite(''); }}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select park" /></SelectTrigger>
                <SelectContent>{parks.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sites.length} sites)</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Camping Site</Label>
              <Select value={selectedSite} onValueChange={setSelectedSite} disabled={!selectedPark}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select site" /></SelectTrigger>
                <SelectContent>{park?.sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
              {site?.coordinates && <p className="text-xs text-muted-foreground mt-2">📍 {site.coordinates}</p>}
            </div>
          </CardContent>
        </Card>

        {selectedSite ? (
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-secondary" />
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronLeft className="h-5 w-5" /></button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-muted transition-colors"><ChevronRight className="h-5 w-5" /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2 uppercase tracking-wider">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`e-${i}`} />)}
                {daysInMonth.map(day => {
                  const { booked, company, status, rangeStart, rangeEnd } = getDateStatus(day);
                  const cellClass = `relative rounded-xl p-2 text-center min-h-[64px] flex flex-col items-center justify-start transition-colors ${
                    booked
                      ? status === 'confirmed'
                        ? 'bg-destructive/10 border border-destructive/20 cursor-pointer hover:bg-destructive/20'
                        : 'bg-warning/10 border border-warning/20 cursor-pointer hover:bg-warning/20'
                      : 'bg-success/5 border border-success/10 hover:bg-success/10'
                  }`;
                  if (booked && site && park) {
                    return (
                      <Popover key={day.toISOString()}>
                        <PopoverTrigger asChild>
                          <div className={cellClass}>
                            <span className="text-sm font-medium">{format(day, 'd')}</span>
                            <span className="text-[9px] leading-tight text-muted-foreground mt-1 truncate w-full px-0.5">{company}</span>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-72">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Booked by</p>
                          <p className="font-semibold mb-2">{company}</p>
                          <p className="text-xs text-muted-foreground mb-3">{rangeStart} → {rangeEnd} · <span className="capitalize">{status}</span></p>
                          <p className="text-xs text-muted-foreground mb-3">If this booking is cancelled, the next person on the waitlist gets first refusal. You can also request to share the site (split cost).</p>
                          <WaitlistDialog
                            siteId={site.id} siteName={site.name}
                            parkId={park.id} parkName={park.name}
                            arrivalDate={rangeStart} departureDate={rangeEnd}
                            trigger={<button className="w-full text-sm font-semibold rounded-lg amber-glow text-accent-foreground py-2">Join waitlist / Share request</button>}
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  }
                  return (
                    <div key={day.toISOString()} className={cellClass}>
                      <span className="text-sm font-medium">{format(day, 'd')}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-6 mt-8 pt-4 border-t text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-success/20 border border-success/30" /><span className="text-muted-foreground">Available</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-warning/20 border border-warning/30" /><span className="text-muted-foreground">Pending</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-destructive/15 border border-destructive/25" /><span className="text-muted-foreground">Confirmed</span></div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4"><MapPin className="h-8 w-8 text-muted-foreground/40" /></div>
            <p className="text-muted-foreground font-medium">Select a park and site above to view the calendar</p>
          </div>
        )}
      </div>
    </div>
  );
}
