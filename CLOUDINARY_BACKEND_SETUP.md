# Cloudinary Backend Configuration Guide

## Overview

This guide covers backend configuration for secure Cloudinary operations including signed uploads, server-side transformations, and image management.

## Architecture

### Frontend (Unsigned Uploads)
- ✅ Direct browser-to-Cloudinary uploads
- ✅ No backend required for basic operations
- ✅ Safe for public-facing forms
- ✅ Limited to preset restrictions

### Backend (Signed Uploads via Supabase)
- ✅ Enhanced security with signature verification
- ✅ Server-side validation and control
- ✅ Advanced transformations
- ✅ Image deletion capabilities
- ✅ Custom upload parameters

## Current Configuration

### Environment Variables

#### Frontend (.env)
```env
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_CLOUDINARY_CLOUD_NAME=dk0oiheaa
VITE_CLOUDINARY_UPLOAD_PRESET=wasilah_unsigned
```

#### Backend (Supabase Edge Function Secrets)
These need to be configured in Supabase Dashboard:

```bash
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

## Cloudinary Dashboard Setup

### 1. Get API Credentials

1. Login to [Cloudinary Console](https://cloudinary.com/console)
2. Go to **Dashboard** → **Account Details**
3. Copy the following:
   - **Cloud Name**: `dk0oiheaa` (already configured)
   - **API Key**: Found in Account Details
   - **API Secret**: Found in Account Details (keep secure!)

### 2. Configure Upload Preset

#### For Unsigned Uploads (Current Setup)
1. Navigate to **Settings** → **Upload**
2. Scroll to **Upload presets**
3. Find or create preset: `wasilah_unsigned`
4. Configure:
   ```
   Preset name: wasilah_unsigned
   Signing mode: Unsigned
   Folder: wasilah
   Use filename or externally defined Public ID: ☑
   Unique filename: ☑
   Overwrite: ☐

   Allowed formats: jpg, png, gif, webp
   Max file size: 2097152 (2MB)
   Max image width: 4000
   Max image height: 4000

   Quality: auto:good
   Format: auto
   ```

#### For Signed Uploads (Optional - Enhanced Security)
1. Create new preset: `wasilah_signed`
2. Configure:
   ```
   Preset name: wasilah_signed
   Signing mode: Signed
   Folder: wasilah

   Access control: authenticated
   Allowed formats: jpg, png, gif, webp
   Max file size: 5242880 (5MB)

   Quality: auto:best
   Format: auto
   ```

### 3. Enable Auto Optimization

1. Go to **Settings** → **Optimization**
2. Enable:
   - ☑ Automatic format selection
   - ☑ Automatic quality selection
   - ☑ Lossy compression

### 4. Configure Transformations

1. Go to **Settings** → **Transformations**
2. Add named transformations:

#### Profile Images
```
Name: profile_image
Transformation: w_400,h_400,c_fill,g_face,q_auto:good,f_auto
```

#### Thumbnails
```
Name: thumbnail
Transformation: w_150,h_150,c_thumb,g_face,q_auto:good,f_auto
```

#### Banner Images
```
Name: banner
Transformation: w_1200,h_400,c_fill,g_auto,q_auto:good,f_auto
```

#### Hero Images
```
Name: hero
Transformation: w_1920,h_800,c_fill,g_auto,q_auto:best,f_auto
```

## Supabase Edge Function Setup

### 1. Deploy Cloudinary Signature Function

The edge function is already created at:
```
supabase/functions/cloudinary-signature/index.ts
```

Deploy using Supabase CLI:
```bash
supabase functions deploy cloudinary-signature
```

Or deploy via Supabase Dashboard:
1. Go to **Edge Functions** section
2. Create new function: `cloudinary-signature`
3. Copy code from `supabase/functions/cloudinary-signature/index.ts`
4. Deploy

### 2. Configure Edge Function Secrets

In Supabase Dashboard:
1. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
2. Add the following secrets:

```bash
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
VITE_CLOUDINARY_CLOUD_NAME=dk0oiheaa
```

Or via CLI:
```bash
supabase secrets set CLOUDINARY_API_KEY=your_api_key
supabase secrets set CLOUDINARY_API_SECRET=your_api_secret
supabase secrets set VITE_CLOUDINARY_CLOUD_NAME=dk0oiheaa
```

### 3. Test Edge Function

```bash
curl -X POST https://your-project.supabase.co/functions/v1/cloudinary-signature \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": 1234567890,
    "folder": "wasilah/test"
  }'
```

Expected response:
```json
{
  "signature": "abcd1234...",
  "timestamp": 1234567890,
  "api_key": "your_api_key",
  "cloud_name": "dk0oiheaa",
  "folder": "wasilah/test"
}
```

## Usage Examples

### Using Unsigned Upload (Current Default)

```tsx
import CloudinaryImageUpload from '../components/CloudinaryImageUpload';

function MyForm() {
  const [imageUrl, setImageUrl] = useState('');

  return (
    <CloudinaryImageUpload
      label="Upload Image"
      value={imageUrl}
      onChange={setImageUrl}
      maxSizeMB={2}
    />
  );
}
```

### Using Signed Upload (Enhanced Security)

```tsx
import { uploadWithSignature } from '../utils/cloudinarySignedUpload';

