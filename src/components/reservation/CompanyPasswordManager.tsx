import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { KeyRound, Trash2, Plus, ShieldCheck, ShieldAlert } from 'lucide-react';
import {
  CompanyDetailed,
  getCompaniesDetailed,
  addCompany,
  deleteCompany,
  setCompanyPassword,
} from '@/store/bookingStore';

/**
 * Staff-only panel: add / remove companies AND set their booking passwords.
 * Each public booking on the Wildlife Reserve form must be unlocked with the
 * company's password before it can be submitted.
 */
export function CompanyPasswordManager() {
  const [companies, setCompanies] = useState<CompanyDetailed[]>([]);
  const [newName, setNewName] = useState('');
  const [pwTarget, setPwTarget] = useState<CompanyDetailed | null>(null);
  const [pwValue, setPwValue] = useState('');
  const [saving, setSaving] = useState(false);

  const reload = async () => setCompanies(await getCompaniesDetailed());
  useEffect(() => { reload(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addCompany(newName.trim());
    setNewName('');
    await reload();
    toast.success('Company added');
  };

  const handleRemove = async (name: string) => {
    if (!confirm(`Remove "${name}" from the list? Existing bookings keep their company name.`)) return;
    await deleteCompany(name);
    await reload();
    toast.success('Company removed');
  };

  const handleSavePassword = async () => {
    if (!pwTarget) return;
    if (pwValue.length < 4) { toast.error('Password must be at least 4 characters'); return; }
    setSaving(true);
    try {
      await setCompanyPassword(pwTarget.id, pwValue);
      toast.success(`Password set for ${pwTarget.name}`);
      setPwTarget(null);
      setPwValue('');
      await reload();
    } catch (e: any) {
      toast.error(e.message || 'Failed to set password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
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
              {c.hasPassword ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-success/15 text-success">
                  <ShieldCheck className="h-3 w-3" /> Password set
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-warning/15 text-warning-foreground">
                  <ShieldAlert className="h-3 w-3" /> No password
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setPwTarget(c); setPwValue(''); }}
              >
                <KeyRound className="h-3.5 w-3.5 mr-1" />
                {c.hasPassword ? 'Reset password' : 'Set password'}
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

      <Dialog open={!!pwTarget} onOpenChange={(o) => { if (!o) { setPwTarget(null); setPwValue(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pwTarget?.hasPassword ? 'Reset' : 'Set'} password — {pwTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">New password</Label>
            <Input
              type="text"
              autoFocus
              value={pwValue}
              onChange={e => setPwValue(e.target.value)}
              placeholder="Min. 4 characters"
            />
            <p className="text-xs text-muted-foreground">
              Share this password privately with the company. They'll need to enter it on the public
              booking form before they can submit.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwTarget(null)}>Cancel</Button>
            <Button
              onClick={handleSavePassword}
              disabled={saving || pwValue.length < 4}
              className="amber-glow text-accent-foreground border-0"
            >
              {saving ? 'Saving...' : 'Save password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
