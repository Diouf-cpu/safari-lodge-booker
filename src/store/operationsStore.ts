// Reservation desk operations: payments, extensions, switches, blackouts, audit, staff
import { supabase } from '@/integrations/supabase/client';

export const PAYMENT_METHODS = [
  'Cash',
  'Card',
  'Bank Transfer',
  'EFT',
  'Mobile Money',
] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

// Cancellation policy: when a paid booking is cancelled, BOGA keeps 50%.
export const CANCELLATION_KEEP_PERCENT = 50;

// One-time extension length in days
export const EXTENSION_DAYS = 7;

// =============== AUDIT LOG ===============
export interface AuditEntry {
  id: string;
  group_id: string | null;
  booking_id: string | null;
  voucher_no: string | null;
  action: string;
  details: any;
  performed_by: string | null;
  performed_by_email: string | null;
  created_at: string;
}

async function currentUserInfo() {
  const { data: { user } } = await supabase.auth.getUser();
  return { id: user?.id ?? null, email: user?.email ?? null };
}

export async function logAudit(entry: {
  group_id?: string | null;
  booking_id?: string | null;
  voucher_no?: string | null;
  action: string;
  details?: any;
}) {
  const u = await currentUserInfo();
  await supabase.from('booking_audit_log').insert({
    group_id: entry.group_id ?? null,
    booking_id: entry.booking_id ?? null,
    voucher_no: entry.voucher_no ?? null,
    action: entry.action,
    details: entry.details ?? null,
    performed_by: u.id,
    performed_by_email: u.email,
  });
}

export async function getAuditLog(limit = 200): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from('booking_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as AuditEntry[];
}

// =============== CONFIRM WITH PAYMENT METHOD ===============
export async function confirmBookingWithPayment(
  voucherNo: string,
  paymentMethod: PaymentMethod,
  paymentReference?: string,
) {
  const u = await currentUserInfo();
  const nowIso = new Date().toISOString();

  const { data: group } = await supabase
    .from('booking_groups')
    .select('id, voucher_no, company_name, grand_total')
    .eq('voucher_no', voucherNo)
    .maybeSingle();

  await supabase
    .from('booking_groups')
    .update({
      status: 'confirmed',
      payment_method: paymentMethod,
      payment_reference: paymentReference || null,
      paid_at: nowIso,
      confirmed_by: u.id,
    })
    .eq('voucher_no', voucherNo);

  await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('voucher_no', voucherNo);

  await logAudit({
    group_id: group?.id,
    voucher_no: voucherNo,
    action: 'payment_confirmed',
    details: {
      payment_method: paymentMethod,
      payment_reference: paymentReference,
      amount: group?.grand_total,
    },
  });
}

// =============== EXTEND (one-time, +7 days) ===============
export async function extendBooking(voucherNo: string): Promise<{ ok: boolean; reason?: string; newExpiresAt?: string }> {
  const { data: group, error } = await supabase
    .from('booking_groups')
    .select('id, voucher_no, status, expires_at, extended_once')
    .eq('voucher_no', voucherNo)
    .maybeSingle();
  if (error || !group) return { ok: false, reason: 'Booking not found' };
  if (group.status !== 'pending') return { ok: false, reason: 'Only pending bookings can be extended' };
  if (group.extended_once) return { ok: false, reason: 'Already extended once. No further extensions allowed.' };

  const base = group.expires_at ? new Date(group.expires_at) : new Date();
  const newExpiry = new Date(base.getTime() + EXTENSION_DAYS * 24 * 60 * 60 * 1000);

  await supabase
    .from('booking_groups')
    .update({
      original_expires_at: group.expires_at,
      expires_at: newExpiry.toISOString(),
      extended_once: true,
      expiry_warning_sent: false, // reset so a new warning can fire
    })
    .eq('voucher_no', voucherNo);

  await logAudit({
    group_id: group.id,
    voucher_no: voucherNo,
    action: 'extended',
    details: {
      added_days: EXTENSION_DAYS,
      previous_expires_at: group.expires_at,
      new_expires_at: newExpiry.toISOString(),
      note: 'One-time extension granted',
    },
  });

  return { ok: true, newExpiresAt: newExpiry.toISOString() };
}

// =============== CANCEL ===============
// type 'unpaid_auto' = pending cancellation, no money involved → hidden from accountant
// type 'paid_refund' = paid cancellation → goes to accountant with refund split
export async function cancelBookingWithPolicy(
  voucherNo: string,
  type: 'unpaid_auto' | 'paid_refund',
  opts?: { keptAmount?: number; refundAmount?: number; reason?: string }
) {
  const { data: group } = await supabase
    .from('booking_groups')
    .select('id, voucher_no, grand_total, status')
    .eq('voucher_no', voucherNo)
    .maybeSingle();
  if (!group) return;

  const update: any = {
    status: 'cancelled',
    cancellation_type: type,
    cancelled_at: new Date().toISOString(),
  };
  if (type === 'paid_refund') {
    const total = Number(group.grand_total);
    const kept = opts?.keptAmount ?? total * (CANCELLATION_KEEP_PERCENT / 100);
    const refund = opts?.refundAmount ?? total - kept;
    update.cancellation_kept_amount = kept;
    update.cancellation_refund_amount = refund;
  }

  await supabase.from('booking_groups').update(update).eq('voucher_no', voucherNo);
  await supabase.from('bookings').update({ status: 'cancelled' }).eq('voucher_no', voucherNo);

  await logAudit({
    group_id: group.id,
    voucher_no: voucherNo,
    action: type === 'paid_refund' ? 'cancelled_paid_refund' : 'cancelled_unpaid',
    details: { ...opts, total: group.grand_total },
  });
}

