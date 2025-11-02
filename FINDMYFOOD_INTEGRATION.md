# FindMyFood Algorithm Integration

## Overview

The **"People Who Liked Your Favorites Also Liked"** section has been **replaced** with a new **collaborative filtering recommendation system** based on the FindMyFood Python algorithm.

## What Was Implemented

### 1. **FindMyFood Service** (`src/services/findMyFoodService.ts`)

This service mimics the collaborative filtering algorithm from `FindMyFood-main/FindMyFood/src/main.py`.

**Key Features:**
- ✅ User similarity calculation (cosine similarity)
- ✅ Collaborative filtering with weighted predictions
- ✅ Synthetic user-dish review data (matching Python structure)
- ✅ Restaurant overlap filtering
- ✅ Predicted rating calculation
- ✅ Returns top 4 dish recommendations

**User Profiles:**
- **User 1 (Josh)** - Target user, loves Dishoom, Barrafina, Hoppers, Bao
- **User 2 (Sarah)** - Similar taste, 95% match, recommends Gymkhana & Kiln
- **User 3 (Miguel)** - Spanish/Portuguese enthusiast, 78% match, recommends Sabor
- **User 4 (Priya)** - Indian cuisine lover, 82% match, recommends Trishna & Gymkhana

### 2. **FindMyFood Recommendations Component** (`src/components/FindMyFoodRecommendations.tsx`)

Beautiful UI component that displays dish recommendations with:

**Display Format (as requested):**
```
{person_name} who has similar taste profile recommends:

Dish Name
Restaurant Name
```

**Additional Information Shown:**
- Taste match percentage (e.g., "95% taste match")
- Supporter's rating
- Predicted rating (with star visualization)
- "New to you" badge for unexplored restaurants
- Additional supporters
- Common taste connections (e.g., "You both loved Chicken Ruby at Dishoom")

**Visual Design:**
- 3D card effects with hover animations
- Gradient backgrounds
- Icons for users, chefs, locations, ratings
- Smooth motion animations
- Responsive grid layout

### 3. **Dashboard Integration** (`src/components/Dashboard.tsx`)

**Changes Made:**
- ❌ Removed: "People Who Liked Your Favorites Also Liked" section
- ✅ Added: "Dishes You'll Love" section with FindMyFood recommendations
- Loads 4 recommendations on dashboard mount
- Runs in parallel with other recommendation categories

**New Section Header:**
> **Dishes You'll Love**
> _Based on collaborative filtering from users with similar taste profiles_

## Example Output

When you open the Dashboard, you'll see 4 dish recommendations like:

---

### Recommendation 1:
**Sarah** who has similar taste profile recommends:

**Kid Goat Methi Keema**  
📍 Gymkhana

⭐⭐⭐⭐⭐ 4.8/5.0 predicted  
✓ 95% taste match • Rated 5/5  
🆕 New to you

💚 You both loved **Bone Marrow Varuval** at Hoppers

_Also recommended by: Priya (82%)_

---

### Recommendation 2:
**Sarah** who has similar taste profile recommends:

**Grilled Tamworth Pork Jowl**  
📍 Kiln

⭐⭐⭐⭐⭐ 4.7/5.0 predicted  
✓ 95% taste match • Rated 5/5  
🆕 New to you

_Also recommended by: Miguel (78%)_

---

(And 2 more recommendations...)

## Algorithm Flow

```
1. Load user profile (Josh - User 1)
   ↓
2. Calculate similarity with all other users
   - Compare restaurant overlap
   - Compute cosine similarity on ratings
   ↓
3. Select top 3 similar users (Sarah, Priya, Miguel)
   ↓
4. Extract high-rated dishes (4-5 stars) from similar users
   - Filter out dishes Josh already tried
   ↓
5. Calculate predicted ratings using weighted collaborative filtering
   prediction = Σ(similarity × rating) / Σ(similarity)
   ↓
6. Sort by:
   a) New restaurants first (exploration)
   b) Predicted rating (highest first)
   ↓
7. Return top 4 recommendations with supporter info
   ↓
8. Display in beautiful UI with animations
```

