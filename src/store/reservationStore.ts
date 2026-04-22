import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, parseISO } from 'date-fns';

// ===== MEMBERS =====
export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  subscription_start: string;
  subscription_end: string;
  status: string;
  notes: string | null;
}

export async function getMembers(): Promise<Member[]> {
  const { data, error } = await supabase.from('members').select('*').order('name');
  if (error) throw error;
  return (data || []) as Member[];
}

export async function addMember(m: Omit<Member, 'id' | 'status'>) {
  const { error } = await supabase.from('members').insert({
    name: m.name, email: m.email, phone: m.phone, country: m.country,
    subscription_start: m.subscription_start, subscription_end: m.subscription_end,
    notes: m.notes, status: 'active',
  });
  if (error) throw error;
}

export async function updateMember(id: string, patch: Partial<Member>) {
  const { error } = await supabase.from('members').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteMember(id: string) {
  const { error } = await supabase.from('members').delete().eq('id', id);
  if (error) throw error;
}

export function memberStatus(subscription_end: string): 'active' | 'expiring_soon' | 'expired' {
  const end = parseISO(subscription_end);
  const days = differenceInDays(end, new Date());
  if (days < 0) return 'expired';
  if (days <= 60) return 'expiring_soon';
  return 'active';
}

export async function findActiveMemberByEmail(email: string): Promise<Member | null> {
  if (!email) return null;
  const { data } = await supabase.from('members').select('*').eq('email', email.toLowerCase().trim()).maybeSingle();
  if (!data) return null;
  return data as Member;
}

// ===== WAITLIST =====
export interface WaitlistRequest {
  id: string;
  booking_id: string | null;
  site_id: string;
  site_name: string;
  park_id: string;
  park_name: string;
  arrival_date: string;
  departure_date: string;
  request_type: 'waitlist' | 'share';
  requester_name: string;
  requester_email: string;
  requester_phone: string;
  message: string | null;
  status: 'pending' | 'promoted' | 'declined' | 'accepted';
  staff_notes: string | null;
  created_at: string;
}

export async function createWaitlistRequest(payload: {
  booking_id?: string | null;
  site_id: string; site_name: string; park_id: string; park_name: string;
  arrival_date: string; departure_date: string;
  request_type: 'waitlist' | 'share';
  requester_name: string; requester_email: string; requester_phone: string;
  message?: string;
}) {
  const { error } = await supabase.from('waitlist_requests').insert({
    booking_id: payload.booking_id ?? null,
    site_id: payload.site_id, site_name: payload.site_name,
    park_id: payload.park_id, park_name: payload.park_name,
    arrival_date: payload.arrival_date, departure_date: payload.departure_date,
    request_type: payload.request_type,
    requester_name: payload.requester_name,
    requester_email: payload.requester_email,
    requester_phone: payload.requester_phone,
    message: payload.message || null,
  });
  if (error) throw error;

  // Create a staff notification
  await supabase.from('notifications').insert({
    type: payload.request_type === 'share' ? 'share_request' : 'waitlist_request',
    title: payload.request_type === 'share' ? 'New share request' : 'New waitlist request',
    message: `${payload.requester_name} requested ${payload.request_type === 'share' ? 'to share' : 'a waitlist slot for'} ${payload.site_name} (${payload.arrival_date} → ${payload.departure_date})`,
    severity: 'info',
    related_kind: 'waitlist_request',
  });
}

export async function getWaitlistRequests(): Promise<WaitlistRequest[]> {
  const { data, error } = await supabase.from('waitlist_requests').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as WaitlistRequest[];
}

export async function getWaitlistForSiteRange(siteId: string, arrival: string, departure: string): Promise<WaitlistRequest[]> {
  const { data } = await supabase
    .from('waitlist_requests')
    .select('*')
    .eq('site_id', siteId)
    .eq('status', 'pending');
  return (data || []).filter(w => {
    const a = new Date(w.arrival_date), d = new Date(w.departure_date);
    const a2 = new Date(arrival), d2 = new Date(departure);
    return a < d2 && d > a2;
  }) as WaitlistRequest[];
}

export async function updateWaitlistStatus(id: string, status: WaitlistRequest['status'], notes?: string) {
  const { error } = await supabase.from('waitlist_requests').update({
    status, staff_notes: notes ?? undefined,
  }).eq('id', id);
  if (error) throw error;
}

// ===== NOTIFICATIONS =====
export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  related_id: string | null;
  related_kind: string | null;
  read: boolean;
  created_at: string;
}

export async function getNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  return (data || []) as AppNotification[];
}

export async function markNotificationRead(id: string, read = true) {
  await supabase.from('notifications').update({ read }).eq('id', id);
}

export async function markAllNotificationsRead() {
  await supabase.from('notifications').update({ read: true }).eq('read', false);
}

export async function deleteNotification(id: string) {
  await supabase.from('notifications').delete().eq('id', id);
}

