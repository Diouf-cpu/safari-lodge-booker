import { supabase } from '@/integrations/supabase/client';

function generateVoucherNo(): string {
  const num = 30000 + Math.floor(Math.random() * 10000);
  return num.toString();
}

function generateSiteVoucherNo(): string {
  const num = 50000 + Math.floor(Math.random() * 50000);
  return 'S' + num.toString();
}

export async function getCompanies(): Promise<string[]> {
  const { data } = await supabase.from('companies').select('name').order('name');
  return (data || []).map(c => c.name);
}

export interface CompanyDetailed {
  id: string;
  name: string;
  hasPassword: boolean;
  mustChange: boolean;
}

export const DEFAULT_COMPANY_PASSWORD = 'boga1234';

// Returns each company plus whether it has a password and whether it's still on
// the shared default `boga1234` (in which case the booking form will force the
// company to set their own password before submitting).
export async function getCompaniesDetailed(): Promise<CompanyDetailed[]> {
  const { data } = await supabase.from('companies').select('id, name').order('name');
  if (!data) return [];
  const statuses = await Promise.all(
    data.map(c => supabase.rpc('company_password_status', { _company_id: c.id }).then(r => r.data?.[0]))
  );
  return data.map((c, i) => ({
    id: c.id,
    name: c.name,
    hasPassword: !!statuses[i]?.has_password,
    mustChange: !!statuses[i]?.must_change,
  }));
}

export async function getCompanyPasswordStatus(companyId: string): Promise<{ hasPassword: boolean; mustChange: boolean }> {
  const { data } = await supabase.rpc('company_password_status', { _company_id: companyId });
  const row = data?.[0];
  return { hasPassword: !!row?.has_password, mustChange: !!row?.must_change };
}

// Admin-only: explicitly set a custom password (rarely used now).
export async function setCompanyPassword(companyId: string, password: string): Promise<void> {
  const { error } = await supabase.rpc('set_company_password', { _company_id: companyId, _password: password });
  if (error) throw error;
}

// Admin-only: reset back to the shared default `boga1234`. The company will be
// forced to pick their own password the next time they try to submit a booking.
export async function resetCompanyPasswordToDefault(companyId: string): Promise<void> {
  const { error } = await supabase.rpc('reset_company_password_to_default', { _company_id: companyId });
  if (error) throw error;
}

// Public: company-initiated password change after entering the default.
export async function changeCompanyPassword(companyId: string, currentPassword: string, newPassword: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('change_company_password', {
    _company_id: companyId,
    _current_password: currentPassword,
    _new_password: newPassword,
  });
  if (error) throw error;
  return data === true;
}

export async function verifyCompanyPassword(companyId: string, password: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_company_password', { _company_id: companyId, _password: password });
  if (error) throw error;
  return data === true;
}

// Add a company. New rows start with default password `boga1234` + must-change
// flag set, so they're immediately usable. Best-effort on the password reset
// (only admins can run it; public callers just upsert).
export async function addCompany(name: string): Promise<void> {
  const { data, error } = await supabase
    .from('companies')
    .upsert({ name }, { onConflict: 'name' })
    .select('id')
    .single();
  if (error) throw error;
  if (data?.id) {
    await supabase.rpc('reset_company_password_to_default', { _company_id: data.id });
  }
}

export async function deleteCompany(name: string): Promise<void> {
  await supabase.from('companies').delete().eq('name', name);
}

export async function getBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getBookingGroups() {
  const { data, error } = await supabase
    .from('booking_groups')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addBookingGroup(
  companyName: string,
  contactEmail: string,
  contactPhone: string,
  items: { parkId: string; parkName: string; siteId: string; siteName: string; arrivalDate: string; departureDate: string; nights: number; ratePerNight: number; totalAmount: number }[]
) {
  const voucherNo = generateVoucherNo();
  const grandTotal = items.reduce((s, i) => s + i.totalAmount, 0);

  await addCompany(companyName);

  const { data: group, error: groupError } = await supabase
    .from('booking_groups')
    .insert({
      voucher_no: voucherNo,
      company_name: companyName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      grand_total: grandTotal,
      status: 'pending',
    })
    .select()
    .single();

  if (groupError) throw groupError;

  const bookingRows = items.map(item => ({
    group_id: group.id,
    voucher_no: voucherNo,
    site_voucher_no: generateSiteVoucherNo(),
    company_name: companyName,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    park_id: item.parkId,
    park_name: item.parkName,
    site_id: item.siteId,
    site_name: item.siteName,
    arrival_date: item.arrivalDate,
    departure_date: item.departureDate,
    nights: item.nights,
    rate_per_night: item.ratePerNight,
    total_amount: item.totalAmount,
    status: 'pending' as const,
  }));

  const { error: bookingsError } = await supabase.from('bookings').insert(bookingRows);
  if (bookingsError) throw bookingsError;

  return { ...group, voucherNo: group.voucher_no };
}

export async function confirmBooking(voucherNo: string) {
  await supabase.from('booking_groups').update({ status: 'confirmed' }).eq('voucher_no', voucherNo);
  await supabase.from('bookings').update({ status: 'confirmed' }).eq('voucher_no', voucherNo);
}

export async function cancelBooking(voucherNo: string) {
  await supabase.from('booking_groups').update({ status: 'cancelled' }).eq('voucher_no', voucherNo);
  await supabase.from('bookings').update({ status: 'cancelled' }).eq('voucher_no', voucherNo);
}

export async function expireOldBookings() {
  // Cancel pending bookings older than 3 days
  const { data: expired } = await supabase
    .from('booking_groups')
    .select('voucher_no')
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString());

  if (expired && expired.length > 0) {
    for (const g of expired) {
      await cancelBooking(g.voucher_no);
    }
  }
  return expired?.length || 0;
}

