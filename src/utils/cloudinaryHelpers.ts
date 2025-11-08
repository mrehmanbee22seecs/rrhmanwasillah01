/**
 * Cloudinary Helper Functions
 *
 * Utilities for image optimization, transformation, and URL generation
 * with Cloudinary's powerful image processing capabilities.
 */

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'pad' | 'limit';
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
  quality?: 'auto' | 'auto:good' | 'auto:best' | 'auto:eco' | 'auto:low' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
  dpr?: number;
  aspectRatio?: string;
  effect?: string;
  radius?: number | string;
}

/**
 * Generate optimized Cloudinary URL with transformations
 *
 * @param url - Original Cloudinary URL
 * @param options - Transformation options
 * @returns Transformed Cloudinary URL
 */
export function getOptimizedCloudinaryUrl(
  url: string,
  options: CloudinaryTransformOptions = {}
): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  const {
    width,
    height,
    crop = 'fill',
    gravity = 'auto',
    quality = 'auto:good',
    format = 'auto',
    dpr,
    aspectRatio,
    effect,
    radius
  } = options;

  const transformations: string[] = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (aspectRatio) transformations.push(`ar_${aspectRatio}`);
  if (crop) transformations.push(`c_${crop}`);
  if (gravity) transformations.push(`g_${gravity}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);
  if (dpr) transformations.push(`dpr_${dpr}`);
  if (effect) transformations.push(`e_${effect}`);
  if (radius) transformations.push(`r_${radius}`);

  const transformString = transformations.join(',');

  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;

  return url.slice(0, uploadIndex + 8) + transformString + '/' + url.slice(uploadIndex + 8);
}

/**
 * Generate responsive image URLs for different screen sizes
 *
 * @param url - Original Cloudinary URL
 * @param sizes - Array of width sizes
 * @returns Object with URLs for each size
 */
export function getResponsiveImageUrls(
  url: string,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1920]
): Record<number, string> {
  const urls: Record<number, string> = {};

  sizes.forEach(width => {
    urls[width] = getOptimizedCloudinaryUrl(url, {
      width,
      crop: 'fill',
      quality: 'auto:good',
      format: 'auto'
    });
  });

  return urls;
}

/**
 * Generate thumbnail URL
 *
 * @param url - Original Cloudinary URL
 * @param size - Thumbnail size (default: 150)
 * @returns Thumbnail URL
 */
export function getThumbnailUrl(url: string, size: number = 150): string {
  return getOptimizedCloudinaryUrl(url, {
    width: size,
    height: size,
    crop: 'thumb',
    gravity: 'face',
    quality: 'auto:good',
    format: 'auto'
  });
}

/**
 * Generate avatar URL with circular crop
 *
 * @param url - Original Cloudinary URL
 * @param size - Avatar size (default: 200)
 * @returns Avatar URL
 */
export function getAvatarUrl(url: string, size: number = 200): string {
  return getOptimizedCloudinaryUrl(url, {
    width: size,
    height: size,
    crop: 'fill',
    gravity: 'face',
    radius: 'max',
    quality: 'auto:good',
    format: 'auto'
  });
}

/**
 * Generate blur placeholder URL for lazy loading
 *
 * @param url - Original Cloudinary URL
 * @returns Blurred placeholder URL
 */
export function getBlurPlaceholderUrl(url: string): string {
  return getOptimizedCloudinaryUrl(url, {
    width: 40,
    quality: 'auto:low',
    format: 'auto',
    effect: 'blur:1000'
  });
}

/**
 * Validate if URL is a Cloudinary URL
 *
 * @param url - URL to validate
 * @returns True if URL is from Cloudinary
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
}

/**
 * Extract public ID from Cloudinary URL
 *
 * @param url - Cloudinary URL
 * @returns Public ID or null
 */
export function extractPublicId(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null;

  const matches = url.match(/\/v\d+\/(.+?)(?:\.[a-z]+)?$/);
  return matches ? matches[1] : null;
}

/**
 * Client-side image compression before upload
 *
 * @param file - File to compress
 * @param maxWidth - Maximum width (default: 1920)
 * @param maxHeight - Maximum height (default: 1080)
 * @param quality - Compression quality 0-1 (default: 0.85)
 * @returns Compressed blob
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

/**
 * Upload configuration for Cloudinary
 */
export interface CloudinaryUploadConfig {
  cloudName: string;
  uploadPreset: string;
  folder?: string;
  tags?: string[];
  context?: Record<string, string>;
  transformation?: CloudinaryTransformOptions;
}

/**
 * Get Cloudinary upload configuration from environment
 *
 * @param folder - Upload folder (default: 'uploads')
 * @returns Upload configuration
 */
export function getCloudinaryConfig(folder: string = 'uploads'): CloudinaryUploadConfig {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration missing. Please check your environment variables.');
  }

  return {
    cloudName,
    uploadPreset,
    folder: `wasilah/${folder}`,
    transformation: {
      quality: 'auto:good',
      format: 'auto'
    }
  };
}

/**
 * Preset image dimensions for consistent sizing
 */
export const IMAGE_PRESETS = {
  profile: { width: 400, height: 400, crop: 'fill' as const },
  thumbnail: { width: 150, height: 150, crop: 'thumb' as const },
  card: { width: 600, height: 400, crop: 'fill' as const },
  banner: { width: 1200, height: 400, crop: 'fill' as const },
  hero: { width: 1920, height: 800, crop: 'fill' as const },
  gallery: { width: 800, height: 600, crop: 'fill' as const }
};

/**
 * Get preset configuration by name
 *
 * @param preset - Preset name
 * @returns Transformation options
 */
export function getImagePreset(preset: keyof typeof IMAGE_PRESETS): CloudinaryTransformOptions {
  return {
    ...IMAGE_PRESETS[preset],
    quality: 'auto:good',
    format: 'auto',
    gravity: 'auto'
  };
}
