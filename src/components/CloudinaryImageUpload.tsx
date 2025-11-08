import React, { useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { compressImage } from '../utils/cloudinaryHelpers';
import { uploadWithSignature } from '../utils/cloudinarySignedUpload';

interface CloudinaryImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  showPreview?: boolean;
}

const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const DEFAULT_MAX_SIZE_MB = 2;

export default function CloudinaryImageUpload({
  label,
  value,
  onChange,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedFormats = ALLOWED_IMAGE_FORMATS,
  showPreview = true
}: CloudinaryImageUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<string>(value);

  React.useEffect(() => {
    setPreview(value);
  }, [value]);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Only image files are allowed.' };
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File too large. Max ${maxSizeMB}MB. Current: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      };
    }

    if (file.size === 0) {
      return { valid: false, error: 'The selected file is empty' };
    }

    return { valid: true };
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      event.target.value = '';
      return;
    }

    setError('');
    setSuccess(false);
    setUploading(true);
    setUploadProgress(0);

    let fileToUpload: File | Blob = file;

    if (file.size > 1024 * 1024) {
      try {
        console.log('Compressing image from', (file.size / (1024 * 1024)).toFixed(2), 'MB');
        fileToUpload = await compressImage(file, 1920, 1080, 0.85);
        console.log('Compressed to', (fileToUpload.size / (1024 * 1024)).toFixed(2), 'MB');
      } catch (compressError) {
        console.warn('Compression failed, uploading original:', compressError);
        fileToUpload = file;
      }
    }

    try {
      const res = await uploadWithSignature({
        file: fileToUpload,
        folder: 'uploads',
        onProgress: (p) => setUploadProgress(p),
      });

      const uploadedUrl = res.secure_url;
      setPreview(uploadedUrl);
      onChange(uploadedUrl);
      setUploadProgress(100);
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      const errorMessage = err?.message || 'Upload failed. Please try again.';
      setError(errorMessage);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
      event.target.value = '';
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    setError('');
    setSuccess(false);
  };

  return (
    <div>
      <label className="block font-luxury-medium text-black mb-2">
        {label}
      </label>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-luxury flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700 font-luxury-body">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-luxury flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-700 font-luxury-body">Image uploaded successfully!</span>
        </div>
      )}

      {preview && showPreview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-luxury border-2 border-vibrant-orange/30"
            onError={() => {
              setError('Failed to load image preview');
              setPreview('');
            }}
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-luxury">
              <div className="text-center">
                <Loader className="w-12 h-12 text-white animate-spin mx-auto mb-2" />
                <span className="text-white font-luxury-body">Uploading... {uploadProgress}%</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-vibrant-orange/30 rounded-luxury cursor-pointer hover:border-vibrant-orange transition-colors bg-gray-50 hover:bg-vibrant-orange/5">
          <input
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader className="w-12 h-12 text-vibrant-orange animate-spin mb-3" />
              <span className="font-luxury-body text-black mb-2">
                {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Processing...'}
              </span>
              <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-vibrant-orange transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-12 h-12 text-vibrant-orange mb-3" />
              <span className="font-luxury-semibold text-black mb-1">Click to upload image</span>
              <span className="text-sm text-gray-500 font-luxury-body">
                {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} up to {maxSizeMB}MB
              </span>
            </div>
          )}
        </label>
      )}
    </div>
  );
}
