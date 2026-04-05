# Auth Role Persistence Context

## Decision

Move admin/client authorization source of truth to database while keeping Clerk as identity provider.

## Current flow implemented

1. Request arrives with Clerk identity headers and token.
2. Identity is validated (JWT path or optional dev bypass path).
3. Backend resolves role using this precedence:
   - Temporary allowlist fallback (`APP_AUTH_ADMIN_CLERK_USER_IDS` or `APP_AUTH_ADMIN_EMAILS`)
   - Persisted role in table `auth_user`
4. If user does not exist in `auth_user`, backend auto-creates with role `client`.
5. Admin promotion is manual by updating `auth_user.role = 'admin'`.

## Database

- Migration: `V4__auth_users.sql`
- Table: `auth_user`
  - `clerk_user_id` (PK)
  - `email`
  - `role` (`admin` or `client`)
  - `created_at`
  - `updated_at`

## Manual admin promotion example

```sql
INSERT INTO auth_user (clerk_user_id, email, role)
VALUES ('user_3BujmS63PxLeLMCJADv96UZiKGF', 'admin@baluarte.com', 'admin')
ON CONFLICT (clerk_user_id)
DO UPDATE SET role = 'admin', email = EXCLUDED.email, updated_at = CURRENT_TIMESTAMP;
```

## Notes

- Clerk remains source of identity (`clerk_user_id`, `email`).
- App database is source of authorization (`role`).
- This avoids hardcoded admin users and enables future admin UI management.
