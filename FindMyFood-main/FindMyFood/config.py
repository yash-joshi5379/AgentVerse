"""
Configuration for FindMyFood recommendation system.
"""

# Data source: 'multi_visit', 'synthetic', or 'sample'
DATA_SOURCE = 'multi_visit'

# Dataset size: 'small', 'medium', 'large'
SYNTHETIC_SIZE = 'small'

# Random seed for reproducibility
CACHE_SEED = 42

# Recommendation settings
TOP_N_RECOMMENDATIONS = 4  # Number of recommendations to generate
MIN_RATING_THRESHOLD = 4.0  # Minimum predicted rating to recommend
SIMILAR_USERS_COUNT = 3  # Number of similar users to consider

# Feature toggles
ENABLE_DISH_EMBEDDING_SIMILARITY = False  # Disable embeddings to save API costs
ENABLE_SENTIMENT_ANALYSIS = False  # Disable sentiment analysis to save API costs

# Embedding similarity boost parameters (only used if ENABLE_DISH_EMBEDDING_SIMILARITY = True)
EMBEDDING_BETA_SAME = 1.0  # Boost for same dish at same restaurant
EMBEDDING_BETA_SIMILAR = 0.5  # Boost for similar dishes
EMBEDDING_MAX_BOOST = 2.0  # Maximum allowed boost

