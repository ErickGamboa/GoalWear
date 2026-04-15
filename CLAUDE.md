# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # development server
npm run build     # production build (also validates routes/types at runtime)
npm run lint      # eslint
```

No test runner is configured. `npm run build` is the primary correctness check for route/type changes.

## Architecture

GoalWear is a Next.js 14 App Router e-commerce site for sports jerseys, backed by Supabase. There are two route groups with separate layouts:

- **`app/(store)/`** — public storefront. Wraps children with `StoreHeader`, `StoreFooter`, `CartSheet`, and `WorldCupOverlay`. Cart state lives entirely in memory via `CartProvider` from `lib/cart-context.tsx`; it is not persisted.
- **`app/admin/(dashboard)/`** — protected admin dashboard. Guarded by `middleware.ts` → `lib/supabase/middleware.ts` which redirects unauthenticated requests to `/admin/login`.

### Data flow

- **Order creation** goes through `app/api/orders/route.ts` (POST), which calls the Supabase RPC `place_order_atomic`. This is an atomic SQL function that creates the order and decrements `product_sizes.stock` in one transaction — do not bypass it with direct inserts.
- **Admin actions** (take/deliver order, inventory processing, patch assignment) use Next.js Server Actions (`"use server"` files like `pedidos/actions.ts`, `pedidos/[id]/patch-actions.ts`), each calling `revalidatePath` after writes.
- **Supabase clients**: browser → `createClient()` from `@/lib/supabase/client`; server/actions → `await createClient()` from `@/lib/supabase/server`. Never create global server-side clients.

### Domain model

- **Products** have three categories: `immediate` (Entrega Inmediata), `preorder` (Pedido Previo), `accessory` (Accesorios).
- **Order status flow**: `pending` → `taken` → `delivered`. Orders only appear in the admin "Pendientes" tab when `inventory_processed = true AND status = 'pending'`. Orders with `inventory_processed = false` show as reverted (red) in the history tab.
- **Patches** are add-ons stored in the `patches` table; they are referenced in `order_items.patches` as a text array of patch names.
- All domain types and constants (sport slugs, category slugs, size lists) live in `lib/types.ts`. Use those constants — don't hardcode strings.

### Database schema

Schema history is in `scripts/` (SQL files numbered `001_`, `002_`, `003_`). The `supabase/migrations/` folder exists but is empty — apply schema changes by running SQL directly or through the Supabase MCP tools.

### PDF export

The admin orders page has a client-side PDF export (`handleExportPdf` in `pedidos/orders-client.tsx`) that builds HTML, opens a print window, and triggers `window.print()`. It only exports visible `preorder` items in the current tab/date filter.

## Key conventions (see AGENTS.md for the full list)

- UI copy is Spanish; code and comments are English.
- Currency: format with `formatCurrency()` from `@/lib/utils` (Costa Rican colón).
- Kids jersey names contain "niñ" — `product_sizes` stores text sizes; `KIDS_SIZE_DISPLAY` in `orders-client.tsx` maps them to display labels (e.g. `XXS = 16`).
- `typescript.ignoreBuildErrors = true` is set in `next.config.mjs` — still fix TS errors in code you touch.
- Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