// =============== SWITCH (site or dates) — keeps voucher ===============
export async function switchBooking(
  bookingId: string,
  changes: { siteId?: string; siteName?: string; parkId?: string; parkName?: string; arrivalDate?: string; departureDate?: string }
) {
  const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle();
  if (!booking) throw new Error('Booking not found');
  const u = await currentUserInfo();

  const update: any = {
    original_site_id: booking.original_site_id ?? booking.site_id,
    original_site_name: booking.original_site_name ?? booking.site_name,
    original_arrival_date: booking.original_arrival_date ?? booking.arrival_date,
    original_departure_date: booking.original_departure_date ?? booking.departure_date,
    switched_at: new Date().toISOString(),
    switched_by: u.id,
  };
  if (changes.siteId) update.site_id = changes.siteId;
  if (changes.siteName) update.site_name = changes.siteName;
  if (changes.parkId) update.park_id = changes.parkId;
  if (changes.parkName) update.park_name = changes.parkName;
  if (changes.arrivalDate) update.arrival_date = changes.arrivalDate;
  if (changes.departureDate) update.departure_date = changes.departureDate;

  if (changes.arrivalDate || changes.departureDate) {
    const newArrival = changes.arrivalDate ?? booking.arrival_date;
    const newDeparture = changes.departureDate ?? booking.departure_date;
    const nights = Math.max(
      0,
      Math.round((new Date(newDeparture).getTime() - new Date(newArrival).getTime()) / (1000 * 60 * 60 * 24))
    );
    update.nights = nights;
    update.total_amount = nights * Number(booking.rate_per_night);
  }

  await supabase.from('bookings').update(update).eq('id', bookingId);

  // Update grand_total on the group
  const { data: siblings } = await supabase
    .from('bookings')
    .select('total_amount')
    .eq('group_id', booking.group_id);
  const newGrand = (siblings || []).reduce((s, b) => s + Number(b.total_amount), 0);
  await supabase.from('booking_groups').update({ grand_total: newGrand }).eq('id', booking.group_id);

  await logAudit({
    group_id: booking.group_id,
    booking_id: bookingId,
    voucher_no: booking.voucher_no,
    action: 'switched',
    details: {
      from_site: booking.site_name,
      to_site: changes.siteName ?? booking.site_name,
      from_arrival: booking.arrival_date,
      to_arrival: changes.arrivalDate ?? booking.arrival_date,
      from_departure: booking.departure_date,
      to_departure: changes.departureDate ?? booking.departure_date,
    },
  });
}

// =============== SITE BLACKOUTS ===============
export interface SiteBlackout {
  id: string;
  park_id: string;
  site_id: string;
  site_name: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
}

export async function getBlackouts(): Promise<SiteBlackout[]> {
  const { data, error } = await supabase
    .from('site_blackouts')
    .select('*')
    .order('start_date', { ascending: false });
  if (error) throw error;
  return (data || []) as SiteBlackout[];
}

export async function addBlackout(b: Omit<SiteBlackout, 'id' | 'created_at'>) {
  const u = await currentUserInfo();
  const { error } = await supabase.from('site_blackouts').insert({ ...b, created_by: u.id });
  if (error) throw error;
}

export async function removeBlackout(id: string) {
  await supabase.from('site_blackouts').delete().eq('id', id);
}

export async function getBlackoutsForSite(siteId: string): Promise<{ start: string; end: string; reason: string | null }[]> {
  const { data } = await supabase
    .from('site_blackouts')
    .select('start_date, end_date, reason')
    .eq('site_id', siteId);
  return (data || []).map(b => ({ start: b.start_date, end: b.end_date, reason: b.reason }));
}

// =============== STAFF INVITATIONS ===============
export interface StaffInvitation {
  id: string;
  email: string;
  role: 'admin' | 'accountant' | 'manager';
  invited_at: string;
  activated: boolean;
  activated_at: string | null;
  revoked: boolean;
  revoked_at: string | null;
}

export async function getStaffInvitations(): Promise<StaffInvitation[]> {
  const { data, error } = await supabase
    .from('staff_invitations')
    .select('*')
    .order('invited_at', { ascending: false });
  if (error) throw error;
  return (data || []) as StaffInvitation[];
}

export async function inviteStaff(email: string, role: 'admin' | 'accountant' | 'manager') {
  const u = await currentUserInfo();
  const { error } = await supabase.from('staff_invitations').insert({
    email: email.toLowerCase().trim(),
    role,
    invited_by: u.id,
  });
  if (error) throw error;
}

export async function revokeStaff(id: string) {
  await supabase.from('staff_invitations').update({
    revoked: true,
    revoked_at: new Date().toISOString(),
  }).eq('id', id);
}

export async function deleteStaffInvitation(id: string) {
  await supabase.from('staff_invitations').delete().eq('id', id);
}
