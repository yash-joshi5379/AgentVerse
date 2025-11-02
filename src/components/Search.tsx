import { useState } from 'react';
import { Search as SearchIcon, X, Plus, Sparkles, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BubbleBackground } from './BubbleBackground';
import { RestaurantDetail } from './RestaurantDetail';

export function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [tasteProfileInput, setTasteProfileInput] = useState('');
  const [tasteProfile, setTasteProfile] = useState<string[]>([]);
  const [dietaryInput, setDietaryInput] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [allergenInput, setAllergenInput] = useState('');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [showRestaurant, setShowRestaurant] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowRestaurant(true);
    }
  };

  const handleAddToProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (tasteProfileInput.trim() && !tasteProfile.includes(tasteProfileInput.trim())) {
      setTasteProfile([...tasteProfile, tasteProfileInput.trim()]);
      setTasteProfileInput('');
    }
  };

  const removeFromProfile = (item: string) => {
    setTasteProfile(tasteProfile.filter(i => i !== item));
  };

  const handleAddDietary = (e: React.FormEvent) => {
    e.preventDefault();
    if (dietaryInput.trim() && !dietaryPreferences.includes(dietaryInput.trim())) {
      setDietaryPreferences([...dietaryPreferences, dietaryInput.trim()]);
      setDietaryInput('');
    }
  };

  const removeFromDietary = (item: string) => {
    setDietaryPreferences(dietaryPreferences.filter(i => i !== item));
  };

  const handleAddAllergen = (e: React.FormEvent) => {
    e.preventDefault();
    if (allergenInput.trim() && !allergens.includes(allergenInput.trim())) {
      setAllergens([...allergens, allergenInput.trim()]);
      setAllergenInput('');
    }
  };

  const removeFromAllergens = (item: string) => {
    setAllergens(allergens.filter(i => i !== item));
  };

  return (
    <div className="min-h-screen relative">
      <BubbleBackground />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20 space-y-8 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="mb-2 drop-shadow-lg">
            Find Your Perfect Restaurant Match
          </h1>
          <p className="text-muted-foreground">
            Personalised ratings and recommendations - discover how well your choice fits your tastes and needs
          </p>
        </motion.div>

        {/* Search Form with 3D Effect */}
        <motion.form
          onSubmit={handleSearch}
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input - Glassmorphism */}
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
                  placeholder="Search for a restaurant you want to try..."
                  className="w-full pl-14 pr-6 py-5 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none transition-all"
                />
              </div>
            </motion.div>

            {/* Location Input - Glassmorphism */}
            <motion.div
              className="relative w-full md:w-80"
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-3xl blur-xl"
                style={{ transform: 'translateZ(-10px)' }}
              />
              <div className="relative backdrop-blur-xl bg-white/90 border-2 border-white shadow-2xl rounded-3xl">
                <MapPin className="absolute left-6 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location..."
                  className="w-full pl-14 pr-6 py-5 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none transition-all"
                />
              </div>
            </motion.div>

            {/* 3D Search Button */}
            <motion.button
              type="submit"
              className="relative px-10 py-5 rounded-3xl overflow-hidden group"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary transform transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse" />
              </div>
              <span className="relative flex items-center gap-2 text-white whitespace-nowrap">
                <Sparkles className="w-5 h-5" />
                Search
              </span>
            </motion.button>
          </div>
        </motion.form>

        {/* Profile Sections */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-4">
          {/* Taste Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <motion.div
              className="relative backdrop-blur-xl bg-white/90 border-2 border-white shadow-2xl rounded-2xl p-5"
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {/* Layered depth effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-2xl blur opacity-30" />
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                  </motion.div>
                  <h3 className="text-foreground">Taste Profile</h3>
                </div>
                
                <form onSubmit={handleAddToProfile} className="mb-4">
                  <div className="relative">
                    <motion.div
                      className="backdrop-blur-xl bg-white/50 border border-border rounded-xl overflow-hidden"
                      whileFocus={{ scale: 1.02 }}
                    >
                      <input
                        type="text"
                        value={tasteProfileInput}
                        onChange={(e) => setTasteProfileInput(e.target.value)}
                        placeholder="Add taste (Spicy, Fried...)"
                        className="w-full pl-4 pr-12 py-3 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none"
                      />
                    </motion.div>
                    <motion.button
                      type="submit"
                      className="absolute right-1.5 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-primary to-secondary text-white p-2 rounded-lg shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                </form>

                {/* Food Category Cards */}
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence mode="popLayout">
                    {tasteProfile.map((item, index) => (
                      <motion.div
                        key={item}
                        layout
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 20,
                          delay: index * 0.05,
                        }}
                        whileHover={{ y: -2, scale: 1.05 }}
                        className="group relative"
                      >
                        {/* 3D Card Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 to-pink-500/40 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
                        
                        <div className="relative backdrop-blur-xl bg-white/80 border-2 border-white shadow-lg rounded-xl px-4 py-2">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-xl" />
                          
                          <div className="relative flex items-center gap-2">
                            <span className="text-foreground text-sm">{item}</span>
                            
                            {/* Remove Button with Micro-interaction */}
                            <motion.button
                              onClick={() => removeFromProfile(item)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              whileHover={{ scale: 1.2, rotate: 90 }}
                              whileTap={{ scale: 0.8 }}
                            >
                              <X className="w-3 h-3" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Dietary Preferences & Allergens Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <motion.div
              className="relative backdrop-blur-xl bg-white/90 border-2 border-white shadow-2xl rounded-2xl p-5"
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {/* Layered depth effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/30 to-red-500/30 rounded-2xl blur opacity-30" />
              
              <div className="relative space-y-6">
                {/* Dietary Preferences */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    >
                      <Sparkles className="w-5 h-5 text-green-500" />
                    </motion.div>
                    <h3 className="text-foreground">Dietary Preferences</h3>
                  </div>
                  
                  <form onSubmit={handleAddDietary} className="mb-4">
                    <div className="relative">
                      <motion.div
                        className="backdrop-blur-xl bg-white/50 border border-border rounded-xl overflow-hidden"
                        whileFocus={{ scale: 1.02 }}
                      >
                        <input
                          type="text"
                          value={dietaryInput}
                          onChange={(e) => setDietaryInput(e.target.value)}
                          placeholder="Add diet (Vegan, Keto...)"
                          className="w-full pl-4 pr-12 py-3 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none"
                        />
                      </motion.div>
                      <motion.button
                        type="submit"
                        className="absolute right-1.5 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-2 rounded-lg shadow-lg"
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </form>

                  {/* Dietary Preference Cards */}
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence mode="popLayout">
                      {dietaryPreferences.map((item, index) => (
                        <motion.div
                          key={item}
                          layout
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 20,
                            delay: index * 0.05,
                          }}
                          whileHover={{ y: -2, scale: 1.05 }}
                          className="group relative"
                        >
                          {/* 3D Card Effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/40 to-emerald-500/40 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
                          
                          <div className="relative backdrop-blur-xl bg-white/80 border-2 border-white shadow-lg rounded-xl px-4 py-2">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-xl" />
                            
                            <div className="relative flex items-center gap-2">
                              <span className="text-foreground text-sm">{item}</span>
                              
                              {/* Remove Button with Micro-interaction */}
                              <motion.button
                                onClick={() => removeFromDietary(item)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                whileHover={{ scale: 1.2, rotate: 90 }}
                                whileTap={{ scale: 0.8 }}
                              >
                                <X className="w-3 h-3" />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Allergens */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    >
                      <Sparkles className="w-5 h-5 text-red-500" />
                    </motion.div>
                    <h3 className="text-foreground">Allergens</h3>
                  </div>
                  
                  <form onSubmit={handleAddAllergen} className="mb-4">
                    <div className="relative">
                      <motion.div
                        className="backdrop-blur-xl bg-white/50 border border-border rounded-xl overflow-hidden"
                        whileFocus={{ scale: 1.02 }}
                      >
                        <input
                          type="text"
                          value={allergenInput}
                          onChange={(e) => setAllergenInput(e.target.value)}
                          placeholder="Add allergens (Peanuts, Dairy...)"
                          className="w-full pl-4 pr-12 py-3 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none"
                        />
                      </motion.div>
                      <motion.button
                        type="submit"
                        className="absolute right-1.5 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-red-500 to-orange-500 text-white p-2 rounded-lg shadow-lg"
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </form>

                  {/* Allergen Cards */}
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence mode="popLayout">
                      {allergens.map((item, index) => (
                        <motion.div
                          key={item}
                          layout
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 20,
                            delay: index * 0.05,
                          }}
                          whileHover={{ y: -2, scale: 1.05 }}
                          className="group relative"
                        >
                          {/* 3D Card Effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-red-500/40 to-orange-500/40 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
                          
                          <div className="relative backdrop-blur-xl bg-white/80 border-2 border-white shadow-lg rounded-xl px-4 py-2">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-xl" />
                            
                            <div className="relative flex items-center gap-2">
                              <span className="text-foreground text-sm">{item}</span>
                              
                              {/* Remove Button with Micro-interaction */}
                              <motion.button
                                onClick={() => removeFromAllergens(item)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                whileHover={{ scale: 1.2, rotate: 90 }}
                                whileTap={{ scale: 0.8 }}
                              >
                                <X className="w-3 h-3" />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Restaurant Detail View */}
        <AnimatePresence mode="wait">
          {showRestaurant && (
            <RestaurantDetail
              restaurantName={searchQuery}
              location={location}
              tasteProfile={tasteProfile}
              dietaryPreferences={dietaryPreferences}
              allergens={allergens}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
