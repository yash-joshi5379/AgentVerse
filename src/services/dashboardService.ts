import { generateRestaurantData } from './openaiService';
import { loadDefaultFavorites } from './favoritesService';

export interface DashboardRestaurant {
  id: string;
  name: string;
  image: string;
  cuisines: string[];
  alignmentScore: number;
  tagline: string;
  rating: number;
  popularity: number;
  location: string;
  description?: string;
  priceLevel?: number;
}

export interface DashboardRecommendations {
  peopleWhoLikedYourFavorites: DashboardRestaurant[];
  trendyFoods: DashboardRestaurant[];
  recommendedForYou: DashboardRestaurant[];
  topMatch?: DashboardRestaurant;
}

// Cache for dashboard recommendations to avoid reloading
let cachedRecommendations: DashboardRecommendations | null = null;
let loadingRecommendationsPromise: Promise<DashboardRecommendations> | null = null;

export async function generateDashboardRecommendations(
  foodPreferences: string[] = []
): Promise<DashboardRecommendations> {
  // Return cached recommendations if available
  if (cachedRecommendations !== null) {
    return cachedRecommendations;
  }

  // Return existing promise if already loading
  if (loadingRecommendationsPromise !== null) {
    return loadingRecommendationsPromise;
  }

  // Start loading
  loadingRecommendationsPromise = (async () => {
    try {
      // Get user's favorites
      const favorites = await loadDefaultFavorites();
      const favoriteNames = favorites.map(f => f.name).join(', ');

      // Get recommendations from OpenAI - fetch in parallel for speed
      // Reduced to 2 restaurants per category to save API credits
      const [suggestions1, suggestions2, suggestions3] = await Promise.allSettled([
        // 1. People who liked your favorites also liked
        generateRestaurantSuggestions(
          `People who like ${favoriteNames} enjoy similar restaurants. Suggest 2 restaurants in London similar in cuisine or vibe.`,
          favoriteNames
        ),
        // 2. Trendy Foods
        generateRestaurantSuggestions(
          `Suggest 2 trendy restaurants in London with high social media buzz or innovative cuisine.`,
          favoriteNames
        ),
        // 3. Recommended for You (based on food preferences)
        foodPreferences.length > 0 
          ? generateRestaurantSuggestions(
              `Based on preferences: ${foodPreferences.join(', ')}, suggest 2 restaurants in London matching these cuisines.`,
              favoriteNames,
              foodPreferences
            )
          : Promise.resolve([])
      ]);

      const recommendations: DashboardRecommendations = {
        peopleWhoLikedYourFavorites: suggestions1.status === 'fulfilled' ? suggestions1.value : [],
        trendyFoods: suggestions2.status === 'fulfilled' ? suggestions2.value : [],
        recommendedForYou: suggestions3.status === 'fulfilled' ? suggestions3.value : [],
      };

      // 4. Top Match - pick the highest scoring one from any category
      const allSuggestions = [
        ...recommendations.peopleWhoLikedYourFavorites,
        ...recommendations.trendyFoods,
        ...recommendations.recommendedForYou,
      ];
      if (allSuggestions.length > 0) {
        // Sort by alignment score and pick the top one
        const sorted = [...allSuggestions].sort((a, b) => b.alignmentScore - a.alignmentScore);
        recommendations.topMatch = sorted[0];
      }

      cachedRecommendations = recommendations;
      return recommendations;
    } catch (error) {
      console.error('Error generating dashboard recommendations:', error);
      cachedRecommendations = {
        peopleWhoLikedYourFavorites: [],
        trendyFoods: [],
        recommendedForYou: [],
      };
      return cachedRecommendations;
    } finally {
      loadingRecommendationsPromise = null;
    }
  })();

  return loadingRecommendationsPromise;
}

async function generateRestaurantSuggestions(
  prompt: string,
  favoriteNames: string,
  foodPreferences: string[] = []
): Promise<DashboardRestaurant[]> {
  try {
    const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
    if (!API_KEY) {
      console.error('OpenAI API key is missing');
      return [];
    }

    const systemPrompt = `You are a restaurant recommendation expert in London. Return ONLY a JSON array of exactly 2 restaurants.

Each restaurant needs:
- name: Restaurant name in London
- cuisine: Cuisine type (string or array)
- description: 1 sentence description
- rating: 3.5-5.0
- popularity: 0-100 (70-90 trendy, 50-70 classic, 20-40 hidden)
- location: London area (e.g., "Camden, 1.2 miles")
- priceLevel: 1-4 (budget to fine dining)
- alignmentScore: 70-95 excellent, 50-70 good
- tagline: Short reason (max 5 words)

${foodPreferences.length > 0 ? `Preferences: ${foodPreferences.join(', ')}` : ''}
${favoriteNames ? `Favorites: ${favoriteNames}` : ''}

Return only JSON, no markdown.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from API');
    }

    // Parse the JSON content - handle markdown code blocks if present
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const restaurants = JSON.parse(jsonContent);
    
    // Convert to our format
    return restaurants.map((r: any, idx: number) => ({
      id: `dashboard-${Date.now()}-${idx}`,
      name: r.name || `Restaurant ${idx + 1}`,
      image: `https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop&auto=format&q=80&sig=${Math.random()}`,
      cuisines: Array.isArray(r.cuisine) ? r.cuisine : [r.cuisine || 'Restaurant'],
      alignmentScore: r.alignmentScore || 75,
      tagline: r.tagline || 'Recommended for you',
      rating: r.rating || 4.5,
      popularity: r.popularity || 60,
      location: r.location || 'London',
      description: r.description || '',
      priceLevel: r.priceLevel || 2,
    }));
  } catch (error) {
    console.error('Error generating restaurant suggestions:', error);
    return [];
  }
}

export async function searchRestaurantsByPrompt(
  userPrompt: string
): Promise<DashboardRestaurant[]> {
  try {
    const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
    if (!API_KEY) {
      console.error('OpenAI API key is missing');
      return [];
    }

    const systemPrompt = `Restaurant expert in London. Return ONLY JSON array of exactly 3 restaurants matching the user's request.

Each restaurant:
- name: Restaurant name in London
- cuisine: Type (string or array)
- description: 2-3 sentences addressing why it matches the request. Be specific about mentioned features.
- rating: 3.5-5.0
- popularity: 0-100
- location: London area with distance if specified
- priceLevel: 1-4
- alignmentScore: 80-98 perfect match, 60-79 good
- tagline: Short reason (max 6 words)

Ensure restaurants directly address the user's needs. Return only JSON, no markdown.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from API');
    }

    // Parse the JSON content - handle markdown code blocks if present
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const restaurants = JSON.parse(jsonContent);
    
    // Limit to 3 and convert to our format
    return restaurants.slice(0, 3).map((r: any, idx: number) => ({
      id: `search-${Date.now()}-${idx}`,
      name: r.name || `Restaurant ${idx + 1}`,
      image: `https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop&auto=format&q=80&sig=${Math.random()}`,
      cuisines: Array.isArray(r.cuisine) ? r.cuisine : [r.cuisine || 'Restaurant'],
      alignmentScore: r.alignmentScore || 85,
      tagline: r.tagline || 'Recommended for you',
      rating: r.rating || 4.5,
      popularity: r.popularity || 60,
      location: r.location || 'London',
      description: r.description || '',
      priceLevel: r.priceLevel || 2,
    }));
  } catch (error) {
    console.error('Error searching restaurants by prompt:', error);
    return [];
  }
}

