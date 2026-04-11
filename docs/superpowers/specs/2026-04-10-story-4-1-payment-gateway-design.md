# Story 4.1 Design — Process Pix and Card Payments via Strategy Gateway

## Scope
Implement Story 4.1 with an active payment strategy gateway that supports:
- Pix payment generation with QR code and copy-paste code rendered inside the app
- Credit card payment fully inside the app
- Installments support for card payments in this story
- Idempotent payment creation
- Order creation/update with payment reference
- No persistence of sensitive payment credentials in platform storage

This design also includes:
- A mock payment gateway for local/dev usage
- A Mercado Pago gateway adapter prepared to be enabled through environment configuration

Out of scope for this story:
- Full webhook-driven asynchronous reconciliation as the main confirmation path
- Automatic provider failover from Mercado Pago to mock in production
- Unrelated checkout or order lifecycle expansion beyond payment creation/update needs

## Requirements and Constraints
- Payment must remain gateway-agnostic through a strategy contract
- Pix and card must be available as user-selectable methods
- Card flow must stay inside the app; no redirect-based checkout
- Installments must be supported now
- The backend is the source of truth for payable amount
- Payment creation must use idempotency protection
- Order and payment records must remain linked through stable references
- Raw card number, CVV, and expiry must never be persisted or logged

## Recommended Approach
Use a strategy-based payment gateway at the backend with two implementations:
- `MockPaymentGatewayStrategy`
- `MercadoPagoPaymentGatewayStrategy`

Use a shared application contract for payment requests so checkout orchestration remains provider-agnostic.

Tokenize card data on the client and send only the resulting token and safe metadata to the backend. For Pix, request payment creation from the backend and render the returned QR/copy-paste data in-app.

## Architecture

### Frontend Responsibilities
The mobile app in `Baluarte-web` should:
- Present payment method selection between Pix and card
- For Pix:
  - request payment creation from the backend
  - render QR code image and copy-paste Pix code in-app
  - preserve pending payment context for retry and revisit
- For card:
  - collect cardholder/payment form input in-app
  - tokenize card details on the client using Mercado Pago client-side tooling/public key
  - submit only tokenized/payment metadata to the backend
  - support installments selection in-app
- Preserve checkout context on payment failure so the customer can retry or switch methods

### Backend Responsibilities
The backend in `Baluarte-core` should:
- Expose a payment creation endpoint under `/api/v1/payment`
- Validate that checkout is ready for payment
- Resolve the active payment provider using environment configuration
- Route payment creation through a `PaymentGatewayStrategy`
- Create or update the order with payment reference metadata
- Persist payment transaction state and provider reference
- Never persist sensitive payment credentials

### Strategy Contract
Suggested port:
- `PaymentGatewayStrategy`

Suggested capabilities:
- `createPixPayment(...)`
- `createCardPayment(...)`

Shared result shape should normalize provider responses into platform-level values such as:
- provider payment reference
- status
- status detail
- method
- Pix QR/copy-paste payload when applicable
- installments when applicable

### Gateway Implementations
#### MockPaymentGatewayStrategy
Used for local/dev/test flows through explicit configuration.

Behavior:
- Pix returns deterministic QR/copy-paste placeholders
- Card returns deterministic success/failure scenarios suitable for UI and test coverage
- Supports installment echoing for contract validation
- Never silently replaces Mercado Pago in production

#### MercadoPagoPaymentGatewayStrategy
Used when environment variables enable Mercado Pago.

Behavior:
- Pix creates a payment and returns QR payload fields required by the app
- Card creates a payment using a tokenized card payload, installments, and payer data
- Uses provider idempotency support on payment creation
- Stores only safe references/statuses in platform persistence

## Data Flow

### Pix Flow
1. App sends payment request with method `pix`, checkout reference, payer data, and idempotency key.
2. Backend validates checkout readiness and computes payable amount from trusted backend state.
3. Backend calls active gateway strategy.
4. Backend persists/updates `paymentTransaction` and links it to the order.
5. Backend returns payment status plus Pix payload:
   - `qrCodeBase64`
   - `qrCode`
   - `copyPasteCode`
   - optional expiration data when available
6. App renders QR code and copy-paste action in-app.

