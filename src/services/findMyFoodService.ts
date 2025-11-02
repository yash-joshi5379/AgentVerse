/**
 * FindMyFood Collaborative Filtering Service
 * 
 * Executes the Python FindMyFood algorithm (FindMyFood-main/FindMyFood/get_recommendations.py)
 * Returns dish recommendations based on collaborative filtering algorithm
 * 
 * Note: Requires Python 3.11+ and dependencies installed (see requirements.txt)
 */

import path from 'path';

export interface Supporter {
  neighbor_id: number;
  neighbor_name: string;
  similarity: number;
  rating: number;
  common_items: {
    type: 'same_dish_same_restaurant' | 'different_dish_same_restaurant';
    dish?: string;
    restaurant?: string;
    user_dish?: string;
    neighbor_dish?: string;
    user_rating?: number;
    neighbor_rating?: number;
  }[];
}

export interface DishRecommendation {
  dish_name: string;
  restaurant: string;
  predicted_rating: number;
  supporters: Supporter[];
  is_new_restaurant: boolean;
}

// User profiles (mimicking the synthetic data from Python)
const USER_PROFILES = {
  1: { name: 'Josh', id: 1 },
  2: { name: 'Sarah', id: 2 },
  3: { name: 'Miguel', id: 3 },
  4: { name: 'Priya', id: 4 },
};

// Synthetic review data (matching Python's multi_visit data structure)
const REVIEW_DATA = [
  // User 1 (Josh - target user)
  { user_id: 1, restaurant_name: 'Dishoom', dish_name: 'Chicken Ruby', rating: 5, cuisine_type: 'Indian' },
  { user_id: 1, restaurant_name: 'Dishoom', dish_name: 'House Black Daal', rating: 5, cuisine_type: 'Indian' },
  { user_id: 1, restaurant_name: 'Barrafina', dish_name: 'Jamón Ibérico', rating: 4, cuisine_type: 'Spanish' },
  { user_id: 1, restaurant_name: 'Hoppers', dish_name: 'Bone Marrow Varuval', rating: 5, cuisine_type: 'Sri Lankan' },
  { user_id: 1, restaurant_name: 'Bao', dish_name: 'Classic Bao', rating: 4, cuisine_type: 'Taiwanese' },
  
  // User 2 (Sarah - similar taste to Josh)
  { user_id: 2, restaurant_name: 'Dishoom', dish_name: 'Chicken Ruby', rating: 5, cuisine_type: 'Indian' },
  { user_id: 2, restaurant_name: 'Dishoom', dish_name: 'Pau Bhaji', rating: 4, cuisine_type: 'Indian' },
  { user_id: 2, restaurant_name: 'Gymkhana', dish_name: 'Kid Goat Methi Keema', rating: 5, cuisine_type: 'Indian' },
  { user_id: 2, restaurant_name: 'Hoppers', dish_name: 'Bone Marrow Varuval', rating: 5, cuisine_type: 'Sri Lankan' },
  { user_id: 2, restaurant_name: 'Bao', dish_name: 'Classic Bao', rating: 4, cuisine_type: 'Taiwanese' },
  { user_id: 2, restaurant_name: 'Kiln', dish_name: 'Grilled Tamworth Pork Jowl', rating: 5, cuisine_type: 'Thai' },
  
  // User 3 (Miguel - Spanish/Portuguese food lover)
  { user_id: 3, restaurant_name: 'Barrafina', dish_name: 'Jamón Ibérico', rating: 5, cuisine_type: 'Spanish' },
  { user_id: 3, restaurant_name: 'Barrafina', dish_name: 'Txangurro', rating: 4, cuisine_type: 'Spanish' },
  { user_id: 3, restaurant_name: 'Sabor', dish_name: 'Iberico Presa', rating: 5, cuisine_type: 'Portuguese' },
  { user_id: 3, restaurant_name: 'Bao', dish_name: 'Classic Bao', rating: 4, cuisine_type: 'Taiwanese' },
  { user_id: 3, restaurant_name: 'Kiln', dish_name: 'Clay Pot Glass Noodles', rating: 5, cuisine_type: 'Thai' },
  { user_id: 3, restaurant_name: 'Sabor', dish_name: 'Piri Piri Chicken', rating: 5, cuisine_type: 'Portuguese' },
  
  // User 4 (Priya - Indian cuisine enthusiast)
  { user_id: 4, restaurant_name: 'Hoppers', dish_name: 'Bone Marrow Varuval', rating: 4, cuisine_type: 'Sri Lankan' },
  { user_id: 4, restaurant_name: 'Gymkhana', dish_name: 'Kid Goat Methi Keema', rating: 5, cuisine_type: 'Indian' },
  { user_id: 4, restaurant_name: 'Gymkhana', dish_name: 'Muntjac Biryani', rating: 5, cuisine_type: 'Indian' },
  { user_id: 4, restaurant_name: 'Trishna', dish_name: 'Dorset Brown Crab', rating: 5, cuisine_type: 'Indian' },
  { user_id: 4, restaurant_name: 'Dishoom', dish_name: 'House Black Daal', rating: 4, cuisine_type: 'Indian' },
  { user_id: 4, restaurant_name: 'Trishna', dish_name: 'Tandoori Lamb Chops', rating: 5, cuisine_type: 'Indian' },
];

