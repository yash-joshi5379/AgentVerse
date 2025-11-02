import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MapPin, Clock, DollarSign, Users, Sparkles, Flame, Heart, Activity, Apple, Loader2, TrendingUp, Calendar, ExternalLink, TreePine, Film, Gamepad2, ShoppingBag, Museum, Beer } from 'lucide-react';
import { generateRestaurantData } from '../services/openaiService';
import { RestaurantMap } from './RestaurantMap';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  reviews: number;
  matchScore?: number;
  matchReasons?: string[];
  tags: string[];
  image?: string;
  healthInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    dietaryTags: string[];
    nutritionNotes?: string;
  };
}

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  origin: string;
  description: string;
  background: string;
  rating: number;
  priceLevel: number;
  environment: string;
  ambiance: string[];
  location: string;
  hours: string;
  menu: MenuItem[];
  similarRestaurants: { id: string; name: string; cuisine: string; rating: number }[];
  popularity?: number;
}

interface RestaurantDetailProps {
  restaurantName: string;
  location?: string;
  tasteProfile: string[];
  dietaryPreferences: string[];
  allergens: string[];
}
export function RestaurantDetail({ restaurantName, location = '', tasteProfile, dietaryPreferences, allergens }: RestaurantDetailProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchRestaurantData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await generateRestaurantData(restaurantName, location, tasteProfile, dietaryPreferences, allergens);
        setRestaurant(data);
      } catch (err) {
        console.error('Error fetching restaurant data:', err);
        setError('Failed to load restaurant information. Please check your OpenAI API key in the .env file.');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [restaurantName, location, tasteProfile, dietaryPreferences, allergens]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading restaurant information...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="backdrop-blur-xl bg-red-500/10 border-2 border-red-500/20 rounded-2xl p-6 text-center">
          <h2 className="text-foreground mb-2">Unable to Load Restaurant Data</h2>
          <p className="text-muted-foreground">{error || 'Restaurant not found'}</p>
          <p className="text-sm text-muted-foreground mt-4">
            Make sure you have added your OpenAI API key to the .env file:<br />
            <code className="bg-muted px-2 py-1 rounded">VITE_OPENAI_API_KEY=your_key_here</code>
          </p>
        </div>
      </div>
    );
  }
  
  // Sort menu by match score
  const sortedMenu = [...restaurant.menu].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  // Filter top matches - items with score >= 85 AND score > 0 (exclude invalid matches)
  const topMatches = sortedMenu.filter(item => (item.matchScore || 0) >= 85 && (item.matchScore || 0) > 0);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderPriceLevel = (level: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4].map((price) => (
          <DollarSign
            key={price}
            className={`w-4 h-4 ${
              price <= level ? 'text-green-500' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderPopularitySlider = (popularity: number) => {
    const getPopularityLabel = (value: number) => {
      if (value >= 80) return 'Extremely Trendy';
      if (value >= 60) return 'Very Popular';
      if (value >= 40) return 'Moderately Popular';
      if (value >= 20) return 'Quiet';
      return 'Hidden Gem';
    };

    const getPopularityColor = (value: number) => {
      if (value >= 80) return 'text-pink-500';
      if (value >= 60) return 'text-orange-500';
      if (value >= 40) return 'text-yellow-500';
      if (value >= 20) return 'text-green-500';
      return 'text-blue-500';
    };

    // Convert 0-100 popularity to 0-5 star rating
    const starRating = (popularity / 100) * 5;

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <span className="text-base font-semibold text-foreground">Trendiness</span>
          </div>
          <span className={`text-sm font-bold ${getPopularityColor(popularity)}`}>
            {getPopularityLabel(popularity)}
          </span>
        </div>
        
        {/* Star Rating Display */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.div
                key={star}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: star * 0.1, 
                  type: 'spring', 
                  stiffness: 200, 
                  damping: 15 
                }}
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= Math.round(starRating)
                      ? `${getPopularityColor(popularity)} fill-current` 
                      : 'text-gray-300'
                  }`}
                />
              </motion.div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-foreground">{starRating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">/ 5.0</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${getPopularityColor(popularity).includes('pink') ? 'from-pink-500 to-rose-500' : getPopularityColor(popularity).includes('orange') ? 'from-orange-500 to-yellow-500' : getPopularityColor(popularity).includes('yellow') ? 'from-yellow-500 to-green-500' : getPopularityColor(popularity).includes('green') ? 'from-green-500 to-cyan-500' : 'from-cyan-500 to-blue-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${popularity}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    );
  };

  const renderHealthInfo = (healthInfo?: MenuItem['healthInfo']) => {
    if (!healthInfo) return null;

    return (
      <motion.div
        className="mt-3 p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-foreground">Nutrition Info</span>
        </div>
        
        {(healthInfo.calories || healthInfo.protein || healthInfo.carbs || healthInfo.fat) && (
          <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
            {healthInfo.calories && (
              <div className="text-center">
                <div className="font-semibold text-foreground">{healthInfo.calories}</div>
                <div className="text-muted-foreground">Cal</div>
              </div>
            )}
            {healthInfo.protein && (
              <div className="text-center">
                <div className="font-semibold text-foreground">{healthInfo.protein}g</div>
                <div className="text-muted-foreground">Protein</div>
              </div>
            )}
            {healthInfo.carbs && (
              <div className="text-center">
                <div className="font-semibold text-foreground">{healthInfo.carbs}g</div>
                <div className="text-muted-foreground">Carbs</div>
              </div>
            )}
            {healthInfo.fat && (
              <div className="text-center">
                <div className="font-semibold text-foreground">{healthInfo.fat}g</div>
                <div className="text-muted-foreground">Fat</div>
              </div>
            )}
          </div>
        )}

        {healthInfo.dietaryTags && healthInfo.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {healthInfo.dietaryTags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs backdrop-blur-xl bg-blue-500/20 border border-blue-500/30 text-blue-700 rounded-full px-2 py-0.5"
              >
                <Activity className="w-3 h-3 inline-block mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {healthInfo.nutritionNotes && (
          <p className="text-xs text-muted-foreground italic flex items-start gap-1">
            <Apple className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-500" />
            {healthInfo.nutritionNotes}
          </p>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Restaurant Header */}
      <motion.div
        className="relative backdrop-blur-xl bg-white/90 border-2 border-white shadow-2xl rounded-2xl p-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
        <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-2xl blur opacity-30" />
        
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-foreground mb-2">{restaurant.name}</h1>
              <p className="text-muted-foreground mb-3">{restaurant.cuisine}</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  {renderStars(restaurant.rating)}
                  <span className="text-sm text-foreground">{restaurant.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  {renderPriceLevel(restaurant.priceLevel)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {restaurant.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {restaurant.hours}
                </div>
              </div>
            </div>
          </div>

          {/* Ambiance Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {restaurant.ambiance.map((tag) => (
              <motion.div
                key={tag}
                className="backdrop-blur-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full px-3 py-1"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-sm text-foreground">{tag}</span>
              </motion.div>
            ))}
          </div>

          {/* Restaurant Description */}
          <div className="space-y-3">
            <p className="text-foreground">{restaurant.description}</p>
            <p className="text-sm text-muted-foreground">{restaurant.background}</p>
          </div>

          {/* Restaurant Location Map */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="text-foreground font-semibold">Location</h3>
            </div>
            <RestaurantMap
              restaurantName={restaurant.name}
              location={restaurant.location}
              apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            />
          </div>

          {/* Booking Information */}
          <motion.div
            className="mt-6 p-5 rounded-xl border-2 backdrop-blur-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              background: restaurant.bookingRequired
                ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)'
                : restaurant.bookingUrl
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
              borderColor: restaurant.bookingRequired
                ? 'rgba(249, 115, 22, 0.3)'
                : restaurant.bookingUrl
                ? 'rgba(59, 130, 246, 0.3)'
                : 'rgba(34, 197, 94, 0.3)'
            }}
          >
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                restaurant.bookingRequired
                  ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/20'
                  : restaurant.bookingUrl
                  ? 'bg-gradient-to-br from-blue-500/20 to-sky-500/20'
                  : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
              }`}>
                <Calendar className={`w-6 h-6 ${
                  restaurant.bookingRequired
                    ? 'text-orange-500'
                    : restaurant.bookingUrl
                    ? 'text-blue-500'
                    : 'text-green-500'
                }`} />
              </div>
              
              <div className="flex-1">
                {restaurant.bookingRequired && restaurant.bookingUrl ? (
                  <>
                    <h3 className="text-foreground font-semibold mb-1">Reservations Required</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This restaurant typically requires advance reservations. Book your table to secure your spot.
                    </p>
                    <motion.a
                      href={restaurant.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Calendar className="w-4 h-4" />
                      Book on {restaurant.bookingPlatform || 'their website'}
                      <ExternalLink className="w-4 h-4" />
                    </motion.a>
                  </>
                ) : restaurant.bookingUrl ? (
                  <>
                    <h3 className="text-foreground font-semibold mb-1">Book a Table (Optional)</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Walk-ins are welcome, but you can also reserve a table online to guarantee your spot.
                    </p>
                    <motion.a
                      href={restaurant.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-sky-500 text-white px-5 py-2.5 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Calendar className="w-4 h-4" />
                      Book a Table on {restaurant.bookingPlatform || 'their website'}
                      <ExternalLink className="w-4 h-4" />
                    </motion.a>
                  </>
                ) : (
                  <>
                    <h3 className="text-foreground font-semibold mb-1">Walk-Ins Welcome</h3>
                    <p className="text-sm text-muted-foreground">
                      No booking required! You can walk in anytime during their opening hours. Perfect for spontaneous dining.
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Personalized Review */}
          <motion.div
            className="mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-foreground">Our Take</span>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>{restaurant.environment}</strong> atmosphere perfect for {restaurant.ambiance.join(', ').toLowerCase()} occasions. 
              With a price range of {restaurant.priceLevel === 1 ? 'budget-friendly' : restaurant.priceLevel === 2 ? 'moderate' : restaurant.priceLevel === 3 ? 'upscale' : 'fine dining'}, 
              this spot offers excellent value for quality. The diverse menu caters to various dietary preferences while maintaining authentic flavors.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Popularity/Trendiness Slider */}
      {restaurant.popularity !== undefined && (
        <motion.div
          className="relative backdrop-blur-xl bg-white/90 border-2 border-white shadow-2xl rounded-2xl p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-2xl blur opacity-30" />
          <div className="relative">
            {renderPopularitySlider(restaurant.popularity)}
          </div>
        </motion.div>
      )}

      {/* Top Matches Section */}
      {topMatches.length > 0 && (
        <motion.div
          className="relative backdrop-blur-xl bg-white/90 border-2 border-white shadow-2xl rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-2xl blur opacity-30" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-foreground">Perfect Matches for You</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Based on your taste profile and dietary preferences, these dishes are specially selected for you.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {topMatches.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="relative group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative backdrop-blur-xl bg-white/80 border-2 border-white shadow-lg rounded-xl p-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-xl" />
                    
                    <div className="relative">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-foreground mb-1">{item.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        </div>
                        <div className="ml-3">
                          <motion.div
                            className="backdrop-blur-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-lg px-3 py-1 shadow-lg"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <span className="text-sm">{item.matchScore}%</span>
                          </motion.div>
                        </div>
                      </div>
                      
                      {item.matchReasons && item.matchReasons.length > 0 && (
                        <div className="mb-3 space-y-1">
                          {item.matchReasons.map((reason, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-green-600">
                              <Sparkles className="w-3 h-3" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {renderStars(item.rating)}
                          <span className="text-sm text-muted-foreground">({item.reviews} reviews)</span>
                        </div>
                        <span className="text-foreground">${item.price.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-3">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs backdrop-blur-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 rounded-full px-2 py-0.5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Health Info */}
                      {renderHealthInfo(item.healthInfo)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Similar Restaurants */}
      <motion.div
        className="relative backdrop-blur-xl bg-white/90 border-2 border-white shadow-2xl rounded-2xl p-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-2xl blur opacity-30" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-blue-500" />
              <h2 className="text-foreground">Similar Restaurants</h2>
            </div>
            
            <div className="space-y-3">
              {restaurant.similarRestaurants.map((similar, index) => (
                <motion.div
                  key={similar.id}
                  className="relative group cursor-pointer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative p-4 rounded-xl border border-gray-200 group-hover:border-blue-500/30 transition-colors">
                    <h4 className="text-foreground mb-1">{similar.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{similar.cuisine}</p>
                    <div className="flex items-center gap-2">
                      {renderStars(similar.rating)}
                      <span className="text-sm text-foreground">{similar.rating}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
    </motion.div>
  );
}
