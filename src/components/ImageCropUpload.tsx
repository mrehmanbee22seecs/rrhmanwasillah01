import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, AlertCircle, CheckCircle, Loader, Crop, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import axios from 'axios';
import { uploadWithSignature } from '../utils/cloudinarySignedUpload';

interface ImageCropUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  showPreview?: boolean;
  aspectRatio?: number;
  targetWidth?: number;
  targetHeight?: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const DEFAULT_MAX_SIZE_MB = 2;

export default function ImageCropUpload({
  label,
  value,
  onChange,
  folder = 'uploads',
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedFormats = ALLOWED_IMAGE_FORMATS,
  showPreview = true,
  aspectRatio,
  targetWidth = 1200,
  targetHeight = 800
}: ImageCropUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string>(value);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSource, setImageSource] = useState<string>('');
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setPreview(value);
  }, [value]);

  useEffect(() => {
    if (showCropModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showCropModal]);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!acceptedFormats.includes(file.type)) {
      const formats = acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ');
      return { valid: false, error: `Please upload a valid image file (${formats})` };
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size must be less than ${maxSizeMB}MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      };
    }

    if (file.size === 0) {
      return { valid: false, error: 'The selected file is empty' };
    }

    return { valid: true };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      e.target.value = '';
      return;
    }

    setError('');
    setSuccess(false);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSource(event.target?.result as string);
      setShowCropModal(true);

      const img = new Image();
      img.onload = () => {
        const containerAspect = aspectRatio || targetWidth / targetHeight;
        const imgAspect = img.width / img.height;

        let cropWidth = 100;
        let cropHeight = 100;

        if (imgAspect > containerAspect) {
          cropHeight = 100;
          cropWidth = (containerAspect / imgAspect) * 100;
        } else {
          cropWidth = 100;
          cropHeight = (imgAspect / containerAspect) * 100;
        }

        setCrop({
          x: (100 - cropWidth) / 2,
          y: (100 - cropHeight) / 2,
          width: cropWidth,
          height: cropHeight
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  const handleCropMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCropMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !cropContainerRef.current) return;

    const container = cropContainerRef.current;
    const rect = container.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    setCrop(prev => ({
      ...prev,
      x: Math.max(0, Math.min(100 - prev.width, prev.x + deltaX)),
      y: Math.max(0, Math.min(100 - prev.height, prev.y + deltaY))
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);

  const handleCropMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleCropMouseMove);
      document.addEventListener('mouseup', handleCropMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleCropMouseMove);
        document.removeEventListener('mouseup', handleCropMouseUp);
      };
    }
  }, [isDragging, handleCropMouseMove, handleCropMouseUp]);

  const getCroppedImage = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          reject(new Error('Canvas not found'));
          return;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not found'));
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cropX = (crop.x / 100) * img.width;
        const cropY = (crop.y / 100) * img.height;
        const cropWidth = (crop.width / 100) * img.width;
        const cropHeight = (crop.height / 100) * img.height;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);
        ctx.translate(-centerX, -centerY);

        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );

        ctx.restore();

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          0.9
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageSource;
    });
  };

  const uploadToCloudinary = async (blob: Blob): Promise<string> => {
    const res = await uploadWithSignature({
      file: blob,
      folder,
      onProgress: (p) => setUploadProgress(p),
    });
    return res.secure_url;
  };

  const handleCropConfirm = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const croppedBlob = await getCroppedImage();
      const uploadedUrl = await uploadToCloudinary(croppedBlob);

      setPreview(uploadedUrl);
      onChange(uploadedUrl);
      setSuccess(true);
      setShowCropModal(false);
      setSelectedFile(null);
      setImageSource('');

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error processing image:', err);
      setError(err.message || 'Failed to process image. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedFile(null);
    setImageSource('');
    setZoom(1);
    setRotation(0);
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
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-vibrant-orange/30 rounded-luxury cursor-pointer hover:border-vibrant-orange transition-colors bg-gray-50 hover:bg-vibrant-orange/5">
          <input
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-vibrant-orange mb-3" />
            <span className="font-luxury-semibold text-black mb-1">Click to upload and crop image</span>
            <span className="text-sm text-gray-500 font-luxury-body">
              {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} up to {maxSizeMB}MB
            </span>
            <span className="text-xs text-gray-400 font-luxury-body mt-1">
              Crop, resize, and optimize your image
            </span>
          </div>
        </label>
      )}

      {showCropModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-luxury p-6 max-w-4xl w-full my-auto">
            <h3 className="text-xl font-luxury-semibold text-black mb-4">Crop & Resize Image</h3>

            <div className="mb-4">
              <div
                ref={cropContainerRef}
                className="relative w-full h-96 bg-gray-900 rounded-luxury overflow-hidden"
                style={{ touchAction: 'none' }}
              >
                <img
                  ref={imageRef}
                  src={imageSource}
                  alt="Crop preview"
                  className="w-full h-full object-contain"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: 'center'
                  }}
                />
                <div
                  className="absolute border-2 border-vibrant-orange cursor-move"
                  style={{
                    left: `${crop.x}%`,
                    top: `${crop.y}%`,
                    width: `${crop.width}%`,
                    height: `${crop.height}%`,
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                  }}
                  onMouseDown={handleCropMouseDown}
                >
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="border border-vibrant-orange/30" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-luxury-medium text-black mb-2">
                  <ZoomIn className="w-4 h-4" />
                  Zoom: {zoom.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-luxury-medium text-black mb-2">
                  <RotateCw className="w-4 h-4" />
                  Rotation: {rotation}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {uploading && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Loader className="w-4 h-4 text-vibrant-orange animate-spin" />
                  <span className="text-sm font-luxury-body text-black">Uploading... {uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-vibrant-orange transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCropCancel}
                disabled={uploading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-luxury hover:bg-gray-50 transition-colors font-luxury-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                disabled={uploading}
                className="px-4 py-2 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-dark transition-colors font-luxury-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Crop className="w-4 h-4" />
                {uploading ? 'Processing...' : 'Crop & Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
