import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Trash2, Plus, ShieldCheck, AlertCircle, RotateCcw, Copy, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  CompanyDetailed,
  getCompaniesDetailed,
  deleteCompany,
  resetCompanyPasswordToDefault,
} from '@/store/bookingStore';

/**
 * Staff-only panel. Each company has a UNIQUE dummy password issued by the
 * system (visible here to the admin). The company is forced to set their own
 * private password the next time they book — at which point the dummy is
 * cleared and replaced with a "Own password set" badge. Press Reset to issue
 * a brand-new dummy any time (e.g. when they forget theirs).
 */
export function CompanyPasswordManager() {
  const [companies, setCompanies] = useState<CompanyDetailed[]>([]);
  const [newName, setNewName] = useState('');
  const [resetTarget, setResetTarget] = useState<CompanyDetailed | null>(null);
  const [newPwd, setNewPwd] = useState<string | null>(null);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  const reload = async () => setCompanies(await getCompaniesDetailed());
  useEffect(() => { reload(); }, []);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      // insert (ignore dup), then seed a unique dummy
      const existing = await supabase.from('companies').select('id').eq('name', name).maybeSingle();
      let id = existing.data?.id;
      if (!id) {
        const { data, error } = await supabase.from('companies').insert({ name }).select('id').single();
        if (error) throw error;
        id = data.id;
      }
      const { data: pwd, error: seedErr } = await supabase.rpc('seed_company_password', { _company_id: id });
      if (seedErr) throw seedErr;
      setNewName('');
      await reload();
      toast.success(`Company added. Dummy password: ${pwd}`);
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
      const pwd = await resetCompanyPasswordToDefault(resetTarget.id);
      setNewPwd(pwd);
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
          Each company is issued a <strong>unique dummy password</strong> when added — visible here so you can share it privately.
          The first time they book they're forced to set their own private password (the dummy then disappears).
          Press <strong>Reset</strong> to generate a fresh dummy any time.
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
            <div className="flex items-center gap-3 min-w-0 flex-wrap">
              <span className="font-medium truncate">{c.name}</span>
              {c.mustChange && c.defaultPassword ? (
                <span className="inline-flex items-center gap-2 text-xs px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-3 w-3" />
                  Dummy:
                  <code className="font-mono font-bold">
                    {reveal[c.id] ? c.defaultPassword : '••••••••'}
                  </code>
                  <button
                    type="button"
                    onClick={() => setReveal(r => ({ ...r, [c.id]: !r[c.id] }))}
                    className="hover:opacity-70"
                    title={reveal[c.id] ? 'Hide' : 'Reveal'}
                  >
                    {reveal[c.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard?.writeText(c.defaultPassword!); toast.success('Copied'); }}
                    className="hover:opacity-70"
                    title="Copy"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
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
              <Button size="sm" variant="outline" onClick={() => { setNewPwd(null); setResetTarget(c); }}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
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

      <Dialog open={!!resetTarget} onOpenChange={(o) => { if (!o) { setResetTarget(null); setNewPwd(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password — {resetTarget?.name}</DialogTitle>
            <DialogDescription>
              {newPwd
                ? 'A new dummy password has been generated. Share it privately — they will be forced to set their own private password the next time they book.'
                : 'This will issue a brand-new dummy password for this company. Their current password will stop working immediately.'}
            </DialogDescription>
          </DialogHeader>

          {newPwd && (
            <div className="p-4 rounded-lg bg-muted flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">New dummy password</p>
                <p className="font-mono text-2xl font-bold tracking-widest">{newPwd}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { navigator.clipboard?.writeText(newPwd); toast.success('Copied'); }}
              >
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetTarget(null); setNewPwd(null); }}>
              {newPwd ? 'Done' : 'Cancel'}
            </Button>
            {!newPwd && (
              <Button onClick={handleReset} className="amber-glow text-accent-foreground border-0">
                Generate new password
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
