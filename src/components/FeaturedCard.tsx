import { ImageWithFallback } from './figma/ImageWithFallback';
import { AlignmentScore } from './AlignmentScore';
import { MapPin, Star } from 'lucide-react';

interface FeaturedCardProps {
  name: string;
  image: string;
  cuisines: string[];
  alignmentScore: number;
  location: string;
  rating: number;
  description: string;
}

export function FeaturedCard({ 
  name, 
  image, 
  cuisines, 
  alignmentScore, 
  location,
  rating,
  description 
}: FeaturedCardProps) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
      style={{
        boxShadow: '0 8px 30px rgba(88, 86, 214, 0.15)'
      }}
    >
      <div className="grid md:grid-cols-2 gap-0">
        <div className="relative h-64 md:h-auto">
          <ImageWithFallback
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
            <Star className="w-4 h-4 fill-[#5856D6] text-[#5856D6]" />
            <span>{rating}</span>
          </div>
        </div>
        
        <div className="p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <div className="inline-block px-3 py-1 bg-gradient-to-r from-primary to-secondary text-white rounded-full text-sm mb-3">
                Top Match For You
              </div>
              <h2 className="mb-2">{name}</h2>
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{location}</span>
              </div>
              <p className="text-muted-foreground">
                {description}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {cuisines.map((cuisine, index) => (
                <span 
                  key={index}
                  className="px-4 py-1 bg-muted text-foreground rounded-full"
                >
                  {cuisine}
                </span>
              ))}
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">Alignment Score</p>
              <AlignmentScore score={alignmentScore} size="large" />
            </div>
          </div>
          
          <button className="mt-6 w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
            style={{
              boxShadow: '0 4px 15px rgba(88, 86, 214, 0.3)'
            }}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
