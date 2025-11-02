"""
Dish embedding functions for semantic similarity.
Uses OpenAI embeddings to compute similarity between dishes at the same restaurant.
"""

import json
import os
import numpy as np
import pandas as pd

# Lazy import OpenAI client (only when needed)
client = None

def _get_client():
    global client
    if client is None:
        from openai import OpenAI
        client = OpenAI()
    return client

# Global cache for dish@restaurant embeddings
_dish_embedding_cache = {}


def get_embedding_cache_file(data_source, size, seed):
    """Get cache file path based on data source and size."""
    if data_source == 'synthetic':
        return f"embedding_cache_{size}_seed{seed}.json"
    else:
        return f"embedding_cache_sample_seed{seed}.json"


def load_embedding_cache(data_source, size, seed):
    """Load embeddings from cache file if it exists."""
    global _dish_embedding_cache
    cache_file = get_embedding_cache_file(data_source, size, seed)
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r') as f:
                _dish_embedding_cache = json.load(f)
                print(f"  Loaded {len(_dish_embedding_cache)} dish embeddings from cache")
        except:
            _dish_embedding_cache = {}


def save_embedding_cache(data_source, size, seed):
    """Save embeddings to cache file."""
    global _dish_embedding_cache
    cache_file = get_embedding_cache_file(data_source, size, seed)
    try:
        with open(cache_file, 'w') as f:
            json.dump(_dish_embedding_cache, f)
    except Exception as e:
        print(f"  Warning: Could not save embedding cache: {e}")


def get_dish_embedding(dish_name, restaurant_name, cuisine_type=None):
    """
    Get embedding for a dish@restaurant combination.
    Caches results to avoid redundant API calls.
    
    Returns:
        List of floats (embedding vector) or None if API fails
    """
    global _dish_embedding_cache
    cache_key = f"{dish_name}@{restaurant_name}"
    
    # Check cache first
    if cache_key in _dish_embedding_cache:
        return _dish_embedding_cache[cache_key]
    
    # Create text representation for embedding
    text_parts = [dish_name, restaurant_name]
    if cuisine_type and pd.notna(cuisine_type):
        text_parts.append(str(cuisine_type))
    text = " | ".join(text_parts)
    
    try:
        response = _get_client().embeddings.create(
            model="text-embedding-3-small",  # Small, fast, cheap
            input=text
        )
        embedding = response.data[0].embedding
        _dish_embedding_cache[cache_key] = embedding
        return embedding
    except Exception as e:
        print(f"  Warning: Failed to get embedding for '{cache_key}': {e}")
        return None


def cosine_similarity_embeddings(emb1, emb2):
    """Compute cosine similarity between two embedding vectors."""
    if emb1 is None or emb2 is None:
        return 0.0
    
    emb1 = np.array(emb1)
    emb2 = np.array(emb2)
    
    dot_product = np.dot(emb1, emb2)
    norm1 = np.linalg.norm(emb1)
    norm2 = np.linalg.norm(emb2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return dot_product / (norm1 * norm2)


def compute_dish_similarity_boost(target_dish, target_restaurant, user_dish, user_restaurant, 
                                   target_cuisine=None, user_cuisine=None,
                                   beta_same=2.0, beta_similar=1.0, max_boost=4.0):
    """
    Compute similarity boost between target dish and user's rated dish.
    Returns: (is_same_dish: bool, dish_similarity: float, total_boost: float)
    """
    # Exact match = maximum boost
    if target_dish == user_dish and target_restaurant == user_restaurant:
        return (True, 1.0, min(max_boost, 1.0 + beta_same))
    
    # Get embeddings
    target_emb = get_dish_embedding(target_dish, target_restaurant, target_cuisine)
    user_emb = get_dish_embedding(user_dish, user_restaurant, user_cuisine)
    
    if target_emb is None or user_emb is None:
        return (False, 0.0, 1.0)  # No boost if embeddings fail
    
    # Compute semantic similarity
    dish_sim = cosine_similarity_embeddings(target_emb, user_emb)
    
    # Apply boost formula: 1 + β₁·same_flag + β₂·dish_sim
    # (same_flag is 0 here since we already checked)
    total_boost = 1.0 + beta_similar * dish_sim
    total_boost = min(max_boost, total_boost)
    
    return (False, dish_sim, total_boost)


def get_cache_stats():
    """Get statistics about the embedding cache."""
    global _dish_embedding_cache
    return len(_dish_embedding_cache)

