# Backup and Recovery Guide

## Overview
This document outlines the backup strategy for the entire system, including code and database.

## Code Backup
- **Status**: ✅ Automated via Lovable GitHub integration
- **Frequency**: Real-time bidirectional sync
- **Location**: Connected GitHub repository

## Database Backup

### Schema Backup
- **Location**: `supabase/migrations/` directory
- **Format**: SQL migration files with timestamps
- **Versioning**: Git-tracked for complete history

### Data Backup Options

#### 1. Supabase Dashboard Export
1. Go to [SQL Editor](https://supabase.com/dashboard/project/rtgcrclgmvcmrjpvtpwm/sql/new)
2. Run: `pg_dump --schema-only --no-owner --no-privileges`
3. Save output to migration file

#### 2. Programmatic Backup
```sql
-- Export all data from public schema
COPY (SELECT * FROM information_schema.tables WHERE table_schema='public') TO STDOUT WITH CSV HEADER;
```

#### 3. Supabase CLI (Recommended)
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref rtgcrclgmvcmrjpvtpwm

# Generate migration from remote changes
supabase db diff --use-migra

# Backup current schema
supabase db dump --data-only > backup.sql
```

## Recovery Process

### Code Recovery
1. Clone from GitHub repository
2. Install dependencies: `npm install`
3. Start development: `npm run dev`

### Database Recovery
1. Reset database: `supabase db reset`
2. Apply migrations: `supabase migration up`
3. Seed data: `supabase db seed`

## Automated Backup Schedule
- **Code**: Continuous (Lovable sync)
- **Schema**: Weekly via GitHub Actions
- **Data**: Manual export recommended before major changes

## Important Notes
- Supabase handles infrastructure backups automatically
- Point-in-time recovery available on Pro plans
- Store sensitive data backups securely
- Test recovery process regularly

## Contact Information
- Project ID: rtgcrclgmvcmrjpvtpwm
- Supabase Dashboard: https://supabase.com/dashboard/project/rtgcrclgmvcmrjpvtpwm