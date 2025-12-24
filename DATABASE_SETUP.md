# Database Migration Guide

This application has been migrated from in-memory storage to PostgreSQL with Prisma ORM.

## Setup Instructions

### 1. Configure Database Connection

Edit `.env.local` and set your PostgreSQL connection URL:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

**Example formats:**
- Local: `postgresql://postgres:password@localhost:5432/mydb`
- Production: Use your PostgreSQL provider's connection URL (e.g., from Heroku, Railway, Supabase, etc.)

### 2. Push Schema to Database

Run the following command to create the database tables:

```bash
npx prisma db push
```

This will create the following tables:
- `Snapshot` - Network health snapshots over time
- `PodStorage` - Pod storage data and credits
- `NodeStats` - Node system statistics (CPU, RAM, network)
- `GeoLocation` - IP geolocation cache

### 3. (Optional) View Database in Prisma Studio

To visually inspect your database:

```bash
npx prisma studio
```

This opens a GUI at http://localhost:5555

## Migration Details

### What Changed

**Before (In-Memory):**
- Data stored in JavaScript Maps
- Data lost on application restart
- No persistence

**After (PostgreSQL):**
- All data persisted in database
- Survives application restarts
- Scalable and queryable
- Automatic cleanup of old data

### Database Models

1. **Snapshot** - Stores network health history
   - Keeps last 30 days of snapshots
   - Tracks network health, risk scores, node counts

2. **PodStorage** - Pod/node storage information
   - Storage capacity and usage
   - Credits and uptime
   - Public/private status

3. **NodeStats** - Real-time node metrics
   - CPU and RAM usage
   - Network packets and streams
   - Updated every 60 seconds

4. **GeoLocation** - IP location cache
   - Reduces API calls to geolocation services
   - Stores latitude, longitude, country, city

### API Changes

All storage operations are now asynchronous. The following functions have been updated:

- `snapshotStore.addSnapshot()` → `await snapshotStore.addSnapshot()`
- `snapshotStore.getSnapshots()` → `await snapshotStore.getSnapshots()`
- `getNodeStorageData()` → `await getNodeStorageData()`
- `getAllStorageData()` → `await getAllStorageData()`
- `getNodeStats()` → `await getNodeStats()`
- `getAllNodeStats()` → `await getAllNodeStats()`

## Deployment Notes

### Environment Variables

Make sure to set `DATABASE_URL` in your production environment.

### Database Providers

Compatible with any PostgreSQL provider:
- **Supabase** (recommended for free tier)
- **Railway**
- **Heroku Postgres**
- **AWS RDS**
- **DigitalOcean Managed Databases**
- **Self-hosted PostgreSQL**

### Prisma Commands

```bash
# Generate Prisma Client (auto-runs on npm install)
npx prisma generate

# Push schema changes to database
npx prisma db push

# View database
npx prisma studio

# Create a migration (optional, for version control)
npx prisma migrate dev --name init
```

## Troubleshooting

### "Can't reach database server"
- Check your DATABASE_URL in `.env.local`
- Verify the database is running
- Check firewall/network settings

### "Table does not exist"
- Run `npx prisma db push` to create tables

### Data not persisting
- Verify DATABASE_URL is correctly set
- Check application logs for database errors
- Ensure database has write permissions

## Development

The application automatically syncs data:
- Storage data: every 30 seconds
- Node stats: every 60 seconds
- Snapshots: manually triggered or via API

All sync operations now write to the database instead of in-memory storage.
