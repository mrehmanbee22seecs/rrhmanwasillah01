# Quick Start Guide - Visibility Fix Deployment

## 1. Configure Cloudinary (5 min)

Get credentials from https://console.cloudinary.com/

Edit `.env` file:
```bash
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name-here
VITE_CLOUDINARY_UPLOAD_PRESET=wasilah_unsigned
CLOUDINARY_API_KEY=your-api-key-here
CLOUDINARY_API_SECRET=your-api-secret-here
```

Create upload preset in Cloudinary:
- Name: wasilah_unsigned
- Mode: Unsigned
- Folder: wasilah/uploads

## 2. Deploy Firebase Indexes (15 min)

```bash
firebase deploy --only firestore:indexes
```

Wait for completion in Firebase Console.

## 3. Run Data Migration (2 min)

```bash
npm run build
npm run dev
```

Open browser console (F12), run:
```javascript
import { migrateVisibility } from './src/scripts/migrateVisibility';
await migrateVisibility();
```

## 4. Deploy Application (5 min)

```bash
npm run build
firebase deploy --only hosting
```

## 5. Deploy Edge Function (5 min)

```bash
supabase functions deploy cloudinary-signature

supabase secrets set CLOUDINARY_API_SECRET=your-secret
supabase secrets set CLOUDINARY_API_KEY=your-key  
supabase secrets set VITE_CLOUDINARY_CLOUD_NAME=your-cloud
```

## 6. Verify Everything Works

- [ ] Go to Projects page - see approved projects
- [ ] Go to Events page - see approved events
- [ ] Open Admin Panel - see visibility badges
- [ ] Test Hide button - item disappears from public
- [ ] Test Show button - item reappears
- [ ] Test Delete button - item removed

## What Was Fixed

✅ Cloudinary configuration errors
✅ Admin delete functionality
✅ Hide/show visibility controls
✅ Data migration for existing records
✅ Complete documentation

## Need Help?

Read detailed guides:
- VISIBILITY_FIX_DEPLOYMENT.md - Full deployment guide
- ADMIN_VISIBILITY_GUIDE.md - Admin user guide
- VISIBILITY_FIX_SUMMARY.md - Complete summary

## Common Issues

**Items not showing**: Run migration script
**Cloudinary errors**: Check .env credentials
**Index errors**: Wait for indexes to finish building
**Hide/Show not working**: Check admin authentication

Total deployment time: ~30 minutes
