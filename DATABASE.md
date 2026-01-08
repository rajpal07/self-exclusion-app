# Database Documentation

## Overview

This document describes the database schema, security policies, and data management for the Self-Exclusion Application. The application uses **Supabase** (PostgreSQL) as its backend database.

## Database Schema

### Tables

#### 1. `profiles`

Stores user profile information and roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, FOREIGN KEY → auth.users | User ID from Supabase Auth |
| `role` | TEXT | DEFAULT 'USER' | User role: 'USER' or 'ADMIN' |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Profile creation timestamp |

**Indexes:**
- Primary key on `id`

**Relationships:**
- `id` references `auth.users(id)` ON DELETE CASCADE

**SQL Schema:**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

#### 2. `excluded_persons`

Stores information about patrons on the self-exclusion list.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique record ID |
| `patron_id` | TEXT | UNIQUE, NOT NULL | Patron's unique identifier |
| `name` | TEXT | NOT NULL | Full name of the patron |
| `dob` | DATE | NOT NULL | Date of birth (YYYY-MM-DD) |
| `expiry_date` | DATE | NOT NULL | Exclusion expiry date |
| `added_date` | DATE | DEFAULT CURRENT_DATE | Date patron was added to list |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

**Indexes:**
- Primary key on `id`
- Unique index on `patron_id`
- Index on `name` for search performance
- Index on `dob` for search performance
- Index on `expiry_date` for filtering active/expired

**SQL Schema:**
```sql
CREATE TABLE excluded_persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patron_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  dob DATE NOT NULL,
  expiry_date DATE NOT NULL,
  added_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_excluded_persons_name ON excluded_persons(name);
CREATE INDEX idx_excluded_persons_dob ON excluded_persons(dob);
CREATE INDEX idx_excluded_persons_expiry ON excluded_persons(expiry_date);
```

---

#### 3. `audit_logs`

Tracks all user actions for compliance and security auditing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique log entry ID |
| `user_id` | UUID | FOREIGN KEY → auth.users | User who performed the action |
| `role` | TEXT | NOT NULL | User's role at time of action |
| `action` | TEXT | NOT NULL | Description of action performed |
| `details` | TEXT | | Additional details about the action |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Timestamp of the action |

**Indexes:**
- Primary key on `id`
- Index on `user_id` for user activity queries
- Index on `created_at` for time-based queries

**Relationships:**
- `user_id` references `auth.users(id)` ON DELETE SET NULL

**SQL Schema:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

---

## Row Level Security (RLS) Policies

Supabase RLS provides database-level security, ensuring users can only access authorized data.

### `profiles` Table

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Profiles are created automatically on signup
CREATE POLICY "Profiles can be created on signup"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
```

### `excluded_persons` Table

```sql
-- Enable RLS
ALTER TABLE excluded_persons ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view exclusions
CREATE POLICY "Authenticated users can view exclusions"
  ON excluded_persons
  FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can add exclusions
CREATE POLICY "Authenticated users can insert exclusions"
  ON excluded_persons
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins can delete exclusions (optional, implement if needed)
CREATE POLICY "Admins can delete exclusions"
  ON excluded_persons
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );
```

### `audit_logs` Table

```sql
-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can insert audit logs
CREATE POLICY "Users can create audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );
```

---

## Database Setup

### Initial Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note the project URL and anon key

2. **Run Migrations**

Execute the following SQL in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create excluded_persons table
CREATE TABLE excluded_persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patron_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  dob DATE NOT NULL,
  expiry_date DATE NOT NULL,
  added_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_excluded_persons_name ON excluded_persons(name);
CREATE INDEX idx_excluded_persons_dob ON excluded_persons(dob);
CREATE INDEX idx_excluded_persons_expiry ON excluded_persons(expiry_date);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE excluded_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (see above sections for complete policies)
```

3. **Configure Environment Variables**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Data Management

### Querying Data

#### Fetch All Active Exclusions

```typescript
const today = new Date().toISOString().split('T')[0];

const { data: activeExclusions } = await supabase
  .from('excluded_persons')
  .select('*')
  .gte('expiry_date', today)
  .order('added_date', { ascending: false });
```

