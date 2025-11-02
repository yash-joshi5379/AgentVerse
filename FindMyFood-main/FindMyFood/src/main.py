"""
Main entry point for the food recommendation system.
Orchestrates data loading, processing, and recommendations.

This is the modular version inside src/ that works with the improved data generation.
"""

import sys
import os
from pathlib import Path

# Add project root to path for config import
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

import pandas as pd
import asyncio
import config
from src.ai import embeddings
from src.core import matrix_ops, recommendations


def load_data():
    """Load review data based on configuration."""
    print(f"\n{'='*60}")
    print("DATA LOADING")
    print(f"{'='*60}")
    print(f"Data source: {config.DATA_SOURCE}")
    print(f"Size: {config.SYNTHETIC_SIZE}")
    print(f"Seed: {config.CACHE_SEED}")
    
    if config.DATA_SOURCE == 'multi_visit':
        from src import data_gen
        
        # Load data (with embeddings if available)
        reviews_df, review_summaries_df, cache_loaded = data_gen.get_or_create_multi_visit_data(
            size=config.SYNTHETIC_SIZE,
            seed=config.CACHE_SEED,
            generate_review_texts=False,
        )
        
        # Load embeddings if they exist
        embeddings_loaded = data_gen.load_embeddings_for_data(config.SYNTHETIC_SIZE, config.CACHE_SEED)
        if embeddings_loaded:
            print(f"  ✅ Loaded {len(embeddings_loaded)} pre-computed embeddings from data directory")
            # Set the global cache
            embeddings._dish_embedding_cache = embeddings_loaded
        else:
            print(f"  ℹ️  No pre-computed embeddings found (will generate on-demand if needed)")
        
        reviews_df.attrs['review_summaries'] = review_summaries_df
        reviews_df.attrs['multi_visit'] = True
        reviews_df.attrs['multi_visit_cache_loaded'] = cache_loaded
        cache_size = f"{config.SYNTHETIC_SIZE}_multi"
        cache_seed = config.CACHE_SEED
        
        print(f"\n✅ Data loaded: {len(reviews_df)} dish reviews, {len(review_summaries_df)} visits")
        
    elif config.DATA_SOURCE == 'synthetic':
        # Import from root-level synthetic_data module
        sys.path.insert(0, str(project_root))
        from synthetic_data import load_synthetic_data
        
        reviews_df = load_synthetic_data(size=config.SYNTHETIC_SIZE, seed=config.CACHE_SEED)
        cache_size = config.SYNTHETIC_SIZE
        cache_seed = config.CACHE_SEED
        print(f"\n✅ Data loaded: {len(reviews_df)} reviews")
        
    elif config.DATA_SOURCE == 'sample':
        # Import from root-level data module
        sys.path.insert(0, str(project_root))
        from data import load_sample_data
        
        reviews_df = load_sample_data()
        cache_size = 'sample'
        cache_seed = config.CACHE_SEED
        print(f"\n✅ Data loaded: {len(reviews_df)} reviews")
        
    else:
        raise ValueError("DATA_SOURCE must be 'sample', 'synthetic', or 'multi_visit'")
    
    return reviews_df, cache_size, cache_seed


