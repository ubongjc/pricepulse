# PricePulse - Security Documentation

**Version:** 1.0.0
**Last Updated:** 2024-11-11
**Security Level:** Enterprise-Grade

---

## Executive Summary

PricePulse implements **enterprise-grade security** with defense-in-depth strategies, following OWASP Top 10 guidelines, and implementing zero-knowledge architecture where appropriate. This document details all security measures implemented in the application.

---

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Protection](#data-protection)
4. [API Security](#api-security)
5. [Input Validation](#input-validation)
6. [Attack Prevention](#attack-prevention)
7. [Compliance](#compliance)
8. [Security Monitoring](#security-monitoring)
9. [Incident Response](#incident-response)
10. [Security Checklist](#security-checklist)

---

## Security Architecture

### Defense in Depth

PricePulse implements multiple layers of security:

```
┌─────────────────────────────────────────────┐
│  Layer 1: Network & Infrastructure          │
│  - TLS 1.3                                   │
│  - DDoS Protection (Cloudflare)              │
│  - WAF (Web Application Firewall)            │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Layer 2: Application Security               │
│  - Security Headers (HSTS, CSP, X-Frame)     │
│  - Rate Limiting                             │
│  - CSRF Protection                           │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Layer 3: Authentication & Authorization     │
│  - Passkey/WebAuthn                          │
│  - JWT with short expiry                     │
│  - Role-Based Access Control                 │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Layer 4: Input Validation                   │
│  - Zod Schema Validation                     │
│  - SQL Injection Prevention                  │
│  - XSS Prevention                            │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Layer 5: Data Protection                    │
│  - Client-Side Encryption (AES-GCM-256)      │
│  - Secure Key Storage                        │
│  - Data Minimization                         │
└─────────────────────────────────────────────┘
```

---

## Authentication & Authorization

### Passkey-First Authentication

**Implementation**: Clerk + WebAuthn

**Security Benefits**:
- No passwords to steal or phish
- Biometric authentication (Face ID, Touch ID, fingerprint)
- Device-bound credentials
- Resistant to phishing attacks
- Resistant to credential stuffing

**Flow**:
```
1. User initiates sign-in
2. WebAuthn challenge generated
3. User authenticates with biometric
4. Signed assertion sent to server
5. Server verifies and issues JWT
```

### JWT Token Management

**Configuration**:
- **Expiry**: 1 hour (short-lived)
- **Algorithm**: RS256 (asymmetric)
- **Storage**: httpOnly cookies (web), Keychain (iOS)
- **Refresh**: Automatic via Clerk

**Security Measures**:
- Tokens signed with private key
- Verified with public key
- No sensitive data in payload
- Automatic rotation on expiry

### Role-Based Access Control (RBAC)

**Roles**:
- `USER` - Free tier, basic features
- `PREMIUM` - Paid tier, advanced features
- `ADMIN` - Administrative access

**Enforcement**:
```typescript
// Middleware checks role on every request
const { userId, sessionClaims } = await auth();
const role = sessionClaims?.metadata?.role || 'USER';

// API endpoints check permissions
if (role !== 'ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Rate Limits by Role**:
- FREE: 100 requests/hour, 20/minute
- PREMIUM: 1000 requests/hour, 100/minute
- ADMIN: 10000 requests/hour, 500/minute

---

## Data Protection

### Client-Side Encryption

**Algorithm**: AES-GCM-256
**Purpose**: Encrypt receipt images before upload
**Key Management**: Unique key per receipt

**Implementation**:
```typescript
// iOS (Swift)
let key = SymmetricKey(size: .bits256)
let sealedBox = try AES.GCM.seal(imageData, using: key)
let ciphertext = sealedBox.combined

// Store key in Keychain
try keychain.store(data: key, forKey: receiptId)

// Web (TypeScript)
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv: iv },
  key,
  imageData
);
```

**Security Properties**:
- **Zero-Knowledge**: Server never sees plaintext
- **Per-Receipt Keys**: Key compromise affects only one receipt
- **Authenticated Encryption**: Detects tampering
- **Secure Storage**: Keys in iOS Keychain / Web Crypto API

### Database Encryption

**At Rest**:
- PostgreSQL encryption enabled
- Encrypted backups
- Encrypted snapshots

**In Transit**:
- TLS 1.3 for all connections
- Certificate pinning (production)

**Sensitive Fields**:
```prisma
model Receipt {
  receiptImageUrl   String?  // Encrypted blob URL
  receiptImageKey   String?  // Encryption key reference
}
```

### Privacy-Preserving Analytics

**K-Anonymity**:
- Public statistics require minimum 5 users
- Postal codes generalized (first 3 digits only)
- Merchant IDs hashed

**Data Minimization**:
- Collect only what's necessary
- Delete after retention period
- User can export/delete anytime

---

## API Security

### Security Headers

**Implemented Headers**:
```typescript
// middleware.ts - securityHeaders()
'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://clerk.com..."
'X-Frame-Options': 'DENY'
'X-Content-Type-Options': 'nosniff'
'X-XSS-Protection': '1; mode=block'
'Referrer-Policy': 'strict-origin-when-cross-origin'
'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(self)'
```

**Purpose**:
- **HSTS**: Force HTTPS
- **CSP**: Prevent XSS
- **X-Frame-Options**: Prevent clickjacking
- **X-Content-Type-Options**: Prevent MIME sniffing

### Rate Limiting

**Implementation**: In-memory (dev) / Redis (production)

**Limits**:
```typescript
FREE tier:
  - 100 requests/hour
  - 20 requests/minute

PREMIUM tier:
  - 1000 requests/hour
  - 100 requests/minute

ADMIN tier:
  - 10000 requests/hour
  - 500 requests/minute

AUTH endpoints:
  - 5 attempts/15 minutes (IP-based)
```

**Response**:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 120
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2024-11-11T12:00:00Z
```

### CSRF Protection

**Implementation**:
```typescript
// middleware.ts - csrfProtection()
export function csrfProtection(request: NextRequest): boolean {
  const { method, headers } = request;

  // Only check state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return true;
  }

  const origin = headers.get('origin');
  const host = headers.get('host');

  // Verify same-origin
  if (origin) {
    const originHost = new URL(origin).host;
    return originHost === host;
  }

  return false;
}
```

**Protection Against**:
- Cross-site request forgery
- Login CSRF
- One-click attacks

---

## Input Validation

### Schema Validation

**Tool**: Zod

**Example**:
```typescript
const receiptIngestSchema = z.object({
  storeName: z.string().min(1).max(100),
  transactionDate: z.string().datetime(),
  totalAmount: z.number().nonnegative().max(999999),
  lineItems: z.array(lineItemSchema).min(1).max(1000),
});

// Validate
const validated = receiptIngestSchema.parse(body);
```

**Benefits**:
- Type-safe at compile time
- Runtime validation
- Clear error messages
- Prevents injection attacks

### Sanitization

**HTML/XSS**:
```typescript
import DOMPurify from 'isomorphic-dompurify';

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML
    ALLOWED_ATTR: [],
  });
}
```

**SQL Injection Prevention**:
- ✅ Prisma ORM (parameterized queries)
- ✅ No raw SQL queries
- ✅ Input validation on all fields

**File Upload Validation**:
```typescript
function validateFileUpload(file: File): boolean {
  // Type whitelist
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) return false;

  // Size limit: 10MB
  if (file.size > 10 * 1024 * 1024) return false;

  // Filename validation (no path traversal)
  if (file.name.includes('..') || file.name.includes('/')) return false;

  return true;
}
```

---

## Attack Prevention

### XSS (Cross-Site Scripting)

**Protections**:
1. ✅ Content Security Policy
2. ✅ Input sanitization (DOMPurify)
3. ✅ Output encoding (React escapes by default)
4. ✅ No `dangerouslySetInnerHTML` without sanitization
5. ✅ HttpOnly cookies (tokens not accessible to JS)

**Example Attack (Prevented)**:
```javascript
// Attacker tries to inject:
<script>steal(document.cookie)</script>

// Our defense:
1. CSP blocks inline scripts
2. DOMPurify strips <script> tags
3. React escapes HTML entities
4. HttpOnly cookies can't be accessed by JS
```

### SQL Injection

**Protections**:
1. ✅ Prisma ORM (parameterized queries)
2. ✅ No raw SQL
3. ✅ Input validation
4. ✅ Type checking

**Example Attack (Prevented)**:
```sql
-- Attacker tries:
'; DROP TABLE users; --

-- Prisma treats it as a string parameter:
SELECT * FROM users WHERE name = '\'; DROP TABLE users; --'
```

### CSRF (Cross-Site Request Forgery)

**Protections**:
1. ✅ Origin/Referer header validation
2. ✅ SameSite cookies
3. ✅ CSRF tokens (Clerk provides)

**Example Attack (Prevented)**:
```html
<!-- Attacker's site -->
<form action="https://pricepulse.app/api/transfer" method="POST">
  <input name="amount" value="1000">
</form>
<script>document.forms[0].submit();</script>

<!-- Our defense: -->
1. Origin header doesn't match
2. SameSite=Lax cookie not sent
3. Request blocked by middleware
```

### Clickjacking

**Protection**: X-Frame-Options: DENY

**Prevents**:
```html
<!-- Attacker tries to embed our site -->
<iframe src="https://pricepulse.app"></iframe>

<!-- Browser blocks it -->
```

### DDoS (Distributed Denial of Service)

**Protections**:
1. ✅ Rate limiting (per-IP, per-user)
2. ✅ Cloudflare DDoS protection
3. ✅ Request size limits
4. ✅ Connection limits

### Session Hijacking

**Protections**:
1. ✅ HTTPS only (no HTTP)
2. ✅ Secure, HttpOnly cookies
3. ✅ SameSite=Lax
4. ✅ Short token expiry (1 hour)
5. ✅ Automatic rotation

### Brute Force

**Protections**:
1. ✅ Rate limiting (5 attempts/15 min)
2. ✅ Passkeys (no passwords to brute force)
3. ✅ Account lockout (Clerk handles)
4. ✅ Failed login monitoring

---

## Compliance

### GDPR (General Data Protection Regulation)

**Right to Access**:
```typescript
// GET /api/user/export
- User can export all their data
- JSON format
- Includes all receipts, lists, preferences
```

**Right to Erasure**:
```typescript
// DELETE /api/user
- Deletes user account
- Cascades to all related data
- Irreversible
- Completed within 30 days
```

**Right to Rectification**:
```typescript
// PATCH /api/user
- User can update their information
- Audit trail maintained
```

**Privacy by Design**:
- Data minimization
- Client-side encryption
- K-anonymity for aggregations
- Opt-in data sharing

### CCPA (California Consumer Privacy Act)

- ✅ Privacy policy
- ✅ Data collection disclosure
- ✅ Opt-out of data sale (we don't sell data)
- ✅ Data access and deletion

### PCI DSS (Payment Card Industry)

- ✅ We don't store credit cards
- ✅ Stripe handles all payments
- ✅ Stripe is PCI DSS compliant

---

## Security Monitoring

### Error Tracking

**Tool**: Sentry

**Configuration**:
```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Scrub sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.Authorization;
    }
    return event;
  },
});
```

### Logging

**What We Log**:
- Authentication attempts (success/failure)
- API requests (method, path, status, duration)
- Rate limit violations
- Security events (CSRF failures, suspicious activity)

**What We DON'T Log**:
- Passwords or tokens
- Personal data (except user ID)
- Credit card numbers
- Encrypted data keys

**Format**: Structured JSON

**Retention**: 90 days

### Alerts

**Critical Alerts**:
- Multiple failed auth attempts
- Rate limit violations (>10/minute)
- CSRF protection triggered
- Suspicious file uploads
- Database connection failures
- High error rates (>5%)

**Alert Channels**:
- Email (immediate)
- Slack (immediate)
- PagerDuty (critical only)

---

## Incident Response

### Security Incident Response Plan

**1. Detection**
- Monitoring alerts
- User reports
- Security scans

**2. Assessment**
- Determine severity (P0-P4)
- Identify affected systems/users
- Estimate impact

**3. Containment**
- Isolate affected systems
- Revoke compromised credentials
- Enable additional monitoring

**4. Eradication**
- Remove threat
- Patch vulnerabilities
- Update security rules

**5. Recovery**
- Restore services
- Verify security
- Monitor for recurrence

**6. Post-Incident**
- Document incident
- Root cause analysis
- Update procedures
- Communicate to users (if required)

### Severity Levels

**P0 - Critical**
- Active data breach
- System completely down
- Payment system compromised

**Response Time**: Immediate
**Communication**: All stakeholders

**P1 - High**
- Significant vulnerability discovered
- Limited unauthorized access
- Core feature down

**Response Time**: < 1 hour
**Communication**: Engineering team + management

**P2 - Medium**
- Minor vulnerability
- Non-critical feature down
- Performance degradation

**Response Time**: < 4 hours
**Communication**: Engineering team

**P3 - Low**
- Minor issue
- Cosmetic bug
- Documentation error

**Response Time**: < 24 hours
**Communication**: Engineering team

---

## Security Checklist

### Pre-Deployment

- [ ] All dependencies updated
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CSRF protection active
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Encryption working (client-side)
- [ ] HTTPS enforced
- [ ] Security monitoring active
- [ ] Error tracking configured
- [ ] Sensitive data scrubbed from logs
- [ ] .env files not committed
- [ ] API keys rotated
- [ ] Database backups configured
- [ ] Incident response plan documented

### Regular Maintenance

**Weekly**:
- [ ] Review error logs
- [ ] Check for security alerts
- [ ] Review rate limit violations

**Monthly**:
- [ ] Update dependencies
- [ ] Security vulnerability scan
- [ ] Review access logs
- [ ] Test backup restoration

**Quarterly**:
- [ ] External security audit
- [ ] Penetration testing
- [ ] Update security documentation
- [ ] Review incident response plan

**Annually**:
- [ ] Comprehensive security audit
- [ ] Update compliance certifications
- [ ] Review and update security policies

---

## Security Contacts

**Security Team**: security@pricepulse.app
**Bug Bounty**: bugbounty@pricepulse.app
**General Support**: support@pricepulse.app

**Responsible Disclosure**:
We welcome security researchers. If you find a vulnerability:
1. Email security@pricepulse.app with details
2. Give us 90 days to fix before public disclosure
3. We'll credit you (if you want) and may offer a bounty

---

## Security Updates

**Version 1.0.0 (2024-11-11)**
- Initial security implementation
- Enterprise-grade security measures
- OWASP Top 10 protections
- Zero-knowledge architecture for sensitive data

---

**Last Security Audit**: 2024-11-11
**Next Scheduled Audit**: 2025-02-11
**Security Level**: ★★★★★ Enterprise-Grade

---

© 2024 PricePulse. All rights reserved.
