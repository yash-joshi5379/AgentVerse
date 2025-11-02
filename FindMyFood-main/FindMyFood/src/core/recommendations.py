"""
Main recommendation algorithm.
Uses collaborative filtering with restaurant-level dish similarity boost.
"""

import pandas as pd
import sys
import os

# Add project root to path for config import
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

import config
from src.ai import embeddings


def get_collaborative_recommendations(user_id, user_dish_matrix, user_dish_matrix_centered, similarity_df, reviews_df,
                                     dish_lookup, top_n=4, min_rating=4.0):
    """
    Get recommendations using collaborative filtering with restaurant-level dish similarity boost.
    
    Args:
        user_id: ID of user to get recommendations for
        user_dish_matrix: User-dish matrix with ratings
        user_dish_matrix_centered: Mean-centered user-dish matrix
        similarity_df: User similarity DataFrame
        reviews_df: Reviews DataFrame
        dish_lookup: Mapping of dish_key -> metadata (dish/restaurant/cuisine)
        top_n: Number of recommendations to return
        min_rating: Minimum predicted rating threshold
    
    Returns:
        List of recommendation dicts or None
    """
    print(f"\n{'='*60}")
    print(f"COLLABORATIVE RECOMMENDATIONS FOR USER {user_id}")
    print(f"{'='*60}")
    print(f"\nAlgorithm: Collaborative Filtering with Restaurant-Level Dish Similarity Boost")
    print(f"  - Base: User-user similarity (collaborative filtering)")
    if config.ENABLE_DISH_EMBEDDING_SIMILARITY:
        print(f"  - Boost: Neighbors who rated similar dishes at same restaurant get higher weight")
        print(f"    - Same dish at same restaurant = max boost ({config.EMBEDDING_BETA_SAME}x)")
        print(f"    - Similar dishes at same restaurant (e.g., chicken vs prawn noodles) = high boost")
        print(f"    - Dissimilar dishes at same restaurant = no boost")
    if config.ENABLE_SENTIMENT_ANALYSIS:
        print(f"  - Sentiment: Stored for explanations only (ratings not modified)")
    print(f"Normalization: Mean-centered user ratings\n")

    if 'dish_key' not in reviews_df.columns:
        reviews_df = reviews_df.copy()
        dish_names = reviews_df['dish_name'].fillna('Unknown Dish').astype(str).str.strip()
        restaurant_names = reviews_df['restaurant_name'].fillna('Unknown Restaurant').astype(str).str.strip()
        reviews_df['dish_key'] = dish_names + " @ " + restaurant_names
    
    # Get user's history (use original matrix for ratings, centered for similarity)
    target_user_ratings = user_dish_matrix.loc[user_id]
    user_mean = user_dish_matrix.loc[user_id].mean()  # User's average rating
    unrated_dish_keys = target_user_ratings[target_user_ratings.isna()].index.tolist()

    if not unrated_dish_keys:
        print("You have rated all available dishes.")
        return None

    # Get user's liked dishes and restaurant history
    user_reviews = reviews_df[reviews_df['user_id'] == user_id].copy()
    user_restaurant_set = set(user_reviews['restaurant_name'].dropna().unique())
    user_liked = user_reviews[user_reviews['rating'] >= 4][
        ['restaurant_name', 'dish_name', 'rating']
    ].to_dict('records')
    has_cuisine_column = 'cuisine_type' in reviews_df.columns

    # Find similar users who have visited at least one same restaurant (collaborative filtering)
    user_sim_scores = similarity_df.loc[user_id].drop(user_id)
    
    # Filter to users who share at least one restaurant with target user
    similar_users_candidates = user_sim_scores[user_sim_scores > 0].nlargest(config.SIMILAR_USERS_COUNT * 3)
    
    similar_users_with_overlap = []
    for candidate_id, sim_score in similar_users_candidates.items():
        candidate_reviews = reviews_df[reviews_df['user_id'] == candidate_id]
        candidate_restaurants = set(candidate_reviews['restaurant_name'].dropna().unique())
        overlap = user_restaurant_set & candidate_restaurants
        if len(overlap) > 0:  # Must have at least 1 shared restaurant
            similar_users_with_overlap.append((candidate_id, sim_score))
    
    # Take top N users with restaurant overlap
    similar_users_with_overlap = sorted(similar_users_with_overlap, key=lambda x: x[1], reverse=True)[:config.SIMILAR_USERS_COUNT]
    
    if similar_users_with_overlap:
        similar_users = pd.Series(
            {user_id: sim for user_id, sim in similar_users_with_overlap},
            name='similarity'
        )
        print(f"  ✅ Found {len(similar_users)} similar users with restaurant overlap")
    else:
        # Fallback: use top similar users even without overlap (better than nothing)
        similar_users = user_sim_scores[user_sim_scores > 0].nlargest(config.SIMILAR_USERS_COUNT)
        print(f"  ⚠️  Found {len(similar_users)} similar users (no restaurant overlap - fallback mode)")

    if len(similar_users) == 0:
        print("No similar users found.")
        return None

    # Predict ratings for unrated dishes
    recommendations_data = []

    for dish_key in unrated_dish_keys:
        dish_meta = dish_lookup.get(dish_key, {})
        dish_name = dish_meta.get('dish_name', dish_key)
        dish_restaurant = dish_meta.get('restaurant_name')
        dish_cuisine = dish_meta.get('cuisine_type')

        target_dish_reviews = reviews_df[reviews_df['dish_key'] == dish_key]
        if dish_restaurant is None and len(target_dish_reviews) > 0:
            dish_restaurant = target_dish_reviews['restaurant_name'].iloc[0]
        if has_cuisine_column and dish_cuisine is None and len(target_dish_reviews) > 0:
            dish_cuisine = target_dish_reviews['cuisine_type'].iloc[0]

        # Collaborative filtering with restaurant-level dish similarity boost
        collab_weighted_sum = 0.0
        collab_sum_of_weights = 0.0
        supporters = []

        for neighbor_id, user_similarity in similar_users.items():
            # Get neighbor's rating for this dish
            neighbor_rating = user_dish_matrix.loc[neighbor_id, dish_key]

            if pd.isna(neighbor_rating):
                continue

            # Use centered ratings for prediction (proper collaborative filtering)
            neighbor_rating_centered = user_dish_matrix_centered.loc[neighbor_id, dish_key]

            # Get neighbor's dish info (which restaurant did they rate this at?)
            neighbor_reviews = reviews_df[reviews_df['user_id'] == neighbor_id].copy()
            neighbor_dish_review = neighbor_reviews[neighbor_reviews['dish_key'] == dish_key]

            neighbor_restaurant = dish_restaurant
            if neighbor_restaurant is None and len(neighbor_dish_review) > 0:
                neighbor_restaurant = neighbor_dish_review['restaurant_name'].iloc[0]

            neighbor_cuisine = dish_cuisine
            if has_cuisine_column and neighbor_cuisine is None and len(neighbor_dish_review) > 0:
                neighbor_cuisine = neighbor_dish_review['cuisine_type'].iloc[0]

            # BOOST: Check dish similarity at SAME RESTAURANT
            # If user has tried similar dishes at the same restaurant, boost this neighbor's contribution
            dish_similarity_boost = 1.0  # Default: no boost

            if config.ENABLE_DISH_EMBEDDING_SIMILARITY and neighbor_restaurant:
                # Find dishes user has tried at the SAME restaurant
                user_dishes_at_restaurant = [
                    item for item in user_liked
                    if item['restaurant_name'] == neighbor_restaurant
                ]

                max_similarity = 0.0

                for user_item in user_dishes_at_restaurant:
                    user_dish_name = user_item['dish_name']

                    # Get cuisine for user dish
                    user_dish_reviews = reviews_df[
                        (reviews_df['dish_name'] == user_dish_name) &
                        (reviews_df['restaurant_name'] == neighbor_restaurant) &
                        (reviews_df['user_id'] == user_id)
                    ]
                    if has_cuisine_column and len(user_dish_reviews) > 0:
                        user_cuisine = user_dish_reviews['cuisine_type'].iloc[0]
                    else:
                        user_cuisine = None

                    # Compute semantic similarity between dishes at SAME restaurant
                    is_same_dish, dish_similarity, _ = embeddings.compute_dish_similarity_boost(
                        dish_name, neighbor_restaurant, user_dish_name, neighbor_restaurant,
                        neighbor_cuisine, user_cuisine,
                        config.EMBEDDING_BETA_SAME, config.EMBEDDING_BETA_SIMILAR, config.EMBEDDING_MAX_BOOST
                    )

                    if is_same_dish:
                        # Same dish at same restaurant = maximum boost
                        max_similarity = 1.0
                        break  # Found exact match, no need to check further
                    elif dish_similarity > max_similarity:
                        max_similarity = dish_similarity

                # Apply boost formula: 1 + β₁·same_flag + β₂·dish_similarity
                if max_similarity >= 1.0:  # Exact match
                    dish_similarity_boost = min(config.EMBEDDING_MAX_BOOST, 1.0 + config.EMBEDDING_BETA_SAME)
                elif max_similarity > 0.3:  # Similar dishes (chicken noodles vs prawn noodles)
                    dish_similarity_boost = min(config.EMBEDDING_MAX_BOOST, 1.0 + config.EMBEDDING_BETA_SIMILAR * max_similarity)
                # else: dissimilar dishes get no boost (boost = 1.0)

            # Apply boost: multiply user-user similarity by dish similarity boost
            # This boosts neighbors who rated similar dishes at the same restaurant
            boosted_weight = user_similarity * dish_similarity_boost

            collab_weighted_sum += (neighbor_rating_centered * boosted_weight)
            collab_sum_of_weights += boosted_weight

            # Get neighbor's reviews for explanations
            neighbor_liked = neighbor_reviews[neighbor_reviews['rating'] >= 4][
                ['restaurant_name', 'dish_name', 'rating']
            ].to_dict('records')

            # Find common dishes/restaurants (deduplicated)
            common_items = []
            seen_combinations = set()
            for user_item in user_liked:
                for neighbor_item in neighbor_liked:
                    if (user_item['dish_name'] == neighbor_item['dish_name'] and
                        user_item['restaurant_name'] == neighbor_item['restaurant_name']):
                        # Same dish at same restaurant
                        combo_key = ('same', user_item['dish_name'], user_item['restaurant_name'])
                        if combo_key not in seen_combinations:
                            seen_combinations.add(combo_key)
                            common_items.append({
                                'type': 'same_dish_same_restaurant',
                                'dish': user_item['dish_name'],
                                'restaurant': user_item['restaurant_name'],
                                'user_rating': user_item['rating'],
                                'neighbor_rating': neighbor_item['rating']
                            })
                    elif user_item['restaurant_name'] == neighbor_item['restaurant_name']:
                        # Different dishes at same restaurant
                        combo_key = ('diff', tuple(sorted([user_item['dish_name'], neighbor_item['dish_name']])), user_item['restaurant_name'])
                        if combo_key not in seen_combinations:
                            seen_combinations.add(combo_key)
                            common_items.append({
                                'type': 'different_dish_same_restaurant',
                                'user_dish': user_item['dish_name'],
                                'neighbor_dish': neighbor_item['dish_name'],
                                'restaurant': user_item['restaurant_name']
                            })

            if neighbor_rating >= 4:
                dish_info = {
                    'dish_key': dish_key,
                    'dish_name': dish_name,
                    'restaurant_name': neighbor_restaurant
                }
                if has_cuisine_column:
                    dish_info['cuisine_type'] = neighbor_cuisine
                supporters.append({
                    'neighbor_id': neighbor_id,
                    'similarity': user_similarity,
                    'rating': neighbor_rating,
                    'common_items': common_items,
                    'dish_info': dish_info
                })

        # Calculate final collaborative score (now includes restaurant-level dish similarity boost)
        if collab_sum_of_weights > 0:
            collab_prediction_centered = collab_weighted_sum / collab_sum_of_weights
            predicted_rating = collab_prediction_centered + user_mean  # Un-center to original scale
        else:
            # No prediction possible
            continue

        # Clamp to valid rating range [1, 5]
        predicted_rating = max(1.0, min(5.0, predicted_rating))

        # Only include if predicted rating is high enough and we have at least one supporter
        if predicted_rating >= min_rating and len(supporters) > 0:
            is_new_restaurant = dish_restaurant not in user_restaurant_set if dish_restaurant else False
            recommendations_data.append({
                'dish_key': dish_key,
                'dish': dish_name,
                'dish_name': dish_name,
                'restaurant': dish_restaurant,
                'predicted_rating': predicted_rating,
                'supporters': supporters,
                'is_new_restaurant': is_new_restaurant
            })

    # Sort by restaurant novelty first, then predicted rating, and take top N
    recommendations_data.sort(key=lambda x: (x['is_new_restaurant'], x['predicted_rating']), reverse=True)
    recommendations_data = recommendations_data[:top_n]

    if not recommendations_data:
        print("No dishes found that match your taste profile with high confidence.")
        return None

    print(f"\n--- TOP {len(recommendations_data)} DISHES YOU'LL LOVE ---\n")

    # Display recommendations
    for idx, rec in enumerate(recommendations_data, 1):
        dish_name = rec['dish_name']
        pred_rating = rec['predicted_rating']
        supporters = rec['supporters']
        dish_restaurant = rec['restaurant'] or "Unknown"
        is_new_restaurant = rec['is_new_restaurant']

        if rec['restaurant']:
            restaurant_note = "new to you" if is_new_restaurant else "you've visited"
            print(f"{idx}. {dish_name}")
            print(f"   Restaurant: {dish_restaurant} ({restaurant_note})")
        else:
            print(f"{idx}. {dish_name}")
            print(f"   Restaurant: {dish_restaurant}")
        print(f"   Predicted Rating: {pred_rating:.2f}/5.0")

        print(f"\n   Why you'll like it:")

        if supporters:
            for sup_idx, supporter in enumerate(supporters, 1):
                common = supporter['common_items']
                
                neighbor_id = supporter['neighbor_id']
                neighbor_rating = supporter['rating']
                similarity = supporter['similarity']
                supporter_restaurant = supporter['dish_info'].get('restaurant_name') if supporter['dish_info'] else dish_restaurant
                supporter_restaurant = supporter_restaurant or "Unknown"

                print(f"\n      Supporter {sup_idx}: User {neighbor_id} ({(similarity*100):.1f}% taste match)")
                line = f"      - They gave '{dish_name}' {int(neighbor_rating)} stars at {supporter_restaurant}"
                if supporter_restaurant != "Unknown" and supporter_restaurant not in user_restaurant_set:
                    line += " (a restaurant you haven't tried yet)"
                print(line)

                if common:
                    print(f"      - Common taste connections:")
                    same_dish_same_rest = [item for item in common if item['type'] == 'same_dish_same_restaurant']
                    diff_dish_same_rest = [item for item in common if item['type'] == 'different_dish_same_restaurant']

                    for item in same_dish_same_rest:
                        print(
                            f"        - Both loved '{item['dish']}' at {item['restaurant']} "
                            f"(you: {int(item['user_rating'])} stars, them: {int(item['neighbor_rating'])} stars)"
                        )

                    for item in diff_dish_same_rest:
                        print(
                            f"        - You loved '{item['user_dish']}' and they loved '{item['neighbor_dish']}' "
                            f"at {item['restaurant']}"
                        )
                else:
                    print(f"      - Similar taste profile to yours based on overall rating patterns")

        print()

    return recommendations_data

