# SmallLet — Complete Self-Hosted Deployment Guide

## Data Storage Architecture

### Where YOUR Data Lives

| Data Type | Storage Location | Third Party? |
|-----------|-----------------|--------------|
| **User accounts, passwords** | Your PostgreSQL database | ❌ No |
| **Properties, units, tenants** | Your PostgreSQL database | ❌ No |
| **Leases, payments, expenses** | Your PostgreSQL database | ❌ No |
| **Maintenance requests** | Your PostgreSQL database | ❌ No |
| **Documents (metadata)** | Your PostgreSQL database | ❌ No |
| **Messages, notifications** | Your PostgreSQL database | ❌ No |
| **Activity logs, audit trail** | Your PostgreSQL database | ❌ No |
| **Session tokens** | JWT in HTTP-only cookies (user browser) | ❌ No |
| **File uploads** | UploadThing OR your S3/self-hosted | ⚠️ Optional |
| **Payment processing** | Stripe (required for payments) | ⚠️ Required for payments |
| **Emails** | Resend OR your SMTP server | ⚠️ Optional |
| **Google login** | Google OAuth (optional) | ⚠️ Optional |

### Summary
- **Core data**: 100% in YOUR PostgreSQL database — no third party
- **File uploads**: Can use your own S3 bucket or local storage
- **Payments**: Stripe is required for card processing (PCI compliance)
- **Emails**: Can use your own SMTP server
- **Auth**: Works with just email/password — Google is optional

---

## Option 1: Fully Self-Hosted (No Third Parties Except Stripe)

