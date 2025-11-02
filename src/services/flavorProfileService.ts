// Flavor profile service - manages user's flavor preferences
// Stores data in localStorage and learns from user interactions

export interface FlavorProfile {
  spicy: number;    // 0-100
  sweet: number;     // 0-100
  salty: number;    // 0-100
  umami: number;    // 0-100
  sour: number;     // 0-100
  bitter: number;    // 0-100
  rich: number;     // 0-100
  light: number;    // 0-100
}

export interface FlavorInteraction {
  type: 'search' | 'favorite' | 'menu_item' | 'rating';
  timestamp: number;
  keywords: string[];
  restaurantName?: string;
  menuItemName?: string;
  rating?: number;
}

const STORAGE_KEY = 'flavorProfile';
const INTERACTIONS_KEY = 'flavorInteractions';
const DEFAULT_PROFILE: FlavorProfile = {
  spicy: 50,    // Average human preference
  sweet: 55,    // Slightly above average (humans generally prefer sweet)
  salty: 52,    // Average
  umami: 48,    // Slightly below average
  sour: 45,     // Below average
  bitter: 40,   // Lower (humans generally dislike bitter)
  rich: 50,     // Average
  light: 50,    // Average
};

// Get current flavor profile
export function getFlavorProfile(): FlavorProfile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Return default and save it
    saveFlavorProfile(DEFAULT_PROFILE);
    return DEFAULT_PROFILE;
  } catch (error) {
    console.error('Error loading flavor profile:', error);
    return DEFAULT_PROFILE;
  }
}

// Save flavor profile
export function saveFlavorProfile(profile: FlavorProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving flavor profile:', error);
  }
}

// Get all interactions
function getInteractions(): FlavorInteraction[] {
  try {
    const stored = localStorage.getItem(INTERACTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading interactions:', error);
    return [];
  }
}

// Save interactions
function saveInteractions(interactions: FlavorInteraction[]): void {
  try {
    // Keep only last 100 interactions to avoid storage bloat
    const recent = interactions.slice(-100);
    localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(recent));
  } catch (error) {
    console.error('Error saving interactions:', error);
  }
}

// Add a new interaction
export function addInteraction(interaction: Omit<FlavorInteraction, 'timestamp'>): void {
  const interactions = getInteractions();
  interactions.push({
    ...interaction,
    timestamp: Date.now(),
  });
  saveInteractions(interactions);
  
  // Trigger learning update
  updateProfileFromInteractions();
}

// Analyze keywords and extract flavor hints
function analyzeFlavorKeywords(keywords: string[]): Partial<FlavorProfile> {
  const hints: Partial<FlavorProfile> = {};
  const lowerKeywords = keywords.map(k => k.toLowerCase());

  // Spicy indicators
  if (lowerKeywords.some(k => ['spicy', 'hot', 'fiery', 'chili', 'pepper', 'sriracha', 'curry', 'cajun'].includes(k))) {
    hints.spicy = 15; // Increase spicy preference
  }

  // Sweet indicators
  if (lowerKeywords.some(k => ['sweet', 'sugar', 'honey', 'caramel', 'dessert', 'chocolate', 'candy', 'syrup'].includes(k))) {
    hints.sweet = 15;
  }

  // Salty indicators
  if (lowerKeywords.some(k => ['salty', 'savory', 'salt', 'brine', 'cured'].includes(k))) {
    hints.salty = 15;
  }

  // Umami indicators
  if (lowerKeywords.some(k => ['umami', 'meaty', 'savory', 'broth', 'miso', 'soy', 'mushroom'].includes(k))) {
    hints.umami = 15;
  }

  // Sour indicators
  if (lowerKeywords.some(k => ['sour', 'tangy', 'citrus', 'lemon', 'lime', 'vinegar', 'acidic'].includes(k))) {
    hints.sour = 15;
  }

  // Bitter indicators
  if (lowerKeywords.some(k => ['bitter', 'dark', 'coffee', 'cocoa', 'greens', 'arugula'].includes(k))) {
    hints.bitter = 10;
  }

  // Rich indicators
  if (lowerKeywords.some(k => ['rich', 'creamy', 'buttery', 'indulgent', 'decadent', 'luxury'].includes(k))) {
    hints.rich = 15;
  }

  // Light indicators
  if (lowerKeywords.some(k => ['light', 'fresh', 'crisp', 'refreshing', 'healthy', 'salad', 'grilled'].includes(k))) {
    hints.light = 15;
  }

  return hints;
}

