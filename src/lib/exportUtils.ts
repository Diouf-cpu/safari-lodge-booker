// Generic CSV export utility — converts an array of objects to a downloadable CSV file.

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) {
    // Still generate an empty file with no headers? Better: warn.
    alert('Nothing to export.');
    return;
  }
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escapeCSV(row[h])).join(',')),
  ];
  const csv = csvLines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('download', safeName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type ExportPeriodPreset = 'today' | 'this_month' | 'last_month' | 'this_year' | 'all' | 'custom';

export function getPeriodRange(preset: ExportPeriodPreset, customFrom?: string, customTo?: string): { from: string; to: string } {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = today.getMonth();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  switch (preset) {
    case 'today':
      return { from: fmt(today), to: fmt(today) };
    case 'this_month':
      return { from: fmt(new Date(yyyy, mm, 1)), to: fmt(new Date(yyyy, mm + 1, 0)) };
    case 'last_month':
      return { from: fmt(new Date(yyyy, mm - 1, 1)), to: fmt(new Date(yyyy, mm, 0)) };
    case 'this_year':
      return { from: `${yyyy}-01-01`, to: `${yyyy}-12-31` };
    case 'all':
      return { from: '2020-01-01', to: fmt(today) };
    case 'custom':
      return { from: customFrom || fmt(today), to: customTo || fmt(today) };
  }
}
