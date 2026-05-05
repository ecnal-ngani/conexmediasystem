'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Search, X } from 'lucide-react';

// Fix for default Leaflet icon paths in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

// Since we are running outside a normal web server deployment sometimes, 
// we override with unpkg CDNs for icons to prevent missing asset errors.
const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

interface MapPickerProps {
  onLocationSelect: (address: string) => void;
  onCancel: () => void;
}

export default function MapPicker({ onLocationSelect, onCancel }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Place marker and reverse-geocode
  const placeMarker = useCallback(async (lat: number, lng: number, address?: string) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    }

    if (address) {
      setSelectedAddress(address);
      markerRef.current.bindPopup(`<b>Selected:</b><br/>${address}`).openPopup();
      return;
    }

    // Reverse geocode if no address provided (click on map)
    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      if (data?.display_name) {
        setSelectedAddress(data.display_name);
        markerRef.current!.bindPopup(`<b>Selected:</b><br/>${data.display_name}`).openPopup();
      } else {
        setSelectedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch {
      setSelectedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Forward geocode search with debounce
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setShowResults(true);
      try {
        const encoded = encodeURIComponent(query.trim());
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=5&countrycodes=ph&addressdetails=1`
        );
        const data: NominatimResult[] = await res.json();
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  }, []);

  // Select a search result
  const handleSelectResult = useCallback((result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    mapInstanceRef.current?.setView([lat, lng], 17, { animate: true });
    placeMarker(lat, lng, result.display_name);

    setSearchQuery(result.display_name);
    setShowResults(false);
    setSearchResults([]);
  }, [placeMarker]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current).setView([14.5995, 120.9842], 12);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Try to get user's current location if possible
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Guard: map may have been destroyed before geolocation resolves
          if (!mapInstanceRef.current) return;
          try {
            const latlng = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
            mapInstanceRef.current.setView(latlng, 15);
          } catch (e) {
            console.warn('[MapPicker] Could not set geolocation view:', e);
          }
        },
        () => {},
        { timeout: 5000 }
      );
    }

    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      placeMarker(lat, lng);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [placeMarker]);

  const handleConfirm = () => {
    if (selectedAddress) {
       onLocationSelect(selectedAddress);
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-full relative rounded-xl overflow-hidden bg-white">
      {/* Search Bar */}
      <div ref={searchContainerRef} className="absolute top-4 left-4 right-4 z-[400] pointer-events-auto">
        <div className="bg-white rounded-2xl shadow-xl border overflow-visible">
          <div className="flex items-center gap-2 px-4 py-3">
            {isSearching ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
            ) : (
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
              placeholder="Search for a street, barangay, or city..."
              className="flex-1 text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none bg-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]); setShowResults(false); }}
                className="p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>

          {/* Selected address display */}
          {selectedAddress && !showResults && (
            <div className="px-4 pb-3 pt-0 border-t border-slate-100">
              <div className="flex items-start gap-2 pt-2">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-slate-500 leading-tight">{selectedAddress}</p>
              </div>
            </div>
          )}

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="border-t border-slate-100 max-h-[200px] overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center gap-3 px-4 py-6 justify-center">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="text-sm text-slate-400 font-medium">Searching locations...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-slate-400 font-medium">No results found.</p>
                  <p className="text-xs text-slate-300 mt-1">Try a different search term.</p>
                </div>
              ) : (
                searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => handleSelectResult(result)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                  >
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm text-slate-700 font-medium leading-tight">{result.display_name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      
      <div ref={mapRef} className="w-full flex-1 z-0 bg-slate-100" />
      
      <div className="absolute bottom-4 left-4 right-4 z-[400] flex gap-3 pointer-events-auto">
        <Button variant="outline" onClick={onCancel} className="flex-1 bg-white h-12 shadow-md rounded-2xl font-bold">
          Cancel
        </Button>
        <Button 
           onClick={handleConfirm} 
           disabled={!selectedAddress || isGeocoding}
           className="flex-1 bg-primary text-white h-12 shadow-md font-bold rounded-2xl"
        >
          Confirm Location
        </Button>
      </div>
    </div>
  );
}
