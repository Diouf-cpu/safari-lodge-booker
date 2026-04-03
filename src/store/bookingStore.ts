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

export async function addCompany(name: string): Promise<void> {
  await supabase.from('companies').upsert({ name }, { onConflict: 'name' });
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

  // Save company if new
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

  const { error: bookingsError } = await supabase
    .from('bookings')
    .insert(bookingRows);

  if (bookingsError) throw bookingsError;

  return { ...group, voucherNo: group.voucher_no };
}

export async function confirmBooking(voucherNo: string) {
  await supabase
    .from('booking_groups')
    .update({ status: 'confirmed' })
    .eq('voucher_no', voucherNo);
  await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('voucher_no', voucherNo);
}

export async function cancelBooking(voucherNo: string) {
  await supabase
    .from('booking_groups')
    .update({ status: 'cancelled' })
    .eq('voucher_no', voucherNo);
  await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('voucher_no', voucherNo);
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
  const { data } = await supabase
    .from('bookings')
    .select('arrival_date, departure_date, company_name, status')
    .eq('site_id', siteId)
    .neq('status', 'cancelled');

  return (data || []).map(b => ({
    start: b.arrival_date,
    end: b.departure_date,
    company: b.company_name,
    status: b.status,
  }));
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