def show_data_stats(reviews_df):
    """Display dataset statistics."""
    print(f"\n{'='*60}")
    print("DATASET STATISTICS")
    print(f"{'='*60}")
    
    total_reviews = len(reviews_df)
    total_users = reviews_df['user_id'].nunique()
    total_dishes = reviews_df['dish_name'].nunique()
    
    print(f"Total reviews: {total_reviews:,}")
    print(f"Total users: {total_users}")
    print(f"Total dishes: {total_dishes}")
    
    if 'restaurant_name' in reviews_df.columns:
        total_restaurants = reviews_df['restaurant_name'].nunique()
        print(f"Total restaurants: {total_restaurants}")
    
    if 'cuisine_type' in reviews_df.columns:
        total_cuisines = reviews_df['cuisine_type'].nunique()
        print(f"Total cuisines: {total_cuisines}")
    
    # Rating distribution
    print(f"\nRating distribution:")
    rating_dist = reviews_df['rating'].value_counts().sort_index()
    for rating, count in rating_dist.items():
        pct = (count / total_reviews) * 100
        print(f"  {int(rating)} stars: {count:4d} ({pct:5.1f}%)")
    
    avg_rating = reviews_df['rating'].mean()
    print(f"\nAverage rating: {avg_rating:.2f}/5.0")
    
    # Multi-visit specific stats
    if reviews_df.attrs.get('multi_visit'):
        if 'review_summaries' in reviews_df.attrs:
            review_summaries_df = reviews_df.attrs['review_summaries']
            total_visits = len(review_summaries_df)
            avg_visits_per_user = total_visits / total_users
            avg_dishes_per_visit = total_reviews / total_visits
            
            print(f"\nMulti-visit statistics:")
            print(f"  Total visits: {total_visits:,}")
            print(f"  Avg visits per user: {avg_visits_per_user:.1f}")
            print(f"  Avg dishes per visit: {avg_dishes_per_visit:.1f}")


def handle_sentiment_analysis(reviews_df):
    """Handle optional sentiment analysis (for explanations only)."""
    print(f"\n{'='*60}")
    print("RATING SYSTEM")
    print(f"{'='*60}")
    
    # Always use effective_rating - no toggling between columns
    if config.ENABLE_SENTIMENT_ANALYSIS:
        from src.ai import sentiment_analysis
        
        print("Sentiment analysis enabled - storing sentiment for explanations only")
        print("Ratings are NOT modified (sentiment used for display only)")
        
        # Analyze sentiment and store for explanations (but don't modify ratings)
        reviews_to_analyze = []
        review_indices = []
        
        for idx, row in reviews_df.iterrows():
            if 'text_review' in row and pd.notna(row['text_review']):
                reviews_to_analyze.append({'review_text': row['text_review'], 'index': idx, 'rating': row['rating']})
                review_indices.append(idx)
            else:
                review_indices.append(idx)
        
        if reviews_to_analyze:
            print(f"  Analyzing {len(reviews_to_analyze)} reviews in batches (async)...")
            analyses = asyncio.run(sentiment_analysis.analyze_reviews_sentiment_batch_async(
                reviews_to_analyze, batch_size=150, max_concurrent=10
            ))
            
            # Store sentiment labels for explanations only
            sentiment_map = {}
            for i, analysis in enumerate(analyses):
                idx = reviews_to_analyze[i]['index']
                sentiment_map[idx] = analysis.get('sentiment_label', 'neutral')
            
            # Add sentiment labels to dataframe
            sentiment_labels = []
            for idx in review_indices:
                if idx in sentiment_map:
                    sentiment_labels.append(sentiment_map[idx])
                else:
                    sentiment_labels.append(None)
            
            reviews_df['sentiment_label'] = sentiment_labels
            print(f"  ✅ Analyzed {len(analyses)} reviews - sentiment stored for explanations")
        else:
            reviews_df['sentiment_label'] = None
            print("  ⚠ No reviews with text to analyze")
        
        # Effective rating = original rating (not modified)
        reviews_df['effective_rating'] = reviews_df['rating']
    else:
        print("Sentiment analysis disabled")
        reviews_df['sentiment_label'] = None
        reviews_df['effective_rating'] = reviews_df['rating']
    
    print(f"Using 'effective_rating' column for all calculations")
    
    return reviews_df


