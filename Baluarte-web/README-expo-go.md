# Expo Go Bootstrap (Story 1.1B)

## Prerequisites

- Node.js 20+
- Expo Go app installed on Android and/or iOS device
- Backend reachable from mobile device network

## Install dependencies

```bash
npm install
```

## Configure local environment file

Create your local `.env` from template:

```bash
cp .env.example .env
```

Set at least:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_ADMIN_EMAILS` (must match backend `APP_AUTH_ADMIN_EMAILS`)
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY` (public key only)

Never put private secrets in web env (`EXPO_PUBLIC_*` is exposed to client bundles).

## Configure API base URL

The app resolves the API base URL in this order:

1. `EXPO_PUBLIC_API_BASE_URL`
2. `EXPO_PUBLIC_ENV` (`development`, `staging`, `production`)
3. `NODE_ENV`

Defaults by environment:

- development: `http://localhost:8080`
- staging: `https://staging-api.example.com`
- production: `https://api.example.com`

For local backend testing from a real device, use your machine LAN IP:

```bash
set EXPO_PUBLIC_API_BASE_URL=http://192.168.0.10:8080
```

## Run with Expo Go

```bash
npm run expo:start
```

Then scan the QR code in Expo Go.

Shortcuts:

```bash
npm run expo:android
npm run expo:ios
```

## Contract check behavior

- Mobile entrypoint is `App.tsx`
- Categories contract check calls `GET /api/v1/catalog/categories`
- Error UI shows normalized `code`, `message`, and optional `traceId`
- Raw backend stack traces are not rendered in UI

## Mock mode for frontend-only validation

- By default, categories are mocked in `development` for Expo Go to speed up UI validation.
- To force real API calls in development, set:

```bash
set EXPO_PUBLIC_USE_MOCK_CATEGORIES=false
```

- To force mocks in any environment, set:

```bash
set EXPO_PUBLIC_USE_MOCK_CATEGORIES=true
```

## Test guardrails

```bash
npm test -- --runInBand
```

Includes:

- Unit tests for envelope parsing and error normalization
- Smoke tests for app boot and categories fetch with mocked API