export async function isDateRangeAvailable(
  siteId: string,
  arrivalDate: string,
  departureDate: string
): Promise<boolean> {
  const { data } = await supabase
    .from('bookings')
    .select('arrival_date, departure_date')
    .eq('site_id', siteId)
    .neq('status', 'cancelled');

  if (!data) return true;

  const arrival = new Date(arrivalDate);
  const departure = new Date(departureDate);

  return !data.some(b => {
    const bArr = new Date(b.arrival_date);
    const bDep = new Date(b.departure_date);
    return arrival < bDep && departure > bArr;
  });
}

export async function getBookedDatesForSite(siteId: string) {
  const [bookingsRes, blackoutsRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('arrival_date, departure_date, company_name, status')
      .eq('site_id', siteId)
      .neq('status', 'cancelled'),
    supabase
      .from('site_blackouts')
      .select('start_date, end_date, reason')
      .eq('site_id', siteId),
  ]);

  const bookings = (bookingsRes.data || []).map(b => ({
    start: b.arrival_date,
    end: b.departure_date,
    company: b.company_name,
    status: b.status as 'pending' | 'confirmed',
  }));

  const blackouts = (blackoutsRes.data || []).map(b => ({
    start: b.start_date,
    end: b.end_date,
    company: b.reason || 'Unavailable',
    status: 'blackout' as const,
  }));

  return [...bookings, ...blackouts];
}

// Returns all blackout windows that overlap the given range, used to hide unavailable sites on the public booking page.
export async function isSiteBlackedOut(siteId: string, arrival: string, departure: string): Promise<boolean> {
  const { data } = await supabase
    .from('site_blackouts')
    .select('start_date, end_date')
    .eq('site_id', siteId);
  if (!data) return false;
  const a = new Date(arrival), d = new Date(departure);
  return data.some(b => {
    const bs = new Date(b.start_date), be = new Date(b.end_date);
    return a <= be && d >= bs;
  });
}

export async function getGroupedBookings() {
  const { data: groups } = await supabase
    .from('booking_groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (!groups) return [];

  const { data: allBookings } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  return groups.map(g => ({
    ...g,
    voucherNo: g.voucher_no,
    companyName: g.company_name,
    contactEmail: g.contact_email,
    contactPhone: g.contact_phone,
    grandTotal: Number(g.grand_total),
    bookings: (allBookings || [])
      .filter(b => b.group_id === g.id)
      .map(b => ({
        ...b,
        voucherNo: b.voucher_no,
        siteVoucherNo: b.site_voucher_no,
        companyName: b.company_name,
        contactEmail: b.contact_email,
        contactPhone: b.contact_phone,
        parkId: b.park_id,
        parkName: b.park_name,
        siteId: b.site_id,
        siteName: b.site_name,
        arrivalDate: b.arrival_date,
        departureDate: b.departure_date,
        ratePerNight: Number(b.rate_per_night),
        totalAmount: Number(b.total_amount),
      })),
  }));
}

export async function getSiteBookingStats() {
  const { data } = await supabase
    .from('bookings')
    .select('park_id, park_name, site_id, site_name, status')
    .neq('status', 'cancelled');

  if (!data) return [];

  const siteMap: Record<string, { parkName: string; siteName: string; siteId: string; parkId: string; total: number; confirmed: number; pending: number }> = {};

  data.forEach(b => {
    const key = b.site_id;
    if (!siteMap[key]) {
      siteMap[key] = { parkName: b.park_name, siteName: b.site_name, siteId: b.site_id, parkId: b.park_id, total: 0, confirmed: 0, pending: 0 };
    }
    siteMap[key].total++;
    if (b.status === 'confirmed') siteMap[key].confirmed++;
    if (b.status === 'pending') siteMap[key].pending++;
  });

  return Object.values(siteMap).sort((a, b) => b.total - a.total);
}

export async function getDailySummary(date: string) {
  // Get all bookings confirmed on a given date
  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;

  const { data } = await supabase
    .from('booking_groups')
    .select('*')
    .eq('status', 'confirmed')
    .gte('updated_at', startOfDay)
    .lte('updated_at', endOfDay);

  if (!data) return { groups: [], totalRevenue: 0 };

  const totalRevenue = data.reduce((s, g) => s + Number(g.grand_total), 0);

  return {
    groups: data.map(g => ({
      voucherNo: g.voucher_no,
      companyName: g.company_name,
      grandTotal: Number(g.grand_total),
      confirmedAt: g.updated_at,
    })),
    totalRevenue,
  };
}
