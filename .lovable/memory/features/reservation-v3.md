---
name: Reservation v3 features
description: Payment methods, one-time extension, 50/50 cancellation refunds, switches, blackouts, audit, manager role, staff invitations, CSV export
type: feature
---
- Payment methods captured on confirmation: Cash, Card, Bank Transfer, EFT, Mobile Money. Stored on booking_groups.payment_method
- One-time extension: pending bookings can be extended +7 days exactly once (extended_once flag). Use extendBooking() in operationsStore
- Cancellation policy: paid → 50% kept / 50% refunded (CANCELLATION_KEEP_PERCENT). Unpaid auto-cancellations stored as cancellation_type='unpaid_auto' and HIDDEN from accountant view. Paid cancellations stored as 'paid_refund' and visible to accountant with kept/refund split
- Site switching: keeps the same voucher; tracks original_site_id, original_arrival_date, switched_at, switched_by. Dates can also change. Recalculates total + grand_total
- Site blackouts: site_blackouts table; staff marks date ranges unavailable per site. Hidden from public booking calendar. getBookedDatesForSite returns blackouts with status='blackout'
- Audit log: booking_audit_log records every payment_confirmed, extended, cancelled_paid_refund, cancelled_unpaid, switched action with performed_by_email
- Manager role (read-only + export): app_role enum extended; manager has SELECT-only RLS on booking_groups, bookings, members, notifications, waitlist_requests, companies, site_blackouts, audit log, staff_invitations
- Staff invitations: staff_invitations table; admin invites by email + role. First password they set becomes permanent. Admin can revoke (revoked=true)
- CSV export: src/lib/exportUtils.ts — exportToCSV(filename, rows) + getPeriodRange preset (today, this_month, last_month, this_year, all, custom)
- Daily 12am cutoff: posted_to_accounts_on field on booking_groups; accountant view filters by this date for end-of-day rollup
- Public site (Index, BookPage): BOGA Reserve hidden completely. /book?type=boga-reserve URL silently redirects to wilderness flow. BOGA Reserve form lives only on /admin
- Extension constants: EXTENSION_DAYS = 7. Member auto-cancel window: 14 days. Warning: 2 days before expiry
