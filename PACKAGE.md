# SmallLet Platform Package

## What's Included

A complete, production-ready Property Management SaaS.

### Backend (40 API Routes)
- Authentication, Properties, Units, Tenants
- Leases, Payments, Maintenance, Expenses
- Documents, Messages, Notifications
- Team Management, Compliance, Admin Operations
- Data Export, Backup/Restore

### Frontend (30 Pages)
- Landing page, Auth, Dashboard
- Properties, Tenants, Leases, Maintenance
- Accounting, Documents, Settings
- Tenant Portal, Admin Dashboard (13 pages)

### Database (22 Models)
- Users, Properties, Units, Tenants
- Leases, Payments, Expenses
- Maintenance, Vendors, Documents
- Messages, Notifications, Activity Logs

### Security (15+ Protections)
- bcrypt, JWT, Rate Limiting
- XSS Prevention, SQL Injection Prevention
- CSRF Protection, Security Headers
- Role-Based Access, Audit Trail

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Deploy

```bash
vercel --prod
```

## Demo
- URL: http://localhost:3000
- Email: demo@smalllet.app
- Password: password123

## License

MIT — free for personal and commercial use.
