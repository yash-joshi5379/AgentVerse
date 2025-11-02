"""
Review text generation using OpenAI.
Handles batch processing and caching of generated reviews.
"""

import json
import re
import asyncio
from openai import AsyncOpenAI

async_client = AsyncOpenAI()


async def process_single_batch(batch_data, batch_idx, num_batches):
    """Process a single batch asynchronously."""
    try:
        # Build prompt for this batch
        reviews_list = []
        for i, rev in enumerate(batch_data, 1):
            dish = rev['dish_name']
            rating = rev['rating']
            cuisine = rev.get('cuisine_type', '')
            cuisine_str = f" ({cuisine})" if cuisine else ""
            
            tone_map = {
                5: "very positive", 4: "positive", 3: "neutral/mixed",
                2: "critical/negative", 1: "very negative"
            }
            tone = tone_map.get(rating, "neutral")
            
            reviews_list.append(f"{i}. {dish}{cuisine_str} ({rating}/5, {tone})")
        
        reviews_str = "\n".join(reviews_list)
        
        # Shorter, more efficient prompt
        prompt = f"""Generate food reviews. Return ONLY valid JSON: {{"1": "review", "2": "review", ...}}
Reviews: {reviews_str}"""
        
        response = await async_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Return only valid JSON. Escape quotes in review text."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=min(4000, len(batch_data) * 100),
            temperature=0.7
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Clean up response - remove markdown code blocks if present
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            parts = response_text.split("```")
            if len(parts) >= 2:
                response_text = parts[1].strip()
                if response_text.startswith("json"):
                    response_text = response_text[4:].strip()
        
        # Extract JSON
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}')
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            response_text = response_text[start_idx:end_idx + 1]
        
        # Parse JSON
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            # Fix common issues
            fixed_text = re.sub(r',\s*}', '}', response_text)
            fixed_text = re.sub(r',\s*]', ']', fixed_text)
            try:
                result = json.loads(fixed_text)
            except json.JSONDecodeError:
                # Manual extraction as fallback
                result = {}
                pattern = r'"(\d+)":\s*"((?:[^"\\]|\\.|"(?=\s*[,}]))*)"'
                matches = list(re.finditer(pattern, response_text, re.DOTALL))
                for match in matches:
                    key = match.group(1)
                    value = match.group(2)
                    value = value.replace('\\"', '"').replace('\\n', ' ').replace('\\r', '').replace('\\t', ' ')
                    result[key] = value.strip()
        
        # Convert to list in order
        batch_reviews = []
        for i in range(1, len(batch_data) + 1):
            key = str(i)
            if key in result:
                review_text = str(result[key]).strip()
                if review_text.startswith('"') and review_text.endswith('"'):
                    review_text = review_text[1:-1]
                batch_reviews.append(review_text)
            else:
                # Fallback
                rev = batch_data[i-1]
                if rev['rating'] >= 4:
                    batch_reviews.append(f"Great {rev['dish_name']}! Really enjoyed it.")
                elif rev['rating'] <= 2:
                    batch_reviews.append(f"{rev['dish_name']} was disappointing.")
                else:
                    batch_reviews.append(f"{rev['dish_name']} was okay, nothing special.")
        
        return batch_reviews
        
    except Exception as e:
        print(f"  ⚠ Batch {batch_idx + 1} error: {str(e)[:80]}")
        # Return fallback reviews
        batch_reviews = []
        for rev in batch_data:
            if rev['rating'] >= 4:
                batch_reviews.append(f"Great {rev['dish_name']}! Really enjoyed it.")
            elif rev['rating'] <= 2:
                batch_reviews.append(f"{rev['dish_name']} was disappointing.")
            else:
                batch_reviews.append(f"{rev['dish_name']} was okay, nothing special.")
        return batch_reviews


async def generate_reviews_batch_async(reviews_data, batch_size=200, max_concurrent=10):
    """
    Generate multiple reviews in batches using async OpenAI API calls.
    Processes multiple batches concurrently for much faster generation.
    
    Args:
        reviews_data: List of dicts with 'dish_name', 'rating', 'cuisine_type'
        batch_size: Number of reviews per batch (default 200, higher = fewer API calls)
        max_concurrent: Maximum concurrent batches (default 10)
    
    Returns:
        List of generated review texts
    """
    if not reviews_data:
        return []
    
    # Process in batches
    num_batches = (len(reviews_data) + batch_size - 1) // batch_size
    batches = []
    for batch_idx in range(num_batches):
        start_idx = batch_idx * batch_size
        end_idx = min(start_idx + batch_size, len(reviews_data))
        batches.append(reviews_data[start_idx:end_idx])
    
    print(f"  Processing {len(reviews_data)} reviews in {num_batches} batches (up to {max_concurrent} concurrent)...")
    
    # Process batches with concurrency limit
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def process_with_semaphore(batch_data, batch_idx):
        async with semaphore:
            return await process_single_batch(batch_data, batch_idx, num_batches)
    
    # Run all batches concurrently (with limit)
    tasks = [process_with_semaphore(batch, idx) for idx, batch in enumerate(batches)]
    results = await asyncio.gather(*tasks)
    
    # Flatten results and show progress
    all_reviews = []
    for i, batch_reviews in enumerate(results):
        all_reviews.extend(batch_reviews)
        if (i + 1) % max(1, num_batches // 10) == 0 or i == num_batches - 1:
            print(f"  Progress: {i + 1}/{num_batches} batches completed")
    
    return all_reviews


def generate_reviews_batch(reviews_data, batch_size=150):
    """
    Synchronous wrapper for async batch generation.
    
    Args:
        reviews_data: List of dicts with 'dish_name', 'rating', 'cuisine_type'
        batch_size: Number of reviews per batch (default 150)
    
    Returns:
        List of generated review texts
    """
    return asyncio.run(generate_reviews_batch_async(reviews_data, batch_size=batch_size, max_concurrent=10))

