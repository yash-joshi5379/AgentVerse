import { useMemo } from 'react';
import { MapPin } from 'lucide-react';

interface RestaurantMapProps {
  restaurantName: string;
  location: string;
  apiKey?: string;
}

export function RestaurantMap({ restaurantName, location, apiKey }: RestaurantMapProps) {
  // Construct Google Maps embed URL with place search
  const mapUrl = useMemo(() => {
    if (!apiKey) return null;
    
    // Use Google Maps Embed API with place search
    const query = encodeURIComponent(`${restaurantName}, ${location}`);
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${query}`;
  }, [restaurantName, location, apiKey]);

  // Fallback: Use Google Maps search link if no API key
  const searchUrl = useMemo(() => {
    const query = encodeURIComponent(`${restaurantName}, ${location}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }, [restaurantName, location]);

  if (!mapUrl) {
    // Fallback UI when API key is not available
    return (
      <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center relative overflow-hidden border-2 border-gray-200">
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <MapPin className="w-16 h-16 text-gray-400" />
        </div>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 bg-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm font-medium text-gray-700 flex items-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          View on Google Maps
        </a>
      </div>
    );
  }

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden shadow-lg relative border-2 border-gray-200 group">
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={mapUrl}
        className="rounded-xl"
        title={`Map showing location of ${restaurantName}`}
      />
      {/* Overlay gradient for better button visibility */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-3 right-3">
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 text-xs font-medium text-gray-700 flex items-center gap-1.5 backdrop-blur-sm border border-gray-200"
        >
          <MapPin className="w-3.5 h-3.5" />
          Open in Maps
        </a>
      </div>
    </div>
  );
}
