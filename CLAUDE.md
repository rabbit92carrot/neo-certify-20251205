# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Neo-Certify (네오인증서) is a product authentication system for tracking PDO threads (medical devices for aesthetic surgery) from production to final consumption. It provides:
- Virtual identification codes for statistical tracking (physical individual tracking not feasible)
- Role-based access for Manufacturers, Distributors, Hospitals, and Admins
- FIFO-based inventory management with immediate ownership transfer
- 24-hour recall window for shipment errors

## Tech Stack

- **Framework**: Next.js 16.0.8 (App Router) with React 19
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Validation**: Zod schemas
- **Testing**: Vitest (unit/integration), Playwright (E2E)

## Common Commands

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run dev:webpack      # Start dev server (Webpack)
npm run build            # Production build

# Type checking, linting, formatting
npm run type-check       # TypeScript type check
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npm run format           # Prettier format
npm run format:check     # Prettier check

# Testing
npm test                 # Run Vitest in watch mode
npm run test:run         # Single test run
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only (requires Supabase)
npm run test:coverage    # Run with coverage
npx vitest run tests/unit/auth.service.test.ts  # Run single test file

# E2E Testing (Playwright)
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run with Playwright UI
npm run test:e2e:headed  # Run with visible browser
npm run test:e2e:debug   # Run with Playwright debugger
npx playwright test auth.spec.ts  # Run single E2E file

# Database
npx supabase start       # Start local Supabase
npx supabase stop        # Stop local Supabase
npm run gen:types        # Generate TypeScript types from DB schema
```

## Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth pages (login, register)
│   ├── (dashboard)/        # Protected dashboard pages by org type
│   │   ├── manufacturer/   # Manufacturer pages
│   │   ├── distributor/    # Distributor pages
│   │   ├── hospital/       # Hospital pages
│   │   └── admin/          # Admin pages
│   └── auth/callback/      # Supabase auth callback
├── components/
│   ├── ui/                 # shadcn/ui base components
│   ├── forms/              # Form components with react-hook-form
│   ├── tables/             # Data table components
│   ├── layout/             # Layout components (DashboardLayout, Header)
│   └── shared/             # Shared components (StatCard, DataTable, CartDisplay)
├── services/               # Business logic (server-side)
├── lib/
│   ├── supabase/           # Supabase client setup (client, server, admin)
│   ├── validations/        # Zod validation schemas
│   └── utils/              # Domain-split utilities (ui, date, time, format, csv, validation)
├── types/
│   ├── api.types.ts        # API response types
│   ├── forms.types.ts      # Form data types (inferred from Zod)
│   └── database.types.ts   # Generated from Supabase
├── constants/              # Constants (routes, navigation, messages)
└── hooks/                  # Custom hooks (useCart, useInfiniteScroll)

supabase/
├── migrations/             # SQL migrations (timestamped, 100+ files)
└── seed.sql                # Seed data for testing

tests/
├── setup.ts                # Test setup
├── helpers/                # Test utilities and factories
├── unit/                   # Unit tests
└── integration/            # Integration tests (uses real Supabase)

e2e/                        # Playwright E2E tests
├── fixtures/               # Auth fixtures
└── *.spec.ts               # Test specs by role
```

### Key Patterns

**SSOT (Single Source of Truth)**
- Constants in `src/constants/` for routes, navigation, messages
- Types in `src/types/` derived from Zod schemas and database types
- Validation schemas in `src/lib/validations/`

**Service Layer Pattern**
- All database operations go through `src/services/*.service.ts`
- Services use `createClient()` from `@/lib/supabase/server` for server-side operations
- Return `ApiResponse<T>` type with `success` flag and either `data` or `error`
- Use SSOT helpers from `common.service.ts`: `createSuccessResponse()`, `createErrorResponse()`, `handlePostgrestError()`

**Server Actions**
- Located in `src/app/(dashboard)/*/actions.ts` per route group
- Wrap service calls with auth checks and error handling

