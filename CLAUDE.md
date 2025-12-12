# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Neo-Certify (네오인증서) is a product authentication system for tracking PDO threads (medical devices for aesthetic surgery) from production to final consumption. It provides:
- Virtual identification codes for statistical tracking (physical individual tracking not feasible)
- Role-based access for Manufacturers, Distributors, Hospitals, and Admins
- FIFO-based inventory management with immediate ownership transfer
- 24-hour recall window for shipment errors

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **Validation**: Zod schemas
- **Testing**: Vitest with Testing Library

## Common Commands

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run dev:webpack      # Start dev server (Webpack)

# Type checking and linting
npm run type-check       # TypeScript type check
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix

# Testing
npm test                 # Run Vitest in watch mode
npm run test:run         # Single test run
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only (requires Supabase)
npm run test:coverage    # Run with coverage

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
│   └── validations/        # Zod validation schemas
├── types/
│   ├── api.types.ts        # API response types
│   ├── forms.types.ts      # Form data types (inferred from Zod)
│   └── database.types.ts   # Generated from Supabase
├── constants/              # Constants (routes, navigation, messages)
└── hooks/                  # Custom hooks (useCart, useInfiniteScroll)

supabase/
├── migrations/             # SQL migrations (00001-00017)
└── seed.sql                # Seed data for testing

tests/
├── setup.ts                # Test setup
├── helpers/                # Test utilities and factories
├── unit/                   # Unit tests
└── integration/            # Integration tests (uses real Supabase)
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

**Server Actions**
- Located in `src/app/(dashboard)/*/actions.ts` per route group
- Wrap service calls with auth checks and error handling

**Type Flow**
```
Zod Schema → Form Types (forms.types.ts) → Service Input
Database Types (generated) → API Types (api.types.ts) → Service Output
```

### Database Functions (PostgreSQL)

Key functions in `supabase/migrations/00011_create_functions.sql`:
- `select_fifo_codes()`: FIFO-based virtual code selection with `FOR UPDATE SKIP LOCKED`
- `is_recall_allowed()`: 24-hour recall window validation
- `get_inventory_count()` / `get_inventory_by_lot()`: Inventory queries
- `generate_virtual_code()`: Unique code generation (format: NC-XXXXXXXX)
- `generate_lot_number()`: Lot number generation based on manufacturer settings

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

Integration tests require local Supabase running:
```bash
npx supabase start
npm run test:integration
```

Tests use `tests/helpers/test-data-factory.ts` for creating test fixtures and `tests/helpers/cleanup.ts` for cleanup between tests.

## Path Aliases

Use `@/*` for imports from `src/`:
```typescript
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types/api.types';
```
