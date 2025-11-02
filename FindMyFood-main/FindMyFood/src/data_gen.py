"""Utilities for generating multi-item restaurant reviews with revisit support.

This module produces synthetic datasets where each review can cover several dishes
from the same restaurant visit. It complements the original ``synthetic_data``
generator by modelling:

* Repeat visits to the same restaurant.
* 1–N dishes per visit (default 1–5).
* Optional natural-language reviews for a sample of visits (default 10%).

Two data frames are returned:

1. ``dish_reviews`` – one row per (user, dish, restaurant, review_id) rating.
2. ``review_summaries`` – one row per review/visit with overall metadata.

The dish-level frame is compatible with the collaborative filtering pipeline,
while the review-level frame powers text generation, caching, or analytics.
"""

from __future__ import annotations

import json
import random
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from pathlib import Path

import numpy as np
import pandas as pd


DEFAULT_SIZE_CONFIGS = {
    "small": {
        "n_users": 50,
        "n_restaurants": 15,
        "n_dishes_per_restaurant": 6,
        "visits_per_user_range": (12, 22),
        "items_per_visit_range": (1, 4),
    },
    "medium": {
        "n_users": 200,
        "n_restaurants": 40,
        "n_dishes_per_restaurant": 8,
        "visits_per_user_range": (20, 38),
        "items_per_visit_range": (1, 5),
    },
    "large": {
        "n_users": 500,
        "n_restaurants": 75,
        "n_dishes_per_restaurant": 10,
        "visits_per_user_range": (30, 55),
        "items_per_visit_range": (1, 6),
    },
    "xlarge": {
        "n_users": 1000,
        "n_restaurants": 150,
        "n_dishes_per_restaurant": 12,
        "visits_per_user_range": (40, 70),
        "items_per_visit_range": (1, 6),
    },
}


__all__ = [
    "generate_multi_item_review_data",
    "load_multi_visit_data",
]


# ---------------------------------------------------------------------------
# Helper data structures
# ---------------------------------------------------------------------------


@dataclass
class Restaurant:
    """Simple container for restaurant metadata."""

    restaurant_id: int
    restaurant_name: str
    cuisine_type: str


@dataclass
class Dish:
    """Simple container for dish metadata."""

    dish_id: int
    dish_name: str
    restaurant_id: int
    restaurant_name: str
    cuisine_type: str


# ---------------------------------------------------------------------------
# Synthetic dataset generation
# ---------------------------------------------------------------------------


