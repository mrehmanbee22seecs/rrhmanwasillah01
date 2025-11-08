import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { HeadInfo } from '../types/submissions';
import ImageUploadField from './ImageUploadField';

interface HeadsManagerProps {
  heads: HeadInfo[];
  onChange: (heads: HeadInfo[]) => void;
  folder: string;
  label?: string;
}

const HeadsManager: React.FC<HeadsManagerProps> = ({
  heads,
  onChange,
  folder,
  label = "Heads"
}) => {
  const addHead = () => {
    const newHead: HeadInfo = {
      id: uuidv4(),
      name: '',
      designation: '',
      image: ''
    };
    onChange([...heads, newHead]);
  };

  const removeHead = (id: string) => {
    onChange(heads.filter(head => head.id !== id));
  };

  const updateHead = (id: string, field: keyof HeadInfo, value: string) => {
    onChange(heads.map(head =>
      head.id === id ? { ...head, [field]: value } : head
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-luxury-medium text-black">{label}</h4>
        <button
          type="button"
          onClick={addHead}
          className="flex items-center px-4 py-2 text-vibrant-orange hover:bg-vibrant-orange/10 rounded-luxury transition-colors font-luxury-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add {label.slice(0, -1)}
        </button>
      </div>

      {heads.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-luxury">
          <p className="text-gray-500 font-luxury-body">No {label.toLowerCase()} added yet. Click "Add {label.slice(0, -1)}" to get started.</p>
        </div>
      )}

      {heads.map((head, index) => (
        <div key={head.id} className="p-6 border-2 border-gray-200 rounded-luxury bg-white space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-luxury-semibold text-black">{label.slice(0, -1)} {index + 1}</h5>
            {heads.length > 0 && (
              <button
                type="button"
                onClick={() => removeHead(head.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-luxury transition-colors"
                title="Remove"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-luxury-medium text-black mb-2">Name</label>
              <input
                type="text"
                value={head.name}
                onChange={(e) => updateHead(head.id, 'name', e.target.value)}
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                placeholder="Enter name"
              />
            </div>

            <div>
              <label className="block font-luxury-medium text-black mb-2">Designation/Title</label>
              <input
                type="text"
                value={head.designation}
                onChange={(e) => updateHead(head.id, 'designation', e.target.value)}
                className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                placeholder="e.g., Project Manager, Coordinator"
              />
            </div>

            <div className="md:col-span-2">
              <ImageUploadField
                label="Profile Photo"
                value={head.image || ''}
                onChange={(url) => updateHead(head.id, 'image', url)}
                folder={folder}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HeadsManager;
