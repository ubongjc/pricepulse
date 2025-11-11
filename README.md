# PricePulse

Receipt-level inflation diary to track grocery prices, compare with neighborhood averages, and discover money-saving product swaps.

## Overview

PricePulse helps consumers:

- 📸 **Scan Receipts**: Capture and digitize grocery receipts
- 📊 **Track Inflation**: Monitor price changes over time
- 🏪 **Compare Locally**: See how your prices compare to neighborhood averages
- 💰 **Save Money**: Get recommendations for cheaper alternatives
- 🔒 **Stay Private**: Client-side encryption keeps your data secure

## Architecture

This monorepo contains two applications:

### Web Application (`pricepulse_web/`)

- **Framework**: Next.js 15 + TypeScript
- **Database**: PostgreSQL + Prisma + pgvector
- **Storage**: Cloudflare R2
- **Auth**: Clerk (passkeys/WebAuthn)
- **Payments**: Stripe

[→ Web Documentation](./pricepulse_web/README.md)

### iOS Application (`pricepulse_ios/`)

- **Framework**: SwiftUI + Combine
- **Security**: CryptoKit (AES-GCM-256)
- **Camera**: AVFoundation + Vision
- **Auth**: AuthenticationServices (passkeys)

[→ iOS Documentation](./pricepulse_ios/README.md)

## Key Features

### Privacy-First Architecture

- **Client-Side Encryption**: Receipt images encrypted on-device before upload
- **Zero-Knowledge**: Server never sees plaintext sensitive data
- **K-Anonymity**: Public statistics preserve user privacy
- **GDPR Compliant**: Data export and deletion built-in

### Smart Price Tracking

- **OCR Processing**: Automatic receipt data extraction
- **Normalization**: Handle shrinkflation by normalizing unit sizes
- **Benchmarking**: Crowd-sourced price data by postal code
- **Suggestions**: ML-powered recommendations for savings

### Secure Authentication

- **Passkey-First**: WebAuthn biometric authentication
- **Magic Links**: Email fallback for compatibility
- **Role-Based Access**: ABAC for fine-grained permissions

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 16+ with pgvector
- Xcode 15+ (for iOS development)
- Clerk account
- Cloudflare R2 bucket
- Stripe account

### Quick Start

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/pricepulse.git
cd pricepulse
```

2. **Set up the web application**

```bash
cd pricepulse_web
npm install
cp .env.example .env
# Edit .env with your configuration
npm run db:push
npm run dev
```

3. **Set up the iOS application**

```bash
cd ../pricepulse_ios
open Package.swift
# Configure backend URL in NetworkManager.swift
# Build and run in Xcode
```

## Project Structure

```
pricepulse/
├── pricepulse_web/          # Next.js web application
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   ├── lib/                 # Utilities and clients
│   ├── prisma/              # Database schema
│   └── README.md
├── pricepulse_ios/          # SwiftUI iOS application
│   ├── PricePulse/
│   │   ├── App/            # App entry point
│   │   ├── Features/       # Feature modules
│   │   ├── Modules/        # Shared functionality
│   │   └── Models/         # Data models
│   └── README.md
└── README.md                # This file
```

## Data Model

### Core Entities

- **User**: Account with role and preferences
- **Receipt**: Receipt record with metadata
- **LineItem**: Individual product on receipt
- **Benchmark**: Aggregated price data by location
- **Entitlement**: Feature access and billing

### Privacy Features

- Client-side encryption keys (device keychain)
- Optional anonymous data sharing
- Hashed merchant identifiers
- K-anonymous statistics

## API Overview

### Authentication

- Passkey-based WebAuthn
- JWT tokens for session management
- Role-based access control

### Core Endpoints

- `POST /api/receipt/ingest` - Upload encrypted receipt
- `GET /api/receipts` - List user receipts
- `GET /api/basket/compare` - Compare prices
- `GET /api/swap/suggest` - Get money-saving suggestions

### Privacy Endpoints

- `POST /api/user/export` - Request data export
- `DELETE /api/user` - Delete all user data
- `PATCH /api/user` - Update privacy preferences

## Monetization

- **Free Tier**: Basic receipt tracking
- **Premium**: Advanced analytics, unlimited history
- **Analytics Dashboards**: For retailers (B2B)
- **Affiliate**: Product recommendations with commission

## Security

### Encryption

- **Algorithm**: AES-GCM-256
- **Key Storage**: Device keychain with biometric protection
- **Key Rotation**: Per-receipt unique keys
- **Transport**: TLS 1.3 only

### Authentication

- **Primary**: WebAuthn/Passkeys
- **Fallback**: Magic links via email
- **Session**: JWT with short expiry
- **MFA**: Built-in via biometrics

### Compliance

- GDPR-compliant data handling
- Right to erasure implemented
- Data portability supported
- Privacy by design principles

## Development

### Web Development

```bash
cd pricepulse_web
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # Lint code
npm run db:studio  # Database GUI
```

### iOS Development

```bash
cd pricepulse_ios
swift build        # Build project
swift test         # Run tests
```

## Deployment

### Web (Vercel)

```bash
cd pricepulse_web
vercel deploy
```

### iOS (App Store)

1. Archive build in Xcode
2. Upload to App Store Connect
3. Submit for review

## License

Copyright © 2024 PricePulse. All rights reserved.

## Support

- Documentation: [docs.pricepulse.app](https://docs.pricepulse.app)
- Issues: [GitHub Issues](https://github.com/yourusername/pricepulse/issues)
- Email: support@pricepulse.app