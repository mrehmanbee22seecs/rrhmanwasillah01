import React, { useState } from 'react';
import { MapPin, Search } from 'lucide-react';

interface LocationPickerProps {
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  onLocationChange: (location: string) => void;
  onAddressChange: (address: string) => void;
  onCoordinatesChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({
  location,
  address = '',
  latitude,
  longitude,
  onLocationChange,
  onAddressChange,
  onCoordinatesChange,
}: LocationPickerProps) {
  const [showCoordinates, setShowCoordinates] = useState(
    latitude !== undefined && longitude !== undefined
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location Name
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="e.g., Community Center, Downtown Park"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Address
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="123 Main St, City, State, ZIP"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Optional: Provide a complete address for better directions
        </p>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowCoordinates(!showCoordinates)}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          {showCoordinates ? 'Hide' : 'Add'} GPS Coordinates
        </button>
      </div>

      {showCoordinates && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={latitude || ''}
              onChange={(e) => {
                const lat = parseFloat(e.target.value);
                if (!isNaN(lat)) {
                  onCoordinatesChange(lat, longitude || 0);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., 40.7128"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={longitude || ''}
              onChange={(e) => {
                const lng = parseFloat(e.target.value);
                if (!isNaN(lng)) {
                  onCoordinatesChange(latitude || 0, lng);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., -74.0060"
            />
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">
              Optional: Add precise GPS coordinates for mapping services
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