/**
 * Calculate user similarity (simplified collaborative filtering)
 * Based on common restaurants and rating patterns
 */
function calculateUserSimilarity(
  targetUserId: number,
  neighborUserId: number,
  reviews: typeof REVIEW_DATA
): { similarity: number; commonRestaurants: string[] } {
  const targetReviews = reviews.filter(r => r.user_id === targetUserId);
  const neighborReviews = reviews.filter(r => r.user_id === neighborUserId);
  
  const targetRestaurants = new Set(targetReviews.map(r => r.restaurant_name));
  const neighborRestaurants = new Set(neighborReviews.map(r => r.restaurant_name));
  
  const commonRestaurants = [...targetRestaurants].filter(r => neighborRestaurants.has(r));
  
  if (commonRestaurants.length === 0) {
    return { similarity: 0, commonRestaurants: [] };
  }
  
  // Calculate cosine similarity on common restaurants
  let dotProduct = 0;
  let targetNorm = 0;
  let neighborNorm = 0;
  
  for (const restaurant of commonRestaurants) {
    const targetRating = targetReviews
      .filter(r => r.restaurant_name === restaurant)
      .reduce((sum, r) => sum + r.rating, 0) / targetReviews.filter(r => r.restaurant_name === restaurant).length;
    
    const neighborRating = neighborReviews
      .filter(r => r.restaurant_name === restaurant)
      .reduce((sum, r) => sum + r.rating, 0) / neighborReviews.filter(r => r.restaurant_name === restaurant).length;
    
    dotProduct += targetRating * neighborRating;
    targetNorm += targetRating * targetRating;
    neighborNorm += neighborRating * neighborRating;
  }
  
  const similarity = targetNorm && neighborNorm ? dotProduct / (Math.sqrt(targetNorm) * Math.sqrt(neighborNorm)) : 0;
  
  return { similarity, commonRestaurants };
}

/**
 * Execute Python script to get real recommendations
 */
async function getPythonRecommendations(
  targetUserId: number = 1,
  topN: number = 4
): Promise<DishRecommendation[] | null> {
  // Check if running in Node.js environment
  if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
    return null; // Return null if not in Node environment
  }

  try {
    // Dynamic import to avoid bundling issues in browser
    const { executePythonScript } = await import('./pythonExecutor');
    
    // Path to Python script (relative to project root)
    const scriptPath = path.join(process.cwd(), 'FindMyFood-main', 'FindMyFood', 'get_recommendations.py');
    
    // Execute Python script
    const result = await executePythonScript<DishRecommendation[]>(
      scriptPath,
      [targetUserId.toString(), topN.toString()]
    );

    if (result.success && result.data) {
      return result.data;
    } else {
      console.error('Python execution failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error executing Python script:', error);
    return null;
  }
}

/**
 * Get collaborative filtering recommendations (fallback to TypeScript implementation)
 * Tries to use Python script first, falls back to TypeScript if unavailable
 */
