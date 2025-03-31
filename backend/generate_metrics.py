#!/usr/bin/env python
"""
Script to generate missing metrics for SaaS ideas.
This script calls the generate_missing_metrics function from reddit_pipeline.py.
"""

import sys
from reddit_pipeline import generate_missing_metrics

if __name__ == "__main__":
    print("Starting metric generation for products with null attributes...")
    print("This will use the Google Ads API to get metrics for keywords.")
    print("Batches will be limited to", end=" ")
    
    # Import the batch size constant to show in the message
    try:
        from reddit_pipeline import BATCH_SIZE_FOR_KEYWORD_ANALYSIS
        print(f"{BATCH_SIZE_FOR_KEYWORD_ANALYSIS} items per batch.")
    except ImportError:
        print("the configured batch size.")
    
    # Run the function to generate missing metrics
    generate_missing_metrics()
    
    print("Process completed.")