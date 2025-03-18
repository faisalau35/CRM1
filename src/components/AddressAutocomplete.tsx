import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddressAutocompleteProps {
  onAddressSelect: (addressData: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  }) => void;
  disabled?: boolean;
  apiKey: string;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  name?: string;
  useGeolocation?: boolean;
}

// Updated to match the actual API response structure
interface GeocodingResult {
  formatted?: string;
  city?: string;
  state?: string;
  state_code?: string;
  postcode?: string;
  country?: string;
  street?: string;
  housenumber?: string;
  county?: string;
  district?: string;
  suburb?: string;
  name?: string;
  result_type?: string;
  rank?: {
    confidence?: number;
  };
  address_line1?: string;
  address_line2?: string;
  properties?: any; // Fallback for other potential structures
}

export function AddressAutocomplete({
  onAddressSelect,
  disabled = false,
  apiKey,
  label = "Address",
  placeholder = "Start typing your address...",
  initialValue = "",
  name = "address",
  useGeolocation = true,
}: AddressAutocompleteProps) {
  const [address, setAddress] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get user's location if geolocation is enabled
  useEffect(() => {
    if (useGeolocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
        }
      );
    }
  }, [useGeolocation]);

  // Handle clicks outside of the component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only process if showing suggestions
      if (!showSuggestions) return;
      
      const target = event.target as HTMLElement;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (text: string) => {
    if (!text || text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      // Build the API URL with optional geolocation bias
      let url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&limit=5&format=json&apiKey=${apiKey}`;
      
      // Add location bias if available
      if (userLocation) {
        url += `&bias=proximity:${userLocation.lon},${userLocation.lat}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('Address API error:', response.status, response.statusText);
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      
      const data = await response.json();
      
      if (data && data.results) {
        // Store the raw response data without filtering
        const results = data.results;
        
        if (results.length > 0) {
          setSuggestions(results);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        console.warn('Invalid or empty response from address API:', data);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, userLocation]);

  // Debounce the address input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (address.length >= 3) {
        fetchSuggestions(address);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [address, fetchSuggestions]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    
    if (!value || value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    if (!suggestion) {
      console.error('Invalid suggestion selected');
      return;
    }
    
    try {
      // Get formatted address directly from the suggestion
      const formattedAddress = suggestion.formatted || 
                              suggestion.address_line1 || 
                              `${suggestion.housenumber || ''} ${suggestion.street || ''}`.trim();
      
      setAddress(formattedAddress);
      setShowSuggestions(false);
      
      // Parse the address components
      const addressData = {
        address: formattedAddress,
        city: suggestion.city || suggestion.district || suggestion.county || '',
        state: suggestion.state_code || suggestion.state || '',
        zipCode: suggestion.postcode || '',
      };
      
      onAddressSelect(addressData);
    } catch (error) {
      console.error("Error processing suggestion:", error, suggestion);
    }
  };

  return (
    <div className="space-y-2 relative" ref={containerRef} style={{ zIndex: 100 }}>
      <Label htmlFor="address-autocomplete">{label}</Label>
      <Input
        id="address-autocomplete"
        name={name}
        value={address}
        onChange={handleAddressChange}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        ref={inputRef}
        onFocus={() => {
          if (address.length >= 3) {
            fetchSuggestions(address);
          }
        }}
      />
      
      {isLoading && (
        <div className="absolute right-3 top-9">
          <div className="animate-spin h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent"></div>
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 shadow-xl rounded-md overflow-y-auto" 
          style={{ zIndex: 9999, position: 'absolute' }}
        >
          <div className="font-bold bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm">
            Address Suggestions ({suggestions.length})
          </div>
          <div className="max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => {
              // Get the formatted address directly from the result
              const formattedAddress = suggestion.formatted || 
                                      suggestion.address_line1 || 
                                      `${suggestion.housenumber || ''} ${suggestion.street || ''}`.trim() ||
                                      'Unknown location';
              
              return (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer text-sm border-t border-gray-200 dark:border-gray-700"
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{ color: 'black', fontWeight: 'bold' }}
                >
                  <div className="font-medium text-black">
                    {formattedAddress}
                  </div>
                  <div className="text-xs text-black mt-1">
                    {suggestion.city || ''} {suggestion.state_code ? `, ${suggestion.state_code}` : suggestion.state ? `, ${suggestion.state}` : ''} {suggestion.postcode ? ` ${suggestion.postcode}` : ''}
                  </div>
                  {suggestion.rank?.confidence !== undefined && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Confidence: {Math.round(suggestion.rank.confidence * 100)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Development debug information removed */}
    </div>
  );
} 