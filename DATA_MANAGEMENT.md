# SmallLet Data Management & Recovery

## Overview

SmallLet implements comprehensive data management, storage, and recovery features to ensure data integrity, compliance, and business continuity.

## Data Storage Architecture

### Database
- **Primary**: PostgreSQL (via Prisma ORM)
- **Connection**: SSL/TLS encrypted
- **Schema**: Fully normalized with proper indexes
- **Migrations**: Version-controlled via Prisma Migrate

### File Storage
- **Provider**: UploadThing (cloud-based)
- **Types**: Property photos, tenant documents, maintenance photos
- **Security**: Signed URLs, authenticated uploads
- **Limits**: 16MB per file, validated types

### Session Storage
- **Method**: JWT tokens (stateless)
- **Storage**: HTTP-only cookies
- **Expiry**: 30 days

## Soft Delete System

All critical entities implement soft deletion:

| Entity | Soft Delete | Retention | Recovery |
|--------|-------------|-----------|----------|
| User | ✅ | 30 days | ✅ Admin/User |
| Property | ✅ | 30 days | ✅ Admin/User |
| Unit | ✅ | 30 days | ✅ Admin/User |
| Tenant | ✅ | 30 days | ✅ Admin/User |
| Lease | ✅ | 30 days | ✅ Admin/User |
| Payment | ✅ | 30 days | ✅ Admin/User |
| Maintenance | ✅ | 30 days | ✅ Admin/User |
| Expense | ✅ | 30 days | ✅ Admin/User |
| Document | ✅ | 30 days | ✅ Admin/User |
| Vendor | ✅ (isActive) | Permanent | ✅ Admin |

### How Soft Delete Works

1. **Deletion**: Sets `deletedAt` timestamp and `isDeleted = true`
2. **Filtering**: All queries automatically exclude soft-deleted records
3. **Retention**: Data kept for 30 days
4. **Cleanup**: Daily cron job permanently deletes past-retention data
5. **Recovery**: Users can restore within 30 days

## Data Export (GDPR Compliance)

### User Data Export
- **Endpoint**: `GET /api/data/export`
- **Format**: JSON
- **Includes**: All user data across all entities
- **Purpose**: GDPR Article 20 (Right to data portability)

### CSV Exports
- **Endpoint**: `GET /api/data/export-csv?type={payments|expenses|tenants|leases}`
- **Format**: CSV with headers
- **Use Case**: Tax reporting, accounting imports

## Data Deletion (GDPR Compliance)

### User-Initiated Deletion
- **Endpoint**: `DELETE /api/data/delete`
- **Process**:
  1. Soft delete all user data
  2. Anonymize user record (email → `deleted_{id}@smalllet.app`)
  3. Set 30-day retention timer
  4. Log deletion for audit

### Permanent Deletion (After Retention)
- **Trigger**: Daily cron job at 2 AM UTC
- **Endpoint**: `POST /api/admin/cleanup`
- **Process**:
  1. Find all records with `deletedAt < 30 days ago`
  2. Permanently delete from database
  3. Clean up associated files
  4. Log cleanup results

### Immediate Admin Deletion
- **Endpoint**: `PATCH /api/admin/users` with `action: "force_delete"`
- **Access**: Admin only
- **Warning**: Immediate permanent deletion

## Data Recovery

### User Recovery
- **Endpoint**: `POST /api/data/restore`
- **Window**: 30 days from deletion
- **Scope**: Restore all data or specific entity
- **Process**:
  1. Clear `deletedAt` and `isDeleted` flags
  2. Restore related records
  3. Log recovery for audit

### Admin Recovery
- **Endpoint**: `PATCH /api/admin/users` with `action: "restore"`
- **Access**: Admin only
- **Scope**: Any user account

## Database Backup

### Automated Backups
- **Frequency**: Daily (recommended via cron or Vercel Cron)
- **Format**: PostgreSQL SQL dump (compressed)
- **Retention**: 30 days
- **Storage**: Secure backup directory

### Manual Backup
- **Endpoint**: `POST /api/admin/backup`
- **Access**: Admin only
- **Output**: Compressed SQL file + metadata JSON

### Restore from Backup
- **Endpoint**: `PUT /api/admin/backup`
- **Access**: Admin only
- **Input**: Backup file path
- **Warning**: Overwrites current database

### Backup Utility
```typescript
import { createBackup, restoreBackup, listBackups } from "@/lib/backup";

// Create backup
const result = await createBackup({ compress: true });

// Restore backup
await restoreBackup("./backups/smalllet_backup_2024-01-15.sql.gz");

// List backups
const { backups } = await listBackups();
```

