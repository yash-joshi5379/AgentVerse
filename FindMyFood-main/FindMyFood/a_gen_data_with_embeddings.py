"""
Complete data generation script with embeddings.

This script:
1. Generates synthetic multi-visit restaurant data
2. Computes embeddings for all dishes
3. Stores everything together in src/data/

Usage:
    python generate_data_with_embeddings.py
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parent
sys.path.insert(0, str(project_root))

import config
from src.data_gen import (
    generate_multi_item_review_data,
    save_multi_visit_data,
    generate_embeddings_for_data,
    DEFAULT_SIZE_CONFIGS
)

def main():
    print("\n" + "="*70)
    print("DATA GENERATION WITH EMBEDDINGS")
    print("="*70)
    
    # Use configuration from config.py
    size = config.SYNTHETIC_SIZE
    seed = config.CACHE_SEED
    
    print(f"\n📋 Configuration:")
    print(f"  - Dataset size: {size.upper()}")
    print(f"  - Random seed: {seed}")
    print(f"  - Embeddings enabled: {config.ENABLE_DISH_EMBEDDING_SIMILARITY}")
    
    # Get size parameters
    if size not in DEFAULT_SIZE_CONFIGS:
        print(f"\n❌ Error: Invalid size '{size}'")
        print(f"   Valid sizes: {', '.join(DEFAULT_SIZE_CONFIGS.keys())}")
        return
    
    params = DEFAULT_SIZE_CONFIGS[size]
    
    print(f"\n📊 Dataset parameters:")
    print(f"  - Users: {params['n_users']}")
    print(f"  - Restaurants: {params['n_restaurants']}")
    print(f"  - Dishes per restaurant: ~{params['n_dishes_per_restaurant']}")
    print(f"  - Visits per user: {params['visits_per_user_range'][0]}-{params['visits_per_user_range'][1]}")
    print(f"  - Items per visit: {params['items_per_visit_range'][0]}-{params['items_per_visit_range'][1]}")
    
    # Step 1: Generate data
    print(f"\n" + "="*70)
    print("STEP 1: GENERATING SYNTHETIC DATA")
    print("="*70)
    
    dishes_df, reviews_df = generate_multi_item_review_data(
        n_users=params['n_users'],
        n_restaurants=params['n_restaurants'],
        n_dishes_per_restaurant=params['n_dishes_per_restaurant'],
        visits_per_user_range=params['visits_per_user_range'],
        items_per_visit_range=params['items_per_visit_range'],
        seed=seed,
        generate_review_texts=False
    )
    
    print(f"\n✅ Data generation complete!")
    print(f"\n📊 Dataset statistics:")
    print(f"  - Dish reviews: {len(dishes_df):,} rows")
    print(f"  - Visit summaries: {len(reviews_df):,} rows")
    print(f"  - Unique users: {dishes_df['user_id'].nunique()}")
    print(f"  - Unique restaurants: {dishes_df['restaurant_id'].nunique()}")
    print(f"  - Unique dishes: {dishes_df['dish_id'].nunique()}")
    print(f"  - Avg visits per user: {len(reviews_df) / dishes_df['user_id'].nunique():.1f}")
    print(f"  - Avg dishes per visit: {len(dishes_df) / len(reviews_df):.1f}")
    
    # Step 2: Save data
    print(f"\n" + "="*70)
    print("STEP 2: SAVING DATA TO DISK")
    print("="*70)
    
    save_multi_visit_data(dishes_df, reviews_df, size, seed)
    
    print(f"\n✅ Data files saved:")
    print(f"  📁 src/data/multi_visit_{size}_seed{seed}_dishes.pkl")
    print(f"  📁 src/data/multi_visit_{size}_seed{seed}_reviews.pkl")
    
    # Step 3: Generate embeddings (if enabled)
    if config.ENABLE_DISH_EMBEDDING_SIMILARITY:
        print(f"\n" + "="*70)
        print("STEP 3: GENERATING EMBEDDINGS")
        print("="*70)
        print(f"\n🔄 Computing OpenAI embeddings for semantic similarity...")
        print(f"   Model: text-embedding-3-small (cheap & fast)")
        
        try:
            embeddings_cache = generate_embeddings_for_data(
                dishes_df, 
                size, 
                seed, 
                force_regenerate=False
            )
            
            if embeddings_cache:
                print(f"\n✅ Embeddings file saved:")
                print(f"  📁 src/data/multi_visit_{size}_seed{seed}_embeddings.json")
                print(f"  📊 Total embeddings: {len(embeddings_cache)}")
                
                # Estimate cost (text-embedding-3-small is ~$0.02 per 1M tokens)
                unique_dishes = dishes_df.groupby(['dish_name', 'restaurant_name']).first()
                avg_tokens_per_dish = 10  # rough estimate
                total_tokens = len(unique_dishes) * avg_tokens_per_dish
                estimated_cost = (total_tokens / 1_000_000) * 0.02
                print(f"  💰 Estimated API cost: ${estimated_cost:.4f}")
            else:
                print(f"\n⚠️  Embedding generation failed (check OpenAI API key)")
                
        except Exception as e:
            print(f"\n❌ Error generating embeddings: {e}")
            print(f"   You can still use the system without embeddings")
            print(f"   (or generate them later by running src/main.py)")
    else:
        print(f"\n" + "="*70)
        print("STEP 3: EMBEDDINGS DISABLED")
        print("="*70)
        print(f"\n⚠️  Embeddings disabled in config.py")
        print(f"   To enable: Set ENABLE_DISH_EMBEDDING_SIMILARITY = True")
    
    # Step 4: Show sample data
    print(f"\n" + "="*70)
    print("SAMPLE DATA PREVIEW")
    print("="*70)
    
    print(f"\n📋 Dish Reviews (first 10 rows):")
    sample_cols = ['user_id', 'restaurant_name', 'dish_name', 'rating', 'cuisine_type']
    print(dishes_df[sample_cols].head(10).to_string(index=False))
    
    print(f"\n📋 Visit Summaries (first 5 rows):")
    summary_cols = ['user_id', 'restaurant_name', 'review_rating', 'n_dishes', 'visit_number']
    print(reviews_df[summary_cols].head(5).to_string(index=False))
    
    # Final summary
    print(f"\n" + "="*70)
    print("GENERATION COMPLETE! 🎉")
    print("="*70)
    
    print(f"\n✅ All files saved to: src/data/")
    print(f"\n📝 Next steps:")
    print(f"  1. Inspect data files (see inspect_data.py)")
    print(f"  2. Run recommendations: python src/main.py")
    print(f"  3. Or use root main.py: python main.py")
    
    print(f"\n💡 Pro tip: Data and embeddings are cached!")
    print(f"   Re-running with same size/seed will load from disk (instant)")
    print(f"   To regenerate: Delete files in src/data/ first")


if __name__ == "__main__":
    main()