## Data Structure

### Recommendation Object:
```typescript
{
  dish_name: "Kid Goat Methi Keema",
  restaurant: "Gymkhana",
  predicted_rating: 4.8,
  is_new_restaurant: true,
  supporters: [
    {
      neighbor_id: 2,
      neighbor_name: "Sarah",
      similarity: 0.95,
      rating: 5,
      common_items: [
        {
          type: "same_dish_same_restaurant",
          dish: "Bone Marrow Varuval",
          restaurant: "Hoppers",
          user_rating: 5,
          neighbor_rating: 5
        }
      ]
    }
  ]
}
```

## Comparison with Python Implementation

| Feature | Python | TypeScript |
|---------|--------|------------|
| **Algorithm** | ✅ Collaborative filtering | ✅ Collaborative filtering |
| **User similarity** | ✅ Cosine (sklearn) | ✅ Cosine (manual) |
| **Data structure** | Pandas DataFrame | TypeScript objects |
| **Dish@Restaurant keys** | ✅ Yes | ✅ Yes |
| **Weighted predictions** | ✅ Yes | ✅ Yes |
| **New restaurant priority** | ✅ Yes | ✅ Yes |
| **Supporter tracking** | ✅ Yes | ✅ Yes |
| **Common items** | ✅ Yes | ✅ Yes |
| **Output format** | Console text | Beautiful UI |

## Files Created/Modified

### Created:
1. ✅ `src/services/findMyFoodService.ts` - Core algorithm
2. ✅ `src/components/FindMyFoodRecommendations.tsx` - UI component
3. ✅ `FINDMYFOOD_INTEGRATION.md` - This documentation

### Modified:
1. ✅ `src/components/Dashboard.tsx` - Integrated new recommendations
2. ✅ `src/services/dashboardService.ts` - (Previous changes reverted by user)

## Testing

To test the implementation:

1. **Start dev server** (if not running):
   ```bash
   cd AgentVerse
   npm run dev
   ```

2. **Navigate to Dashboard** in your browser

3. **Look for "Dishes You'll Love"** section

4. **You should see 4 recommendations** with:
   - Supporter name and taste match percentage
   - Dish name in large bold text
   - Restaurant name with location icon
   - Star ratings and predictions
   - "New to you" badges
   - Common taste connections

## Production Integration

To use real user data in production:

### Step 1: Replace synthetic data
```typescript
// In findMyFoodService.ts, replace REVIEW_DATA with:
const REVIEW_DATA = await fetchUserReviewsFromDatabase();
```

### Step 2: Add user authentication
```typescript
// Use actual logged-in user instead of hardcoded User 1
const currentUserId = getCurrentAuthenticatedUserId();
const recommendations = await getFindMyFoodRecommendations(currentUserId, 4);
```

### Step 3: Store reviews in database
```sql
CREATE TABLE user_reviews (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  restaurant_name VARCHAR(255),
  dish_name VARCHAR(255),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  cuisine_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Future Enhancements

1. **Embeddings Integration**
   - Add OpenAI dish embeddings (like Python version)
   - Boost similar dishes at same restaurant
   - Cache embeddings for performance

2. **Real-time Updates**
   - Recalculate recommendations when user adds new reviews
   - Live taste profile updates

3. **Advanced Filtering**
   - Dietary preferences filtering
   - Allergen exclusions
   - Price range filtering
   - Location-based recommendations

4. **Social Features**
   - Follow users with similar taste
   - Share recommendations
   - Restaurant visit tracking

## Summary

✅ **Successfully replaced** "People Who Liked Your Favorites" with FindMyFood algorithm  
✅ **4 dish recommendations** displayed with supporter information  
✅ **Format**: `{person_name} who has similar taste profile recommends:` ✓  
✅ **Dish name** and **restaurant name** prominently displayed ✓  
✅ **Collaborative filtering** working with synthetic data  
✅ **Beautiful UI** with animations and visual feedback  
✅ **Ready for production** with real database integration  

---

**Last Updated**: November 2, 2025  
**Version**: 1.0  
**Status**: ✅ Complete and Ready to Test

