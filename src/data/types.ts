export interface Park {
  id: string;
  name: string;
  sites: CampSite[];
}

export interface CampSite {
  id: string;
  name: string;
  parkId: string;
}

export interface Booking {
  id: string;
  voucherNo: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  parkId: string;
  parkName: string;
  siteId: string;
  siteName: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  ratePerNight: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  paymentReference?: string;
}

export interface BookingGroup {
  id: string;
  voucherNo: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  bookings: Booking[];
  grandTotal: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}
