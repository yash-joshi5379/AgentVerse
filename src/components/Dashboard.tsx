import { useState, useEffect } from 'react';
import { FeaturedCard } from './FeaturedCard';
import { RestaurantCard } from './RestaurantCard';
import { BubbleBackground } from './BubbleBackground';
import { Loader2 } from 'lucide-react';
import { generateDashboardRecommendations, type DashboardRecommendations } from '../services/dashboardService';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<DashboardRecommendations | null>(null);
  const [foodPreferences, setFoodPreferences] = useState<string[]>(['Japanese', 'Italian', 'Mexican', 'BBQ']);

  // Load recommendations on mount
  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      try {
        const recs = await generateDashboardRecommendations(foodPreferences);
        setRecommendations(recs);
      } catch (error) {
        console.error('Error loading dashboard recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [foodPreferences]);

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
            We've found some amazing restaurants you'll love
          </p>
        </div>
        
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
        
        {/* People Who Liked Your Favorites Also Liked */}
        {recommendations.peopleWhoLikedYourFavorites.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2>People Who Liked Your Favorites Also Liked</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.peopleWhoLikedYourFavorites.map((restaurant) => (
                <RestaurantCard 
                  key={restaurant.id} 
                  {...restaurant}
                />
              ))}
            </div>
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
      </div>
    </div>
  );
}