async function handleUpload(file: File) {
  try {
    const result = await uploadWithSignature({
      file,
      folder: 'profiles',
      transformation: 'w_400,h_400,c_fill,g_face,q_auto:good,f_auto',
      onProgress: (progress) => {
        console.log(`Upload progress: ${progress}%`);
      }
    });

    console.log('Uploaded:', result.secure_url);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

### Upload Profile Image with Custom ID

```tsx
import { uploadProfileImage } from '../utils/cloudinarySignedUpload';

async function handleProfileUpload(file: File, userId: string) {
  const result = await uploadProfileImage(file, userId, (progress) => {
    setUploadProgress(progress);
  });

  setProfileImageUrl(result.secure_url);
}
```

### Delete Image

```tsx
import { deleteImage, extractPublicId } from '../utils/cloudinarySignedUpload';

async function handleDelete(imageUrl: string) {
  const publicId = extractPublicId(imageUrl);
  if (publicId) {
    await deleteImage(publicId);
    console.log('Image deleted');
  }
}
```

## Security Considerations

### Unsigned Uploads (Current)

**Pros:**
- ✅ No backend required
- ✅ Faster implementation
- ✅ Lower server costs
- ✅ Suitable for public forms

**Cons:**
- ⚠ Limited control over upload parameters
- ⚠ Cannot delete images from frontend
- ⚠ Restricted to preset configurations
- ⚠ Less flexibility

**Use Cases:**
- Public image submissions
- User-generated content
- Forms without authentication
- MVP and prototypes

### Signed Uploads (Enhanced)

**Pros:**
- ✅ Full control over uploads
- ✅ Server-side validation
- ✅ Can delete images
- ✅ Advanced transformations
- ✅ Audit trail capability

**Cons:**
- ⚠ Requires backend function
- ⚠ Slightly more complex setup
- ⚠ Additional API calls

**Use Cases:**
- Admin panels
- Authenticated user uploads
- Production applications
- Image management systems

## Migration Path

### Phase 1: Current (Unsigned Uploads)
```
Frontend → Cloudinary (Direct)
```
- Quick setup
- No backend needed
- Perfect for MVP

### Phase 2: Hybrid Approach
```
Public Forms → Cloudinary (Unsigned)
Admin Panel → Supabase Edge Function → Cloudinary (Signed)
```
- Best of both worlds
- Gradual migration
- Recommended approach

### Phase 3: Full Backend (Future)
```
All Uploads → Supabase Edge Function → Cloudinary (Signed)
```
- Maximum security
- Full control
- Enterprise-grade

## Monitoring and Analytics

### Cloudinary Dashboard

1. **Usage Dashboard**
   - Monitor storage usage
   - Track bandwidth consumption
   - View transformation counts

2. **Media Library**
   - Browse uploaded images
   - Search by tags/folders
   - Bulk operations

3. **Reports**
   - Usage trends
   - Popular transformations
   - Error rates

### Set Up Alerts

1. Go to **Settings** → **Notifications**
2. Configure alerts for:
   - Storage threshold (e.g., 80% of 25GB)
   - Bandwidth limit (e.g., 20GB/month)
   - Unusual activity

## Cost Optimization

### Current Usage (Free Tier)
- Storage: 25 GB
- Bandwidth: 25 GB/month
- Transformations: 25,000/month

### Optimization Strategies

1. **Image Compression**
   - Use `q_auto:good` for balance
   - Use `q_auto:eco` for maximum savings
   - Apply format optimization (`f_auto`)

2. **Lazy Loading**
   - Load images only when needed
   - Use blur placeholders
   - Implement progressive loading

3. **Responsive Images**
   - Serve appropriate sizes
   - Use srcset for different viewports
   - Avoid serving oversized images

4. **Caching**
   - Leverage Cloudinary CDN
   - Set appropriate cache headers
   - Use versioned URLs

5. **Cleanup**
   - Delete unused images
   - Archive old content
   - Implement retention policies

## Troubleshooting

### Issue: Signature generation fails

**Solution:**
1. Verify Edge Function secrets are set
2. Check Cloudinary API credentials
3. Test Edge Function independently
4. Review function logs

### Issue: Upload works locally but fails in production

**Solution:**
1. Verify environment variables in production
2. Check CORS settings in Cloudinary
3. Ensure Edge Function is deployed
4. Review production logs

### Issue: Images not optimized

**Solution:**
1. Check transformation parameters
2. Verify auto-optimization settings
3. Use appropriate quality settings
4. Test URLs with transformations

## Testing Checklist

Backend Configuration:
- [ ] Cloudinary API credentials obtained
- [ ] Upload presets configured
- [ ] Auto-optimization enabled
- [ ] Named transformations created
- [ ] Edge Function deployed
- [ ] Edge Function secrets set
- [ ] Test signature generation
- [ ] Test signed upload
- [ ] Test image deletion
- [ ] Verify transformations work
- [ ] Check monitoring dashboard
- [ ] Set up usage alerts

## Support and Resources

- **Cloudinary Docs**: https://cloudinary.com/documentation
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Upload API**: https://cloudinary.com/documentation/image_upload_api_reference
- **Transformation Reference**: https://cloudinary.com/documentation/transformation_reference

## Next Steps

1. **Immediate (Required)**
   - ✅ Environment variables configured
   - ✅ Upload preset exists
   - ⏳ Test uploads in application

2. **Short Term (Recommended)**
   - ⏳ Deploy Edge Function
   - ⏳ Configure backend secrets
   - ⏳ Test signed uploads
   - ⏳ Set up monitoring

3. **Long Term (Optional)**
   - ⏳ Implement image analytics
   - ⏳ Add cleanup automation
   - ⏳ Optimize transformations
   - ⏳ Migrate to signed uploads
