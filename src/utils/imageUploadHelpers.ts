export const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
export const DEFAULT_MAX_SIZE_MB = 5;
export const MAX_SIZE_BYTES = DEFAULT_MAX_SIZE_MB * 1024 * 1024;

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export const validateImageFile = (
  file: File,
  maxSizeMB: number = DEFAULT_MAX_SIZE_MB,
  acceptedFormats: string[] = ALLOWED_IMAGE_FORMATS
): ImageValidationResult => {
  if (!acceptedFormats.includes(file.type)) {
    const formats = acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ');
    return { valid: false, error: `Please upload a valid image file (${formats})` };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  if (file.size === 0) {
    return { valid: false, error: 'The selected file is empty' };
  }

  return { valid: true };
};

export const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
};

export const generateUniqueFileName = (folder: string, originalFileName: string): string => {
  const timestamp = Date.now();
  const sanitized = sanitizeFileName(originalFileName);
  return `${folder}/${timestamp}_${sanitized}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const getAcceptedFormatsString = (formats: string[] = ALLOWED_IMAGE_FORMATS): string => {
  return formats.map(f => f.split('/')[1].toUpperCase()).join(', ');
};