// Generates booking-expiry warnings (12-day mark) — safe to run on dashboard load
export async function sweepBookingExpiryNotifications() {
  const { data: groups } = await supabase
    .from('booking_groups')
    .select('id, voucher_no, company_name, expires_at, expiry_warning_sent, status')
    .eq('status', 'pending')
    .eq('expiry_warning_sent', false);

  if (!groups) return;
  const now = Date.now();
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

  for (const g of groups) {
    if (!g.expires_at) continue;
    const expires = new Date(g.expires_at).getTime();
    const msLeft = expires - now;
    // Notify when 2 days or less remain (and not yet expired)
    if (msLeft > 0 && msLeft <= twoDaysMs) {
      await supabase.from('notifications').insert({
        type: 'booking_expiring',
        title: 'Reservation about to expire',
        message: `Voucher ${g.voucher_no} for ${g.company_name} will auto-cancel in under 2 days unless confirmed. Contact the client about extension or payment.`,
        severity: 'warning',
        related_id: g.id,
        related_kind: 'booking_group',
      });
      await supabase.from('booking_groups').update({ expiry_warning_sent: true }).eq('id', g.id);
    }
  }
}

// Member renewal warnings (60-day and 30-day)
export async function sweepMemberRenewalNotifications() {
  const { data: members } = await supabase.from('members').select('*');
  if (!members) return;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (const m of members) {
    const end = new Date(m.subscription_end); end.setHours(0, 0, 0, 0);
    const days = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let bucket: '60' | '30' | 'expired' | null = null;
    if (days < 0 && m.status !== 'expired') bucket = 'expired';
    else if (days === 30) bucket = '30';
    else if (days === 60) bucket = '60';
    if (!bucket) continue;

    // Avoid duplicate by checking last 25h notifications for this member+bucket
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('related_id', m.id)
      .eq('type', `member_renewal_${bucket}`)
      .gte('created_at', new Date(Date.now() - 25 * 3600 * 1000).toISOString())
      .limit(1);
    if (existing && existing.length) continue;

    await supabase.from('notifications').insert({
      type: `member_renewal_${bucket}`,
      title: bucket === 'expired' ? 'Member subscription expired' : `Member renewal due in ${bucket} days`,
      message: bucket === 'expired'
        ? `${m.name} (${m.email}) subscription has expired. Bookings are now disabled until they renew.`
        : `${m.name} (${m.email}) subscription expires on ${m.subscription_end}. Contact them about renewal.`,
      severity: bucket === 'expired' ? 'critical' : 'warning',
      related_id: m.id,
      related_kind: 'member',
    });

    if (bucket === 'expired' && m.status !== 'expired') {
      await supabase.from('members').update({ status: 'expired' }).eq('id', m.id);
    }
  }
}

// ===== BOGA RESERVE per-person booking =====
export const BOGA_PER_PERSON_RATE = 250; // BWP per person per night

function genVoucher(): string { return (30000 + Math.floor(Math.random() * 10000)).toString(); }
function genSiteVoucher(): string { return 'S' + (50000 + Math.floor(Math.random() * 50000)).toString(); }

export async function createBogaReserveBooking(payload: {
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  idNumber: string;
  siteId: string;
  siteName: string;
  arrivalDate: string;
  departureDate: string;
  guestCount: number;
}) {
  const nights = differenceInDays(new Date(payload.departureDate), new Date(payload.arrivalDate));
  if (nights <= 0) throw new Error('Departure must be after arrival');
  const total = nights * payload.guestCount * BOGA_PER_PERSON_RATE;
  const voucherNo = genVoucher();

  const { data: group, error: groupError } = await supabase.from('booking_groups').insert({
    voucher_no: voucherNo,
    company_name: payload.fullName,
    contact_email: payload.email,
    contact_phone: payload.phone,
    grand_total: total,
    status: 'pending',
    booker_type: 'individual',
  }).select().single();
  if (groupError) throw groupError;

  const { error: bookingError } = await supabase.from('bookings').insert({
    group_id: group.id,
    voucher_no: voucherNo,
    site_voucher_no: genSiteVoucher(),
    company_name: payload.fullName,
    contact_email: payload.email,
    contact_phone: payload.phone,
    park_id: 'boga-reserve',
    park_name: 'BOGA Reserve',
    site_id: payload.siteId,
    site_name: payload.siteName,
    arrival_date: payload.arrivalDate,
    departure_date: payload.departureDate,
    nights,
    rate_per_night: payload.guestCount * BOGA_PER_PERSON_RATE,
    total_amount: total,
    status: 'pending',
    booking_type: 'individual',
    guest_count: payload.guestCount,
    per_person_rate: BOGA_PER_PERSON_RATE,
    nationality: payload.nationality,
    id_number: payload.idNumber,
  });
  if (bookingError) throw bookingError;

  return { voucherNo, total, nights };
}
