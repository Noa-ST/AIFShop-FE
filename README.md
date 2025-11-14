# AIFShop Frontend

React 18 + Vite storefront with integrated order management and payment flows powered by React Query.

## Environment

Create a `.env` (or `.env.local`) in the project root and configure the backend base URL:

```
VITE_API_BASE_URL=https://your-backend-host
```

If the variable is omitted the app falls back to `https://localhost:7109`.

## Development Scripts

- `pnpm install` – install dependencies.
- `pnpm dev` – start Vite + Express dev server.
- `pnpm build` – build client and server bundles.
- `pnpm test` – run unit/component tests with Vitest.
- `pnpm typecheck` – run TypeScript compiler checks.

## Order & Payment Flow

- Shared Axios client (`client/services/axiosClient.ts`) enforces auth headers, refresh logic, and normalised `ServiceResponse<T>` handling via `assertServiceSuccess`.
- Service layer (`client/services/orders.ts`, `client/services/payments.ts`) exposes CRUD helpers for orders, statuses, and payment processing.
- React Query hooks (`client/hooks/use-orders.ts`, `client/hooks/use-payments.ts`) manage caching/mutations across customer, seller, and admin scopes.
- Pages:
  - `/orders/my` – customer order list with status filters and empty/loader states.
  - `/orders/shop` – seller view scoped to the current shop.
  - `/orders/admin` – admin overview with inline status transitions.
  - `/orders/:id` – detailed order view with payment trigger, mock items, and audit placeholders.
- Status labels and badge colours are centralised in `client/constants/order-status.ts`.

## Testing

Vitest runs in `jsdom` using Testing Library helpers. Key tests live under:

- `client/services/__tests__/orders.test.ts` – Axios failure handling.
- `client/hooks/__tests__/useOrderList.test.tsx` – hook queries & filtering.
- `client/pages/Orders/__tests__/*.test.tsx` – UI rendering and mutation triggers.

Run `pnpm test` to execute the full suite.

