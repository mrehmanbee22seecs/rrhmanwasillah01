import React from 'react';
import { Settings } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';

interface EditButtonProps {
  onClick: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const EditButton: React.FC<EditButtonProps> = ({ onClick, position = 'top-right' }) => {
  const { canEdit } = useAdmin();

  if (!canEdit) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <button
      onClick={onClick}
      className={`absolute ${positionClasses[position]} z-50 bg-vibrant-orange hover:bg-vibrant-orange-light text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group`}
      title="Edit this section"
    >
      <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
    </button>
  );
};

export default EditButton;