async function getTypeScriptRecommendations(
  targetUserId: number = 1,
  topN: number = 4
): Promise<DishRecommendation[]> {
  // Get target user's reviews
  const targetReviews = REVIEW_DATA.filter(r => r.user_id === targetUserId);
  const targetRestaurants = new Set(targetReviews.map(r => r.restaurant_name));
  const targetDishes = new Set(
    targetReviews.map(r => `${r.dish_name}@${r.restaurant_name}`)
  );
  
  // Find similar users
  const otherUserIds = [2, 3, 4].filter(id => id !== targetUserId);
  const similarities = otherUserIds
    .map(userId => ({
      userId,
      ...calculateUserSimilarity(targetUserId, userId, REVIEW_DATA)
    }))
    .filter(s => s.similarity > 0 && s.commonRestaurants.length > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3); // Top 3 similar users
  
  // Find candidate dishes
  const candidates = new Map<string, {
    dish_name: string;
    restaurant: string;
    weightedSum: number;
    weightSum: number;
    supporters: Supporter[];
    isNewRestaurant: boolean;
  }>();
  
  for (const similarUser of similarities) {
    const userReviews = REVIEW_DATA.filter(r => r.user_id === similarUser.userId);
    
    for (const review of userReviews) {
      const dishKey = `${review.dish_name}@${review.restaurant_name}`;
      
      // Skip if target user already tried this
      if (targetDishes.has(dishKey)) continue;
      
      // Only high ratings (4-5 stars)
      if (review.rating < 4) continue;
      
      // Calculate weighted rating
      const weight = similarUser.similarity;
      const weightedRating = review.rating * weight;
      
      // Find common items between target and neighbor
      const neighborReviews = REVIEW_DATA.filter(r => r.user_id === similarUser.userId);
      const commonItems = [];
      
      for (const targetRev of targetReviews) {
        for (const neighborRev of neighborReviews) {
          if (targetRev.dish_name === neighborRev.dish_name && 
              targetRev.restaurant_name === neighborRev.restaurant_name) {
            commonItems.push({
              type: 'same_dish_same_restaurant' as const,
              dish: targetRev.dish_name,
              restaurant: targetRev.restaurant_name,
              user_rating: targetRev.rating,
              neighbor_rating: neighborRev.rating,
            });
          } else if (targetRev.restaurant_name === neighborRev.restaurant_name) {
            commonItems.push({
              type: 'different_dish_same_restaurant' as const,
              user_dish: targetRev.dish_name,
              neighbor_dish: neighborRev.dish_name,
              restaurant: targetRev.restaurant_name,
            });
          }
        }
      }
      
      if (!candidates.has(dishKey)) {
        candidates.set(dishKey, {
          dish_name: review.dish_name,
          restaurant: review.restaurant_name,
          weightedSum: weightedRating,
          weightSum: weight,
          supporters: [],
          isNewRestaurant: !targetRestaurants.has(review.restaurant_name),
        });
      } else {
        const dish = candidates.get(dishKey)!;
        dish.weightedSum += weightedRating;
        dish.weightSum += weight;
      }
      
      // Add supporter
      candidates.get(dishKey)!.supporters.push({
        neighbor_id: similarUser.userId,
        neighbor_name: USER_PROFILES[similarUser.userId as keyof typeof USER_PROFILES]?.name || `User ${similarUser.userId}`,
        similarity: similarUser.similarity,
        rating: review.rating,
        common_items: commonItems,
      });
    }
  }
  
  // Calculate predicted ratings and sort
  const recommendations = Array.from(candidates.values())
    .map(c => ({
      dish_name: c.dish_name,
      restaurant: c.restaurant,
      predicted_rating: c.weightedSum / c.weightSum,
      supporters: c.supporters,
      is_new_restaurant: c.isNewRestaurant,
    }))
    .sort((a, b) => {
      // Prioritize new restaurants, then predicted rating
      if (a.is_new_restaurant !== b.is_new_restaurant) {
        return a.is_new_restaurant ? -1 : 1;
      }
      return b.predicted_rating - a.predicted_rating;
    })
    .slice(0, topN);
  
  return recommendations;
}

/**
 * Get collaborative filtering recommendations
 * Primary: Executes Python script (if available)
 * Fallback: Uses TypeScript implementation with synthetic data
 */
export async function getFindMyFoodRecommendations(
  targetUserId: number = 1,
  topN: number = 4
): Promise<DishRecommendation[]> {
  // Try Python execution first
  const pythonResults = await getPythonRecommendations(targetUserId, topN);
  
  if (pythonResults && pythonResults.length > 0) {
    console.log('✅ Using Python FindMyFood recommendations');
    return pythonResults;
  }
  
  // Fallback to TypeScript implementation
  console.log('ℹ️  Using TypeScript fallback recommendations (Python unavailable)');
  return getTypeScriptRecommendations(targetUserId, topN);
}

/**
 * Get user profile by ID
 */
export function getUserProfile(userId: number) {
  return USER_PROFILES[userId as keyof typeof USER_PROFILES] || { name: `User ${userId}`, id: userId };
}

