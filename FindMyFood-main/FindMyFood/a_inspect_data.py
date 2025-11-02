"""
Inspect generated restaurant review data.

This script loads and displays the generated data in a readable format.
"""

import sys
from pathlib import Path
import json

# Add project root to path
project_root = Path(__file__).resolve().parent
sys.path.insert(0, str(project_root))

import pandas as pd
import config
from src.data_gen import DATA_DIR, _get_dataset_paths

def main():
    print("\n" + "="*70)
    print("DATA INSPECTION - RESTAURANT REVIEW SYSTEM")
    print("="*70)
    
    size = config.SYNTHETIC_SIZE
    seed = config.CACHE_SEED
    
    print(f"\nConfiguration: size={size}, seed={seed}")
    
    dishes_path, reviews_path, embeddings_path = _get_dataset_paths(size, seed)
    
    # Check files exist
    print(f"\n📁 File Status:")
    if not dishes_path.exists():
        print(f"  ❌ Dishes file not found!")
        print(f"     Expected: {dishes_path}")
        print(f"\n  Run: python a_gen_data_with_embeddings.py")
        return
    
    print(f"  ✅ Dishes: {dishes_path.name}")
    print(f"     Size: {dishes_path.stat().st_size:,} bytes")
    
    if reviews_path.exists():
        print(f"  ✅ Reviews: {reviews_path.name}")
        print(f"     Size: {reviews_path.stat().st_size:,} bytes")
    
    if embeddings_path.exists():
        print(f"  ✅ Embeddings: {embeddings_path.name}")
        print(f"     Size: {embeddings_path.stat().st_size:,} bytes")
    
    # =========================================================================
    # LOAD AND INSPECT DISH REVIEWS
    # =========================================================================
    print(f"\n" + "="*70)
    print("DISH-LEVEL REVIEW DATA")
    print("="*70)
    
    dishes_df = pd.read_pickle(dishes_path)
    
    print(f"\n📊 Dataset Overview:")
    print(f"  Shape: {dishes_df.shape[0]:,} rows × {dishes_df.shape[1]} columns")
    print(f"  Columns: {list(dishes_df.columns)}")
    
    print(f"\n📊 Statistics:")
    print(f"  Total reviews: {len(dishes_df):,}")
    print(f"  Unique users: {dishes_df['user_id'].nunique()}")
    print(f"  Unique restaurants: {dishes_df['restaurant_id'].nunique()}")
    print(f"  Unique dishes: {dishes_df['dish_id'].nunique()}")
    print(f"  Average rating: {dishes_df['rating'].mean():.2f}/5.0")
    
    print(f"\n📊 Rating Distribution:")
    rating_dist = dishes_df['rating'].value_counts().sort_index()
    for rating, count in rating_dist.items():
        pct = (count / len(dishes_df)) * 100
        bar = '█' * int(pct / 2)
        print(f"  {int(rating)} stars: {count:4d} ({pct:5.1f}%) {bar}")
    
    print(f"\n📊 Cuisine Distribution:")
    cuisine_dist = dishes_df['cuisine_type'].value_counts().head(10)
    for cuisine, count in cuisine_dist.items():
        pct = (count / len(dishes_df)) * 100
        print(f"  {cuisine:15s}: {count:4d} ({pct:5.1f}%)")
    
    print(f"\n📋 Sample Dish Reviews (first 20 rows):")
    display_cols = ['user_id', 'restaurant_name', 'dish_name', 'rating', 'cuisine_type', 'visit_number']
    print(dishes_df[display_cols].head(20).to_string(index=False))
    
    # =========================================================================
    # LOAD AND INSPECT VISIT SUMMARIES
    # =========================================================================
    if reviews_path.exists():
        print(f"\n" + "="*70)
        print("VISIT-LEVEL SUMMARY DATA")
        print("="*70)
        
        reviews_df = pd.read_pickle(reviews_path)
        
        print(f"\n📊 Dataset Overview:")
        print(f"  Shape: {reviews_df.shape[0]:,} rows × {reviews_df.shape[1]} columns")
        print(f"  Columns: {list(reviews_df.columns)}")
        
        print(f"\n📊 Statistics:")
        print(f"  Total visits: {len(reviews_df):,}")
        print(f"  Average dishes per visit: {reviews_df['n_dishes'].mean():.2f}")
        print(f"  Average visits per user: {len(reviews_df) / dishes_df['user_id'].nunique():.2f}")
        
        print(f"\n📊 Dishes Per Visit Distribution:")
        dishes_per_visit = reviews_df['n_dishes'].value_counts().sort_index()
        for n_dishes, count in dishes_per_visit.items():
            pct = (count / len(reviews_df)) * 100
            bar = '█' * int(pct / 2)
            print(f"  {n_dishes} dishes: {count:4d} ({pct:5.1f}%) {bar}")
        
        print(f"\n📋 Sample Visit Summaries (first 15 rows):")
        summary_cols = ['user_id', 'restaurant_name', 'review_rating', 'n_dishes', 'cuisine_type', 'visit_number']
        print(reviews_df[summary_cols].head(15).to_string(index=False))
    
    # =========================================================================
    # INSPECT EMBEDDINGS
    # =========================================================================
    if embeddings_path.exists():
        print(f"\n" + "="*70)
        print("EMBEDDING DATA")
        print("="*70)
        
        with open(embeddings_path, 'r') as f:
            embeddings = json.load(f)
        
        print(f"\n📊 Statistics:")
        print(f"  Total embeddings: {len(embeddings)}")
        
        if embeddings:
            # Get first embedding to show vector length
            first_key = list(embeddings.keys())[0]
            first_embedding = embeddings[first_key]
            print(f"  Vector dimensions: {len(first_embedding)}")
            
            print(f"\n📋 Sample Embeddings (first 10):")
            for i, (key, embedding) in enumerate(list(embeddings.items())[:10]):
                # Show first 5 values of the vector
                preview = embedding[:5]
                print(f"  {key}")
                print(f"    Vector preview: [{preview[0]:.3f}, {preview[1]:.3f}, {preview[2]:.3f}, {preview[3]:.3f}, {preview[4]:.3f}, ...]")
    
    # =========================================================================
    # USER DEEP DIVE - USER 1
    # =========================================================================
    print(f"\n" + "="*70)
    print("USER DEEP DIVE - USER 1")
    print("="*70)
    
    user_1_data = dishes_df[dishes_df['user_id'] == 1].copy()
    
    if len(user_1_data) == 0:
        print("\n  No data found for User 1")
    else:
        print(f"\n📊 User 1 Statistics:")
        print(f"  Total reviews: {len(user_1_data)}")
        print(f"  Average rating: {user_1_data['rating'].mean():.2f}/5.0")
        print(f"  Restaurants visited: {user_1_data['restaurant_name'].nunique()}")
        print(f"  Dishes tried: {user_1_data['dish_name'].nunique()}")
        print(f"  Total visits: {user_1_data['visit_number'].max()}")
        
        # Favorite restaurants
        print(f"\n📊 User 1's Favorite Restaurants (by avg rating):")
        rest_avg = user_1_data.groupby('restaurant_name')['rating'].agg(['mean', 'count']).sort_values('mean', ascending=False)
        for rest, row in rest_avg.head(5).iterrows():
            print(f"  {rest:25s}: {row['mean']:.2f}/5.0 ({int(row['count'])} dishes)")
        
        # Favorite cuisines
        print(f"\n📊 User 1's Favorite Cuisines (by avg rating):")
        cuisine_avg = user_1_data.groupby('cuisine_type')['rating'].agg(['mean', 'count']).sort_values('mean', ascending=False)
        for cuisine, row in cuisine_avg.iterrows():
            print(f"  {cuisine:15s}: {row['mean']:.2f}/5.0 ({int(row['count'])} dishes)")
        
        # Full review history
        print(f"\n📋 User 1's Complete Review History:")
        user_cols = ['visit_number', 'restaurant_name', 'dish_name', 'rating', 'cuisine_type']
        sorted_user_data = user_1_data.sort_values('visit_number')
        print(sorted_user_data[user_cols].to_string(index=False))
        
        # Top rated dishes
        print(f"\n⭐ User 1's Top Rated Dishes (5 stars):")
        top_dishes = user_1_data[user_1_data['rating'] == 5][['restaurant_name', 'dish_name', 'cuisine_type']]
        if len(top_dishes) > 0:
            print(top_dishes.to_string(index=False))
        else:
            print("  (No 5-star ratings)")
        
        # Low rated dishes
        print(f"\n👎 User 1's Lowest Rated Dishes (1-2 stars):")
        low_dishes = user_1_data[user_1_data['rating'] <= 2][['restaurant_name', 'dish_name', 'rating', 'cuisine_type']]
        if len(low_dishes) > 0:
            print(low_dishes.to_string(index=False))
        else:
            print("  (No low ratings)")
    
    # =========================================================================
    # SUMMARY
    # =========================================================================
    print(f"\n" + "="*70)
    print("INSPECTION COMPLETE!")
    print("="*70)
    
    print(f"\n📊 Data Summary:")
    print(f"  • {len(dishes_df):,} dish reviews across {dishes_df['user_id'].nunique()} users")
    print(f"  • {dishes_df['restaurant_id'].nunique()} restaurants with {dishes_df['dish_id'].nunique()} unique dishes")
    if reviews_path.exists():
        print(f"  • {len(reviews_df):,} restaurant visits")
    if embeddings_path.exists():
        print(f"  • {len(embeddings)} dish embeddings computed")
    
    print(f"\n✅ Data looks good! Ready to run recommendations.")
    print(f"\n💡 Next step:")
    print(f"  python src/main.py")
    print(f"  or")
    print(f"  python main.py")


if __name__ == "__main__":
    main()

