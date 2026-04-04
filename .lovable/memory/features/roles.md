---
name: User Roles and Booking Expiry
description: Admin and accountant roles with different dashboard views; 3-day auto-cancel for unpaid bookings
type: feature
---
- **Admin role**: Full access to bookings, companies, sites, voucher lookup, can confirm/cancel bookings, manage company list, generate receipt and voucher PDFs after confirmation
- **Accountant role**: Read-only view of confirmed payments and daily summaries (date-filterable)
- **3-day auto-cancel**: Pending bookings expire after 3 days if not confirmed (expires_at column on booking_groups)
- **Document flow**: Before confirmation → voucher preview (no site voucher codes). After confirmation → admin generates Receipt (with amounts) and Site Vouchers (with per-site voucher codes)
- Site voucher codes are only revealed after payment is confirmed
