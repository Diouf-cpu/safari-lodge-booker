import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Trash2, Plus, ShieldCheck, AlertCircle, RotateCcw, Copy } from 'lucide-react';
import {
  CompanyDetailed,
  getCompaniesDetailed,
  addCompany,
  deleteCompany,
  resetCompanyPasswordToDefault,
  DEFAULT_COMPANY_PASSWORD,
} from '@/store/bookingStore';

/**
 * Staff-only panel. Each company starts with the shared default password
 * `boga1234` — admin can press "Reset password" any time to put a company
 * back to the default (e.g. when a company forgets theirs). The company is
 * then forced to set their own password the next time they book.
 */
export function CompanyPasswordManager() {
  const [companies, setCompanies] = useState<CompanyDetailed[]>([]);
  const [newName, setNewName] = useState('');
  const [resetTarget, setResetTarget] = useState<CompanyDetailed | null>(null);

  const reload = async () => setCompanies(await getCompaniesDetailed());
  useEffect(() => { reload(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await addCompany(newName.trim());
      setNewName('');
      await reload();
      toast.success(`Company added. Default password is "${DEFAULT_COMPANY_PASSWORD}" — share it privately.`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to add company');
    }
  };

  const handleRemove = async (name: string) => {
    if (!confirm(`Remove "${name}" from the list? Existing bookings keep their company name.`)) return;
    await deleteCompany(name);
    await reload();
    toast.success('Company removed');
  };

  const handleReset = async () => {
    if (!resetTarget) return;
    try {
      await resetCompanyPasswordToDefault(resetTarget.id);
      toast.success(`Password reset. New password: ${DEFAULT_COMPANY_PASSWORD}`);
      setResetTarget(null);
      await reload();
    } catch (e: any) {
      toast.error(e.message || 'Failed to reset password');
    }
  };

  return (
    <div>
      <div className="p-3 mb-5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs">
        <p className="font-semibold mb-1">How company passwords work</p>
        <p className="text-muted-foreground">
          New companies start with the shared default password <code className="px-1 py-0.5 rounded bg-muted font-mono">{DEFAULT_COMPANY_PASSWORD}</code>.
          The first time they book they'll be asked to set their own private password. If they forget it, press <strong>Reset</strong> below to put it back to the default.
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <Input
          placeholder="New company name..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAdd} className="amber-glow text-accent-foreground border-0">
          <Plus className="h-4 w-4 mr-1.5" /> Add
        </Button>
      </div>

      <div className="space-y-2">
        {companies.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No companies in the list yet.</p>
        )}
        {companies.map(c => (
          <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium truncate">{c.name}</span>
              {c.mustChange ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-3 w-3" /> Default password
                </span>
              ) : c.hasPassword ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-success/15 text-success">
                  <ShieldCheck className="h-3 w-3" /> Own password set
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  No password
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setResetTarget(c)}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset password
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => handleRemove(c.name)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!resetTarget} onOpenChange={(o) => { if (!o) setResetTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password — {resetTarget?.name}</DialogTitle>
            <DialogDescription>
              This will set their password back to the shared default. They'll be asked to pick their own private password the next time they try to book.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-lg bg-muted flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">New password</p>
              <p className="font-mono text-lg font-bold">{DEFAULT_COMPANY_PASSWORD}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(DEFAULT_COMPANY_PASSWORD);
                toast.success('Copied');
              }}
            >
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Share <code className="font-mono">{DEFAULT_COMPANY_PASSWORD}</code> privately with {resetTarget?.name}. Anyone with this default password will be forced to set a new one before submitting a booking.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>Cancel</Button>
            <Button onClick={handleReset} className="amber-glow text-accent-foreground border-0">
              Reset password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
