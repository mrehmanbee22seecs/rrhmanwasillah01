import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Trash2 } from 'lucide-react';
import axios from 'axios';
import { compressImage } from '../utils/cloudinaryHelpers';
import { uploadWithSignature } from '../utils/cloudinarySignedUpload';

interface Field {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'number' | 'select' | 'color';
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

interface ContentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: Field[];
  initialData: Record<string, any>;
  onSave: (data: Record<string, any>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const ContentEditor: React.FC<ContentEditorProps> = ({
  isOpen,
  onClose,
  title,
  fields,
  initialData,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFormData(initialData);
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleImageUpload = async (fieldName: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setUploadingImages(prev => ({ ...prev, [fieldName]: true }));
    try {
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

      const res = await uploadWithSignature({
        file: fileToUpload,
        folder: 'content',
      });

      const url = res.secure_url;
      setFormData(prev => ({ ...prev, [fieldName]: url }));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to upload image. Please try again.';
      alert(errorMessage);
    } finally {
      setUploadingImages(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;

    setLoading(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-cream-white rounded-luxury-lg max-w-3xl w-full my-auto shadow-luxury-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-luxury-heading text-black">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block font-luxury-medium text-black mb-2">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === 'text' && (
                  <input
                    type="text"
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}

                {field.type === 'select' && field.options && (
                  <select
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    required={field.required}
                  >
                    {field.options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                )}

                {field.type === 'color' && (
                  <input
                    type="text"
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder={field.placeholder || 'e.g., bg-cream-elegant'}
                    required={field.required}
                  />
                )}

                {field.type === 'image' && (
                  <div className="space-y-4">
                    {formData[field.name] && (
                      <div className="relative">
                        <img
                          src={formData[field.name]}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-luxury border-2 border-vibrant-orange/30"
                          onError={(e) => {
                            console.error('Image preview error:', formData[field.name]);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, [field.name]: '' }))}
                          disabled={uploadingImages[field.name]}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {uploadingImages[field.name] && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-luxury">
                            <div className="text-center">
                              <Upload className="w-12 h-12 text-white animate-pulse mx-auto mb-2" />
                              <span className="text-white font-luxury-body">Uploading...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="border-2 border-dashed border-vibrant-orange/30 rounded-luxury p-6 text-center hover:border-vibrant-orange transition-colors">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(field.name, file);
                            e.target.value = '';
                          }
                        }}
                        className="hidden"
                        id={`upload-${field.name}`}
                        disabled={uploadingImages[field.name]}
                      />
                      <label
                        htmlFor={`upload-${field.name}`}
                        className={`cursor-pointer flex flex-col items-center ${uploadingImages[field.name] ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploadingImages[field.name] ? (
                          <>
                            <Upload className="w-8 h-8 text-vibrant-orange mb-2 animate-pulse" />
                            <span className="text-black font-luxury-body">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-vibrant-orange mb-2" />
                            <span className="text-black font-luxury-body font-semibold mb-1">
                              Click to upload image
                            </span>
                            <span className="text-sm text-gray-500 font-luxury-body">
                              JPEG, PNG, GIF, WebP up to 5MB
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-6 py-3 bg-red-500 text-white rounded-luxury hover:bg-red-600 disabled:opacity-50 font-luxury-semibold flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete
              </button>
            )}
            <div className="flex-1"></div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border-2 border-gray-300 text-black rounded-luxury hover:bg-gray-50 disabled:opacity-50 font-luxury-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-vibrant-orange text-white rounded-luxury hover:bg-vibrant-orange-light disabled:opacity-50 font-luxury-semibold flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContentEditor;