### Prerequisites
- Linux server (Ubuntu 22.04 recommended)
- Domain name with DNS pointing to your server
- SSL certificate (Let's Encrypt)

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2
```

### Step 2: Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE smalllet;
CREATE USER smalllet_user WITH ENCRYPTED PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE smalllet TO smalllet_user;

# Exit
\q

# Enable remote access (if needed)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Change: listen_addresses = '*'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add: host all all 0.0.0.0/0 scram-sha-256

sudo systemctl restart postgresql
```

### Step 3: Create App Directory

```bash
# Create app directory
sudo mkdir -p /var/www/smalllet
cd /var/www/smalllet

# Set ownership
sudo chown -R $USER:$USER /var/www/smalllet

# Clone or upload your code
git clone <your-repo> .
# OR upload via SCP/FTP
```

### Step 4: Environment Variables

```bash
# Create .env file
nano /var/www/smalllet/.env
```

Add this:
```env
# Database (YOUR server)
DATABASE_URL="postgresql://smalllet_user:your_strong_password_here@localhost:5432/smalllet?schema=public"

# NextAuth (YOUR secret)
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-32-character-random-secret-key-here!!!"

# Stripe (required for payments)
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_MONTHLY="price_..."
STRIPE_PRICE_ID_YEARLY="price_..."

# UploadThing (optional - skip if using local storage)
# UPLOADTHING_SECRET=""
# UPLOADTHING_APP_ID=""

# Email (use your own SMTP instead of Resend)
EMAIL_FROM="SmallLet <noreply@yourdomain.com>"
SMTP_HOST="smtp.yourdomain.com"
SMTP_PORT="587"
SMTP_USER="noreply@yourdomain.com"
SMTP_PASSWORD="your-smtp-password"

# App
APP_URL="https://yourdomain.com"
APP_NAME="SmallLet"

# Security
NODE_ENV="production"
```

### Step 5: Install & Build

```bash
cd /var/www/smalllet

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Build for production
npm run build
```

### Step 6: PM2 Process Manager

```bash
# Create PM2 config
nano /var/www/smalllet/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'smalllet',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/smalllet',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/smalllet/err.log',
    out_file: '/var/log/smalllet/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G'
  }]
};
```

```bash
# Create log directory
sudo mkdir -p /var/log/smalllet

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save
pm2 startup systemd
```

### Step 7: Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/smalllet
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Stripe webhooks
    location /api/webhooks/stripe {
        proxy_pass http://localhost:3000/api/webhooks/stripe;
        proxy_read_timeout 300s;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/smalllet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### Step 9: Stripe Webhooks (Production)

In Stripe Dashboard:
1. Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
4. Copy signing secret to `.env`

### Step 10: Automated Backups

```bash
# Create backup script
sudo nano /usr/local/bin/smalllet-backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/var/backups/smalllet"
DB_NAME="smalllet"
DB_USER="smalllet_user"

mkdir -p $BACKUP_DIR

# Database backup
PGPASSWORD="your_db_password" pg_dump -U $DB_USER -d $DB_NAME | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Keep only last 30 backups
ls -t $BACKUP_DIR/db_*.sql.gz | tail -n +31 | xargs -r rm
```

```bash
sudo chmod +x /usr/local/bin/smalllet-backup.sh

# Add to cron (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/smalllet-backup.sh
```

### Step 11: Final Checks

```bash
# Check app is running
pm2 status

# Check logs
pm2 logs smalllet

# Check database
sudo -u postgres psql -d smalllet -c "SELECT COUNT(*) FROM \"User\";"

# Test website
curl -I https://yourdomain.com
```

---

## Option 2: Vercel (Easiest - 2 Minutes)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Add environment variables in Vercel Dashboard
#    Settings → Environment Variables
#    Add: DATABASE_URL, NEXTAUTH_SECRET, STRIPE keys, etc.

# 5. Set up database (Vercel Postgres or Supabase)
#    Vercel Dashboard → Storage → Create Postgres

# 6. Run migrations
vercel env pull .env.local
npx prisma migrate deploy

# Done! Your app is live.
```

---

## Option 3: Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://smalllet:password@db:5432/smalllet?schema=public
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret-key
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=smalllet
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=smalllet
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

### Deploy with Docker

```bash
# Build and start
docker-compose up -d --build

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Seed data
docker-compose exec app npx prisma db seed

# View logs
docker-compose logs -f app
```

---

## Data Ownership & Privacy

### What YOU Control

| Component | Your Control | Notes |
|-----------|-------------|-------|
| **Database** | 100% | Your PostgreSQL server |
| **User data** | 100% | Stored in your DB |
| **Property data** | 100% | Stored in your DB |
| **Payment records** | 100% | Stored in your DB |
| **File metadata** | 100% | Stored in your DB |
| **Session data** | 100% | JWT in cookies |
| **Application code** | 100% | Runs on your server |
| **Backups** | 100% | You control backup location |

### What Requires Third Parties

| Service | Why Required | Can Replace? |
|---------|-------------|--------------|
| **Stripe** | PCI compliance for card payments | No (legally required) |
| **UploadThing** | File storage | Yes → S3/MinIO/Local |
| **Resend** | Email delivery | Yes → Your SMTP |
| **Google OAuth** | Social login | Yes → Email only |

### Making It 100% Self-Hosted (No Third Parties)

To completely eliminate third parties (except Stripe for payments):

1. **File Storage**: Use local disk or MinIO (self-hosted S3)
   ```env
   # Instead of UploadThing, use local storage
   # Files saved to /var/www/smalllet/uploads/
   ```

2. **Email**: Use your own SMTP server
   ```env
   SMTP_HOST="mail.yourdomain.com"
   SMTP_PORT="587"
   SMTP_USER="noreply@yourdomain.com"
   SMTP_PASSWORD="..."
   ```

3. **Auth**: Use email/password only (disable Google OAuth)
   ```env
   # Remove GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
   ```

4. **Database**: Self-hosted PostgreSQL
   ```env
   DATABASE_URL="postgresql://user:pass@localhost:5432/smalllet"
   ```

### Data Residency

- All core data stays in YOUR database
- Choose database location (US, EU, Asia)
- No data leaves your server except:
  - Payment data → Stripe (encrypted)
  - Emails → Your SMTP server
  - Optional: File uploads → Your S3 bucket

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check app health
curl https://yourdomain.com/api/health

# Check database
sudo -u postgres psql -c "SELECT 1"

# Check disk space
df -h

# Check memory
free -h
```

### Log Rotation

```bash
# Install logrotate
sudo apt install logrotate

# Configure
sudo nano /etc/logrotate.d/smalllet
```

```
/var/log/smalllet/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
}
```

### Updates

```bash
# Update app
cd /var/www/smalllet
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart smalllet
```

---

## Troubleshooting

### App Won't Start
```bash
# Check logs
pm2 logs smalllet

# Check port
sudo lsof -i :3000

# Restart
pm2 restart smalllet
```

### Database Connection Failed
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
psql -U smalllet_user -d smalllet -c "SELECT 1"

# Check firewall
sudo ufw status
```

### 502 Bad Gateway
```bash
# Check if app is running
pm2 status

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check ports
sudo netstat -tlnp | grep 3000
```

### SSL Issues
```bash
# Renew certificate
sudo certbot renew

# Check certificate
openssl s_client -connect yourdomain.com:443
```

---

## Support

For deployment issues:
1. Check logs: `pm2 logs` or `docker-compose logs`
2. Review `DEPLOYMENT.md` for detailed steps
3. Check `SECURITY.md` for security config
4. Open issue on GitHub

---

**Your data. Your server. Your control.**
