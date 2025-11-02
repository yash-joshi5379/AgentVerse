"""
Wrapper script to generate FindMyFood recommendations and output JSON.
This script is called from Node.js to get recommendations.
"""

import sys
import os
import json
from pathlib import Path

# Set UTF-8 encoding for stdout
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Add project root to path for config import
project_root = Path(__file__).resolve().parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Suppress warnings and info messages
import warnings
warnings.filterwarnings('ignore')

# Suppress print statements from imported modules
import io
import contextlib

try:
    import pandas as pd
    import config
    from src import data_gen
    from src.core import matrix_ops, recommendations
    
    def get_recommendations_json(user_id=1, top_n=4):
        """Get recommendations and return as JSON."""
        
        # Suppress all print statements during execution
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            # Load data (with embeddings if available)
            reviews_df, review_summaries_df, cache_loaded = data_gen.get_or_create_multi_visit_data(
                size=config.SYNTHETIC_SIZE,
                seed=config.CACHE_SEED,
                generate_review_texts=False,
            )
        
            reviews_df.attrs['review_summaries'] = review_summaries_df
            reviews_df.attrs['multi_visit'] = True
            reviews_df.attrs['multi_visit_cache_loaded'] = cache_loaded
            
            # Use effective_rating column
            reviews_df['effective_rating'] = reviews_df['rating']
            
            # Create user-dish matrix
            user_dish_matrix, user_dish_matrix_centered, user_dish_matrix_filled, dish_lookup = matrix_ops.create_user_dish_matrix(
                reviews_df, rating_column='effective_rating'
            )
            
            # Calculate user similarity
            user_similarity_df = matrix_ops.calculate_user_similarity(user_dish_matrix_filled)
            
            # Get collaborative recommendations
            recs = recommendations.get_collaborative_recommendations(
                user_id,
                user_dish_matrix,
                user_dish_matrix_centered,
                user_similarity_df,
                reviews_df,
                dish_lookup,
                top_n=top_n,
                min_rating=config.MIN_RATING_THRESHOLD
            )
        
        if recs is None or len(recs) == 0:
            return []
        
        # Convert to JSON-serializable format
        json_recs = []
        for rec in recs:
            # Get user names from reviews
            supporter_data = []
            for supporter in rec.get('supporters', []):
                neighbor_id = supporter['neighbor_id']
                # Try to get a name based on user_id (simple mapping)
                user_names = {1: 'Josh', 2: 'Sarah', 3: 'Miguel', 4: 'Priya'}
                neighbor_name = user_names.get(neighbor_id, f'User {neighbor_id}')
                
                supporter_data.append({
                    'neighbor_id': neighbor_id,
                    'neighbor_name': neighbor_name,
                    'similarity': float(supporter['similarity']),
                    'rating': int(supporter['rating']),
                    'common_items': supporter.get('common_items', [])
                })
            
            json_recs.append({
                'dish_name': rec['dish_name'],
                'restaurant': rec['restaurant'],
                'predicted_rating': float(rec['predicted_rating']),
                'is_new_restaurant': bool(rec['is_new_restaurant']),
                'supporters': supporter_data
            })
        
        return json_recs
    
    if __name__ == '__main__':
        # Get user_id from command line args (default 1)
        user_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
        top_n = int(sys.argv[2]) if len(sys.argv) > 2 else 4
        
        # Get recommendations
        recommendations_list = get_recommendations_json(user_id, top_n)
        
        # Output as JSON
        print(json.dumps(recommendations_list, indent=2))
        
except Exception as e:
    # Return error as JSON
    print(json.dumps({
        'error': str(e),
        'type': type(e).__name__
    }), file=sys.stderr)
    sys.exit(1)

