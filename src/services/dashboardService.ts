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
      const [suggestions1, suggestions2, suggestions3] = await Promise.allSettled([
        // 1. People who liked your favorites also liked
        generateRestaurantSuggestions(
          `People who like ${favoriteNames} (located in London) also enjoy similar restaurants. Suggest 3-4 restaurants in London that are similar in cuisine or vibe to these favorites. They should be popular with overlapping audiences.`,
          favoriteNames
        ),
        // 2. Trendy Foods
        generateRestaurantSuggestions(
          `Suggest 3-4 extremely trendy and popular restaurants in London right now. These should be hot spots with high social media buzz, celebrity visits, or innovative cuisine that's currently taking the city by storm. Focus on the newest, most talked-about places.`,
          favoriteNames
        ),
        // 3. Recommended for You (based on food preferences)
        foodPreferences.length > 0 
          ? generateRestaurantSuggestions(
              `Based on food preferences for ${foodPreferences.join(', ')}, suggest 4-5 restaurants in London that perfectly match these cuisines. These should be highly-rated restaurants known for these specific cuisine types.`,
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

    const systemPrompt = `You are a restaurant recommendation expert in London. Generate realistic restaurant recommendations based on the criteria given.

Return ONLY a JSON array of restaurants. Each restaurant should have:
- name: A realistic restaurant name in London
- cuisine: Type of cuisine (can be a single string like "Italian" or array like ["Italian", "Mediterranean"])
- description: 1-2 sentence compelling description
- rating: A rating between 3.5 and 5.0
- popularity: How trendy (0-100, where trendy modern places are 70-90, established classics 50-70, hidden gems 20-40)
- location: A realistic location in London (e.g., "Camden, 1.2 miles away" or "Shoreditch, 2.5 miles away")
- priceLevel: Price level 1-4 (1=budget, 2=moderate, 3=upscale, 4=fine dining)
- alignmentScore: Calculate based on: (1) How well it matches user's favorite restaurants (40% weight), (2) Restaurant rating quality (30% weight), (3) Trendiness/popularity (30% weight). Scores should be 70-95 for excellent matches, 50-70 for good matches.
- tagline: A short catchy reason for this recommendation (e.g., "Because you liked Dishoom" or "Trending hotspot" or "Perfect for Italian lovers")

${foodPreferences.length > 0 ? `User preferences: ${foodPreferences.join(', ')}` : ''}
${favoriteNames ? `User's favorite restaurants: ${favoriteNames}` : ''}

Generate realistic, diverse London restaurants that fit the criteria.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
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

