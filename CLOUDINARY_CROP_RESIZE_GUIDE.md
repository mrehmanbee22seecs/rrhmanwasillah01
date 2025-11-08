# Cloudinary Image Cropping, Resizing & Optimization Guide

## Overview

This guide covers the complete image handling system with cropping, resizing, and optimization features powered by Cloudinary.

## Features Implemented

### 1. Image Cropping Component (`ImageCropUpload.tsx`)

Interactive image editor with:
- **Visual crop area** with draggable selection
- **Zoom control** (0.5x to 3x)
- **Rotation** (0° to 360° in 15° increments)
- **Aspect ratio preservation**
- **Real-time preview**
- **Progress tracking**
- **Target dimensions** (default: 1200x800)

### 2. Automatic Compression

All upload components now include:
- **Client-side compression** for images >1MB
- **Quality optimization** (85% JPEG quality)
- **Max dimensions** (1920x1080) before upload
- **Reduced bandwidth usage**
- **Faster upload times**

### 3. Cloudinary Optimization Utilities (`cloudinaryHelpers.ts`)

Comprehensive helper functions for:
- **URL transformation** with quality/format optimization
- **Responsive images** for multiple screen sizes
- **Thumbnail generation** with face detection
- **Avatar URLs** with circular crop
- **Blur placeholders** for lazy loading
- **Image presets** for consistent sizing

## Component Usage

### Using ImageCropUpload (Full Crop Editor)

```tsx
import ImageCropUpload from '../components/ImageCropUpload';

<ImageCropUpload
  label="Profile Photo"
  value={profileImage}
  onChange={setProfileImage}
  folder="profiles"
  maxSizeMB={2}
  aspectRatio={1}  // 1:1 for square
  targetWidth={400}
  targetHeight={400}
/>
```

### Using CloudinaryImageUpload (Simple with Optimization)

```tsx
import CloudinaryImageUpload from '../components/CloudinaryImageUpload';

<CloudinaryImageUpload
  label="Cover Image"
  value={coverImage}
  onChange={setCoverImage}
  maxSizeMB={2}
  showPreview={true}
/>
```

### Using EnhancedImageUpload (Advanced Features)

```tsx
import EnhancedImageUpload from '../components/EnhancedImageUpload';

<EnhancedImageUpload
  label="Gallery Image"
  value={galleryImage}
  onChange={setGalleryImage}
  folder="gallery"
  maxSizeMB={2}
/>
```

### Using ImageUploadField (Lightweight)

```tsx
import ImageUploadField from '../components/ImageUploadField';

<ImageUploadField
  label="Thumbnail"
  value={thumbnail}
  onChange={setThumbnail}
  folder="thumbnails"
  maxSizeMB={1}
/>
```

## Cloudinary Helper Functions

### Optimized Image URLs

```tsx
import { getOptimizedCloudinaryUrl } from '../utils/cloudinaryHelpers';

const optimizedUrl = getOptimizedCloudinaryUrl(originalUrl, {
  width: 800,
  height: 600,
  crop: 'fill',
  quality: 'auto:good',
  format: 'auto'
});
```

### Responsive Images

```tsx
import { getResponsiveImageUrls } from '../utils/cloudinaryHelpers';

const urls = getResponsiveImageUrls(originalUrl, [320, 640, 1024, 1920]);

<picture>
  <source srcSet={urls[1920]} media="(min-width: 1920px)" />
  <source srcSet={urls[1024]} media="(min-width: 1024px)" />
  <source srcSet={urls[640]} media="(min-width: 640px)" />
  <img src={urls[320]} alt="Responsive" />
</picture>
```

### Thumbnail Generation

```tsx
import { getThumbnailUrl } from '../utils/cloudinaryHelpers';

const thumbUrl = getThumbnailUrl(originalUrl, 150);
<img src={thumbUrl} alt="Thumbnail" className="w-12 h-12" />
```

### Avatar with Circular Crop

```tsx
import { getAvatarUrl } from '../utils/cloudinaryHelpers';

const avatarUrl = getAvatarUrl(originalUrl, 200);
<img src={avatarUrl} alt="Avatar" className="rounded-full" />
```

### Blur Placeholder for Lazy Loading

```tsx
import { getBlurPlaceholderUrl } from '../utils/cloudinaryHelpers';

const [loaded, setLoaded] = useState(false);
const blurUrl = getBlurPlaceholderUrl(originalUrl);

<img
  src={loaded ? originalUrl : blurUrl}
  onLoad={() => setLoaded(true)}
  alt="Lazy loaded"
  className={loaded ? '' : 'blur-sm'}
/>
```

### Using Image Presets

```tsx
import { IMAGE_PRESETS, getImagePreset } from '../utils/cloudinaryHelpers';

const profilePreset = getImagePreset('profile');  // 400x400
const bannerPreset = getImagePreset('banner');    // 1200x400
const heroPreset = getImagePreset('hero');        // 1920x800
```

## Configuration

### Environment Variables

Add to `.env`:

```env
VITE_CLOUDINARY_CLOUD_NAME=dk0oiheaa
VITE_CLOUDINARY_UPLOAD_PRESET=wasilah_unsigned
```

### Cloudinary Dashboard Setup

