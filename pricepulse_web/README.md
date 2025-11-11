# PricePulse Web

PricePulse is a receipt-level inflation tracking application that helps users monitor grocery prices, compare with neighborhood averages, and discover money-saving product swaps.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL 16 + Prisma 5 + pgvector
- **Storage**: Cloudflare R2 (S3-compatible)
- **Authentication**: Clerk (passkeys/WebAuthn-first)
- **Payments**: Stripe
- **Monitoring**: Sentry + OpenTelemetry
- **API**: REST with OpenAPI documentation

## Features

- 🔐 **Passkey Authentication**: WebAuthn-first authentication with magic link fallback
- 🧾 **Receipt Ingestion**: Upload and process receipt images with OCR
- 🔒 **Client-Side Encryption**: Sensitive data encrypted before upload
- 📊 **Price Tracking**: Monitor price changes over time
- 🏪 **Neighborhood Comparison**: Compare prices with local averages
- 💰 **Smart Suggestions**: Get recommendations for money-saving swaps
- 📱 **Responsive Design**: Works on desktop and mobile

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 16+ with pgvector extension
- Clerk account for authentication
- Cloudflare R2 bucket for storage
- Stripe account for payments

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and fill in your configuration:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`: Clerk credentials
- `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe credentials
- `R2_*`: Cloudflare R2 configuration
- `SENTRY_DSN`: Sentry DSN for error tracking

3. Set up the database:

```bash
npm run db:push
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
pricepulse_web/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── health/        # Health check endpoint
│   │   └── receipt/       # Receipt management
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility functions
│   ├── db.ts             # Prisma client
│   └── utils.ts          # Helper utilities
├── prisma/               # Database schema
│   └── schema.prisma     # Prisma schema definition
├── middleware.ts         # Clerk authentication middleware
└── next.config.ts        # Next.js configuration
```

## Database Schema

Key models:

- **User**: User accounts with role-based access control
- **Receipt**: Receipt records with metadata
- **LineItem**: Individual items on receipts
- **Benchmark**: Aggregated price benchmarks by postal code
- **Entitlement**: Feature access and billing entitlements
- **DataExportRequest**: GDPR-compliant data export requests

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/receipt/ingest` - Ingest new receipt
- `GET /api/receipts` - List receipts
- `GET /api/receipts/[id]` - Get receipt details
- `DELETE /api/receipts/[id]` - Delete receipt
- `GET /api/user` - Get current user
- `PATCH /api/user` - Update user preferences
- `POST /api/user/export` - Request data export
- `DELETE /api/user` - Delete user account

## Security & Privacy

- **Client-Side Encryption**: Receipt images are encrypted client-side before upload
- **Privacy-First**: Server only stores encrypted ciphertext
- **K-Anonymity**: Public statistics use k-anonymity for privacy
- **Role-Based Access Control**: Fine-grained permissions with ABAC
- **GDPR Compliance**: Data export and deletion capabilities

## Development

```bash
# Run development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Database commands
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
```

## Deployment

This application is designed to be deployed on Vercel with:

- PostgreSQL database (Vercel Postgres, Neon, or Supabase)
- Cloudflare R2 for file storage
- Clerk for authentication
- Stripe for payments
- Sentry for monitoring

## License

Copyright © 2024 PricePulse. All rights reserved.