### Card Flow
1. App collects card data in-app.
2. App tokenizes card data on the client.
3. App sends backend only:
   - checkout reference
   - method `card`
   - card token
   - payment method id
   - issuer id when applicable
   - installments
   - payer data
   - idempotency key
4. Backend validates checkout readiness and trusted amount.
5. Backend calls active gateway strategy.
6. Backend persists/updates `paymentTransaction` and order payment reference.
7. Backend returns normalized payment result with approved/pending/rejected state.

## API Contract Direction

### Payment Request
Suggested request shape:

```json
{
  "checkoutSessionId": "chk_123",
  "method": "pix|card",
  "idempotencyKey": "uuid",
  "payer": {
    "email": "cliente@exemplo.com",
    "identification": {
      "type": "CPF",
      "number": "12345678909"
    }
  },
  "card": {
    "token": "tok_x",
    "paymentMethodId": "visa",
    "issuerId": "123",
    "installments": 3
  }
}
```

### Pix Response
```json
{
  "data": {
    "paymentId": "pay_123",
    "status": "pending",
    "method": "pix",
    "pix": {
      "qrCode": "000201...",
      "qrCodeBase64": "iVBORw0...",
      "copyPasteCode": "000201..."
    }
  }
}
```

### Card Response
```json
{
  "data": {
    "paymentId": "pay_456",
    "status": "approved|pending|rejected",
    "statusDetail": "accredited|pending_review_manual|cc_rejected_other_reason",
    "method": "card",
    "installments": 3
  }
}
```

## Persistence and State

### Payment Transaction
Persist only safe fields such as:
- internal payment id
- provider name
- provider payment id/reference
- order id
- checkout session id
- method
- amount
- installments
- status
- status detail
- idempotency key
- timestamps

Do not persist:
- raw card number
- CVV
- expiry
- raw cardholder payloads beyond what is already safe and required

### Order Update Rule
When payment is created:
- ensure an order record exists or is updated from the checkout context
- attach payment reference and pending/initial payment status

When payment is approved:
- update order payment reference and mark payment success state

When payment is rejected or fails:
- keep checkout/order context recoverable so the customer can retry or switch methods

## Error Handling and Recovery

### General Rules
- Reject payment creation if checkout is invalid or incomplete
- Reject malformed or incompatible method payloads deterministically
- Treat backend-calculated amount as authoritative
- Require idempotency key for each payment creation attempt

### Pix Recovery
- If payment creation fails, keep checkout state and allow retry
- If Pix is pending, preserve returned QR/copy-paste data for revisit
- If a Pix payment expires later, the next attempt should create a new payment with a new idempotency key

### Card Recovery
- If client-side tokenization fails, show form-level validation and do not call backend
- If provider rejects payment, preserve checkout context and allow:
  - retry with another card
  - change installments
  - switch to Pix
- If a network/timeout issue occurs, idempotency must prevent duplicate charge creation

## Environment Configuration
Suggested environment-driven selection:
- `PAYMENT_PROVIDER=mock|mercadopago`

Suggested Mercado Pago envs:
- public key
- access token
- sandbox/test mode toggle
- optional webhook/notification URL base for upcoming stories

Mock should be enabled only by explicit configuration, not as an automatic production fallback.

## Testing Strategy
Add targeted tests for:
- Pix payment creation returns QR and copy-paste data
- Card payment creation accepts tokenized payload and installments
- Idempotency prevents duplicate payment creation
- Order is created/updated with payment reference
- Sensitive card credentials are not persisted
- Card rejection preserves recoverable checkout state
- Method switching from card to Pix preserves context
- Mock and Mercado Pago adapters both satisfy the same strategy contract

## Implementation Notes
- Prefer extending existing checkout/payment flow files instead of creating parallel abstractions without need
- Keep frontend and backend contracts aligned with current project envelope conventions
- Keep mock behavior deterministic enough to support testing and local validation
- Prepare the Mercado Pago adapter so the user can enable it later by configuring `.env`

## Documentation References
- Story: `_bmad-output/implementation-artifacts/4-1-process-pix-and-card-payments-via-strategy-gateway.md`
- PRD: `_bmad-output/planning-artifacts/prd.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Epics: `_bmad-output/planning-artifacts/epics.md`
