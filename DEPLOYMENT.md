# SmallLet — Deployment Guide

## Quick Deploy (5 Minutes)

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Stripe account
- Vercel account (or any Node.js hosting)

### Step 1: Clone & Install
```bash
git clone <your-repo-url>
cd smalllet
npm install
```

### Step 2: Environment Variables
```bash
cp .env.example .env
```

Fill in your `.env`:
```env
# Required
DATABASE_URL="postgresql://user:password@host:5432/smalllet?schema=public"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-32-char-secret-key-here!!!"

# Stripe (required for payments)
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_MONTHLY="price_..."
STRIPE_PRICE_ID_YEARLY="price_..."

# Optional
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
RESEND_API_KEY="re_..."
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""
APP_URL="https://your-domain.com"
```

### Step 3: Database Setup
```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### Step 4: Stripe Webhooks (Production)
In Stripe Dashboard:
1. Go to Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### Step 5: Build & Deploy
```bash
npm run build
```

**Vercel (Recommended):**
```bash
npm i -g vercel
vercel --prod
```

Add environment variables in Vercel Dashboard → Settings → Environment Variables.

**Railway/Render:**
- Connect GitHub repo
- Add environment variables
- Deploy automatically

---

## Detailed Deployment

### 1. Database Setup

#### Option A: Vercel Postgres
```bash
vercel postgres create
# Copy connection string to DATABASE_URL
```

#### Option B: Supabase
1. Create project at supabase.com
2. Copy connection string (use pooled connection)
3. Add `?pgbouncer=true&connection_limit=1` to URL

#### Option C: Railway
```bash
railway add --database postgres
# Copy connection string
```

#### Option D: Self-Hosted
```bash
# Docker
docker run -d   --name smalllet-db   -e POSTGRES_USER=smalllet   -e POSTGRES_PASSWORD=yourpassword   -e POSTGRES_DB=smalllet   -p 5432:5432   postgres:15
```

### 2. Stripe Configuration

#### Products & Prices
1. Go to Stripe Dashboard → Products
2. Create product: "SmallLet Starter"
3. Add price: $19/month (recurring)
4. Copy Price ID to `STRIPE_PRICE_ID_MONTHLY`
5. Create product: "SmallLet Pro"
6. Add price: $49/month (recurring)
7. Copy Price ID to `STRIPE_PRICE_ID_YEARLY`

#### Webhook Setup
```bash
# Local development
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy webhook signing secret
```

### 3. Google OAuth (Optional)
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`
4. Copy Client ID and Secret to env vars

### 4. UploadThing (Optional)
1. Go to uploadthing.com
2. Create app
3. Copy API key and App ID to env vars

### 5. Resend (Optional)
1. Go to resend.com
2. Get API key
3. Verify domain
4. Copy API key to env vars

### 6. Environment Validation

The app validates all required environment variables on startup. If any are missing, you'll see:
```
❌ Invalid environment variables:
   DATABASE_URL: Required
   NEXTAUTH_SECRET: Required
```

### 7. Build Configuration

**next.config.js** already includes:
- Security headers
- Image domains
- Stripe webhook CORS

**No changes needed** for standard deployment.

### 8. Cron Jobs

**Vercel:**
The `vercel.json` includes a daily cleanup job at 2 AM UTC.

**Other platforms:**
Set up a cron job to hit:
```
POST https://your-domain.com/api/admin/cleanup
Header: x-cron-secret: YOUR_CRON_SECRET
```

### 9. SSL/HTTPS

Required for:
- Stripe webhooks
- Secure cookies
- HSTS headers

**Vercel:** Automatic SSL
**Custom server:** Use Let's Encrypt

### 10. Monitoring

Recommended tools:
- **Vercel Analytics**: Built-in
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **UptimeRobot**: Uptime monitoring

---

## Post-Deployment Checklist

- [ ] Database migrations applied
- [ ] Seed data loaded
- [ ] Stripe webhooks configured
- [ ] Environment variables set
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] Email sending verified
- [ ] File uploads working
- [ ] Payment flow tested
- [ ] Admin dashboard accessible
- [ ] Backup job scheduled
- [ ] Cleanup job scheduled
- [ ] Demo credentials working
- [ ] Mobile responsive verified
- [ ] Dark mode working

---

## Scaling Considerations

### Database
- Use connection pooling (PgBouncer)
- Enable read replicas for reporting
- Set up automated backups

### File Storage
- UploadThing handles scaling automatically
- For self-hosted: use S3/CloudFront

### Performance
- Enable Vercel Edge Network
- Use Next.js Image optimization
- Enable React Query caching

### Security
- Rotate secrets quarterly
- Enable 2FA for admin accounts
- Review audit logs weekly
- Update dependencies monthly

---

## Troubleshooting

### Build Errors
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection
```bash
# Test connection
npx prisma db pull
```

### Stripe Webhook Failures
- Check webhook URL is correct
- Verify signing secret
- Check Stripe dashboard for failed events

### Email Not Sending
- Verify Resend API key
- Check domain verification
- Review spam folders

---

## Support

For deployment issues:
1. Check logs: `vercel logs --all`
2. Review `SECURITY.md` for security config
3. Check `DATA_MANAGEMENT.md` for data ops
4. Open issue on GitHub

---

**Ready to deploy?** Run `vercel --prod` and you're live!
