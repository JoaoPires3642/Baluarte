# Auth Role Persistence Context

## Decision

Move admin/client authorization source of truth to database while keeping FusionAuth as identity provider.

## Current flow implemented

1. Request arrives with JWT in Authorization header.
2. JWT is validated via JWKS (RS256) — `JwtAuthenticationFilter`.
3. Backend resolves role using this precedence:
   - Temporary allowlist fallback (`APP_AUTH_ADMIN_EMAILS`)
   - Persisted role in table `auth_user`
4. If user does not exist in `auth_user`, backend auto-creates with role `client`.
5. Admin promotion is manual by updating `auth_user.role = 'admin'`.

## Email resolution (when JWT lacks email claim)

If the JWT does not contain an `email` claim, a fallback request to `FusionAuth /api/user/{id}` resolves it.
Response is cached in memory for 5 minutes to avoid excessive API calls.

## Database

- Migration: `V4__auth_users.sql`, `V35__rename_clerk_user_id.sql`
- Table: `auth_user`
  - `user_id` (PK)
  - `email`
  - `role` (`admin` or `client`)
  - `created_at`
  - `updated_at`

## Manual admin promotion example

```sql
INSERT INTO auth_user (user_id, email, role)
VALUES ('<fusionauth-user-uuid>', 'admin@baluarte.com', 'admin')
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin', email = EXCLUDED.email, updated_at = CURRENT_TIMESTAMP;
```

## Notes

- FusionAuth remains source of identity (user UUID, email).
- App database is source of authorization (`role`).
- This avoids hardcoded admin users and enables future admin UI management.