## Admin Dashboard

### Access
- **URL**: `/admin`
- **Requirements**: `LANDLORD` or `OWNER` role
- **Features**:
  - User management (suspend, restore, delete)
  - System statistics
  - Subscription analytics
  - Financial overview
  - Backup management
  - Data cleanup triggers

### User Management Actions
| Action | Endpoint | Effect |
|--------|----------|--------|
| Suspend | `PATCH /api/admin/users` | Disables subscription |
| Restore | `PATCH /api/admin/users` | Reactivates account |
| Force Delete | `PATCH /api/admin/users` | Immediate permanent deletion |
| Change Role | `PATCH /api/admin/users` | Updates user role |

## Data Retention Policies

| Data Type | Retention | Cleanup |
|-----------|-----------|---------|
| Soft-deleted records | 30 days | Daily cron |
| Notifications | 90 days | Daily cron |
| Activity logs | 1 year | Daily cron |
| Sessions | 30 days | JWT expiry |
| Backups | 30 days | Manual |
| File uploads | Linked to record | With record deletion |

## Security Measures

### Data Protection
- **Encryption at rest**: PostgreSQL SSL
- **Encryption in transit**: HTTPS/TLS 1.2+
- **Field-level**: SSN encrypted at application layer
- **File storage**: Signed URLs, authenticated access

### Access Control
- **Ownership verification**: Every query checks `landlordId`
- **Role-based access**: Owner/Manager/Viewer/Tenant
- **Audit logging**: All data changes logged
- **Rate limiting**: Prevents data scraping

## Disaster Recovery

### Recovery Scenarios

1. **Accidental Deletion**
   - User restores within 30 days via Settings
   - Admin restores via admin dashboard

2. **Database Corruption**
   - Restore from latest backup
   - Point-in-time recovery (if WAL archiving enabled)

3. **Complete Data Loss**
   - Restore from offsite backup
   - Re-run seed if needed
   - Reconnect Stripe webhooks

### Recovery Time Objectives
- **Soft-deleted data**: Instant (toggle flag)
- **From backup**: 5-30 minutes (depending on size)
- **Full system restore**: 1-2 hours

## Compliance

### GDPR
- ✅ Right to access (data export)
- ✅ Right to erasure (account deletion)
- ✅ Right to portability (JSON/CSV export)
- ✅ Data retention limits (30 days)
- ✅ Audit trail (activity logs)

### Data Residency
- Configurable via database region
- All data stored in user's chosen region
- No cross-border data transfer without consent

## Monitoring

### Data Health Checks
- Daily: Soft-deleted record counts
- Daily: Backup verification
- Weekly: Storage usage
- Monthly: Retention compliance audit

### Alerts
- Backup failure
- Unusual deletion patterns
- Storage approaching limits
- Cleanup job failures

## Best Practices

### For Users
1. Export data before major changes
2. Review deletion warnings carefully
3. Restore within 30 days if needed
4. Use CSV exports for tax reporting

### For Admins
1. Verify backups daily
2. Monitor deletion patterns
3. Test restore procedures monthly
4. Review audit logs weekly
5. Keep backup storage secure

### For Developers
1. Always use soft delete for user data
2. Include `deletedAt: null` in queries
3. Log all data modifications
4. Validate backup integrity
5. Test recovery procedures

## API Reference

### Data Export
```bash
# Export all data as JSON
curl -H "Authorization: Bearer TOKEN"   https://api.smalllet.app/api/data/export

# Export payments as CSV
curl -H "Authorization: Bearer TOKEN"   https://api.smalllet.app/api/data/export-csv?type=payments
```

### Data Deletion
```bash
# Schedule account deletion
curl -X DELETE -H "Authorization: Bearer TOKEN"   https://api.smalllet.app/api/data/delete

# Restore data
curl -X POST -H "Authorization: Bearer TOKEN"   -d '{"restoreAll": true}'   https://api.smalllet.app/api/data/restore
```

### Admin Operations
```bash
# List users
curl -H "Authorization: Bearer ADMIN_TOKEN"   https://api.smalllet.app/api/admin/users

# Create backup
curl -X POST -H "Authorization: Bearer ADMIN_TOKEN"   https://api.smalllet.app/api/admin/backup

# Run cleanup
curl -X POST -H "Authorization: Bearer ADMIN_TOKEN"   -H "x-cron-secret: CRON_SECRET"   https://api.smalllet.app/api/admin/cleanup
```

---

Last updated: 2024
