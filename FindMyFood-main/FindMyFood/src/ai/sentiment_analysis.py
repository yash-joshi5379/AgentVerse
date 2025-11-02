"""
Sentiment analysis for review texts.
Stores sentiment labels for explanations only (does not modify ratings).
"""

import json
import asyncio
from openai import AsyncOpenAI

async_client = AsyncOpenAI()


async def analyze_review_sentiment_and_quality_single(review_text):
    """Analyze a single review sentiment and quality (async)."""
    prompt = f"""Analyze: "{review_text}"
Return JSON: {{"sentiment_score": 0.0-1.0, "quality_score": 0.0-1.0, "sentiment_label": "positive/negative/neutral"}}"""
    
    response = await async_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": "Return only valid JSON."}, {"role": "user", "content": prompt}],
        max_tokens=100,
        temperature=0.3
    )
    
    response_text = response.choices[0].message.content.strip()
    # Clean JSON
    start_idx = response_text.find('{')
    end_idx = response_text.rfind('}')
    if start_idx != -1 and end_idx != -1:
        response_text = response_text[start_idx:end_idx + 1]
    
    try:
        result = json.loads(response_text)
    except:
        return {'sentiment_score': 0.7, 'quality_score': 0.5, 'sentiment_label': 'neutral'}
    
    return {
        'sentiment_score': float(result.get('sentiment_score', 0.7)),
        'quality_score': float(result.get('quality_score', 0.5)),
        'sentiment_label': result.get('sentiment_label', 'neutral')
    }


async def analyze_reviews_sentiment_batch_async(reviews_data, batch_size=150, max_concurrent=10):
    """
    Analyze multiple reviews' sentiment and quality in batches (async).
    
    Args:
        reviews_data: List of dicts with 'review_text' and optionally 'index'
        batch_size: Reviews per API call (default 150)
        max_concurrent: Max concurrent batches (default 10)
    
    Returns:
        List of analysis dicts in same order
    """
    if len(reviews_data) == 0:
        return []
    
    # Group reviews into batches for API calls
    num_batches = (len(reviews_data) + batch_size - 1) // batch_size
    batches = []
    for i in range(num_batches):
        start = i * batch_size
        end = min(start + batch_size, len(reviews_data))
        batches.append(reviews_data[start:end])
    
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def process_batch(batch_data, batch_idx):
        async with semaphore:
            try:
                reviews_list = [f"{j+1}. {r['review_text'][:200]}" for j, r in enumerate(batch_data)]
                reviews_str = "\n".join(reviews_list)
                
                prompt = f"""Analyze these reviews. Return JSON array: [{{"sentiment_score": 0.0-1.0, "quality_score": 0.0-1.0, "sentiment_label": "string"}}, ...]
Reviews:
{reviews_str}"""
                
                response = await async_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "Return only valid JSON array."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=min(3000, len(batch_data) * 80),
                    temperature=0.3
                )
                
                response_text = response.choices[0].message.content.strip()
                start_idx = response_text.find('[')
                end_idx = response_text.rfind(']')
                if start_idx != -1 and end_idx != -1:
                    response_text = response_text[start_idx:end_idx + 1]
                
                try:
                    results = json.loads(response_text)
                    batch_analyses = []
                    for j, result in enumerate(results):
                        batch_analyses.append({
                            'sentiment_score': float(result.get('sentiment_score', 0.7)),
                            'quality_score': float(result.get('quality_score', 0.5)),
                            'sentiment_label': result.get('sentiment_label', 'neutral')
                        })
                    # Fill missing if needed
                    while len(batch_analyses) < len(batch_data):
                        batch_analyses.append({'sentiment_score': 0.7, 'quality_score': 0.5, 'sentiment_label': 'neutral'})
                    if (batch_idx + 1) % max(1, num_batches // 10) == 0 or batch_idx == num_batches - 1:
                        print(f"  Progress: {batch_idx + 1}/{num_batches} batches completed")
                    return batch_analyses[:len(batch_data)]
                except:
                    # Fallback: return defaults instead of individual calls (faster)
                    print(f"  ⚠ Batch {batch_idx + 1} JSON parse error, using defaults")
                    return [{'sentiment_score': 0.7, 'quality_score': 0.5, 'sentiment_label': 'neutral'} for _ in batch_data]
            except Exception as e:
                print(f"  ⚠ Batch {batch_idx + 1} error, using defaults: {str(e)[:60]}")
                return [{'sentiment_score': 0.7, 'quality_score': 0.5, 'sentiment_label': 'neutral'} for _ in batch_data]
    
    tasks = [process_batch(batch, idx) for idx, batch in enumerate(batches)]
    results = await asyncio.gather(*tasks)
    
    # Flatten
    all_analyses = []
    for batch_results in results:
        all_analyses.extend(batch_results)
    
    return all_analyses