1. **Login** to [Cloudinary Console](https://cloudinary.com/console)

2. **Create Unsigned Upload Preset**:
   - Navigate to Settings → Upload
   - Click "Add upload preset"
   - Set Upload preset name: `wasilah_unsigned`
   - Signing Mode: **Unsigned**
   - Folder: `wasilah`
   - Allowed formats: `jpg, png, gif, webp`
   - Max file size: `2097152` (2MB)
   - Quality: `auto:good`
   - Format: `auto`

3. **Enable Auto-Format and Quality**:
   - Settings → Image Optimization
   - Enable "Automatic format selection"
   - Enable "Automatic quality selection"

4. **Configure Transformations** (Optional):
   - Settings → Transformations
   - Add named transformations for common use cases

## Image Optimization Best Practices

### 1. Always Use Transformations

Instead of:
```tsx
<img src={cloudinaryUrl} />
```

Use:
```tsx
import { getOptimizedCloudinaryUrl } from '../utils/cloudinaryHelpers';

const optimizedUrl = getOptimizedCloudinaryUrl(cloudinaryUrl, {
  width: 800,
  quality: 'auto:good',
  format: 'auto'
});

<img src={optimizedUrl} />
```

### 2. Implement Responsive Images

```tsx
const responsiveUrls = getResponsiveImageUrls(imageUrl);

<img
  src={responsiveUrls[640]}
  srcSet={`
    ${responsiveUrls[320]} 320w,
    ${responsiveUrls[640]} 640w,
    ${responsiveUrls[1024]} 1024w,
    ${responsiveUrls[1920]} 1920w
  `}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Responsive"
/>
```

### 3. Use Appropriate Presets

```tsx
// For profile pictures (400x400)
getOptimizedCloudinaryUrl(url, IMAGE_PRESETS.profile);

// For card images (600x400)
getOptimizedCloudinaryUrl(url, IMAGE_PRESETS.card);

// For hero banners (1920x800)
getOptimizedCloudinaryUrl(url, IMAGE_PRESETS.hero);
```

### 4. Implement Lazy Loading

```tsx
<img
  src={getBlurPlaceholderUrl(imageUrl)}
  data-src={imageUrl}
  loading="lazy"
  className="blur-sm transition-all"
  onLoad={(e) => {
    e.currentTarget.src = imageUrl;
    e.currentTarget.classList.remove('blur-sm');
  }}
/>
```

## File Size Optimization

### Before Upload (Client-Side)

All components automatically:
1. Check file size
2. Compress images >1MB
3. Resize to max 1920x1080
4. Optimize quality to 85%

### During Upload (Cloudinary)

Cloudinary applies:
1. Auto-format selection (WebP for modern browsers)
2. Auto-quality optimization
3. Compression algorithms
4. CDN caching

### After Upload (Display)

Use transformations to:
1. Serve appropriate sizes
2. Apply format optimization
3. Reduce bandwidth usage
4. Improve load times

## Storage Structure

```
wasilah/
├── uploads/          # General uploads
├── profiles/         # User profiles
├── content/          # CMS content
├── gallery/          # Gallery images
├── thumbnails/       # Thumbnail images
└── banners/          # Banner images
```

## API Limits

### Free Tier (Current)
- Storage: 25 GB
- Bandwidth: 25 GB/month
- Transformations: 25,000/month
- Videos: 500 MB storage

### Recommendations
- Monitor usage in Cloudinary Dashboard
- Set up usage alerts
- Implement image cleanup for deleted content
- Use transformations efficiently

## Troubleshooting

### Issue: Images not uploading

**Solution**:
1. Check environment variables are set
2. Verify upload preset exists in Cloudinary
3. Check browser console for errors
4. Verify file size is under 2MB

### Issue: Images load slowly

**Solution**:
1. Use optimized URLs with transformations
2. Implement responsive images
3. Enable lazy loading
4. Use appropriate image sizes

### Issue: Poor image quality

**Solution**:
1. Adjust quality parameter
2. Use higher resolution source images
3. Check compression settings
4. Review Cloudinary transformation settings

### Issue: Upload fails at 99%

**Solution**:
1. Check internet connection stability
2. Try smaller file size
3. Clear browser cache
4. Retry upload

## Testing Checklist

- [ ] Upload JPEG image (<2MB)
- [ ] Upload PNG image (<2MB)
- [ ] Crop and resize image
- [ ] Verify compression works
- [ ] Check optimized URLs generate correctly
- [ ] Test responsive image URLs
- [ ] Verify thumbnail generation
- [ ] Test avatar with circular crop
- [ ] Check blur placeholder
- [ ] Verify images appear in Cloudinary dashboard
- [ ] Test on mobile device
- [ ] Verify upload progress indicator
- [ ] Test error handling
- [ ] Check success messages

## Performance Metrics

### Expected Results
- **Upload time**: 2-5 seconds for 1MB image
- **Load time**: <500ms for optimized images
- **File size reduction**: 40-60% with compression
- **Bandwidth savings**: 50-70% with optimization

## Support Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)
- [Unsigned Uploads](https://cloudinary.com/documentation/upload_images#unsigned_upload)
- [Optimization Guide](https://cloudinary.com/documentation/image_optimization)

## Future Enhancements

### Phase 1 (Current)
- ✅ Crop and resize functionality
- ✅ Automatic compression
- ✅ Optimization helpers
- ✅ Multiple upload components

### Phase 2 (Planned)
- [ ] Batch upload support
- [ ] Image filters and effects
- [ ] Advanced crop presets
- [ ] Video upload support
- [ ] AI-powered auto-cropping
- [ ] Background removal
- [ ] Smart object detection

### Phase 3 (Future)
- [ ] Signed uploads with backend
- [ ] Custom transformation API
- [ ] Image analytics
- [ ] Usage tracking dashboard
- [ ] Automated backup system
