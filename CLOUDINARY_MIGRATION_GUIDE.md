# Cloudinary Image Upload Migration Guide

## Summary
Firebase Storage image uploads have been replaced with Cloudinary uploads using an unsigned preset. All upload UI components (progress bar, error handling, preview) remain fully functional.

## Changes Made

### 1. Dependencies
- **Added**: `axios` package for HTTP requests to Cloudinary API

### 2. Environment Variables
Added to `.env`:
```
VITE_CLOUDINARY_CLOUD_NAME=dk0oiheaa
VITE_CLOUDINARY_UPLOAD_PRESET=wasilah_unsigned
```

### 3. Modified Components

#### `ImageUploadField.tsx`
- Removed Firebase Storage imports (`ref`, `uploadBytes`, `getDownloadURL`)
- Added Cloudinary upload logic using axios
- Progress bar fully wired to Cloudinary upload progress events
- Images uploaded to: `wasilah/{folder}/` (e.g., `wasilah/uploads/`)
- Max file size reduced to 2MB (from 5MB)

#### `EnhancedImageUpload.tsx`
- Removed Firebase Storage imports
- Replaced `uploadBytesResumable` with axios POST to Cloudinary
- Maintained all advanced features: compression, stall detection, retry logic
- Cancel functionality uses axios cancel tokens
- Images uploaded to: `wasilah/{folder}/`

#### `ContentEditor.tsx`
- Removed Firebase Storage imports
- Updated `handleImageUpload` to use Cloudinary
- Images uploaded to: `wasilah/content/`
- Max file size reduced to 2MB

#### `CloudinaryImageUpload.tsx` (New)
- Standalone Cloudinary upload component
- Drop-in replacement for Firebase upload components
- Full progress tracking and error handling

### 4. Unchanged
- **Firebase Auth**: Still uses Firebase Authentication
- **Firestore**: Still uses Firestore for data persistence
- All image URLs are stored in Firestore as before
- UI/UX remains identical for end users

## Testing Checklist

### Basic Upload Test
1. Open the app and navigate to any form with image upload
2. Select a small image file (<2MB, JPEG/PNG/GIF/WebP)
3. **Expected**: Progress bar animates from 0% to 100%
4. **Expected**: Image preview displays
5. **Expected**: Success message appears

### Validation Tests
1. **Test non-image file**:
   - Select a .txt or .pdf file
   - **Expected**: Error message "Only image files are allowed"

2. **Test oversized file**:
   - Select an image >2MB
   - **Expected**: Error message with file size details

3. **Test empty file**:
   - **Expected**: Error message "The selected file is empty"

### Cloudinary Verification
1. After successful upload, copy the returned `secure_url` from browser console
2. **Expected format**: `https://res.cloudinary.com/dk0oiheaa/image/upload/v{timestamp}/wasilah/uploads/{filename}`
3. Open URL in browser - **Expected**: Image loads over HTTPS
4. Log into [Cloudinary Dashboard](https://cloudinary.com/console)
5. Go to **Media Library** → **Folders**
6. Navigate to `wasilah/uploads/` (or `wasilah/content/`)
7. **Expected**: Uploaded image appears in folder

### Firestore Verification
1. After upload, check Firestore document where image URL is saved
2. **Expected**: Document contains Cloudinary `secure_url`
3. **Expected**: URL format matches: `https://res.cloudinary.com/dk0oiheaa/...`

### Error Handling Tests
1. **Test with no internet**:
   - Disconnect from internet
   - Attempt upload
   - **Expected**: "No response from server. Please check your connection."

2. **Test cancel upload**:
   - Start upload of larger file
   - Click "Cancel Upload" button during progress
   - **Expected**: Upload stops, "Upload cancelled" message appears

## Configuration Security

### ✅ Safe (Already Implemented)
- `VITE_CLOUDINARY_CLOUD_NAME` - Public cloud name (safe to expose)
- `VITE_CLOUDINARY_UPLOAD_PRESET` - Unsigned preset (safe to expose)
- Uploads use unsigned preset (no API secret in frontend)
- Cloudinary preset should have upload restrictions configured:
  - Allowed formats: image/jpeg, image/png, image/gif, image/webp
  - Max file size: 2MB
  - Folder: wasilah/

### ⚠️ Do NOT Add to Frontend
- `CLOUDINARY_URL` (contains API secret)
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

These should only be used server-side if signed uploads are needed in the future.

## Cloudinary Preset Configuration

The `wasilah_unsigned` preset should be configured with:
- **Upload preset**: unsigned
- **Folder**: wasilah (sub-folders added by upload logic)
- **Allowed formats**: jpg, png, gif, webp
- **Max file size**: 2MB
- **Transformations**: Optional (can add auto-format, auto-quality)

## Troubleshooting

### "Cloudinary configuration missing"
- Verify `.env` file contains `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET`
- Restart dev server after changing `.env`

### Upload fails with 400 error
- Check Cloudinary preset name is correct
- Verify preset is set to "unsigned" mode
- Check upload restrictions in Cloudinary dashboard

### Images not appearing in Cloudinary
- Verify cloud name is correct
- Check folder path in Cloudinary Media Library
- Images are in `wasilah/uploads/` or `wasilah/content/`

### Upload stalls/times out
- Check internet connection
- Verify Cloudinary service status
- Try smaller file (<1MB)
- Component has 2-minute timeout and auto-retry logic

## Future Improvements

### Optional: Server-Side Signed Uploads
For enhanced security, you could:
1. Create API endpoint that signs upload requests
2. Use `CLOUDINARY_API_SECRET` server-side only
3. Frontend requests signature from API before upload
4. Allows per-user upload quotas and restrictions

### Optional: Image Transformations
Cloudinary supports on-the-fly transformations:
```javascript
// Example: Auto-optimize and resize
const optimizedUrl = url.replace('/upload/', '/upload/f_auto,q_auto,w_800,h_600,c_limit/');
```

## Support
- Cloudinary Docs: https://cloudinary.com/documentation
- Unsigned Uploads: https://cloudinary.com/documentation/upload_images#unsigned_upload
