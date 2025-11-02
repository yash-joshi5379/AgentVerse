import { motion } from 'motion/react';
import { ChefHat, Star, MapPin, Users } from 'lucide-react';
import { DishRecommendation } from '../services/findMyFoodService';

interface FindMyFoodRecommendationsProps {
  recommendations: DishRecommendation[];
}

export function FindMyFoodRecommendations({ recommendations }: FindMyFoodRecommendationsProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {recommendations.map((rec, index) => {
        // Get the primary supporter (highest similarity)
        const primarySupporter = rec.supporters.length > 0 
          ? rec.supporters.reduce((prev, current) => 
              (current.similarity > prev.similarity) ? current : prev
            )
          : null;

        if (!primarySupporter) return null;

        return (
          <motion.div
            key={`${rec.dish_name}-${rec.restaurant}-${index}`}
            className="relative group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Card */}
            <div className="relative backdrop-blur-xl bg-white/90 border-2 border-white shadow-lg rounded-2xl p-6 group-hover:shadow-2xl transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl" />
              
              <div className="relative">
                {/* Supporter Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      <span className="text-teal-600 font-semibold">{primarySupporter.neighbor_name}</span>
                      {' '}who has similar taste profile recommends:
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{(primarySupporter.similarity * 100).toFixed(0)}% taste match</span>
                      </div>
                      <span className="text-xs text-muted-foreground">•</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>Rated {primarySupporter.rating}/5</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dish and Restaurant Info */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-orange-500/10 to-pink-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ChefHat className="w-8 h-8 text-orange-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-foreground mb-1 line-clamp-2">
                      {rec.dish_name}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{rec.restaurant}</span>
                      {rec.is_new_restaurant && (
                        <span className="px-2 py-0.5 bg-teal-500/10 text-teal-600 text-xs font-semibold rounded-full">
                          New to you
                        </span>
                      )}
                    </div>

                    {/* Predicted Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.round(rec.predicted_rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {rec.predicted_rating.toFixed(1)}/5.0
                      </span>
                      <span className="text-xs text-muted-foreground">predicted</span>
                    </div>

                    {/* Additional Supporters */}
                    {rec.supporters.length > 1 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-muted-foreground mb-1">
                          Also recommended by:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {rec.supporters
                            .filter(s => s.neighbor_id !== primarySupporter.neighbor_id)
                            .slice(0, 2)
                            .map((supporter, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded-full"
                              >
                                {supporter.neighbor_name} ({(supporter.similarity * 100).toFixed(0)}%)
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Common Items Hint */}
                    {primarySupporter.common_items.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground">
                          {primarySupporter.common_items
                            .filter(item => item.type === 'same_dish_same_restaurant')
                            .slice(0, 1)
                            .map(item => (
                              <span key={`${item.dish}-${item.restaurant}`}>
                                💚 You both loved <span className="font-medium">{item.dish}</span> at {item.restaurant}
                              </span>
                            ))}
                          {primarySupporter.common_items.length > 0 && 
                           primarySupporter.common_items.filter(item => item.type === 'same_dish_same_restaurant').length === 0 &&
                           primarySupporter.common_items
                            .filter(item => item.type === 'different_dish_same_restaurant')
                            .slice(0, 1)
                            .map(item => (
                              <span key={`${item.user_dish}-${item.neighbor_dish}`}>
                                🍽️ Similar tastes at {item.restaurant}
                              </span>
                            ))}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

