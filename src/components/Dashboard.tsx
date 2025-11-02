import { useState, useEffect } from 'react';
import { FeaturedCard } from './FeaturedCard';
import { RestaurantCard } from './RestaurantCard';
import { BubbleBackground } from './BubbleBackground';
import { FindMyFoodRecommendations } from './FindMyFoodRecommendations';
import { Loader2, Search as SearchIcon, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { generateDashboardRecommendations, type DashboardRecommendations, searchRestaurantsByPrompt, type DashboardRestaurant } from '../services/dashboardService';
import { getFindMyFoodRecommendations, type DishRecommendation } from '../services/findMyFoodService';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<DashboardRecommendations | null>(null);
  const [findMyFoodRecs, setFindMyFoodRecs] = useState<DishRecommendation[]>([]);
  const [foodPreferences, setFoodPreferences] = useState<string[]>(['Japanese', 'Italian', 'Mexican', 'BBQ']);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DashboardRestaurant[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load recommendations on mount
  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      try {
        // Load both standard recommendations and FindMyFood collaborative filtering
        const [recs, findMyFoodResults] = await Promise.all([
          generateDashboardRecommendations(foodPreferences),
          getFindMyFoodRecommendations(1, 4) // User 1 (Josh), top 4 recommendations
        ]);
        setRecommendations(recs);
        setFindMyFoodRecs(findMyFoodResults);
      } catch (error) {
        console.error('Error loading dashboard recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [foodPreferences]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const results = await searchRestaurantsByPrompt(searchQuery.trim());
      setSearchResults(results);
      
      // Track search interaction for flavor learning
      const { addInteraction, extractKeywords } = await import('../services/flavorProfileService');
      const keywords = extractKeywords(searchQuery);
      addInteraction({
        type: 'search',
        keywords,
      });
    } catch (error) {
      console.error('Error searching restaurants:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <BubbleBackground />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Finding the best restaurants for you...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="min-h-screen relative">
        <BubbleBackground />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
          <div className="text-center py-20">
            <p className="text-muted-foreground">Unable to load recommendations. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <BubbleBackground />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        <div>
          <h1 className="mb-1">Welcome back, Josh!</h1>
          <p className="text-muted-foreground">
            {searchResults ? 'Here are your personalized recommendations' : "We've found some amazing restaurants you'll love"}
          </p>
        </div>

        {/* Search Bar */}
        <motion.form
          onSubmit={handleSearch}
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex gap-4">
            <motion.div
              className="relative flex-1"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-3xl blur-xl"
                style={{ transform: 'translateZ(-10px)' }}
              />
              <div className="relative backdrop-blur-xl bg-white/90 border-2 border-white shadow-2xl rounded-3xl">
                <SearchIcon className="absolute left-6 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for restaurants... e.g. 'Find me a restaurant that has spicy flavourful halal chicken dishes in soho'"
                  className="w-full pl-14 pr-6 py-5 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                )}
              </div>
            </motion.div>

            <motion.button
              type="submit"
              disabled={searchLoading || !searchQuery.trim()}
              className="relative px-10 py-5 rounded-3xl overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary transform transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <span className="relative flex items-center gap-2 text-white whitespace-nowrap">
                {searchLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                Search
              </span>
            </motion.button>
          </div>
        </motion.form>
        
        {/* Search Results */}
        {searchResults !== null && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2>Search Results</h2>
              {searchResults.length === 0 && (
                <p className="text-muted-foreground text-sm">No results found. Try a different search.</p>
              )}
            </div>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((restaurant) => (
                  <RestaurantCard 
                    key={restaurant.id} 
                    {...restaurant}
                    allowLongDescription={true}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Default Recommendations - Only show when no search results */}
        {searchResults === null && (
          <>
            {/* Top Match */}
            {recommendations.topMatch && (
              <div>
                <h2 className="mb-4">Your Perfect Match</h2>
                <FeaturedCard 
                  {...recommendations.topMatch}
                  description={recommendations.topMatch.description || ''}
                />
              </div>
            )}
            
            {/* FindMyFood Collaborative Filtering Recommendations */}
            {findMyFoodRecs.length > 0 && (
              <div>
                <div className="flex flex-col mb-6">
                  <h2>Dishes You'll Love</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on collaborative filtering from users with similar taste profiles
                  </p>
                </div>
                <FindMyFoodRecommendations recommendations={findMyFoodRecs} />
              </div>
            )}
            
            {/* Trendy Foods */}
            {recommendations.trendyFoods.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2>Trendy Foods</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.trendyFoods.map((restaurant) => (
                    <RestaurantCard 
                      key={restaurant.id} 
                      {...restaurant}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Recommended For You */}
            {recommendations.recommendedForYou.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2>Recommended For You</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.recommendedForYou.map((restaurant) => (
                    <RestaurantCard 
                      key={restaurant.id} 
                      {...restaurant}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {recommendations.peopleWhoLikedYourFavorites.length === 0 && 
             recommendations.trendyFoods.length === 0 && 
             recommendations.recommendedForYou.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl">
                <p className="text-muted-foreground">No recommendations available yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