def generate_multi_item_review_data(
    n_users: int = 100,
    n_restaurants: int = 40,
    n_dishes_per_restaurant: int = 8,
    visits_per_user_range: Tuple[int, int] = (5, 20),
    items_per_visit_range: Tuple[int, int] = (1, 5),
    review_text_probability: float = 0.1,
    generate_review_texts: bool = False,
    seed: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Generate a synthetic dataset with multi-item restaurant visits.

    Parameters
    ----------
    n_users:
        Number of distinct diners.
    n_restaurants:
        Number of restaurants in the catalogue.
    n_dishes_per_restaurant:
        Approximate number of dishes each restaurant offers (+-2 variation).
    visits_per_user_range:
        Inclusive range for the number of restaurant visits per user.
    items_per_visit_range:
        Inclusive range for how many dishes are ordered per visit.
    review_text_probability:
        Probability that a visit receives a generated free-text review.
    generate_review_texts:
        If ``True``, use the OpenAI batch generator to craft written reviews
        for ~``review_text_probability`` of visits. When ``False``, the text
        columns remain ``None``.
    seed:
        Random seed for deterministic output.

    Returns
    -------
    Tuple[pd.DataFrame, pd.DataFrame]
        ``(dish_reviews, review_summaries)`` as described in the module docstring.
    """

    rng = random.Random(seed)
    np.random.seed(seed)

    # ------------------------------------------------------------------
    # Restaurant and dish catalogues
    # ------------------------------------------------------------------

    restaurant_prefixes = [
        "Bella",
        "Golden",
        "Spice",
        "Ocean",
        "Mountain",
        "Sunset",
        "Royal",
        "Coastal",
        "Urban",
        "Classic",
        "Fusion",
        "Modern",
        "Traditional",
        "Gourmet",
        "Express",
        "Corner",
        "House",
        "Garden",
        "Dragon",
        "Lotus",
        "Star",
        "Pearl",
        "Moon",
        "Bamboo",
        "Emerald",
        "Ruby",
        "Sapphire",
        "Crystal",
        "Velvet",
        "Silk",
        "Jade",
        "Opal",
        "Amber",
        "Coral",
    ]
    restaurant_suffixes = [
        "Restaurant",
        "Kitchen",
        "Bistro",
        "Grill",
        "Cafe",
        "Diner",
        "Place",
        "House",
        "Express",
        "Dining",
        "Palace",
        "Eatery",
        "Tavern",
        "Lounge",
        "Spot",
        "Corner",
        "Delights",
        "Taste",
        "Flavors",
        "Bites",
    ]

    cuisines: Dict[str, List[str]] = {
        "Italian": [
            "Margherita Pizza",
            "Spaghetti Carbonara",
            "Lasagna",
            "Risotto",
            "Chicken Parmigiana",
            "Bruschetta",
            "Tiramisu",
            "Gnocchi",
            "Fettuccine Alfredo",
            "Caprese Salad",
            "Osso Buco",
            "Calzone",
            "Cannoli",
            "Gelato",
            "Penne Arrabbiata",
            "Minestrone",
        ],
        "Thai": [
            "Pad Thai",
            "Green Curry",
            "Tom Yum Soup",
            "Massaman Curry",
            "Pad See Ew",
            "Som Tam",
            "Thai Basil Chicken",
            "Mango Sticky Rice",
            "Pad Kra Pao",
            "Larb",
            "Panang Curry",
            "Tom Kha Gai",
            "Yellow Curry",
            "Thai Fried Rice",
            "Satay",
            "Papaya Salad",
        ],
        "Japanese": [
            "Tonkatsu Ramen",
            "Salmon Sashimi",
            "Chicken Teriyaki Bowl",
            "Vegetable Tempura",
            "Pork Tonkatsu",
            "Miso Soup",
            "Yakitori Skewers",
            "Beef Udon",
            "California Roll",
            "Spicy Tuna Roll",
            "Gyoza",
            "Okonomiyaki",
            "Katsu Curry",
            "Chawanmushi",
            "Takoyaki",
        ],
        "Mexican": [
            "Tacos al Pastor",
            "Beef Enchiladas",
            "Chicken Burrito Bowl",
            "Quesadilla",
            "Fresh Guacamole",
            "Chiles Rellenos",
            "Carnitas",
            "Flan",
            "Churros",
            "Mole Chicken",
            "Ceviche",
            "Pozole",
            "Tostadas",
            "Elote",
            "Horchata",
            "Chicken Fajitas",
        ],
        "American": [
            "Bacon Cheeseburger",
            "BBQ Ribs",
            "Mac & Cheese",
            "Buffalo Wings",
            "Caesar Salad",
            "Club Sandwich",
            "Apple Pie",
            "Fried Chicken",
            "Philly Cheesesteak",
            "Chicken Pot Pie",
            "Clam Chowder",
            "Meatloaf",
            "Pulled Pork Sandwich",
            "Cornbread",
            "Key Lime Pie",
        ],
        "Chinese": [
            "Kung Pao Chicken",
            "Peking Duck",
            "Mapo Tofu",
            "Sweet & Sour Pork",
            "Dim Sum Platter",
            "Beef Chow Mein",
            "Hot Pot",
            "General Tso Chicken",
            "Orange Chicken",
            "Egg Drop Soup",
            "Szechuan Beef",
            "Dumplings",
            "Lo Mein",
            "Fried Rice",
            "Mongolian Beef",
            "Wonton Soup",
        ],
        "Indian": [
            "Butter Chicken",
            "Chicken Biryani",
            "Tandoori Chicken",
            "Paneer Tikka",
            "Dal Makhani",
            "Samosa",
            "Garlic Naan",
            "Gulab Jamun",
            "Palak Paneer",
            "Chana Masala",
            "Lamb Curry",
            "Rogan Josh",
            "Dosa",
            "Biryani",
            "Tikka Masala",
            "Aloo Gobi",
        ],
        "French": [
            "Coq au Vin",
            "Beef Bourguignon",
            "Ratatouille",
            "Butter Croissant",
            "Escargot",
            "Duck Confit",
            "French Onion Soup",
            "Crème Brûlée",
            "Bouillabaisse",
            "Quiche Lorraine",
            "Beef Tartare",
            "Cassoulet",
            "Tarte Tatin",
            "Macarons",
            "Duck à l'Orange",
            "Soufflé",
        ],
        "Mediterranean": [
            "Greek Salad",
            "Lamb Gyro",
            "Hummus Platter",
            "Falafel",
            "Moussaka",
            "Spanakopita",
            "Shawarma",
            "Baklava",
            "Stuffed Grape Leaves",
            "Tzatziki",
            "Lamb Kebab",
            "Pita Bread",
            "Tabouli",
            "Kofta",
            "Baba Ganoush",
            "Greek Yogurt",
        ],
        "Korean": [
            "Bibimbap",
            "Bulgogi",
            "Kimchi Jjigae",
            "Korean BBQ",
            "Japchae",
            "Tteokbokki",
            "Galbi",
            "Bossam",
            "Korean Fried Chicken",
            "Soondubu",
            "Haemul Pajeon",
            "Samgyeopsal",
            "Dak Galbi",
            "Gimbap",
            "Jjajangmyeon",
            "Seolleongtang",
        ],
    }

    restaurants: List[Restaurant] = []
    used_names = set()
    for restaurant_id in range(1, n_restaurants + 1):
        cuisine = rng.choice(list(cuisines.keys()))
        name = f"{rng.choice(restaurant_prefixes)} {rng.choice(restaurant_suffixes)}"
        while name in used_names:
            name = f"{rng.choice(restaurant_prefixes)} {rng.choice(restaurant_suffixes)}"
        used_names.add(name)
        restaurants.append(Restaurant(restaurant_id, name, cuisine))

    # Build dish catalogue per restaurant
    dishes: List[Dish] = []
    dishes_by_restaurant: Dict[int, List[Dish]] = defaultdict(list)
    dish_id_counter = 1
    for restaurant in restaurants:
        cuisine_dishes = cuisines[restaurant.cuisine_type]
        n_dishes = rng.randint(
            max(5, n_dishes_per_restaurant - 2),
            min(len(cuisine_dishes), n_dishes_per_restaurant + 2),
        )
        selected = rng.sample(cuisine_dishes, n_dishes)
        for dish_name in selected:
            dish = Dish(
                dish_id=dish_id_counter,
                dish_name=dish_name,
                restaurant_id=restaurant.restaurant_id,
                restaurant_name=restaurant.restaurant_name,
                cuisine_type=restaurant.cuisine_type,
            )
            dishes.append(dish)
            dishes_by_restaurant[restaurant.restaurant_id].append(dish)
            dish_id_counter += 1

    # ------------------------------------------------------------------
    # Taste clusters (shared with previous generator for continuity)
    # ------------------------------------------------------------------

    n_clusters = max(5, n_users // 20)
    cluster_preferences: Dict[int, Dict[str, float]] = {}
    for cluster_id in range(n_clusters):
        prefs = {cuisine: np.random.uniform(0.25, 0.85) for cuisine in cuisines}
        # amplify three cuisines per cluster to create variety
        for _ in range(3):
            cuisine = rng.choice(list(cuisines.keys()))
            if rng.random() > 0.5:
                prefs[cuisine] = np.random.uniform(0.7, 0.95)
            else:
                prefs[cuisine] = np.random.uniform(0.15, 0.4)
        cluster_preferences[cluster_id] = prefs

    user_clusters = {user_id: (user_id - 1) % n_clusters for user_id in range(1, n_users + 1)}

    # ------------------------------------------------------------------
    # Generate visits with multi-item orders
    # ------------------------------------------------------------------

    dish_records: List[Dict[str, Optional[object]]] = []
    review_records: List[Dict[str, Optional[object]]] = []
    review_to_dish_indices: Dict[str, List[int]] = defaultdict(list)

    review_id_counter = 1

    for user_id in range(1, n_users + 1):
        cluster_id = user_clusters[user_id]
        base_prefs = cluster_preferences[cluster_id].copy()

        # user-specific noise on top of cluster baseline
        for cuisine in base_prefs:
            noise = rng.uniform(-0.15, 0.15)
            base_prefs[cuisine] = max(0.1, min(0.98, base_prefs[cuisine] + noise))

        n_visits = rng.randint(visits_per_user_range[0], visits_per_user_range[1])

        for visit_idx in range(n_visits):
            weights = [base_prefs[rest.cuisine_type] for rest in restaurants]
            restaurant = rng.choices(restaurants, weights=weights, k=1)[0]

            available_dishes = dishes_by_restaurant[restaurant.restaurant_id]
            if not available_dishes:
                continue

            min_items, max_items = items_per_visit_range
            n_items = rng.randint(min_items, max_items)
            n_items = min(n_items, len(available_dishes))
            selected_dishes = rng.sample(available_dishes, n_items)

            # base preference-driven rating for the visit
            base_preference = base_prefs[restaurant.cuisine_type]
            review_base = base_preference * 4 + 1 + rng.gauss(0, 0.6)

            dish_indices_for_visit: List[int] = []
            dish_ratings: List[int] = []

            review_id = f"R{review_id_counter:06d}"
            review_id_counter += 1

            for dish in selected_dishes:
                dish_noise = rng.gauss(0, 0.5)
                raw_rating = review_base + dish_noise
                rating = int(np.clip(np.round(raw_rating), 1, 5))
                dish_record = {
                    "review_id": review_id,
                    "user_id": user_id,
                    "restaurant_id": dish.restaurant_id,
                    "restaurant_name": dish.restaurant_name,
                    "dish_id": dish.dish_id,
                    "dish_name": dish.dish_name,
                    "cuisine_type": dish.cuisine_type,
                    "rating": rating,
                    "review_rating": None,  # filled below
                    "text_review": None,
                    "visit_number": visit_idx + 1,
                }
                dish_records.append(dish_record)
                record_idx = len(dish_records) - 1
                dish_indices_for_visit.append(record_idx)
                review_to_dish_indices[review_id].append(record_idx)
                dish_ratings.append(rating)

            if not dish_indices_for_visit:
                continue

            overall_rating = int(np.clip(np.round(np.mean(dish_ratings)), 1, 5))
            for idx in dish_indices_for_visit:
                dish_records[idx]["review_rating"] = overall_rating

            review_records.append(
                {
                    "review_id": review_id,
                    "user_id": user_id,
                    "restaurant_id": restaurant.restaurant_id,
                    "restaurant_name": restaurant.restaurant_name,
                    "cuisine_type": restaurant.cuisine_type,
                    "review_rating": overall_rating,
                    "n_dishes": len(dish_indices_for_visit),
                    "text_review": None,
                    "visit_number": visit_idx + 1,
                }
            )

    # ------------------------------------------------------------------
    # Optional review text generation (approx. 10% of visits)
    # ------------------------------------------------------------------

    if generate_review_texts and review_records:
        try:
            from src.ai import review_generation
        except Exception as exc:  # pragma: no cover - guard for optional dependency
            print(
                f"Warning: Could not import review_generation ({exc}); "
                "skipping text generation."
            )
        else:
            candidates: List[int] = []
            for idx, _ in enumerate(review_records):
                if rng.random() < review_text_probability:
                    candidates.append(idx)

            if candidates:
                payload = []
                for position, review_idx in enumerate(candidates):
                    summary = review_records[review_idx]
                    dish_strings = []
                    for dish_idx in review_to_dish_indices[summary["review_id"]]:
                        dish = dish_records[dish_idx]
                        dish_strings.append(
                            f"{dish['dish_name']} ({dish['rating']}/5)"
                        )
                    if not dish_strings:
                        continue
                    dishes_joined = ", ".join(dish_strings)
                    payload.append(
                        {
                            "index": position,
                            "dish_name": f"{summary['restaurant_name']} visit: {dishes_joined}",
                            "rating": summary["review_rating"],
                            "cuisine_type": summary["cuisine_type"],
                        }
                    )

                if payload:
                    generated_texts = review_generation.generate_reviews_batch(
                        payload,
                        batch_size=min(50, len(payload)),
                    )

                    for local_idx, review_idx in enumerate(candidates):
                        if local_idx >= len(generated_texts):
                            break
                        text = generated_texts[local_idx]
                        review_records[review_idx]["text_review"] = text
                        for dish_idx in review_to_dish_indices[
                            review_records[review_idx]["review_id"]
                        ]:
                            dish_records[dish_idx]["text_review"] = text

    dish_reviews_df = pd.DataFrame(dish_records)
    review_summaries_df = pd.DataFrame(review_records)

    return dish_reviews_df, review_summaries_df


def load_multi_visit_data(
    size: str = "small",
    seed: int = 42,
    generate_review_texts: bool = False,
    review_text_probability: float = 0.1,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Convenience wrapper that mirrors ``synthetic_data.load_synthetic_data``.

    Parameters
    ----------
    size:
        Dataset size key. Must exist in ``DEFAULT_SIZE_CONFIGS``.
    seed:
        Random seed forwarded to the generator.
    generate_review_texts:
        Whether to produce written reviews for a subset of visits.
    review_text_probability:
        Probability per visit of generating text (ignored if ``generate_review_texts``
        is ``False``).
    """

    if size not in DEFAULT_SIZE_CONFIGS:
        valid = ", ".join(DEFAULT_SIZE_CONFIGS.keys())
        raise ValueError(f"size must be one of: {valid}")

    params = DEFAULT_SIZE_CONFIGS[size]
    dish_df, review_df = generate_multi_item_review_data(
        generate_review_texts=generate_review_texts,
        review_text_probability=review_text_probability,
        seed=seed,
        **params,
    )
    return dish_df, review_df


DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(exist_ok=True)


def _get_dataset_paths(size: str, seed: int) -> Tuple[Path, Path, Path]:
    """Get paths for dishes, reviews, and embeddings files."""
    base_name = f"multi_visit_{size}_seed{seed}"
    dishes_path = DATA_DIR / f"{base_name}_dishes.pkl"
    reviews_path = DATA_DIR / f"{base_name}_reviews.pkl"
    embeddings_path = DATA_DIR / f"{base_name}_embeddings.json"
    return dishes_path, reviews_path, embeddings_path


def save_multi_visit_data(
    dish_reviews: pd.DataFrame,
    review_summaries: pd.DataFrame,
    size: str,
    seed: int,
) -> None:
    """Save dish reviews and visit summaries to disk."""
    dishes_path, reviews_path, _ = _get_dataset_paths(size, seed)
    dish_reviews.to_pickle(dishes_path)
    review_summaries.to_pickle(reviews_path)


def load_multi_visit_data_from_disk(size: str, seed: int) -> Optional[Tuple[pd.DataFrame, pd.DataFrame]]:
    """Load dish reviews and visit summaries from disk."""
    dishes_path, reviews_path, _ = _get_dataset_paths(size, seed)
    if not dishes_path.exists() or not reviews_path.exists():
        return None
    dish_reviews = pd.read_pickle(dishes_path)
    review_summaries = pd.read_pickle(reviews_path)
    return dish_reviews, review_summaries


def save_embeddings_for_data(embeddings_cache: dict, size: str, seed: int) -> None:
    """Save embeddings to the data directory alongside the dataset."""
    _, _, embeddings_path = _get_dataset_paths(size, seed)
    try:
        with open(embeddings_path, 'w') as f:
            json.dump(embeddings_cache, f)
        print(f"    ✅ Embeddings saved: {embeddings_path.name}")
    except Exception as e:
        print(f"    ⚠ Warning: Could not save embeddings: {e}")


def load_embeddings_for_data(size: str, seed: int) -> Optional[dict]:
    """Load embeddings from the data directory."""
    _, _, embeddings_path = _get_dataset_paths(size, seed)
    if not embeddings_path.exists():
        return None
    try:
        with open(embeddings_path, 'r') as f:
            embeddings = json.load(f)
        return embeddings
    except Exception as e:
        print(f"    ⚠ Warning: Could not load embeddings: {e}")
        return None


def generate_embeddings_for_data(
    dish_reviews: pd.DataFrame,
    size: str,
    seed: int,
    force_regenerate: bool = False
) -> Optional[dict]:
    """
    Generate embeddings for all unique dishes in the dataset.
    
    Args:
        dish_reviews: DataFrame with dish_name, restaurant_name, cuisine_type
        size: Dataset size (for cache naming)
        seed: Random seed (for cache naming)
        force_regenerate: If True, regenerate even if cache exists
        
    Returns:
        Dictionary mapping "dish_name@restaurant_name" to embedding vectors
    """
    # Check if embeddings already exist
    if not force_regenerate:
        existing_embeddings = load_embeddings_for_data(size, seed)
        if existing_embeddings:
            print(f"    ℹ️  Embeddings already exist ({len(existing_embeddings)} items)")
            return existing_embeddings
    
    print(f"    🔄 Generating embeddings for unique dishes...")
    
    try:
        from src.ai import embeddings as emb_module
        from openai import OpenAI
    except ImportError as e:
        print(f"    ⚠ Warning: Could not import embeddings module: {e}")
        print(f"    Embeddings will be generated on-demand during runtime.")
        return None
    
    # Get unique dish@restaurant combinations
    unique_dishes = dish_reviews.groupby(['dish_name', 'restaurant_name']).first().reset_index()
    total_unique = len(unique_dishes)
    
    print(f"    Generating embeddings for {total_unique} unique dishes...")
    
    embeddings_cache = {}
    client = OpenAI()
    
    for idx, row in unique_dishes.iterrows():
        dish_name = row['dish_name']
        restaurant_name = row['restaurant_name']
        cuisine_type = row.get('cuisine_type') if 'cuisine_type' in row else None
        
        cache_key = f"{dish_name}@{restaurant_name}"
        
        # Create text representation for embedding
        text_parts = [dish_name, restaurant_name]
        if cuisine_type and pd.notna(cuisine_type):
            text_parts.append(str(cuisine_type))
        text = " | ".join(text_parts)
        
        try:
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            embedding = response.data[0].embedding
            embeddings_cache[cache_key] = embedding
            
            if (idx + 1) % 10 == 0:
                print(f"      Progress: {idx + 1}/{total_unique} embeddings generated...")
                
        except Exception as e:
            print(f"      ⚠ Warning: Failed to get embedding for '{cache_key}': {e}")
            continue
    
    print(f"    ✅ Generated {len(embeddings_cache)} embeddings")
    
    # Save embeddings
    save_embeddings_for_data(embeddings_cache, size, seed)
    
    return embeddings_cache


def get_or_create_multi_visit_data(
    size: str,
    seed: int,
    generate_review_texts: bool = False,
    review_text_probability: float = 0.1,
    generate_embeddings: bool = False,
) -> Tuple[pd.DataFrame, pd.DataFrame, bool]:
    """
    Load or create multi-visit data with optional embedding generation.
    
    Args:
        size: Dataset size ('small', 'medium', 'large', 'xlarge')
        seed: Random seed for reproducibility
        generate_review_texts: Whether to generate text reviews
        review_text_probability: Probability of generating text per review
        generate_embeddings: Whether to generate embeddings during data creation
        
    Returns:
        Tuple of (dish_reviews, review_summaries, cache_loaded)
    """
    cached = load_multi_visit_data_from_disk(size, seed)
    if cached is not None:
        return cached[0], cached[1], True

    dish_reviews, review_summaries = load_multi_visit_data(
        size=size,
        seed=seed,
        generate_review_texts=generate_review_texts,
        review_text_probability=review_text_probability,
    )
    save_multi_visit_data(dish_reviews, review_summaries, size, seed)
    
    # Optionally generate embeddings during data creation
    if generate_embeddings:
        print(f"\n    📊 Generating embeddings for dataset...")
        generate_embeddings_for_data(dish_reviews, size, seed, force_regenerate=False)
    
    return dish_reviews, review_summaries, False


if __name__ == "__main__":  # pragma: no cover - manual testing helper
    dishes_df, reviews_df = generate_multi_item_review_data(
        n_users=10,
        n_restaurants=5,
        visits_per_user_range=(2, 4),
        generate_review_texts=False,
        seed=123,
    )
    print("Dish-level rows:", len(dishes_df))
    print("Review-level rows:", len(reviews_df))

