import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Star, MapPin, Edit2, Check, X, Plus, Loader2 } from 'lucide-react';
import { loadDefaultFavorites, addFavorite, type FavoriteRestaurant } from '../services/favoritesService';

const allCuisines = ['Japanese', 'Italian', 'Mexican', 'Thai', 'BBQ', 'Seafood', 'American', 'Chinese', 'Indian', 'Korean', 'Vietnamese', 'Mediterranean'];

export function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState(['Japanese', 'Italian', 'Mexican', 'BBQ']);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<FavoriteRestaurant[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [addingRestaurant, setAddingRestaurant] = useState(false);

  // Load default favorites on mount
  useEffect(() => {
    const loadFavorites = async () => {
      setLoadingFavorites(true);
      try {
        const favorites = await loadDefaultFavorites();
        setFavoriteRestaurants(favorites);
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoadingFavorites(false);
      }
    };

    loadFavorites();
  }, []);

  const handleAddFavorite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestaurantName.trim()) return;

    setAddingRestaurant(true);
    try {
      const newFavorite = await addFavorite(newRestaurantName.trim());
      if (newFavorite) {
        setFavoriteRestaurants([...favoriteRestaurants, newFavorite]);
        setNewRestaurantName('');
        setShowAddDialog(false);
      } else {
        alert('Failed to add restaurant. Please check your API key and try again.');
      }
    } catch (error) {
      console.error('Error adding restaurant:', error);
      alert('Failed to add restaurant. Please try again.');
    } finally {
      setAddingRestaurant(false);
    }
  };

  const removeFavorite = (id: string) => {
    setFavoriteRestaurants(favoriteRestaurants.filter(r => r.id !== id));
  };

  const toggleCuisine = (cuisine: string) => {
    if (selectedCuisines.includes(cuisine)) {
      setSelectedCuisines(selectedCuisines.filter(c => c !== cuisine));
    } else {
      setSelectedCuisines([...selectedCuisines, cuisine]);
    }
  };

  return (
    <div className="min-h-screen relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        <div className="bg-gradient-to-br from-primary to-secondary rounded-3xl p-8 text-white shadow-[0_8px_30px_rgba(88,86,214,0.3)] transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl">
              👤
            </div>
            <div>
              <h1 className="text-white mb-2">Josh Martinez</h1>
              <p className="text-white/90">Member since August 2025</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="text-sm">
                  <span className="opacity-90">Favorites:</span>
                  <span className="ml-2">{favoriteRestaurants.length}</span>
                </div>
                <div className="text-sm">
                  <span className="opacity-90">Reviews:</span>
                  <span className="ml-2">12</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(88,86,214,0.1)] transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2>Food Preferences</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                isEditing 
                  ? 'bg-destructive text-white' 
                  : 'bg-primary text-white'
              }`}
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  Edit Preferences
                </>
              )}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Select your favorite cuisines to get better recommendations
              </p>
              <div className="flex flex-wrap gap-3">
                {allCuisines.map((cuisine) => (
                  <button
                    key={cuisine}
                    onClick={() => toggleCuisine(cuisine)}
                    className={`px-4 py-2 rounded-full transition-all ${
                      selectedCuisines.includes(cuisine)
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                        : 'bg-muted text-foreground hover:bg-secondary/30'
                    }`}
                  >
                    {selectedCuisines.includes(cuisine) && (
                      <Check className="w-4 h-4 inline mr-1" />
                    )}
                    {cuisine}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="mt-4 bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-full hover:shadow-lg transition-all"
              >
                Save Preferences
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {selectedCuisines.map((cuisine) => (
                <span
                  key={cuisine}
                  className="px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/30 text-foreground rounded-full"
                >
                  {cuisine}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2>My Favourite Restaurants</h2>
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Favorite
            </button>
          </div>

          {loadingFavorites ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading favorites...</p>
              </div>
            </div>
          ) : favoriteRestaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {favoriteRestaurants.map((restaurant) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 relative group"
                >
                  <div className="relative h-40 overflow-hidden">
                    <ImageWithFallback
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeFavorite(restaurant.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3>{restaurant.name}</h3>
                    <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(restaurant.rating)
                              ? 'fill-[#5856D6] text-[#5856D6]'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{restaurant.location}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center">
              <p className="text-muted-foreground mb-4">
                No favorites yet. Add your favorite restaurants to see them here!
              </p>
              <button
                onClick={() => setShowAddDialog(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-full hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Your First Favorite
              </button>
            </div>
          )}
        </div>

        {showAddDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold mb-4">Add Favorite Restaurant</h3>
              <form onSubmit={handleAddFavorite}>
                <input
                  type="text"
                  value={newRestaurantName}
                  onChange={(e) => setNewRestaurantName(e.target.value)}
                  placeholder="Enter restaurant name..."
                  className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={addingRestaurant}
                />
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddDialog(false);
                      setNewRestaurantName('');
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                    disabled={addingRestaurant}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingRestaurant}
                    className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {addingRestaurant ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