#### Search for Patron

```typescript
const { data: patron } = await supabase
  .from('excluded_persons')
  .select('*')
  .ilike('name', searchName)
  .eq('dob', searchDOB)
  .maybeSingle();
```

#### Add New Patron

```typescript
const { data, error } = await supabase
  .from('excluded_persons')
  .insert([{
    patron_id: 'P12345',
    name: 'John Doe',
    dob: '1990-05-15',
    expiry_date: '2025-12-31'
  }]);
```

#### Create Audit Log

```typescript
const { data: { user } } = await supabase.auth.getUser();

await supabase.from('audit_logs').insert({
  user_id: user.id,
  role: 'USER',
  action: 'Added new patron',
  details: `ID: P12345, Name: John Doe`
});
```

---

## Backup & Recovery

### Automated Backups

Supabase provides automated daily backups for all projects:
- **Retention**: 7 days (free tier), 30+ days (paid tiers)
- **Location**: Managed by Supabase
- **Restoration**: Via Supabase dashboard

### Manual Backup

```bash
# Export data using Supabase CLI
supabase db dump -f backup.sql

# Or use pg_dump directly
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql
```

### Point-in-Time Recovery

Available on paid Supabase plans:
- Restore to any point in the last 30 days
- Granularity: 1 second

---

## Performance Optimization

### Indexes

Current indexes optimize common queries:
- `name` and `dob` for patron searches
- `expiry_date` for active/expired filtering
- `created_at` for audit log time-based queries

### Query Optimization Tips

1. **Use Indexes**: Queries on `name`, `dob`, `expiry_date` are indexed
2. **Limit Results**: Use `.limit()` for large datasets
3. **Select Specific Columns**: Use `.select('id, name')` instead of `.select('*')`
4. **Use Pagination**: For large lists

```typescript
// Paginated query
const { data, error } = await supabase
  .from('excluded_persons')
  .select('*')
  .range(0, 49) // First 50 records
  .order('added_date', { ascending: false });
```

---

## Data Retention Policies

### Excluded Persons

- **Retention**: Until expiry date passes
- **Cleanup**: Expired records can be archived or deleted
- **Recommendation**: Keep expired records for audit purposes

### Audit Logs

- **Retention**: Indefinite (for compliance)
- **Cleanup**: Optional archival after 1 year
- **Recommendation**: Retain for at least 1 year

### Cleanup Script (Optional)

```sql
-- Archive expired exclusions older than 1 year
DELETE FROM excluded_persons
WHERE expiry_date < CURRENT_DATE - INTERVAL '1 year';

-- Archive old audit logs (move to separate table)
INSERT INTO audit_logs_archive
SELECT * FROM audit_logs
WHERE created_at < CURRENT_DATE - INTERVAL '1 year';

DELETE FROM audit_logs
WHERE created_at < CURRENT_DATE - INTERVAL '1 year';
```

---

## Monitoring & Maintenance

### Database Health Checks

1. **Check Table Sizes**
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

2. **Check Index Usage**
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

3. **Monitor Query Performance**
   - Use Supabase Dashboard → Database → Query Performance
   - Identify slow queries
   - Add indexes as needed

---

## Security Best Practices

1. **Enable RLS on All Tables**: Prevents unauthorized access
2. **Use Parameterized Queries**: Prevents SQL injection
3. **Limit Permissions**: Use anon key for client, service key for admin
4. **Regular Audits**: Review audit logs for suspicious activity
5. **Backup Regularly**: Ensure data can be recovered

---

## Troubleshooting

### Common Issues

**Issue**: RLS blocking queries
- **Solution**: Check RLS policies, ensure user is authenticated

**Issue**: Slow queries
- **Solution**: Add indexes, use `.select()` with specific columns

**Issue**: Unique constraint violation
- **Solution**: Check for duplicate `patron_id` before insert

**Issue**: Foreign key constraint violation
- **Solution**: Ensure referenced user exists in `auth.users`

---

## Conclusion

The database schema is designed for security, performance, and compliance. RLS policies ensure data protection, indexes optimize query performance, and audit logs provide complete traceability.

For database changes or issues, consult the Supabase documentation or contact the development team.