def precompute_embeddings(reviews_df, cache_size, cache_seed):
    """Pre-compute embeddings for all unique dish@restaurant combinations."""
    if config.ENABLE_DISH_EMBEDDING_SIMILARITY:
        print(f"\n{'='*60}")
        print("DISH EMBEDDING SIMILARITY")
        print(f"{'='*60}")
        print("Embedding similarity enabled - will boost ratings for semantically similar dishes")
        
        # Check if embeddings are already loaded
        current_cache_size = embeddings.get_cache_stats()
        if current_cache_size > 0:
            print(f"  ℹ️  Already loaded {current_cache_size} embeddings from data directory")
        else:
            print("\n  No pre-computed embeddings found - computing now...")
        
        # Pre-compute embeddings for all unique dish@restaurant combinations
        print("\n  Pre-computing embeddings for unique dishes...")
        unique_dishes = reviews_df.groupby(['dish_name', 'restaurant_name']).first().reset_index()
        total_unique = len(unique_dishes)
        computed = 0
        cached_before = embeddings.get_cache_stats()
        
        for _, row in unique_dishes.iterrows():
            cuisine = row.get('cuisine_type') if 'cuisine_type' in row else None
            embeddings.get_dish_embedding(row['dish_name'], row['restaurant_name'], cuisine)
            computed += 1
            if computed % 10 == 0 and total_unique > 20:
                print(f"    Progress: {computed}/{total_unique} dishes embedded...")
        
        new_embeddings = embeddings.get_cache_stats() - cached_before
        print(f"  ✅ Total embeddings: {embeddings.get_cache_stats()} (computed {new_embeddings} new, {cached_before} from cache)")
        
        # Save embeddings with the data (not in root)
        if new_embeddings > 0 and config.DATA_SOURCE == 'multi_visit':
            from src import data_gen
            data_gen.save_embeddings_for_data(embeddings._dish_embedding_cache, config.SYNTHETIC_SIZE, config.CACHE_SEED)
            print(f"  💾 Embeddings saved to src/data/ directory")


def main():
    """Main execution function."""
    # 1. Load data
    reviews_df, cache_size, cache_seed = load_data()
    
    # 2. Show dataset statistics
    show_data_stats(reviews_df)
    
    # 3. Handle sentiment analysis (optional, for explanations only)
    reviews_df = handle_sentiment_analysis(reviews_df)
    
    # 4. Create user-dish matrix
    user_dish_matrix, user_dish_matrix_centered, user_dish_matrix_filled, dish_lookup = matrix_ops.create_user_dish_matrix(
        reviews_df, rating_column='effective_rating'
    )
    
    # 5. Calculate user similarity
    user_similarity_df = matrix_ops.calculate_user_similarity(user_dish_matrix_filled)
    
    # 6. Pre-compute embeddings (optional)
    precompute_embeddings(reviews_df, cache_size, cache_seed)
    
    # 7. Run recommendations
    user_id_to_predict = 3
    
    # Show user's history
    print("\n" + "="*60)
    print(f"USER {user_id_to_predict}'S HISTORY")
    print("="*60)
    cols_to_show = ['restaurant_name', 'dish_name', 'rating']
    if config.ENABLE_SENTIMENT_ANALYSIS and 'sentiment_label' in reviews_df.columns:
        cols_to_show.append('sentiment_label')
    user_history = reviews_df[reviews_df['user_id'] == user_id_to_predict][cols_to_show].head(10)
    print(user_history.to_string(index=False))
    if config.ENABLE_SENTIMENT_ANALYSIS:
        print(f"\nNote: Sentiment labels stored for explanations only. Ratings are not modified.")
    else:
        print(f"\nNote: Using original star ratings.")
    
    # Get collaborative recommendations
    recs = recommendations.get_collaborative_recommendations(
        user_id_to_predict,
        user_dish_matrix,
        user_dish_matrix_centered,
        user_similarity_df,
        reviews_df,
        dish_lookup,
        top_n=config.TOP_N_RECOMMENDATIONS,
        min_rating=config.MIN_RATING_THRESHOLD
    )
    
    print("\n" + "="*60)
    print("RECOMMENDATIONS COMPLETE")
    print("="*60)
    
    return recs


if __name__ == "__main__":
    main()

