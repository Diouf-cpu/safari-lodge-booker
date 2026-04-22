---
name: Reservation v2 features
description: Members, waitlist/share, notifications feed, BOGA Reserve per-person pricing
type: feature
---
- "Admin" UI is renamed "Reservation" everywhere (route still /admin)
- Tabs in reservation dashboard: Notifications (default), Bookings, Waitlist, Members, Companies, Manage List, Sites, Voucher Lookup
- Members table = annual subscribers only (name, email, country, subscription_start/end). Status: active / expiring_soon (≤60 days) / expired
- Expired members can fill the booking form but Submit is disabled with "Renewal required" message
- Notifications generated automatically: booking_expiring (2 days before 14-day cancel), waitlist_request, share_request, member_renewal_60, member_renewal_30, member_renewal_expired
- Sweeps run on dashboard load (sweepBookingExpiryNotifications, sweepMemberRenewalNotifications)
- Waitlist & share requests: anonymous can submit from BookPage (when site unavailable) or AvailabilityPage calendar (popover on booked dates). Staff sees in Waitlist tab and decides manually (Promote / Accept / Decline)
- BOGA Reserve Camp = individuals only. Public flow: /book?type=boga-reserve. Reservation desk: dedicated button at top. Pricing = guest_count × nights × BOGA_PER_PERSON_RATE (P250)
- Wildlife parks (everything except boga-reserve) excluded from BOGA Reserve flow and vice-versa
- Booking auto-cancel window: 14 days (default expires_at = now() + 14 days)
