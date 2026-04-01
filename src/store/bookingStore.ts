import { Booking, BookingGroup } from '@/data/types';

const STORAGE_KEY = 'boga_bookings';

function generateVoucherNo(): string {
  const num = 30000 + Math.floor(Math.random() * 10000);
  return num.toString();
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function getBookings(): Booking[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveBookings(bookings: Booking[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

export function addBookingGroup(
  companyName: string,
  contactEmail: string,
  contactPhone: string,
  items: { parkId: string; parkName: string; siteId: string; siteName: string; arrivalDate: string; departureDate: string; nights: number; ratePerNight: number; totalAmount: number }[]
): BookingGroup {
  const voucherNo = generateVoucherNo();
  const groupId = generateId();
  const now = new Date().toISOString();

  const newBookings: Booking[] = items.map(item => ({
    id: generateId(),
    voucherNo,
    companyName,
    contactEmail,
    contactPhone,
    ...item,
    status: 'pending' as const,
    createdAt: now,
  }));

  const existing = getBookings();
  saveBookings([...existing, ...newBookings]);

  return {
    id: groupId,
    voucherNo,
    companyName,
    contactEmail,
    contactPhone,
    bookings: newBookings,
    grandTotal: newBookings.reduce((s, b) => s + b.totalAmount, 0),
    status: 'pending',
    createdAt: now,
  };
}

export function confirmBooking(voucherNo: string) {
  const bookings = getBookings();
  const updated = bookings.map(b =>
    b.voucherNo === voucherNo ? { ...b, status: 'confirmed' as const } : b
  );
  saveBookings(updated);
}

export function cancelBooking(voucherNo: string) {
  const bookings = getBookings();
  const updated = bookings.map(b =>
    b.voucherNo === voucherNo ? { ...b, status: 'cancelled' as const } : b
  );
  saveBookings(updated);
}

export function isDateRangeAvailable(
  siteId: string,
  arrivalDate: string,
  departureDate: string,
  excludeBookingId?: string
): boolean {
  const bookings = getBookings().filter(
    b => b.siteId === siteId && b.status !== 'cancelled' && b.id !== excludeBookingId
  );
  const arrival = new Date(arrivalDate);
  const departure = new Date(departureDate);

  return !bookings.some(b => {
    const bArr = new Date(b.arrivalDate);
    const bDep = new Date(b.departureDate);
    return arrival < bDep && departure > bArr;
  });
}

export function getBookedDatesForSite(siteId: string): { start: string; end: string; company: string; status: string }[] {
  return getBookings()
    .filter(b => b.siteId === siteId && b.status !== 'cancelled')
    .map(b => ({ start: b.arrivalDate, end: b.departureDate, company: b.companyName, status: b.status }));
}

export function getGroupedBookings(): BookingGroup[] {
  const bookings = getBookings();
  const groups: Record<string, Booking[]> = {};
  bookings.forEach(b => {
    if (!groups[b.voucherNo]) groups[b.voucherNo] = [];
    groups[b.voucherNo].push(b);
  });

  return Object.entries(groups).map(([voucherNo, items]) => ({
    id: items[0].id,
    voucherNo,
    companyName: items[0].companyName,
    contactEmail: items[0].contactEmail,
    contactPhone: items[0].contactPhone,
    bookings: items,
    grandTotal: items.reduce((s, b) => s + b.totalAmount, 0),
    status: items[0].status,
    createdAt: items[0].createdAt,
  }));
}
