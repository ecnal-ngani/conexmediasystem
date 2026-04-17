'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin } from 'lucide-react';

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

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize Map to Manila by default
    const map = L.map(mapRef.current).setView([14.5995, 120.9842], 12);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Try to get user's current location if possible
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
          map.setView(latlng, 15);
        },
        () => {}, // Ignore errors silently
        { timeout: 5000 }
      );
    }

    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      }

      setIsGeocoding(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        if (data && data.display_name) {
          setSelectedAddress(data.display_name);
          markerRef.current.bindPopup(`<b>Selected:</b><br/>${data.display_name}`).openPopup();
        } else {
           setSelectedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      } catch (err) {
        setSelectedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } finally {
        setIsGeocoding(false);
      }
    });

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleConfirm = () => {
    if (selectedAddress) {
       onLocationSelect(selectedAddress);
    }
  };

  return (
    <div className="flex flex-col h-[500px] w-full relative rounded-xl overflow-hidden bg-white">
      <div className="absolute top-4 left-4 right-4 z-[400] bg-white p-4 rounded-xl shadow-lg border flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3 overflow-hidden mr-4">
           {isGeocoding ? (
             <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
           ) : (
             <MapPin className="w-5 h-5 text-primary shrink-0" />
           )}
           <p className="text-sm font-medium text-slate-700 truncate">
             {selectedAddress || 'Tap anywhere on the map to drop a pin...'}
           </p>
        </div>
      </div>
      
      <div ref={mapRef} className="w-full flex-1 z-0 bg-slate-100" />
      
      <div className="absolute bottom-4 left-4 right-4 z-[400] flex gap-3 pointer-events-auto">
        <Button variant="outline" onClick={onCancel} className="flex-1 bg-white h-12 shadow-md">
          Cancel
        </Button>
        <Button 
           onClick={handleConfirm} 
           disabled={!selectedAddress || isGeocoding}
           className="flex-1 bg-primary text-white h-12 shadow-md font-bold"
        >
          Confirm Location
        </Button>
      </div>
    </div>
  );
}
