---
name: Company booking passwords
description: Each safari company has a private bcrypt password gating public Wildlife bookings; staff manage via Reservation > Manage List
type: feature
---
- `companies.password_hash` (bcrypt via pgcrypto). Column SELECT revoked from anon/authenticated.
- RPCs: `set_company_password(_company_id, _password)` (admin-only), `verify_company_password(_company_id, _password)` returns boolean.
- Staff UI: `src/components/reservation/CompanyPasswordManager.tsx` rendered inside the AdminPage "Manage List" tab.
- Public BookPage requires password verification before submit when a known company is selected. "Other company" entries skip the gate (staff sets a password later).
- Min password length: 4 chars. Re-verified server-side at submit time.
- Password-set badges in the staff list use a localStorage flag cache (best-effort UI hint only).
