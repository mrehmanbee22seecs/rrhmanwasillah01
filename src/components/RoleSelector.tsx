import React from 'react';
import { UserRole } from '../types/user';
import { ROLE_INFO, getRoleIcon } from '../utils/roleInfo';
import { CheckCircle } from 'lucide-react';

interface RoleSelectorProps {
  selectedRole: UserRole | null;
  onRoleSelect: (role: UserRole) => void;
  disabled?: boolean;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onRoleSelect, disabled = false }) => {
  const roles: UserRole[] = ['student', 'ngo', 'volunteer']; // Exclude admin from selection

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-luxury-heading text-black mb-2">I am a...</h3>
        <p className="text-sm text-black/70 mb-4">Select the option that best describes you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role) => {
          const roleInfo = ROLE_INFO[role];
          const Icon = getRoleIcon(role);
          const isSelected = selectedRole === role;

          return (
            <button
              key={role}
              type="button"
              onClick={() => !disabled && onRoleSelect(role)}
              disabled={disabled}
              className={`
                relative p-6 rounded-2xl border-2 transition-all duration-300 text-left
                ${isSelected 
                  ? 'border-vibrant-orange bg-vibrant-orange/5 shadow-lg scale-105' 
                  : 'border-gray-200 bg-white hover:border-vibrant-orange/50 hover:shadow-md'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-vibrant-orange rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className={`w-12 h-12 ${roleInfo.color} rounded-full flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>

              {/* Title */}
              <h4 className="text-xl font-luxury-heading text-black mb-2">{roleInfo.name}</h4>

              {/* Description */}
              <p className="text-sm text-black/70 mb-4">{roleInfo.description}</p>

              {/* Features */}
              <ul className="space-y-1">
                {roleInfo.features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="text-xs text-black/60 flex items-center">
                    <span className="w-1.5 h-1.5 bg-vibrant-orange rounded-full mr-2"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {selectedRole && (
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Selected:</strong> {ROLE_INFO[selectedRole].name}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            You can change this later in your profile settings
          </p>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;

