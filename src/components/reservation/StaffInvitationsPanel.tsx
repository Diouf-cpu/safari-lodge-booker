import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Ban, Trash2, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { getStaffInvitations, inviteStaff, revokeStaff, deleteStaffInvitation, type StaffInvitation } from '@/store/operationsStore';

export function StaffInvitationsPanel({ readOnly = false }: { readOnly?: boolean }) {
  const [list, setList] = useState<StaffInvitation[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'accountant' | 'manager'>('accountant');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try { setList(await getStaffInvitations()); } catch (e: any) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!email.includes('@')) { toast.error('Enter a valid email'); return; }
    setLoading(true);
    try {
      await inviteStaff(email, role);
      toast.success(`Invited ${email} as ${role}. They sign up with this email; first password they set sticks.`);
      setEmail('');
      await load();
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };

  const revoke = async (id: string, em: string) => {
    if (!confirm(`Revoke access for ${em}? They won't be able to log in.`)) return;
    try { await revokeStaff(id); toast.success('Access revoked'); await load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this invitation entirely?')) return;
    try { await deleteStaffInvitation(id); toast.success('Deleted'); await load(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <Card className="border-0 shadow-md">
          <CardContent className="pt-5 pb-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="h-4 w-4 text-primary" />
              <h3 className="font-display font-semibold">Invite a team member</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Add their email and role. They sign up at <span className="font-mono">/admin</span> with this email — the first password they enter becomes their password.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input className="mt-1.5" type="email" placeholder="staff@boga.org.bw" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Role</Label>
                <Select value={role} onValueChange={(v: any) => setRole(v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (reservation desk)</SelectItem>
                    <SelectItem value="accountant">Accountant (read-only $)</SelectItem>
                    <SelectItem value="manager">Manager (read-only all)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={submit} disabled={loading} className="w-full">
                  <UserPlus className="h-4 w-4 mr-1.5" />{loading ? 'Inviting...' : 'Invite'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-md">
        <CardContent className="pt-5 pb-3">
          <h3 className="font-display font-semibold mb-3">Team members ({list.length})</h3>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No invitations yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited</TableHead>
                  {!readOnly && <TableHead className="w-24"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-sm">{s.email}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{s.role}</Badge></TableCell>
                    <TableCell>
                      {s.revoked ? <Badge variant="destructive">Revoked</Badge>
                        : s.activated ? <Badge className="bg-primary text-primary-foreground"><ShieldCheck className="h-3 w-3 mr-1" />Active</Badge>
                          : <Badge variant="secondary">Pending first login</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(s.invited_at), 'MMM d, yyyy')}</TableCell>
                    {!readOnly && (
                      <TableCell>
                        <div className="flex gap-1">
                          {!s.revoked && (
                            <Button size="icon" variant="ghost" title="Revoke access" onClick={() => revoke(s.id, s.email)}>
                              <Ban className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" title="Delete invitation" onClick={() => del(s.id)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
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