**Type Flow**
```
Zod Schema → Form Types (forms.types.ts) → Service Input
Database Types (generated) → API Types (api.types.ts) → Service Output
```

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useCart()` | Session-scoped cart state for shipment/treatment flows |
| `useAuth()` | User, organization, and manufacturerSettings state with auth subscription |
| `useInfiniteScroll()` | Intersection Observer for triggering pagination loads |
| `useCursorPagination()` | High-performance cursor-based pagination for large datasets (10K+ rows) |

### Common Service Utilities

Use these helpers from `common.service.ts` for consistency:

**Response Builders:**
- `createSuccessResponse<T>(data)`, `createErrorResponse(code, message, details?)`
- `createUnauthorizedResponse()`, `createForbiddenResponse()`, `createNotFoundResponse()`

**Error Handling:**
- `handlePostgrestError(error)` - Maps PostgreSQL error codes (e.g., 23505 → DUPLICATE_ENTRY)
- `handleGenericError(error)` - Catches generic JS errors
- `ERROR_CODES` constant for standardized error codes

**RPC Validation:**
- `parseRpcResult<T>(schema, data, context)` - Zod validation for RPC results
- `parseRpcArray<T>()`, `parseRpcSingle<T>()` - Convenience wrappers
- Schemas in `src/lib/validations/rpc-schemas.ts`

**Organization Helpers:**
- `getOrganizationName(id, cache?)`, `getOrganizationNames(ids)` - With caching for batch queries
- `createOrganizationNameCache()` - Request-scoped deduplication

**Privacy:**
- `maskPhoneNumber()`, `maskEmail()` - PII masking for display

### Supabase Clients

| Client | Import | When to Use |
|--------|--------|-------------|
| `createClient()` | `@/lib/supabase/server` | Server-side with RLS (respects user permissions) |
| `createAdminClient()` | `@/lib/supabase/admin` | Admin operations bypassing RLS |
| `createBrowserClient()` | `@/lib/supabase/client` | Client-side (browser) operations |

### Performance Patterns

- **Cursor Pagination**: Use `useCursorPagination()` + `get_history_summary()` for datasets >1000 rows
- **Virtual Tables**: Use `VirtualDataTable` (TanStack Virtual) for rendering 10K+ rows efficiently
- **N+1 Prevention**: Use `getOrganizationNames()` bulk fetch with caching instead of individual queries
- **Memoization**: Memoize column definitions (`useMemo`) and row keys in table components
- **FIFO Locking**: DB uses `FOR UPDATE SKIP LOCKED` for concurrent shipment safety

### Database Functions (PostgreSQL)

Key functions across `supabase/migrations/`:
- `select_fifo_codes()`: FIFO-based virtual code selection with `FOR UPDATE SKIP LOCKED`
- `is_recall_allowed()`: 24-hour recall window validation
- `get_inventory_count()` / `get_inventory_by_lot()` / `get_inventory_by_lots_bulk()`: Inventory queries
- `generate_virtual_code()`: Unique code generation (format: NC-XXXXXXXX)
- `generate_lot_number()`: Lot number generation based on manufacturer settings
- `create_shipment_atomic()`: Atomic shipment creation with FIFO selection
- `get_dashboard_stats_*()`: Role-specific dashboard statistics
- `get_admin_event_summary()`: Admin event history aggregation
- `get_history_summary()`: Organization history with cursor-based pagination

### Organization Types and Routes

| Type | Route Prefix | Main Features |
|------|--------------|---------------|
| MANUFACTURER | `/manufacturer/*` | Products, Production, Shipment, Settings |
| DISTRIBUTOR | `/distributor/*` | Shipment, Inventory |
| HOSPITAL | `/hospital/*` | Treatment, Inventory |
| ADMIN | `/admin/*` | Organizations, Approvals, History |

### Business Rules

- **Immediate Transfer**: All shipments transfer ownership instantly (no pending state)
- **24-Hour Recall**: Sender can recall within 24 hours with mandatory reason
- **FIFO Processing**: Oldest lot items shipped first (manufacturer can optionally select lot)
- **Virtual Codes**: DB-managed codes for statistical tracking (not physical individual tracking)
- **1 Organization = 1 Account**: Single shared account per organization

## Testing

### Unit/Integration Tests (Vitest)

Integration tests require local Supabase running:
```bash
npx supabase start
npm run test:integration
```

Tests use `tests/helpers/test-data-factory.ts` for creating test fixtures and `tests/helpers/cleanup.ts` for cleanup between tests.

### E2E Tests (Playwright)

E2E tests run against the dev server with seed data accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@neocert.com | admin123 |
| Manufacturer | manufacturer@neocert.com | test123 |
| Distributor | distributor@neocert.com | test123 |
| Hospital | hospital@neocert.com | test123 |

Tests run sequentially (`workers: 1`) to preserve DB state.

## Deployment

- **Production**: https://neo-certify-20251205.vercel.app
- **Local**: http://localhost:3000

## Path Aliases

Use `@/*` for imports from `src/`:
```typescript
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types/api.types';
```

## Critical Guidelines

### Context Memory Management

**IMPORTANT**: 작업 중 context memory가 부족하다고 예상되면:
1. **절대로** 작업을 임의로 축약하거나 우회하여 진행하지 않습니다
2. 작업을 즉시 중단하고 사용자에게 memory 부족 상황을 보고합니다
3. 완료된 작업과 남은 작업을 명확히 정리하여 사용자에게 전달합니다

### Type Safety and Workarounds

**금지 사항**: 타입 오류를 우회하기 위해 다음 방법을 사용하지 않습니다:
- `any` 타입 캐스팅 (`as any`)
- `// @ts-ignore` 또는 `// @ts-expect-error` 주석
- `eslint-disable` 주석으로 타입 관련 규칙 비활성화

**올바른 해결책**:
1. **새 RPC 함수 추가 시**: `npm run gen:types`로 database.types.ts 재생성
2. **타입 불일치 시**: 실제 타입 정의를 수정하거나 확장
3. **해결이 어려운 경우**: 사용자에게 상황을 설명하고 지침을 요청

```bash
# RPC 함수 추가 후 타입 재생성
npx supabase start  # 로컬 Supabase 실행 필요
npm run gen:types   # database.types.ts 자동 생성
```
