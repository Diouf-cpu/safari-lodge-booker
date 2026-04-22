import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download } from 'lucide-react';
import { exportToCSV, getPeriodRange, ExportPeriodPreset } from '@/lib/exportUtils';

interface ExportButtonProps<T extends Record<string, any>> {
  /** Source rows to filter and export. */
  rows: T[];
  /** How to read the date used to filter each row. Should return ISO/YYYY-MM-DD. */
  getDate: (row: T) => string | null | undefined;
  /** Optional row mapper to shape the CSV columns. */
  mapRow?: (row: T) => Record<string, any>;
  /** Filename prefix (no extension). Period suffix is appended automatically. */
  filenamePrefix: string;
  label?: string;
  variant?: 'default' | 'outline';
}

const PRESETS: { value: ExportPeriodPreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_month', label: 'This week / month' }, // we show "This week" via custom alias below
  { value: 'this_year', label: 'This year' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom range…' },
];

/** Returns range for "this week" (Mon → Sun). */
function thisWeekRange() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Mon=0
  const start = new Date(d); start.setDate(d.getDate() - day);
  const end = new Date(start); end.setDate(start.getDate() + 6);
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return { from: fmt(start), to: fmt(end) };
}

/**
 * Reusable export-to-CSV button with preset date ranges.
 * Used in both Reservation Dashboard and Accountant Dashboard.
 */
export function ExportButton<T extends Record<string, any>>({
  rows, getDate, mapRow, filenamePrefix, label = 'Export CSV', variant = 'outline',
}: ExportButtonProps<T>) {
  const [preset, setPreset] = useState<'today' | 'this_week' | 'this_month' | 'this_year' | 'custom'>('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [open, setOpen] = useState(false);

  const handleExport = () => {
    const range =
      preset === 'this_week' ? thisWeekRange() :
      preset === 'custom' ? { from: customFrom, to: customTo } :
      getPeriodRange(preset as ExportPeriodPreset);

    if (preset === 'custom' && (!customFrom || !customTo)) {
      alert('Pick both a start and an end date.'); return;
    }

    const filtered = rows.filter(r => {
      const d = (getDate(r) || '').slice(0, 10);
      return d >= range.from && d <= range.to;
    });
    const shaped = mapRow ? filtered.map(mapRow) : filtered;
    exportToCSV(`${filenamePrefix}_${range.from}_to_${range.to}`, shaped);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={variant} size="sm">
          <Download className="h-4 w-4 mr-1.5" /> {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <p className="text-sm font-semibold mb-3">Export to CSV</p>
        <div className="space-y-2">
          {[
            { v: 'today', l: 'Today' },
            { v: 'this_week', l: 'This week (Mon–Sun)' },
            { v: 'this_month', l: 'This month' },
            { v: 'this_year', l: 'This year' },
            { v: 'custom', l: 'Custom range…' },
          ].map(p => (
            <label key={p.v} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="export-preset"
                value={p.v}
                checked={preset === p.v}
                onChange={() => setPreset(p.v as any)}
              />
              {p.l}
            </label>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div>
              <Label className="text-[10px] uppercase text-muted-foreground">From</Label>
              <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-[10px] uppercase text-muted-foreground">To</Label>
              <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} />
            </div>
          </div>
        )}
        <Button className="w-full mt-4 amber-glow text-accent-foreground border-0" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1.5" /> Download CSV
        </Button>
      </PopoverContent>
    </Popover>
  );
}
