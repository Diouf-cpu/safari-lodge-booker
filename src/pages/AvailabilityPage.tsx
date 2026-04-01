import { useState, useMemo } from 'react';
import { parks } from '@/data/parks';
import { getBookedDatesForSite } from '@/store/bookingStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { MapPin, CalendarDays } from 'lucide-react';
import { format, eachDayOfInterval, isSameMonth, startOfMonth, endOfMonth, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';

export default function AvailabilityPage() {
  const [selectedPark, setSelectedPark] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const park = parks.find(p => p.id === selectedPark);

  const bookedRanges = useMemo(() => {
    if (!selectedSite) return [];
    return getBookedDatesForSite(selectedSite);
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
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">Check Availability</h1>
          <p className="text-muted-foreground">Select a park and camping site to see the availability calendar.</p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6 grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Park / Reserve</Label>
              <Select value={selectedPark} onValueChange={v => { setSelectedPark(v); setSelectedSite(''); }}>
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
              <Select value={selectedSite} onValueChange={setSelectedSite} disabled={!selectedPark}>
                <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                <SelectContent>
                  {park?.sites.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedSite ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  {format(currentMonth, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="px-3 py-1 rounded-md bg-muted hover:bg-muted/80 text-sm">←</button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="px-3 py-1 rounded-md bg-muted hover:bg-muted/80 text-sm">→</button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {daysInMonth.map(day => {
                  const { booked, company, status } = getDateStatus(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`relative p-2 rounded-md text-center text-sm min-h-[60px] flex flex-col items-center justify-start ${
                        booked
                          ? status === 'confirmed'
                            ? 'bg-destructive/15 border border-destructive/30'
                            : 'bg-warning/15 border border-warning/30'
                          : 'bg-success/10 border border-success/20 hover:bg-success/20'
                      }`}
                    >
                      <span className="font-medium">{format(day, 'd')}</span>
                      {booked && (
                        <span className="text-[10px] leading-tight text-muted-foreground mt-1 truncate w-full">
                          {company}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-6 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-success/20 border border-success/30" />
                  <span className="text-muted-foreground">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-warning/15 border border-warning/30" />
                  <span className="text-muted-foreground">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-destructive/15 border border-destructive/30" />
                  <span className="text-muted-foreground">Confirmed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-20">
            <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Select a park and site to view the calendar</p>
          </div>
        )}
      </div>
    </div>
  );
}
