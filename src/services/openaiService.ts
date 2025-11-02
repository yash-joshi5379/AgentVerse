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
  popularity?: number; // 0-100 scale indicating how trendy/popular the restaurant is currently
}

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function generateRestaurantData(
  restaurantName: string,
  location: string,
  tasteProfile: string[],
  dietaryPreferences: string[],
  allergens: string[]
): Promise<Restaurant> {
  if (!API_KEY) {
    console.error('OpenAI API key is missing. Please add VITE_OPENAI_API_KEY to your .env file');
    throw new Error('API key not configured');
  }

  const prompt = `You are a restaurant information expert. Generate comprehensive information for a restaurant called "${restaurantName}"${location ? ` located in ${location}` : ''}.

Create realistic and detailed information in JSON format with the following structure:

{
  "name": "${restaurantName}",
  "cuisine": "type of cuisine",
  "origin": "City, State",
  "description": "1-2 sentence compelling description of the restaurant's concept and offerings",
  "background": "A detailed paragraph about how the restaurant was originally created, including the founders' story, inspiration, and any interesting history. Make it engaging and authentic.",
  "rating": 4.5,
  "priceLevel": 2,
  "environment": "Upscale Casual",
  "ambiance": ["Modern", "Cozy", "Trendy"],
  "location": "Address, City, State",
  "hours": "Mon-Sun: 11:00 AM - 10:00 PM",
  "popularity": 75,
  "menu": [
    {
      "id": "1",
      "name": "Dish name",
      "description": "Appetizing description of the dish",
      "price": 15.99,
      "rating": 4.7,
      "reviews": 234,
      "tags": ["Spicy", "Gluten-Free", "Healthy"],
      "healthInfo": {
        "calories": 450,
        "protein": 25,
        "carbs": 35,
        "fat": 15,
        "dietaryTags": ["High Protein", "Low Carb", "Heart Healthy"],
        "nutritionNotes": "Rich in omega-3 fatty acids and packed with antioxidants"
      }
    }
  ],
  "similarRestaurants": [
    {
      "id": "2",
      "name": "Similar restaurant name",
      "cuisine": "Similar cuisine type",
      "rating": 4.5
    }
  ]
}

Requirements:
1. Create 6-8 menu items with realistic names, descriptions, and prices
2. For each menu item, provide detailed health/nutrition information including calories, macros, dietary tags, and nutrition notes
3. Include dietary tags like: "High Protein", "Low Carb", "Heart Healthy", "Gluten-Free", "Keto-Friendly", "Vegetarian", "Vegan", "High Fiber", "Low Sodium", etc.
4. Make the background story authentic and interesting about the restaurant's founding
5. Ensure menu items align with the restaurant's cuisine type
6. Price range should be realistic for the restaurant type
7. Use JSON format only, no markdown or code blocks
8. Similar restaurants should be in the same general area and cuisine category
9. For "popularity": rate how trendy and currently popular this restaurant is on a scale of 0-100. Consider factors like: social media presence, recent reviews, celebrity visits, food trends, novelty, buzz around cuisine type, restaurant age, etc. A brand new trendy fusion place might be 85-95, a classic well-established place might be 60-75, an obscure place might be 20-40.

${tasteProfile.length > 0 ? `Consider these taste preferences: ${tasteProfile.join(', ')}` : ''}
${dietaryPreferences.length > 0 ? `Consider these dietary preferences: ${dietaryPreferences.join(', ')}` : ''}
${allergens.length > 0 ? `Be mindful of these allergens: ${allergens.join(', ')}` : ''}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates restaurant information in valid JSON format. Always respond with ONLY the JSON object, no additional text or markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
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
    
    // Remove markdown code blocks if present
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    
    const restaurantData = JSON.parse(jsonContent);

    // Helper function to check if item matches dietary requirements
    const matchesDietaryRequirements = (item: any, preferences: string[]): boolean => {
      if (preferences.length === 0) return true;
      
      const itemText = `${item.name} ${item.description} ${item.tags.join(' ')} ${item.healthInfo?.dietaryTags?.join(' ') || ''}`.toLowerCase();
      
      // Check ALL preferences are met (not just one)
      return preferences.every(pref => {
        const prefLower = pref.toLowerCase();
        
        // First check if the preference is explicitly found in tags or dietary tags
        if (item.tags.some((tag: string) => tag.toLowerCase().includes(prefLower))) return true;
        if (item.healthInfo?.dietaryTags?.some((tag: string) => tag.toLowerCase().includes(prefLower))) return true;
        
        // For vegan - check it's actually vegan (contains no animal products)
        if (prefLower.includes('vegan')) {
          const nonVegan = ['chicken', 'beef', 'pork', 'fish', 'seafood', 'meat', 'dairy', 'cheese', 'milk', 'butter', 'egg', 'shrimp', 'salmon', 'tuna', 'turkey', 'lamb', 'bacon', 'honey'];
          if (nonVegan.some(non => itemText.includes(non))) return false;
          // If no non-vegan ingredients, check for vegan confirmation
          return true;
        }
        
        // For vegetarian - check it contains no meat/fish
        if (prefLower.includes('vegetarian')) {
          const nonVegetarian = ['chicken', 'beef', 'pork', 'fish', 'seafood', 'meat', 'shrimp', 'salmon', 'tuna', 'turkey', 'lamb', 'bacon', 'ham'];
          if (nonVegetarian.some(non => itemText.includes(non))) return false;
          return true;
        }
        
        // For gluten-free
        if (prefLower.includes('gluten-free') || prefLower.includes('gluten')) {
          const gluten = ['wheat', 'flour', 'bread', 'pasta', 'noodles', 'soy sauce', 'beer'];
          if (gluten.some(g => itemText.includes(g))) return false;
          return true;
        }
        
        // For keto
        if (prefLower.includes('keto')) {
          const highCarb = ['rice', 'bread', 'pasta', 'potato', 'fries', 'noodles', 'quinoa', 'barley'];
          if (highCarb.some(carb => itemText.includes(carb))) return false;
          return true;
        }
        
        // For paleo
        if (prefLower.includes('paleo')) {
          const nonPaleo = ['dairy', 'cheese', 'milk', 'wheat', 'bread', 'rice', 'legumes', 'beans'];
          if (nonPaleo.some(non => itemText.includes(non))) return false;
          return true;
        }
        
        // Generic check - if preference mentioned in text
        return itemText.includes(prefLower);
      });
    };

    // Helper function to check if item is allergen safe
    const isAllergenSafe = (item: any, allergens: string[]): boolean => {
      if (allergens.length === 0) return true;
      
      const itemText = `${item.name} ${item.description}`.toLowerCase();
      return !allergens.some(allergen => itemText.includes(allergen.toLowerCase()));
    };

    // Add match scores based on taste profile and dietary preferences
    const enrichedMenu = restaurantData.menu.map((item: any, index: number) => {
      // First check if item meets strict dietary requirements
      const meetsDietaryReqs = matchesDietaryRequirements(item, dietaryPreferences);
      const allergenSafe = isAllergenSafe(item, allergens);
      
      // If dietary preferences or allergens are specified and item doesn't meet them, set very low score
      if ((dietaryPreferences.length > 0 && !meetsDietaryReqs) || !allergenSafe) {
        return {
          ...item,
          id: String(index + 1),
          matchScore: 0,
          matchReasons: undefined,
        };
      }

      let matchScore = Math.floor(Math.random() * 30) + 60; // Base score 60-90

      // Check taste profile matches
      if (tasteProfile.some(t => 
        item.tags.some((tag: string) => tag.toLowerCase().includes(t.toLowerCase())) ||
        item.name.toLowerCase().includes(t.toLowerCase()) ||
        item.description.toLowerCase().includes(t.toLowerCase())
      )) {
        matchScore += 15;
      }

      // If dietary preferences are specified and met, give high score
      if (dietaryPreferences.length > 0 && meetsDietaryReqs) {
        matchScore += 30; // Higher boost for meeting dietary requirements
      }

      matchScore = Math.min(100, matchScore); // Cap at 100

      const matchReasons: string[] = [];
      if (tasteProfile.some(t => item.name.toLowerCase().includes(t.toLowerCase()))) {
        matchReasons.push(`Matches your "${tasteProfile.find(t => item.name.toLowerCase().includes(t.toLowerCase()))}" preference`);
      }
      if (dietaryPreferences.length > 0 && meetsDietaryReqs) {
        matchReasons.push(`Perfect for ${dietaryPreferences[0]} diet`);
      }

      return {
        ...item,
        id: String(index + 1),
        matchScore,
        matchReasons: matchReasons.length > 0 ? matchReasons : undefined,
      };
    });

    return {
      ...restaurantData,
      id: '1',
      menu: enrichedMenu,
    };
  } catch (error) {
    console.error('Error generating restaurant data:', error);
    throw error;
  }
}

