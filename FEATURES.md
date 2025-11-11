# PricePulse - Features Documentation

**Version:** 1.1.1
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
- **Restaurant Tracking**: Monitor menu prices at McDonald's, Chick-fil-A, and more
- **Delivery Platform Integration**: Compare prices across Instacart, Uber Eats, DoorDash, etc.
- **Smart Cart**: Add items to cart for online ordering on your preferred platform
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

### 16. Delivery Platform Integration

**Description**: Shop online through your favorite delivery platforms.

**Supported Platforms**:
- **Grocery**: Instacart, Amazon Fresh, Walmart+, Shipt
- **Restaurant**: Uber Eats, DoorDash, Grubhub, Skip The Dishes
- **Both**: Postmates, Deliveroo, Just Eat, Menulog

**Features**:
- **Platform Comparison**: Compare same product across all platforms
- **Markup Transparency**: See platform markup vs in-store prices
- **Fee Calculator**: Show delivery + service fees for each platform
- **Deep Linking**: Tap to open item in platform's app
- **Cart Management**: Add items to cart for online ordering
- **Best Platform**: Automatically suggest cheapest platform for your order

**Platform-Specific Details**:
- Delivery fee ranges
- Service fee percentages
- Minimum order requirements
- App download links (iOS & Android)
- Direct deep links (e.g., instacart://product/123)

**Price Tracking**:
- Track platform-specific prices
- Compare platform markup over time
- Identify best platform for different products
- Historical price data per platform

### 17. Restaurant Price Tracking

**Description**: Monitor menu prices at major restaurant chains.

**Supported Restaurants** (12+):
- **Fast Food**: McDonald's, Burger King, Wendy's, Taco Bell, KFC, Popeyes
- **Fast Casual**: Chick-fil-A, Chipotle, Subway
- **Cafe**: Starbucks
- **Pizza**: Pizza Hut, Domino's

**Features**:
- **Menu Item Search**: Find specific items (e.g., "Big Mac", "Chicken Sandwich")
- **Restaurant Comparison**: Compare prices for same item across chains
- **Inflation Tracking**: Monitor how menu prices change over time
- **Category Browsing**: Browse by burgers, chicken, sides, drinks, desserts
- **Calorie Information**: See nutritional info alongside prices
- **Platform Availability**: See which delivery platforms offer each restaurant

**Restaurant Analytics**:
- **Inflation Rates**: Compare inflation at McDonald's vs Chick-fil-A
- **Price Trends**: Track how Big Mac prices change over months
- **Best Value**: Find cheapest options for similar items
- **Regional Differences**: Compare prices in different locations

**Example Insights**:
- "McDonald's prices up 5.2% in last 30 days"
- "Chick-fil-A has lowest inflation rate (2.1%)"
- "Big Mac currently $5.69, up from $5.39 last month"
- "Save $1.20 by ordering from Taco Bell instead of McDonald's"

### 18. Smart Cart System

**Description**: Build shopping carts for online ordering with price optimization.

**Features**:
- **Multi-Platform Carts**: Create separate carts for different platforms
- **Auto-Pricing**: Automatically fetch current prices from platforms
- **Fee Calculation**: Show delivery fees, service fees, and total cost
- **Cart Optimization**: Suggest best platform based on your cart
- **Save for Later**: Keep items in cart across sessions
- **Platform Switching**: Compare total cost across platforms
- **Send to App**: One-click to open platform app with your items (see below)

**Cart Management**:
- Add grocery products or restaurant menu items
- Update quantities
- Apply customizations (for restaurant items)
- View itemized subtotal, fees, and total
- Clear or complete cart

**Platform Comparison**:
```
Your Cart: 5 items

Instacart:      $45.20 + $5.99 delivery + $2.26 service = $53.45
Uber Eats:      $47.10 + $3.99 delivery + $7.07 service = $58.16
DoorDash:       $46.50 + $4.99 delivery + $5.12 service = $56.61

Best Option: Instacart (Save $2.71)
```

**Send to App Feature**: Click "Send to App" button to automatically open the delivery platform app with your cart items ready to order (see Feature #21 for details).

### 19. Location-Based Restaurant Search

**Description**: Find restaurants near you with pricing info.

**Features**:
- **GPS Search**: Find restaurants within specified radius
- **Map View**: See restaurant locations on interactive map
- **Platform Availability**: Which delivery platforms serve each location
- **Delivery Options**: Delivery vs pickup availability
- **Distance**: Show distance from current location
- **Hours**: Opening hours and current status

**Use Cases**:
- "Find cheapest McDonald's near me"
- "Which locations are on Uber Eats?"
- "Show all fast food within 5km"

### 20. Menu Item Price History

**Description**: Track how restaurant prices change over time.

**Features**:
- **90-Day History**: See price changes up to 3 months back
- **Trend Charts**: Visualize price movements
- **Inflation Rates**: Calculate percentage increases
- **Platform-Specific**: Track prices on each delivery platform
- **Price Alerts**: Get notified when menu item prices change

**Example**:
```
Big Mac Price History (Last 90 days)

Jan 2024: $5.29
Feb 2024: $5.39 (+1.9%)
Mar 2024: $5.69 (+5.6%)

Platform Comparison:
- In-store:    $5.69
- Uber Eats:   $6.49 (+14.1%)
- DoorDash:    $6.29 (+10.5%)
- Grubhub:     $6.39 (+12.3%)
```

### 21. Send to App Feature (One-Click Cart Population)

**Description**: Seamlessly transfer your shopping cart from PricePulse to delivery platform apps.

**How It Works**:

When you click "Send to [Platform] App", PricePulse uses multiple intelligent methods to help you complete your order:

**Method 1: API Integration (Best Experience)** ✅
- For platforms with API access (currently Instacart)
- Requires one-time OAuth connection
- Automatically adds all items to your cart in the app
- No manual work needed - just click checkout!

**Method 2: Deep Linking** ✅
- Opens the platform app directly on your device
- Takes you to the store/restaurant you selected
- Shows clear instructions for adding each item
- Works for: Instacart, Uber Eats, DoorDash, Grubhub, and more

**Method 3: Web URL** ✅
- Opens platform website if app not installed
- Direct link to store or restaurant
- Shopping list provided for easy reference

**Method 4: Clipboard Copy** ✅
- Copies your shopping list to clipboard
- Step-by-step instructions provided
- Works as universal fallback

**Supported Scenarios**:

**Example 1: Grocery Shopping**
```
You've built a cart with:
- 1 Banana (from Walmart on Instacart)
- 1 Apple (from Loblaws on Instacart)

1. Click "Send to Instacart"
2. App opens to Walmart
3. Instructions show: "Add 1 banana, then switch to Loblaws for 1 apple"
4. Complete checkout in Instacart
```

**Example 2: Restaurant Orders**
```
You've built a cart with:
- Big Mac from McDonald's (via Uber Eats)
- Fries from McDonald's (via Uber Eats)

1. Click "Send to Uber Eats"
2. App opens to McDonald's menu
3. Instructions show items to add
4. Complete checkout in Uber Eats
```

**Example 3: Mixed Orders (Advanced)**
```
PricePulse helps you split orders intelligently:

Cart A (Instacart - Walmart): Banana
Cart B (Uber Eats - McDonald's): Big Mac

Each cart has a "Send to App" button for its respective platform.
```

**Platform Account Connection** (Optional):

For the best experience with supported platforms:

1. Go to Settings → Connected Platforms
2. Click "Connect [Platform] Account"
3. Authorize PricePulse via OAuth
4. Now "Send to App" can automatically populate your cart!

**Currently Supported**:
- **API Integration**: Instacart (with connected account)
- **Deep Linking**: All 12 platforms
- **Web URLs**: All platforms with websites

**Coming Soon**:
- Uber Eats API integration
- DoorDash API integration
- Automatic multi-store cart splitting
- Browser extension for one-click population

**Security & Privacy**:
- OAuth tokens encrypted at rest
- You control which platforms to connect
- Disconnect anytime from Settings
- We never store your platform passwords
- All API calls use secure, authorized endpoints

**Technical Details**:

Deep link formats we support:
```
Instacart:     instacart://store/{store_id}
               instacart://product/{product_id}

Uber Eats:     ubereats://restaurant/{restaurant_id}
               ubereats://item/{menu_item_id}

DoorDash:      doordash://store/{store_id}
               doordash://item/{item_id}

Grubhub:       grubhub://restaurant/{restaurant_id}
```

iOS and Android app IDs tracked for App Store/Play Store deep linking.

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
GET    /api/analytics/dashboard           - Get dashboard metrics
GET    /api/analytics/spending            - Get spending analysis
GET    /api/analytics/trends              - Get price trends
GET    /api/analytics/inflation/stores    - Compare store inflation
GET    /api/analytics/inflation/product   - Product-specific inflation
GET    /api/analytics/inflation/restaurants - Compare restaurant inflation
```

#### Cart Management

```
POST   /api/cart                    - Create new cart
GET    /api/cart                    - Get all active carts
GET    /api/cart/:id                - Get cart summary
DELETE /api/cart/:id                - Cancel cart
POST   /api/cart/:id/items          - Add item to cart
PATCH  /api/cart/items/:itemId      - Update item quantity
DELETE /api/cart/items/:itemId      - Remove item from cart
POST   /api/cart/:id/complete       - Mark cart as completed
POST   /api/cart/:id/clear          - Clear all items from cart
```

#### Restaurant Tracking

```
GET    /api/restaurants/search      - Search restaurants
GET    /api/restaurants/:id         - Get restaurant details
GET    /api/restaurants/:id/platforms - Get platform availability
GET    /api/restaurants/nearby      - Find restaurants by location
```

#### Menu Items

```
GET    /api/menu-items/search       - Search menu items
GET    /api/menu-items/:id/compare  - Compare item across platforms
GET    /api/menu-items/:id/history  - Get price history
```

#### Delivery Platforms

```
GET    /api/platforms               - List all delivery platforms
POST   /api/platforms/connect       - Connect platform OAuth account
GET    /api/platforms/connect       - Get connected platforms
DELETE /api/platforms/connect/:platformId - Disconnect platform account
```

#### Send to App (Deep Linking)

```
POST   /api/cart/:id/send-to-app    - Send cart to platform app
GET    /api/products/:id/open-in-app - Generate deep link for product
GET    /api/menu-items/:id/open-in-app - Generate deep link for menu item
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

### Version 1.1.1 (2024-11-11)

**Send to App (One-Click Cart Population)**:
- ✅ **One-Click Cart Transfer**: Send cart to platform app with single button click
- ✅ **Multiple Transfer Methods**: API integration, deep linking, web URLs, clipboard
- ✅ **Platform OAuth Connection**: Connect accounts for automatic cart population
- ✅ **Deep Linking**: Open specific products/restaurants in platform apps
- ✅ **Instacart API Integration**: Automatic cart population for connected accounts
- ✅ **All 12 Platforms Supported**: Works with every delivery platform

**New API Endpoints**:
- ✅ Send to App (1 new endpoint)
- ✅ Platform connections (3 new endpoints)
- ✅ Deep linking (2 new endpoints)

**Database Enhancements**:
- ✅ PlatformConnection model for OAuth tokens
- ✅ platformProductId fields for deep linking
- ✅ Encrypted token storage

### Version 1.1.0 (2024-11-11)

**Delivery Platform & Restaurant Tracking**:
- ✅ **Delivery Platform Integration**: Support for 12+ platforms (Instacart, Uber Eats, DoorDash, etc.)
- ✅ **Restaurant Tracking**: Track menu prices at 12 major chains (McDonald's, Chick-fil-A, etc.)
- ✅ **Smart Cart System**: Build carts for online ordering with price optimization
- ✅ **Platform Price Comparison**: Compare same product/menu item across all platforms
- ✅ **Markup Transparency**: See platform markup vs in-store/base prices
- ✅ **Restaurant Inflation**: Track inflation at restaurants (e.g., "McDonald's vs Chick-fil-A")
- ✅ **Menu Item Search**: Search 90+ menu items across restaurants
- ✅ **Location-Based Search**: Find restaurants near you with GPS
- ✅ **Platform Deep Linking**: Direct links to open items in platform apps
- ✅ **Fee Calculator**: Show delivery + service fees for each platform
- ✅ **Menu Item Price History**: 90-day price tracking for restaurant items
- ✅ **Multi-Platform Carts**: Create separate carts for different platforms

**New API Endpoints**:
- ✅ Cart management (8 new endpoints)
- ✅ Restaurant search & tracking (4 new endpoints)
- ✅ Menu item search & comparison (3 new endpoints)
- ✅ Delivery platforms (1 new endpoint)
- ✅ Restaurant inflation analytics (1 new endpoint)

**Database Enhancements**:
- ✅ 11 new database models for delivery platforms and restaurants
- ✅ Platform-specific pricing tables
- ✅ Menu item price history tracking
- ✅ Restaurant location with GPS coordinates
- ✅ Platform availability tracking

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