// Update profile based on interactions (learning mechanism)
export function updateProfileFromInteractions(): void {
  const interactions = getInteractions();
  if (interactions.length === 0) return;

  const currentProfile = getFlavorProfile();
  const updates: Partial<FlavorProfile> = {};

  // Analyze all interactions
  interactions.forEach(interaction => {
    const keywords = interaction.keywords || [];
    
    // Extract flavor hints from keywords
    const hints = analyzeFlavorKeywords(keywords);
    
    // Weight by interaction type and recency
    const weight = getInteractionWeight(interaction);
    const recencyFactor = getRecencyFactor(interaction.timestamp);
    const totalWeight = weight * recencyFactor;

    // Apply hints with weighting
    Object.entries(hints).forEach(([key, value]) => {
      const flavorKey = key as keyof FlavorProfile;
      if (!updates[flavorKey]) {
        updates[flavorKey] = 0;
      }
      updates[flavorKey] = (updates[flavorKey] || 0) + value * totalWeight;
    });

    // If there's a rating, use it to weight the update
    if (interaction.rating !== undefined && interaction.rating >= 4) {
      // Positive rating means user liked these flavors
      Object.entries(hints).forEach(([key, value]) => {
        const flavorKey = key as keyof FlavorProfile;
        if (!updates[flavorKey]) {
          updates[flavorKey] = 0;
        }
        updates[flavorKey] = (updates[flavorKey] || 0) + value * 0.5 * totalWeight;
      });
    }
  });

  // Apply updates to profile (with damping to prevent wild swings)
  const dampingFactor = 0.3; // Slow learning
  const updatedProfile: FlavorProfile = { ...currentProfile };

  Object.entries(updates).forEach(([key, change]) => {
    const flavorKey = key as keyof FlavorProfile;
    const newValue = currentProfile[flavorKey] + change * dampingFactor;
    // Clamp between 0 and 100
    updatedProfile[flavorKey] = Math.max(0, Math.min(100, newValue));
  });

  // Normalize to prevent all values from drifting too high/low
  const avg = Object.values(updatedProfile).reduce((a, b) => a + b, 0) / 8;
  const targetAvg = 50;
  const adjustment = (targetAvg - avg) * 0.1; // Gentle correction

  Object.keys(updatedProfile).forEach(key => {
    const flavorKey = key as keyof FlavorProfile;
    updatedProfile[flavorKey] = Math.max(0, Math.min(100, updatedProfile[flavorKey] + adjustment));
  });

  saveFlavorProfile(updatedProfile);
}

// Get weight for interaction type
function getInteractionWeight(interaction: FlavorInteraction): number {
  switch (interaction.type) {
    case 'rating':
      return 2.0; // Ratings are very important
    case 'favorite':
      return 1.5; // Favorites are important
    case 'menu_item':
      return 1.2; // Menu item selections are moderately important
    case 'search':
      return 1.0; // Searches are baseline
    default:
      return 1.0;
  }
}

// Get recency factor (more recent = higher weight)
function getRecencyFactor(timestamp: number): number {
  const ageInDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  if (ageInDays < 1) return 1.0;
  if (ageInDays < 7) return 0.8;
  if (ageInDays < 30) return 0.5;
  if (ageInDays < 90) return 0.3;
  return 0.1; // Very old interactions have minimal weight
}

// Extract keywords from text
export function extractKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  const keywords: string[] = [];
  
  // Flavor-related words
  const flavorWords = [
    'spicy', 'hot', 'sweet', 'salty', 'sour', 'bitter', 'umami', 'tangy',
    'rich', 'creamy', 'light', 'fresh', 'citrus', 'savory', 'herby', 'aromatic'
  ];
  
  flavorWords.forEach(word => {
    if (lowerText.includes(word)) {
      keywords.push(word);
    }
  });

  // Food descriptors that hint at flavors
  const descriptors = [
    'curry', 'chili', 'caramel', 'honey', 'lemon', 'lime', 'vinegar',
    'butter', 'cream', 'salad', 'grilled', 'fried', 'steamed'
  ];

  descriptors.forEach(desc => {
    if (lowerText.includes(desc)) {
      keywords.push(desc);
    }
  });

  return keywords;
}

// Initialize profile if it doesn't exist
export function initializeFlavorProfile(): void {
  if (!localStorage.getItem(STORAGE_KEY)) {
    saveFlavorProfile(DEFAULT_PROFILE);
  }
}
