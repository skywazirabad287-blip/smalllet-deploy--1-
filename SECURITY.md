# SmallLet Security Documentation

## Overview

SmallLet implements defense-in-depth security across all layers of the application. This document outlines the security measures, threat mitigations, and best practices.

## Authentication & Authorization

### JWT Sessions
- **Strategy**: JWT with 30-day expiration
- **Storage**: HTTP-only cookies (handled by NextAuth.js)
- **Refresh**: Automatic via NextAuth session rotation
- **Secret**: Minimum 32-character `NEXTAUTH_SECRET` required

### Multi-Factor Authentication
- Google OAuth 2.0 integration
- Credential-based login with bcrypt hashing (12 rounds)
- Magic link support (via NextAuth email provider)

### Role-Based Access Control (RBAC)
| Role | Permissions |
|------|-------------|
| OWNER | Full access to all properties, team management, billing |
| MANAGER | CRUD on assigned properties, tenants, maintenance |
| VIEWER | Read-only access to assigned properties |
| TENANT | Portal access: pay rent, submit maintenance, view documents |

### Ownership Verification
Every API route verifies the requesting user owns the resource:
```typescript
// Example: Property ownership check
const property = await prisma.property.findFirst({
  where: { id: params.id, landlordId: session.user.id },
});
if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });
```

## Rate Limiting

| Endpoint | Window | Max Requests |
|----------|--------|-------------|
| Auth (signin/signup) | 15 min | 5 attempts |
| Signup | 1 hour | 3 accounts |
| Payments | 1 min | 10 requests |
| Leases | 1 min | 10 requests |
| General API | 1 min | 60 requests |
| Webhooks | 1 min | 100 requests |

Implementation: In-memory store (Redis recommended for production)

## Input Validation & Sanitization

### Zod Schema Validation
All API endpoints validate input with strict Zod schemas:
- Type coercion disabled
- Strict mode enabled
- Custom error messages
- No excess properties allowed

### XSS Prevention
- All text inputs sanitized via `sanitizeString()`
- HTML tags encoded: `<` → `&lt;`, `>` → `&gt;`
- Quotes encoded: `"` → `&quot;`, `'` → `&#x27;`
- XSS pattern detection on all inputs
- Content Security Policy (CSP) headers

### SQL Injection Prevention
- **Prisma ORM** used exclusively (parameterized queries)
- No raw SQL queries in production code
- Input validated before database operations

## Security Headers

All responses include:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; ...
```

## Content Security Policy (CSP)

```
default-src 'self'
script-src 'self' 'unsafe-eval' 'unsafe-inline'
style-src 'self' 'unsafe-inline'
img-src 'self' blob: data: https://*.googleusercontent.com https://utfs.io
font-src 'self'
connect-src 'self' https://api.stripe.com https://uploadthing.com
frame-src 'self' https://js.stripe.com https://hooks.stripe.com
media-src 'self'
object-src 'none'
base-uri 'self'
form-action 'self'
frame-ancestors 'none'
upgrade-insecure-requests
```

## CORS Configuration

```javascript
allowedOrigins: [
  process.env.NEXTAUTH_URL,
  "https://smalllet.app",
  "https://www.smalllet.app",
]
allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
credentials: true
```

## File Upload Security

### UploadThing Integration
- **Max file size**: 16MB (documents), 4MB (images)
- **Allowed types**: JPG, PNG, WebP, PDF
- **Authentication**: Session verification before upload
- **Storage**: Secure cloud storage with signed URLs
- **Validation**: MIME type + extension check on server

### Document Vault
- Files tagged and searchable
- Access control: landlord-only by default
- Tenant access limited to their own documents

## Payment Security

### Stripe Integration
- **PCI Compliance**: Stripe Elements (PCI DSS Level 1)
- **PaymentIntents**: Secure 3D Secure authentication
- **Webhook Verification**: HMAC-SHA256 signature validation
- **No card data stored**: All handled by Stripe
- **Idempotency**: Built into Stripe API calls

### Subscription Management
- Checkout sessions with CSRF protection
- Billing portal for self-service
- Automatic subscription status sync via webhooks
- Graceful handling of payment failures

## Data Protection

### Encryption at Rest
- PostgreSQL with SSL/TLS
- Prisma connection encryption
- Sensitive fields (SSN) encrypted at application layer

### Encryption in Transit
- HTTPS only (HSTS enforced)
- TLS 1.2+ minimum
- Secure cookie flags

### Password Security
- **Hashing**: bcrypt with 12 rounds
- **Complexity**: Minimum 8 characters
- **Storage**: Never store plaintext passwords
- **Reset**: Secure token-based reset (not yet implemented)

## Audit & Monitoring

### Activity Logging
Every action is logged with:
- User ID
- Action type (e.g., PROPERTY_CREATED)
- Entity type and ID
- Before/after snapshots (where applicable)
- IP address and user agent
- Timestamp

### Security Events Logged
- Failed login attempts
- Password changes
- Team member invites/revocations
- Subscription changes
- Payment failures
- Unauthorized access attempts

## Threat Mitigations

| Threat | Mitigation |
|--------|-----------|
| SQL Injection | Prisma ORM (parameterized queries) |
| XSS | Input sanitization + CSP headers |
| CSRF | NextAuth CSRF tokens + SameSite cookies |
| IDOR | Ownership verification on every request |
| Brute Force | Rate limiting on auth endpoints |
| Clickjacking | X-Frame-Options: DENY |
| MIME Sniffing | X-Content-Type-Options: nosniff |
| Session Hijacking | HTTP-only cookies + JWT expiration |
| Mass Assignment | Zod schema validation (strict mode) |
| File Upload Abuse | Type validation + size limits |
| Information Disclosure | Generic error messages |
| Man-in-the-Middle | HTTPS + HSTS |

## Environment Variables

### Required (Production)
```env
DATABASE_URL=postgresql://... (SSL required)
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<32+ char random string>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Optional
```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
RESEND_API_KEY=re_...
UPLOADTHING_SECRET=...
```

## Security Checklist for Deployment

- [ ] Change all default/demo passwords
- [ ] Set strong NEXTAUTH_SECRET (32+ random chars)
- [ ] Enable HTTPS (HSTS preloaded)
- [ ] Configure CORS for production domain only
- [ ] Set up Redis for rate limiting (production)
- [ ] Enable PostgreSQL SSL
- [ ] Configure Stripe webhook endpoints
- [ ] Set up monitoring/alerting
- [ ] Enable audit log rotation
- [ ] Review and restrict team permissions
- [ ] Enable 2FA for admin accounts
- [ ] Set up automated security scans

## Reporting Security Issues

If you discover a security vulnerability, please:
1. Do NOT open a public issue
2. Email security@smalllet.app with details
3. Allow 48 hours for initial response
4. Coordinate disclosure timeline

## Security Updates

This project follows responsible disclosure. Security patches are released as soon as vulnerabilities are confirmed and fixed.

---

Last updated: 2024
