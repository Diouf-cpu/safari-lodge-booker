import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, Plus, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { parks } from '@/data/parks';
import { getBlackouts, addBlackout, removeBlackout, type SiteBlackout } from '@/store/operationsStore';

export function SiteBlackoutsPanel({ readOnly = false }: { readOnly?: boolean }) {
  const [list, setList] = useState<SiteBlackout[]>([]);
  const [parkId, setParkId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try { setList(await getBlackouts()); } catch (e: any) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, []);

  const park = parks.find(p => p.id === parkId);

  const submit = async () => {
    if (!parkId || !siteId || !start || !end) { toast.error('Fill all required fields'); return; }
    if (new Date(end) < new Date(start)) { toast.error('End date must be after start'); return; }
    const site = park?.sites.find(s => s.id === siteId);
    if (!site) { toast.error('Pick a site'); return; }
    setLoading(true);
    try {
      await addBlackout({
        park_id: parkId,
        site_id: siteId,
        site_name: site.name,
        start_date: start,
        end_date: end,
        reason: reason || null,
      });
      toast.success('Site blocked for those dates');
      setSiteId(''); setStart(''); setEnd(''); setReason('');
      await load();
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  const del = async (id: string) => {
    if (!confirm('Remove this blackout? Site will become bookable again for those dates.')) return;
    try { await removeBlackout(id); toast.success('Removed'); await load(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <Card className="border-0 shadow-md">
          <CardContent className="pt-5 pb-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Ban className="h-4 w-4 text-destructive" />
              <h3 className="font-display font-semibold">Block a site</h3>
            </div>
            <p className="text-xs text-muted-foreground">Sites blocked here won't appear available on the public booking page for those dates.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Park</Label>
                <Select value={parkId} onValueChange={(v) => { setParkId(v); setSiteId(''); }}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Choose park" /></SelectTrigger>
                  <SelectContent>{parks.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Site</Label>
                <Select value={siteId} onValueChange={setSiteId} disabled={!park}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Choose site" /></SelectTrigger>
                  <SelectContent>{park?.sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Reason (optional)</Label>
                <Input className="mt-1.5" placeholder="Maintenance, flood..." value={reason} onChange={e => setReason(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Start date</Label>
                <Input type="date" className="mt-1.5" value={start} onChange={e => setStart(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">End date</Label>
                <Input type="date" className="mt-1.5" value={end} onChange={e => setEnd(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button onClick={submit} disabled={loading} className="w-full"><Plus className="h-4 w-4 mr-1.5" />{loading ? 'Saving...' : 'Block site'}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-md">
        <CardContent className="pt-5 pb-3">
          <h3 className="font-display font-semibold mb-3">Active blackouts ({list.length})</h3>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No site blackouts.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Reason</TableHead>
                  {!readOnly && <TableHead className="w-16"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map(b => (
                  <TableRow key={b.id}>
                    <TableCell><Badge variant="outline">{b.site_name}</Badge></TableCell>
                    <TableCell className="text-sm">{format(new Date(b.start_date), 'MMM d, yyyy')} → {format(new Date(b.end_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{b.reason || '—'}</TableCell>
                    {!readOnly && (
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => del(b.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
