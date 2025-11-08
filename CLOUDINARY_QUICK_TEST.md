# Cloudinary Upload - Quick Test Guide

## ✅ Quick 5-Minute Test

### 1. Start the App
```bash
npm run dev
```

### 2. Test Upload
1. Navigate to any page with image upload:
   - **Leader Manager** (Admin panel)
   - **Heads Manager** (Admin panel)
   - **Create Submission** page

2. Click "Upload Image" or "Click to upload image"

3. Select a JPEG/PNG image (<2MB)

4. **Watch for**:
   - ✅ Progress bar animates 0% → 100%
   - ✅ Image preview appears
   - ✅ Green success message: "Image uploaded successfully!"

### 3. Verify in Cloudinary
1. Go to: https://cloudinary.com/console
2. Login to account: **dk0oiheaa**
3. Click **Media Library** (left sidebar)
4. Navigate to folders:
   - `wasilah/uploads/` - For leader/head images
   - `wasilah/content/` - For content editor images
5. **Expected**: Your uploaded image appears with timestamp

### 4. Test Error Handling
**Test A - Wrong file type:**
- Upload a `.txt` or `.pdf` file
- **Expected**: Red error: "Only image files are allowed"

**Test B - File too large:**
- Upload image >2MB
- **Expected**: Red error: "File too large. Max 2MB. Current: X.XX MB"

## 🔧 Environment Check

Open `.env` and verify:
```
VITE_CLOUDINARY_CLOUD_NAME=dk0oiheaa
VITE_CLOUDINARY_UPLOAD_PRESET=wasilah_unsigned
```

If missing, add these lines and restart dev server.

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| "Cloudinary configuration missing" | Check `.env` file has both variables, restart dev server |
| Upload fails instantly | Check internet connection, verify cloud name/preset |
| Progress bar stuck at 0% | Open browser console, check for CORS or network errors |
| Image not in Cloudinary | Wait 30 seconds, refresh Media Library, check correct folder |

## 📊 What Changed

| Before (Firebase Storage) | After (Cloudinary) |
|---------------------------|-------------------|
| `uploadBytes()` | `axios.post()` to Cloudinary API |
| `getDownloadURL()` | `res.data.secure_url` |
| Firebase Storage URLs | Cloudinary CDN URLs |
| 5MB limit | 2MB limit |
| Firebase console | Cloudinary Media Library |

## ✨ What Stayed the Same

- ✅ Upload UI and UX (progress bar, preview, errors)
- ✅ Firebase Auth (login/logout)
- ✅ Firestore (all data except image URLs)
- ✅ URL saved to Firestore (just different host)

## 🎯 Success Criteria

Upload is working correctly if:
1. Progress bar reaches 100%
2. Image preview displays in app
3. No console errors
4. Image appears in Cloudinary Media Library
5. Firestore document has `https://res.cloudinary.com/...` URL
