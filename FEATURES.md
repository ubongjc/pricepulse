# PricePulse - Features Documentation

**Version:** 1.0.0
**Last Updated:** 2024-11-11
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Advanced Features](#advanced-features)
4. [Security Features](#security-features)
5. [Platform Support](#platform-support)
6. [API Documentation](#api-documentation)
7. [Usage Guide](#usage-guide)
8. [Monetization](#monetization)
9. [Technical Architecture](#technical-architecture)

---

## Overview

PricePulse is a comprehensive grocery price tracking application that helps consumers monitor inflation, compare prices across stores, and save money on everyday purchases.

### Key Differentiators

- **Real-time Price Data**: Updates from major grocery stores twice daily (12am/12pm)
- **Multi-store Comparison**: Track prices across Walmart, Loblaws, Kroger, Target, and more
- **Product-specific Inflation**: See how individual items are trending at different retailers
- **Smart Recommendations**: AI-powered suggestions for where to buy each product cheaper
- **Privacy-first**: Client-side encryption with zero-knowledge architecture
- **Cross-platform**: Native iOS app + responsive web app

---

## Core Features

### 1. Receipt Scanning & OCR

**Description**: Capture and digitize grocery receipts automatically.

**How it works**:
- **Web**: Upload receipt images via drag-and-drop or file picker
- **iOS**: Use camera to scan receipts or select from photo library
- **OCR Processing**: Automatic extraction of store name, date, items, prices, and totals
- **Manual Editing**: Review and correct OCR results before saving

**Technical Details**:
- OCR Engine: Vision API (iOS), Tesseract.js (Web)
- Image preprocessing for better accuracy
- Line item matching with product database
- UPC code recognition

**Security**:
- All receipt images encrypted client-side with AES-GCM-256
- Unique encryption key per receipt stored in keychain/secure storage
- Server only receives encrypted ciphertext

### 2. Price History Visualization

**Description**: Track how prices change over time with interactive charts.

**Features**:
- **Time-series charts**: View price trends for individual products
- **Multiple timeframes**: 7 days, 30 days, 3 months, 6 months, 1 year, all time
- **Comparison view**: Compare multiple products or stores on same chart
- **Inflation rate**: See percentage change from baseline
- **Export data**: Download price history as CSV

**Chart Types**:
- Line charts for time-series data
- Bar charts for store comparisons
- Pie charts for spending categories
- Heat maps for price variations by location

**Interactions**:
- Zoom and pan
- Hover tooltips with detailed information
- Click to drill down into specific time periods
- Filter by product, category, or store

### 3. Store Price Comparison

**Description**: Compare prices for the same product across multiple stores.

**Supported Stores**:
- **US**: Walmart, Target, Kroger, Safeway, Albertsons, Costco, Sam's Club
- **Canada**: Loblaws, Sobeys, Metro, Walmart Canada, Costco Canada
- **UK**: Tesco, Sainsbury's, Asda, Morrisons
- **Australia**: Woolworths, Coles, IGA
- **Global**: Amazon Fresh, Instacart partner stores

**Features**:
- Side-by-side price comparison
- Best price highlighting
- Distance to nearest store location
- Stock availability status
- Price per unit normalization ($/oz, $/kg, etc.)

**Price Data Sources**:
- User-submitted receipts (crowd-sourced)
- Instacart API integration
- Store website scraping (where permitted)
- Partner retailer APIs
- Public pricing datasets

### 4. Product Inflation Tracking

**Description**: Monitor inflation for specific products at different stores.

**Example Insights**:
- "Bananas at Walmart: +12% vs last month"
- "Bananas at Loblaws: +8% vs last month"
- "Milk prices up 15% across all stores in your area"
- "Organic produce: -5% at Target this week"

**Analytics**:
- Product-level inflation rates
- Store-level inflation rates
- Category-level inflation rates
- Regional inflation comparisons
- Historical inflation trends

**Visualizations**:
- Inflation heatmaps by product and store
- Comparative bar charts
- Trend lines with projections
- Anomaly detection (sudden price spikes)

### 5. Smart Store Recommendations

**Description**: AI-powered suggestions for where to buy each product.

**Recommendation Engine**:
- **Best Price**: Cheapest option for each item
- **Best Value**: Considers quality, distance, and savings
- **Route Optimization**: Minimize trips while maximizing savings
- **Shopping List**: Build optimized list across multiple stores
- **Budget Mode**: Stay within budget while getting best prices

**Factors Considered**:
- Current prices at each store
- Historical price trends
- Distance from user location
- Store hours and availability
- Delivery options and fees
- User preferences (organic, brand loyalty, etc.)

**Savings Calculation**:
- "Save $12.50 by buying milk at Store A and bread at Store B"
- "Potential monthly savings: $45.30"
- "Annual savings projection: $543.60"

### 6. Real-time Price Updates

**Description**: Automated price data collection from multiple sources.

**Update Schedule**:
- **Frequency**: Twice daily at 12:00 AM and 12:00 PM (user's timezone)
- **Sources**: Instacart, store APIs, web scraping, user submissions
- **Coverage**: 10,000+ products across 100+ stores
- **Accuracy**: 95%+ accuracy with manual verification

**Data Pipeline**:
```
Data Sources → Scrapers/APIs → Validation → Normalization → Database → User App
```

**Price Change Notifications**:
- Push notifications for items on watchlist
- Email alerts for significant price drops
- Weekly price summary reports

### 7. Shopping List Optimization

**Description**: Create smart shopping lists that save money.

**Features**:
- Add items manually or from favorites
- Import from previous receipts
- Suggest alternatives (generic vs brand)
- Show price comparison for each item
- Route optimization across stores
- Share lists with family members

**Optimization Strategies**:
- **Single Store**: Best prices at one location (convenience)
- **Multi-Store**: Maximum savings across stores
- **Balanced**: Reasonable savings with minimal hassle
- **Delivery**: Include delivery fees in calculations

### 8. Budget Tracking

**Description**: Monitor grocery spending and stay within budget.

**Features**:
- Set monthly/weekly budgets
- Track spending by category
- Compare actual vs budgeted amounts
- Alerts when approaching limits
- Historical spending analysis
- Budget recommendations based on family size

**Insights**:
- "You've spent 75% of this month's budget"
- "Dairy spending up 20% vs last month"
- "You could save $30/month by switching stores"

### 9. Price Alerts

**Description**: Get notified when prices drop or rise significantly.

**Alert Types**:
- **Price Drop**: When a watched item goes on sale
- **Price Spike**: When a regular item increases significantly
- **Threshold**: When price crosses user-defined level
- **Back in Stock**: When out-of-stock item becomes available

**Delivery Methods**:
- Push notifications (mobile)
- Email
- SMS (premium)
- In-app notifications

### 10. Analytics Dashboard

**Description**: Comprehensive view of your grocery spending and savings.

**Metrics**:
- Total spending (month/year)
- Savings achieved vs baseline
- Average inflation rate
- Most expensive categories
- Price volatility by product
- Store loyalty breakdown

**Visualizations**:
- Spending trends over time
- Category breakdown (pie chart)
- Store comparison (bar chart)
- Inflation heatmap
- Savings opportunities

---

## Advanced Features

### 11. Shrinkflation Detection

**Description**: Identify when package sizes decrease while prices stay the same.

**How it works**:
- Track unit size over time
- Normalize prices to standard units ($/oz, $/kg)
- Alert when unit price increases despite stable shelf price
- Show size reduction percentage

**Example**:
- "Chips bag reduced from 12oz to 10oz (-16.7%)"
- "Effective price increase: +20.5%"

### 12. Receipt Organization

**Description**: Automatically categorize and organize receipts.

**Features**:
- Auto-categorization by merchant
- Tags and labels
- Search by store, date, item, or amount
- Filters and sorting
- Archive old receipts
- Export for tax purposes

### 13. Family Accounts

**Description**: Share access with family members.

**Features**:
- Multiple users per account
- Role-based permissions (admin, member, viewer)
- Shared shopping lists
- Aggregated spending across family
- Individual receipt tracking
- Privacy controls

### 14. Loyalty Program Integration

**Description**: Track rewards and maximize benefits.

**Features**:
- Import loyalty card data
- Track points and rewards
- Suggest when to use rewards
- Cashback tracking
- Credit card rewards optimization

### 15. Seasonal Trends

**Description**: Understand how prices fluctuate throughout the year.

**Insights**:
- "Strawberries cheapest in June"
- "Turkey prices spike before Thanksgiving"
- "Back-to-school sales in August"
- Best times to buy specific items

---

## Security Features

### Authentication & Authorization

- **Passkey-first**: WebAuthn biometric authentication
- **Magic Links**: Email-based passwordless login fallback
- **MFA**: Multi-factor authentication via biometrics
- **Session Management**: JWT tokens with short expiry (1 hour)
- **Role-based Access Control**: Admin, Premium, User roles
- **API Key Management**: Secure key rotation

### Data Protection

- **Client-side Encryption**: AES-GCM-256 for receipt images
- **TLS 1.3**: All network traffic encrypted
- **Zero-knowledge**: Server never sees plaintext sensitive data
- **Secure Key Storage**: iOS Keychain, Web Crypto API
- **Key Rotation**: Per-receipt unique encryption keys

### Application Security

- **Input Validation**: Zod schema validation on all inputs
- **SQL Injection Prevention**: Parameterized queries (Prisma ORM)
- **XSS Protection**: Content Security Policy, sanitized outputs
- **CSRF Protection**: SameSite cookies, CSRF tokens
- **Rate Limiting**: Prevent brute force and DoS attacks
- **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options

### Privacy Features

- **K-anonymity**: Public statistics preserve user privacy
- **Opt-in Data Sharing**: Users control what data is shared
- **Anonymous Mode**: Use app without creating account
- **Data Minimization**: Collect only necessary data
- **Right to Erasure**: GDPR-compliant data deletion
- **Data Portability**: Export all user data

### Compliance

- **GDPR**: European data protection compliance
- **CCPA**: California privacy compliance
- **SOC 2**: Security audit ready
- **PCI DSS**: Payment data security (Stripe)
- **HIPAA**: Not applicable (not health data)

---

## Platform Support

### Web Application

**Browsers Supported**:
- Chrome 90+ (desktop and mobile)
- Firefox 88+ (desktop and mobile)
- Safari 14+ (desktop and mobile)
- Edge 90+
- Samsung Internet 14+

**Responsive Breakpoints**:
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px - 1439px
- Large Desktop: 1440px+

**Progressive Web App (PWA)**:
- Installable on home screen
- Offline functionality
- Push notifications
- Background sync

### iOS Application

**Requirements**:
- iOS 17.0+
- iPhone and iPad supported
- Optimized for all screen sizes
- Dark mode support
- Widget support (planned)

**Device Compatibility**:
- iPhone 15 Pro Max / Plus / Standard / Mini
- iPhone 14 series
- iPhone 13 series
- iPhone 12 series
- iPhone 11 series
- iPhone SE (2nd and 3rd gen)
- iPad Pro, Air, Mini
- Optimized for Dynamic Island

### Future Platforms

- **Android**: Native Kotlin app (roadmap)
- **Apple Watch**: Companion app (roadmap)
- **Desktop Apps**: Electron wrapper (planned)

---

## API Documentation

### Authentication

All API requests require authentication via Bearer token:

```
Authorization: Bearer <jwt_token>
```

### Core Endpoints

#### Receipt Management

```
POST   /api/receipt/ingest         - Upload receipt
GET    /api/receipts                - List receipts
GET    /api/receipts/:id            - Get receipt details
PATCH  /api/receipts/:id            - Update receipt
DELETE /api/receipts/:id            - Delete receipt
```

#### Price Tracking

```
GET    /api/prices/product/:upc     - Get price history for product
GET    /api/prices/compare          - Compare prices across stores
GET    /api/prices/inflation        - Get inflation data
GET    /api/prices/alerts           - Get price alerts
POST   /api/prices/alerts           - Create price alert
```

#### Recommendations

```
GET    /api/recommendations/stores  - Get store recommendations
POST   /api/recommendations/list    - Optimize shopping list
GET    /api/recommendations/savings - Get savings opportunities
```

#### Analytics

```
GET    /api/analytics/dashboard     - Get dashboard metrics
GET    /api/analytics/spending      - Get spending analysis
GET    /api/analytics/trends        - Get price trends
```

#### User Management

```
GET    /api/user                    - Get current user
PATCH  /api/user                    - Update user profile
POST   /api/user/export             - Request data export
DELETE /api/user                    - Delete account
```

### Rate Limits

- **Free Tier**: 100 requests/hour
- **Premium Tier**: 1000 requests/hour
- **API Keys**: 10,000 requests/hour

### Webhooks

```
POST   /api/webhooks/stripe         - Stripe payment events
POST   /api/webhooks/clerk          - Clerk auth events
```

---

## Usage Guide

### Getting Started

#### Web Application

1. Visit [pricepulse.app](https://pricepulse.app)
2. Click "Sign In" and create account with passkey
3. Allow camera access for receipt scanning
4. Scan your first receipt
5. Explore price comparisons and insights

#### iOS Application

1. Download from App Store
2. Open app and tap "Create Account"
3. Set up passkey with Face ID or Touch ID
4. Grant camera and photo library permissions
5. Tap camera icon to scan receipt
6. View your dashboard

### Scanning Receipts

**Best Practices**:
- Ensure good lighting
- Flatten receipt to avoid wrinkles
- Capture entire receipt in frame
- Avoid shadows and glare
- Hold camera steady

**What to do after scanning**:
1. Review extracted data
2. Correct any errors
3. Add missing items
4. Confirm store location
5. Save receipt

### Comparing Prices

1. Tap on any product in a receipt
2. View "Price Comparison" tab
3. See prices at nearby stores
4. Filter by distance or price
5. Add to shopping list

### Setting Up Alerts

1. Go to any product page
2. Tap "Create Alert"
3. Choose alert type (price drop, threshold)
4. Set notification preferences
5. Save alert

### Optimizing Shopping Lists

1. Create new shopping list
2. Add items manually or from past receipts
3. Tap "Optimize"
4. Choose optimization strategy
5. View recommended stores
6. Export or share list

### Budget Management

1. Go to Settings → Budget
2. Set monthly budget
3. Choose categories to track
4. Enable budget alerts
5. Monitor spending in dashboard

---

## Monetization

### Free Tier

**Included**:
- Unlimited receipt scanning
- 30 days price history
- Basic price comparisons
- 3 price alerts
- Standard support

**Limitations**:
- Ads displayed
- Limited to 50 receipts stored
- Basic analytics only

### Premium Tier ($9.99/month or $99/year)

**Everything in Free, plus**:
- Ad-free experience
- Unlimited price history
- Advanced analytics
- Unlimited price alerts
- Multi-store route optimization
- Family sharing (up to 5 members)
- Priority support
- CSV export
- API access (1000 req/hour)

### Business Tier ($49/month)

**For retailers and analysts**:
- Everything in Premium
- Advanced API access (10,000 req/hour)
- Custom integrations
- White-label options
- Market intelligence reports
- Dedicated support
- SLA guarantees

### Affiliate Revenue

- Product recommendations with affiliate links
- Commission on purchases
- Store partnerships
- Sponsored listings (clearly marked)

---

## Technical Architecture

### Frontend

**Web**:
- Framework: Next.js 15 (App Router)
- Language: TypeScript 5
- Styling: Tailwind CSS + shadcn/ui
- State: React Context + Zustand
- Charts: Recharts / Chart.js
- Forms: React Hook Form + Zod

**iOS**:
- Framework: SwiftUI
- Architecture: MVVM + Combine
- Navigation: NavigationStack
- Data: Async/await + URLSession
- Persistence: Core Data + UserDefaults

### Backend

**API**:
- Framework: Next.js API Routes
- Runtime: Node.js 18+
- Validation: Zod
- Documentation: OpenAPI 3.0

**Database**:
- Primary: PostgreSQL 16
- Extensions: pgvector (embeddings)
- ORM: Prisma 5
- Caching: Redis
- Search: PostgreSQL Full-text

**Storage**:
- Files: Cloudflare R2 (S3-compatible)
- Encryption: AES-GCM-256 client-side
- CDN: Cloudflare

**Background Jobs**:
- Queue: BullMQ + Redis
- Scheduler: node-cron
- Workers: Separate Node processes

### Infrastructure

**Hosting**:
- Web: Vercel (Edge Network)
- Database: Neon / Supabase
- Storage: Cloudflare R2
- Cache: Upstash Redis

**Monitoring**:
- Errors: Sentry
- Analytics: Plausible (privacy-friendly)
- Logs: Structured JSON → Datadog
- Metrics: OpenTelemetry → Prometheus
- Uptime: Better Uptime

**CI/CD**:
- Version Control: GitHub
- CI: GitHub Actions
- Preview: Vercel previews
- Testing: Jest + Playwright
- Linting: ESLint + Prettier

### External Services

**Authentication**: Clerk (passkeys, magic links)
**Payments**: Stripe (subscriptions, one-time)
**Email**: Resend (transactional)
**SMS**: Twilio (alerts)
**Push**: Firebase Cloud Messaging
**Maps**: Mapbox (store locations)

---

## Changelog

### Version 1.0.0 (2024-11-11)

**Initial Release**:
- ✅ Receipt scanning with OCR
- ✅ Price history tracking
- ✅ Store comparisons
- ✅ Product inflation tracking
- ✅ Smart recommendations
- ✅ Real-time price updates (12am/12pm)
- ✅ Shopping list optimization
- ✅ Budget tracking
- ✅ Price alerts
- ✅ Analytics dashboard
- ✅ Client-side encryption
- ✅ Passkey authentication
- ✅ Responsive design (all devices)
- ✅ iOS native app
- ✅ GDPR compliance
- ✅ Production security hardening

---

## Support & Contact

**Documentation**: [docs.pricepulse.app](https://docs.pricepulse.app)
**Status Page**: [status.pricepulse.app](https://status.pricepulse.app)
**Support Email**: support@pricepulse.app
**Feature Requests**: [GitHub Issues](https://github.com/yourusername/pricepulse/issues)
**Twitter**: [@PricePulseApp](https://twitter.com/PricePulseApp)

---

**© 2024 PricePulse. All rights reserved.**
