import { generateRestaurantData } from './openaiService';

export interface FavoriteRestaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  location: string;
  image: string;
}

// Cache for favorites to avoid reloading
let cachedFavorites: FavoriteRestaurant[] | null = null;
let loadingPromise: Promise<FavoriteRestaurant[]> | null = null;

export async function loadDefaultFavorites(): Promise<FavoriteRestaurant[]> {
  // Return cached favorites if available
  if (cachedFavorites !== null) {
    return cachedFavorites;
  }

  // Return existing promise if already loading
  if (loadingPromise !== null) {
    return loadingPromise;
  }

  // Start loading
  loadingPromise = (async () => {
    try {
      const defaultRestaurants = ['Dishoom', 'Vapiano'];
      const favorites: FavoriteRestaurant[] = [];

      for (const name of defaultRestaurants) {
        try {
          const data = await generateRestaurantData(name, 'London', [], [], []);
          favorites.push({
            id: data.id || Math.random().toString(),
            name: data.name,
            cuisine: data.cuisine,
            rating: data.rating,
            location: data.location,
            image: `https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop&auto=format&q=80`,
          });
        } catch (error) {
          console.error(`Error loading ${name}:`, error);
        }
      }

      cachedFavorites = favorites;
      return favorites;
    } catch (error) {
      console.error('Error loading favorites:', error);
      cachedFavorites = []; // Cache empty array to prevent retries
      return [];
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

// Allow manual cache clearing if needed
export function clearFavoritesCache() {
  cachedFavorites = null;
  loadingPromise = null;
}

// Add a new favorite
export async function addFavorite(name: string): Promise<FavoriteRestaurant | null> {
  try {
    const data = await generateRestaurantData(name.trim(), '', [], [], []);
    const newFavorite: FavoriteRestaurant = {
      id: data.id || Math.random().toString(),
      name: data.name,
      cuisine: data.cuisine,
      rating: data.rating,
      location: data.location,
      image: `https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop&auto=format&q=80`,
    };

    // Add to cache
    if (cachedFavorites !== null) {
      cachedFavorites = [...cachedFavorites, newFavorite];
    }

    return newFavorite;
  } catch (error) {
    console.error('Error adding favorite:', error);
    return null;
  }
}

