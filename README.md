# StockMate — Inventory Management

Professional stock and inventory management web application built for glass businesses. Tracks products, stock levels, purchases, sales, SQMT calculations, and valuations with full transaction history.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend:** Next.js Server Actions, Route Handlers
- **Database:** PostgreSQL with Prisma ORM
- **Validation:** Zod
- **Auth:** NextAuth.js v5
- **Charts:** Recharts
- **Icons:** Lucide React
- **Testing:** Vitest (unit), Playwright (E2E)

## Architecture

```
stockmate/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts               # Development seed data
├── scripts/
│   └── import-excel.ts       # Excel workbook importer
├── src/
│   ├── actions/              # Server Actions (purchases, sales, products, stock)
│   ├── app/                  # Next.js App Router pages
│   │   ├── dashboard/        # Dashboard with stats
│   │   ├── stock/            # Stock listing + product detail
│   │   ├── purchases/        # Purchase CRUD
│   │   ├── sales/            # Sale CRUD
│   │   ├── reports/          # Reports & analytics
│   │   └── settings/         # Product & company management
│   ├── components/
│   │   ├── forms/            # Purchase & sale forms
│   │   ├── layout/           # Shell, navigation
│   │   └── stock/            # Stock filters
│   └── lib/
│       ├── db.ts             # Prisma client singleton
│       ├── stock.ts          # Stock domain logic (SQMT, valuations)
│       ├── utils.ts          # Formatters, helpers
│       └── validations.ts    # Zod schemas
├── tests/
│   ├── unit/                 # Vitest unit tests
│   └── e2e/                  # Playwright E2E tests
├── DOMAIN_DECISIONS.md       # Business logic documentation
└── .env.example              # Environment template
```

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local or remote)

### Setup

```bash
# 1. Clone and install
cd stockmate
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your database URL

# 3. Set up database
npx prisma generate
npx prisma migrate dev --name init

# 4. Seed development data
npm run db:seed

# 5. (Optional) Import Excel data
npm run db:import -- "STOCK REPORT 26-27.xlsx"

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Default Login

```
admin@stockmate.local / admin123
manager@stockmate.local / admin123
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | NextAuth secret (generate with `openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | No | App URL (default: `http://localhost:3000`) |

## Key Domain Logic

### SQMT Calculation

```
SQMT = (Height_cm × Width_cm × Quantity) / 10,000
```

Dimensions are stored in centimeters. The divisor converts cm² to m².

### Stock Valuation

```
SQMT_Rate = MTR_Rate × Thickness_mm
Valuation = SQMT × SQMT_Rate
```

### Stock Movement

Stock is tracked via a ledger of movements:

```
Closing_Stock = Opening_Stock + Purchases - Sales + Adjustments
```

Every purchase and sale creates a `StockMovement` record, enabling:
- Historical reconstruction at any date
- Full auditability
- Future support for adjustments, returns, damage, transfers

## Excel Import

The importer reads `STOCK REPORT 26-27.xlsx` and:

1. Parses CALC sheets for product master data (161 products, 3 companies)
2. Parses monthly sheets for daily transactions (April–September 2026)
3. Creates normalized database records
4. Reconciles DB closing stock against Excel closing stock
5. Reports warnings for any mismatches

```bash
npm run db:import -- "path/to/STOCK REPORT 26-27.xlsx"
```

## Database Schema

### Core Tables

| Table | Purpose |
|---|---|
| `companies` | Glass manufacturers (SGG, GG, ASAHI) |
| `products` | Product catalog with dimensions and rates |
| `stock_openings` | Opening stock per product per month |
| `purchases` / `purchase_items` | Purchase transactions |
| `sales` / `sale_items` | Sale transactions |
| `stock_movements` | Ledger of all stock changes |
| `users` | Authentication |
| `audit_logs` | Change tracking |

### Stock Ledger Design

Rather than storing a mutable "current stock" number, every stock change is recorded as a movement:

- `PURCHASE` — positive sheets/cases
- `SALE` — negative sheets/cases
- `ADJUSTMENT` — corrections
- `RETURN` — customer returns
- `DAMAGE` — damaged stock write-off
- `TRANSFER` — location transfers (future)

This enables historical queries: "What was the stock of product X on July 15th?"

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed development data
npm run db:import        # Import Excel workbook
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests
```

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `DATABASE_URL` — Use a managed PostgreSQL (Neon, Supabase, etc.)
   - `AUTH_SECRET` — Generate a secure random string
4. Vercel auto-detects Next.js and deploys

## Testing

### Unit Tests

Tests verify core business calculations against known workbook values:

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

## License

Private — Internal business application.