import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Loader, RefreshCw } from 'lucide-react';
import axios, { CancelTokenSource } from 'axios';
import { compressImage } from '../utils/cloudinaryHelpers';
import { uploadWithSignature } from '../utils/cloudinarySignedUpload';

interface EnhancedImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  showPreview?: boolean;
}

const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const DEFAULT_MAX_SIZE_MB = 2;
const UPLOAD_TIMEOUT_MS = 120000; // 2 minutes timeout
const STALL_CHECK_INTERVAL_MS = 5000; // Check for stall every 5 seconds

export default function EnhancedImageUpload({
  label,
  value,
  onChange,
  folder = 'uploads',
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedFormats = ALLOWED_IMAGE_FORMATS,
  showPreview = true
}: EnhancedImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string>(value);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [uploadAttempts, setUploadAttempts] = useState(0);

  // Refs for tracking and cleanup
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stallCheckRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressRef = useRef<number>(0);
  const lastProgressTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    setPreview(value);
  }, [value]);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (stallCheckRef.current) clearInterval(stallCheckRef.current);
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel();
      }
    };
  }, []);

  /**
   * Validate file before upload
   */
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!acceptedFormats.includes(file.type)) {
      const formats = acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ');
      return { valid: false, error: `Please upload a valid image file (${formats})` };
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return { valid: false, error: `File size must be less than ${maxSizeMB}MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB` };
    }

    if (file.size === 0) {
      return { valid: false, error: 'The selected file is empty' };
    }

    return { valid: true };
  };


  /**
   * Check if upload has stalled (progress not changing)
   */
  const checkForStall = () => {
    const currentTime = Date.now();
    const timeSinceLastProgress = currentTime - lastProgressTimeRef.current;

    // If progress hasn't changed in 10 seconds and we're between 1-99%, consider it stalled
    if (timeSinceLastProgress > 10000 && lastProgressRef.current > 0 && lastProgressRef.current < 99) {
      console.error('Upload appears to be stalled at', lastProgressRef.current + '%');

      // Cancel current upload
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel();
      }

      setError(`Upload stalled at ${lastProgressRef.current}%. Retrying...`);

      // Auto-retry if we haven't exceeded max attempts
      if (uploadAttempts < 3) {
        setTimeout(() => {
          const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
          if (fileInput?.files?.[0]) {
            handleFileChange({ target: fileInput } as any);
          }
        }, 2000);
      }
    }
  };

  /**
   * Upload file to Cloudinary with proper error handling
   */
  const uploadFile = async (file: File): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Reset state
        setError('');
        setSuccess(false);
        setUploading(true);
        setUploadProgress(0);
        lastProgressRef.current = 0;
        lastProgressTimeRef.current = Date.now();

        // Try to compress image if it's large
        let fileToUpload: File | Blob = file;
        if (file.size > 1024 * 1024) { // If larger than 1MB
          try {
            console.log('Compressing image from', (file.size / (1024 * 1024)).toFixed(2), 'MB');
            fileToUpload = await compressImage(file);
            console.log('Compressed to', ((fileToUpload.size) / (1024 * 1024)).toFixed(2), 'MB');
          } catch (compressError) {
            console.warn('Compression failed, uploading original:', compressError);
            fileToUpload = file;
          }
        }

        console.log('Starting Cloudinary upload. Size:', (fileToUpload.size / 1024).toFixed(2), 'KB');

        // Create cancel token
        const cancelToken = axios.CancelToken.source();
        cancelTokenRef.current = cancelToken;

        // Set timeout to prevent infinite waiting
        timeoutRef.current = setTimeout(() => {
          console.error('Upload timeout reached');
          cancelToken.cancel('Upload timeout');
          reject(new Error('Upload timeout - please check your connection and try again'));
        }, UPLOAD_TIMEOUT_MS);

        // Start stall detection
        stallCheckRef.current = setInterval(checkForStall, STALL_CHECK_INTERVAL_MS);

        const res = await uploadWithSignature({
          file: fileToUpload,
          folder,
          onProgress: (p) => {
            setUploadProgress(p);
            lastProgressRef.current = p;
            lastProgressTimeRef.current = Date.now();
          },
        });

        // Cleanup
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (stallCheckRef.current) clearInterval(stallCheckRef.current);

        const downloadURL = res.secure_url;
        console.log('Upload completed. URL:', downloadURL);
        resolve(downloadURL);
      } catch (error: any) {
        // Cleanup
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (stallCheckRef.current) clearInterval(stallCheckRef.current);

        console.error('Upload error:', error);

        let errorMessage = 'Upload failed. ';
        if (axios.isCancel(error)) {
          errorMessage += 'Upload was cancelled.';
        } else if (error.response) {
          errorMessage += error.response.data?.error?.message || 'Server error occurred.';
        } else if (error.request) {
          errorMessage += 'No response from server. Please check your connection.';
        } else {
          errorMessage += error.message || 'Please try again.';
        }

        reject(new Error(errorMessage));
      }
    });
  };

  /**
   * Handle file selection and upload
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess(false);
    setUploadAttempts(prev => prev + 1);

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      e.target.value = '';
      return;
    }

    try {
      const downloadURL = await uploadFile(file);

      setPreview(downloadURL);
      onChange(downloadURL);
      setSuccess(true);
      setUploadAttempts(0); // Reset attempts on success

      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const errorMessage = error?.message || 'Failed to upload image. Please try again.';
      setError(errorMessage);

      // Suggest retry if we haven't exceeded max attempts
      if (uploadAttempts < 3) {
        setError(errorMessage + ' (Auto-retry in 2 seconds...)');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  /**
   * Handle manual retry
   */
  const handleRetry = () => {
    const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
    fileInput?.click();
  };

  /**
   * Remove uploaded image
   */
  const handleRemove = () => {
    setPreview('');
    onChange('');
    setError('');
    setSuccess(false);
    setUploadAttempts(0);
  };

  /**
   * Cancel ongoing upload
   */
  const handleCancel = () => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Upload cancelled by user');
      setUploading(false);
      setUploadProgress(0);
      setError('Upload cancelled');
    }
  };

  return (
    <div>
      <label className="block font-luxury-medium text-black mb-2">
        {label}
      </label>

      {/* Error Banner */}
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-luxury flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-sm text-red-700 font-luxury-body">{error}</span>
            {uploadAttempts < 3 && !uploading && (
              <button
                onClick={handleRetry}
                className="ml-2 text-sm text-red-600 underline hover:text-red-800"
              >
                Retry Upload
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success Banner */}
      {success && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-luxury flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-700 font-luxury-body">Image uploaded successfully!</span>
        </div>
      )}

      {/* Upload Attempts Warning */}
      {uploadAttempts >= 3 && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-luxury flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-yellow-700 font-luxury-body">
            Multiple upload attempts detected. Please check your internet connection or try a smaller image.
          </span>
        </div>
      )}

      {/* Preview or Upload Area */}
      {preview && showPreview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-luxury border-2 border-vibrant-orange/30"
            onError={(e) => {
              console.error('Image preview error:', preview);
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
              <div className="text-center w-full px-4">
                <Loader className="w-12 h-12 text-white animate-spin mx-auto mb-2" />
                <span className="text-white font-luxury-body block mb-2">Uploading... {uploadProgress}%</span>
                <div className="w-full max-w-xs mx-auto h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-vibrant-orange transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <button
                  onClick={handleCancel}
                  className="mt-2 text-sm text-white underline hover:text-gray-200"
                >
                  Cancel Upload
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-vibrant-orange/30 rounded-luxury cursor-pointer hover:border-vibrant-orange transition-colors bg-gray-50 hover:bg-vibrant-orange/5">
          <input
            id="file-upload-input"
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <div className="flex flex-col items-center w-full px-4">
              <Loader className="w-12 h-12 text-vibrant-orange animate-spin mb-3" />
              <span className="font-luxury-body text-black mb-2">Uploading... {uploadProgress}%</span>
              <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-vibrant-orange transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 font-luxury-body mt-2">
                {uploadProgress < 30 && 'Initializing upload...'}
                {uploadProgress >= 30 && uploadProgress < 70 && 'Uploading to server...'}
                {uploadProgress >= 70 && uploadProgress < 100 && 'Finalizing...'}
                {uploadProgress === 100 && 'Processing...'}
              </span>
              <button
                onClick={handleCancel}
                className="mt-2 text-sm text-vibrant-orange underline hover:text-vibrant-orange-dark"
              >
                Cancel Upload
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-12 h-12 text-vibrant-orange mb-3" />
              <span className="font-luxury-semibold text-black mb-1">Click to upload image</span>
              <span className="text-sm text-gray-500 font-luxury-body">
                {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} up to {maxSizeMB}MB
              </span>
              {uploadAttempts > 0 && (
                <span className="text-xs text-gray-400 font-luxury-body mt-1">
                  Attempt {uploadAttempts + 1}/3
                </span>
              )}
            </div>
          )}
        </label>
      )}
    </div>
  );
}
