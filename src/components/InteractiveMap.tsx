import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader } from 'lucide-react';

interface LocationSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

interface InteractiveMapProps {
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  onLocationChange: (location: string) => void;
  onAddressChange: (address: string) => void;
  onCoordinatesChange: (lat: number, lng: number) => void;
}

export default function InteractiveMap({
  location,
  address = '',
  latitude,
  longitude,
  onLocationChange,
  onAddressChange,
  onCoordinatesChange,
}: InteractiveMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=5`
        );
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  const handleSelectLocation = (suggestion: LocationSuggestion) => {
    setSelectedLocation(suggestion);
    setShowSuggestions(false);

    const locationName = suggestion.address.road || suggestion.display_name.split(',')[0];
    const fullAddress = `${suggestion.address.road || ''}, ${suggestion.address.city || ''}, ${suggestion.address.state || ''}, ${suggestion.address.country || ''}`.replace(/, ,/g, ',').trim();

    onLocationChange(locationName);
    onAddressChange(fullAddress);
    onCoordinatesChange(parseFloat(suggestion.lat), parseFloat(suggestion.lon));

    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-luxury-medium text-black mb-2">
          Search Location *
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="w-full pl-10 pr-10 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
            placeholder="Start typing to search for a location..."
          />
          {isLoading && (
            <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 text-vibrant-orange w-5 h-5 animate-spin" />
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white border-2 border-vibrant-orange/30 rounded-luxury shadow-luxury max-h-64 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSelectLocation(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-vibrant-orange/10 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 text-vibrant-orange mr-2 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-luxury-semibold text-black text-sm">
                      {suggestion.display_name.split(',')[0]}
                    </div>
                    <div className="text-xs text-gray-600 font-luxury-body">
                      {suggestion.display_name}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block font-luxury-medium text-black mb-2">
          Location Name *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
            placeholder="e.g., Community Center, Downtown Park"
            required
          />
        </div>
      </div>

      <div>
        <label className="block font-luxury-medium text-black mb-2">
          Full Address *
        </label>
        <textarea
          rows={2}
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
          placeholder="Street, City, State, Country"
        />
      </div>

      {latitude && longitude && (
        <div className="p-4 bg-vibrant-orange/5 rounded-luxury border border-vibrant-orange/20">
          <div className="flex items-center text-sm text-black">
            <MapPin className="w-4 h-4 text-vibrant-orange mr-2" />
            <span className="font-luxury-semibold">GPS Coordinates: </span>
            <span className="ml-2 font-luxury-body">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
          </div>
        </div>
      )}

      {selectedLocation && (
        <div className="p-4 bg-green-50 rounded-luxury border border-green-200">
          <div className="flex items-start">
            <MapPin className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-luxury-semibold text-black text-sm mb-1">Location Selected</div>
              <div className="text-xs text-gray-700 font-luxury-body">
                {selectedLocation.display_name}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
