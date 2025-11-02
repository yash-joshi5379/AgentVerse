"""
Matrix operations for user-dish similarity calculations.
Handles user-dish matrix creation and mean-centering.
"""

import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


def create_user_dish_matrix(reviews_df, rating_column='effective_rating'):
    """
    Create user-dish matrix with mean-centered normalization.
    
    Args:
        reviews_df: DataFrame with user_id, dish_name, and rating column
        rating_column: Column name to use for ratings (default: 'effective_rating')
    
    Returns:
        Tuple of (original_matrix, mean_centered_matrix, mean_centered_filled_matrix, dish_lookup)
    """
    print(f"\n{'='*60}")
    print("USER-DISH MATRIX CREATION")
    print(f"{'='*60}")
    print("Creating user-dish matrix with mean-centered normalization...")
    print(f"Using: {rating_column} column (star ratings only)")

    # Ensure each dish is scoped to a specific restaurant (dish@restaurant key)
    if 'dish_key' not in reviews_df.columns:
        dish_names = reviews_df['dish_name'].fillna('Unknown Dish').astype(str).str.strip()
        restaurant_names = reviews_df['restaurant_name'].fillna('Unknown Restaurant').astype(str).str.strip()
        reviews_df['dish_key'] = dish_names + " @ " + restaurant_names

    # Create user-dish matrix keyed by dish@restaurant
    user_dish_matrix = reviews_df.pivot_table(
        index='user_id',
        columns='dish_key',
        values=rating_column,
        aggfunc='mean'
    )

    # CRITICAL: Mean-center user ratings for better collaborative filtering
    # This removes user bias (some users rate high, others rate low)
    # Calculate user means
    user_means = user_dish_matrix.mean(axis=1)
    user_dish_matrix_centered = user_dish_matrix.sub(user_means, axis=0)

    # Fill NaN with 0 for similarity calculation (centered around user mean)
    user_dish_matrix_filled = user_dish_matrix_centered.fillna(0)

    print(f"  Applied mean-centering: User rating biases removed")
    print(f"  Matrix shape: {user_dish_matrix.shape} ({user_dish_matrix.shape[0]} users x {user_dish_matrix.shape[1]} dishes)")

    lookup_cols = ['dish_name', 'restaurant_name']
    if 'cuisine_type' in reviews_df.columns:
        lookup_cols.append('cuisine_type')
    dish_lookup = (
        reviews_df[['dish_key'] + lookup_cols]
        .drop_duplicates(subset='dish_key')
        .set_index('dish_key')
        .to_dict('index')
    )

    return user_dish_matrix, user_dish_matrix_centered, user_dish_matrix_filled, dish_lookup


def calculate_user_similarity(user_dish_matrix_filled):
    """
    Calculate cosine similarity between users.
    
    Args:
        user_dish_matrix_filled: Mean-centered user-dish matrix with NaN filled as 0
    
    Returns:
        DataFrame of user similarity matrix
    """
    print(f"\n{'='*60}")
    print("USER SIMILARITY CALCULATION")
    print(f"{'='*60}")
    
    # Use mean-centered matrix for similarity (better captures taste preferences)
    user_similarity = cosine_similarity(user_dish_matrix_filled)
    user_similarity_df = pd.DataFrame(
        user_similarity,
        index=user_dish_matrix_filled.index,
        columns=user_dish_matrix_filled.index
    )
    
    print(f"  Calculated cosine similarity between {len(user_similarity_df)} users")
    
    return user_similarity_df

