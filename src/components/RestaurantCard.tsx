import { ImageWithFallback } from './figma/ImageWithFallback';
import { AlignmentScore } from './AlignmentScore';
import { MapPin, Star, DollarSign } from 'lucide-react';

interface RestaurantCardProps {
  id: string | number;
  name: string;
  image: string;
  cuisines: string[];
  alignmentScore: number;
  tagline?: string;
  description?: string;
  rating?: number;
  location?: string;
  priceLevel?: number;
  onClick?: () => void;
}

const getPriceDisplay = (level?: number): string => {
  if (!level) return '';
  return '£'.repeat(level);
};

export function RestaurantCard({ 
  name, 
  image, 
  cuisines, 
  alignmentScore, 
  tagline,
  description,
  rating,
  location,
  priceLevel,
  onClick 
}: RestaurantCardProps) {
  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group transform hover:-translate-y-2"
      onClick={onClick}
      style={{
        boxShadow: '0 4px 20px rgba(88, 86, 214, 0.1)'
      }}
    >
      <div className="relative h-48 overflow-hidden">
        <ImageWithFallback
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {rating && (
          <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
            <Star className="w-3 h-3 fill-[#5856D6] text-[#5856D6]" />
            <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h3 className="mb-1">{name}</h3>
          {tagline && (
            <p className="text-sm text-muted-foreground italic">
              {tagline}
            </p>
          )}
        </div>
        
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2">
          {cuisines.map((cuisine, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-muted text-foreground rounded-full text-xs"
            >
              {cuisine}
            </span>
          ))}
        </div>
        
        {(location || priceLevel) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{location}</span>
              </div>
            )}
            {priceLevel && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                <span>{getPriceDisplay(priceLevel)}</span>
              </div>
            )}
          </div>
        )}
        
        <AlignmentScore score={alignmentScore} />
      </div>
    </div>
  );
}
