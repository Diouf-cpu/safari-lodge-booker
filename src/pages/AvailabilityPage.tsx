import { useState, useMemo, useEffect } from 'react';
import { parks } from '@/data/parks';
import { getBookedDatesForSite } from '@/store/bookingStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MapPin, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';

export default function AvailabilityPage() {
  const [selectedPark, setSelectedPark] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookedRanges, setBookedRanges] = useState<{ start: string; end: string; company: string; status: string }[]>([]);

  const park = parks.find(p => p.id === selectedPark);
  const site = park?.sites.find(s => s.id === selectedSite);

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
        return { booked: true, company: range.company, status: range.status };
      }
    }
    return { booked: false, company: '', status: '' };
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-10">
          <p className="text-secondary font-display font-semibold text-sm uppercase tracking-[0.2em] mb-2">Availability</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Check Site Availability</h1>
          <p className="text-muted-foreground">Select a park and camping site to see the booking calendar.</p>
        </div>

        <Card className="mb-8 border-0 shadow-md">
          <CardContent className="pt-6 grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Park / Reserve</Label>
              <Select value={selectedPark} onValueChange={v => { setSelectedPark(v); setSelectedSite(''); }}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select park" /></SelectTrigger>
                <SelectContent>{parks.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
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
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </button>
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
                  const { booked, company, status } = getDateStatus(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`relative rounded-xl p-2 text-center min-h-[64px] flex flex-col items-center justify-start transition-colors ${
                        booked
                          ? status === 'confirmed'
                            ? 'bg-destructive/10 border border-destructive/20'
                            : 'bg-warning/10 border border-warning/20'
                          : 'bg-success/5 border border-success/10 hover:bg-success/10'
                      }`}
                    >
                      <span className="text-sm font-medium">{format(day, 'd')}</span>
                      {booked && (
                        <span className="text-[9px] leading-tight text-muted-foreground mt-1 truncate w-full px-0.5">
                          {company}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-6 mt-8 pt-4 border-t text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-success/20 border border-success/30" />
                  <span className="text-muted-foreground">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-warning/20 border border-warning/30" />
                  <span className="text-muted-foreground">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-destructive/15 border border-destructive/25" />
                  <span className="text-muted-foreground">Confirmed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium">Select a park and site above to view the calendar</p>
          </div>
        )}
      </div>
    </div>
  );
}
