import os
from dotenv import load_dotenv
import requests
import json
from math import floor

# Load environment variables from .env file
load_dotenv()

# DataForSEO API credentials
DATAFORSEO_USERNAME = os.getenv('DATAFORSEO_USERNAME')
DATAFORSEO_PASSWORD = os.getenv('DATAFORSEO_PASSWORD')
# Default values for when metrics can't be retrieved
DUMMY_DATA = [0, "N/A", 0]

def approximate_revenue(average_searches, competition, CR=0.01, B=50, alpha=1.0, k=1000, beta=0.2):
    '''
    Calculate approximate monthly revenue based on search volume and competition.
    
    Parameters:
        average_searches: Average monthly keyword searches (S).
        competition: Market competition on a scale from 0 (low) to 100 (high).
        CR: Conversion rate from a searcher to a paying customer (default 0.01, i.e., 1%).
        B: Baseline price per customer in dollars (default $50).
        alpha: Demand sensitivity factor (default 1.0).
        k: Saturation constant for demand (default 1000).
        beta: Competition sensitivity factor (default 0.2).
    '''
    try:
        average_searches = float(average_searches or 0)
        competition = float(competition or 0)
        
        # Calculate the number of paying customers
        paying_customers = average_searches * CR
        
        # Calculate the adaptive price per customer
        price = B * (1 + alpha * (average_searches / (average_searches + k))) * (1 - beta * (competition / 100))
        
        # Calculate the total estimated monthly revenue
        revenue = paying_customers * price
        return int(revenue)
    except Exception as e:
        print(f"Revenue calculation error: {e}")
        return DUMMY_DATA[2]

def get_google_metrics(keywords_list):
    """
    Get Google Ads metrics for a list of keywords using DataForSEO API.
    
    Parameters:
        keywords_list: List of keyword strings to analyze.
        
    Returns:
        Dictionary with keywords as keys and [avg_searches, competition_level, revenue] as values
    """
    results = {}
    
    # Check if we have valid credentials and keywords
    if not keywords_list:
        return results  # Return empty dict if no keywords
        
    if not DATAFORSEO_USERNAME or not DATAFORSEO_PASSWORD:
        # Return dummy data for testing when credentials aren't available
        return {keyword: DUMMY_DATA for keyword in keywords_list}
    
    # Prepare batches of keywords (max 1000 per request)
    batch_size = 1000
    for i in range(0, len(keywords_list), batch_size):
        batch_keywords = keywords_list[i:i+batch_size]
        
        # DataForSEO endpoint for Google Ads search volume
        endpoint_url = "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live"
        
        # Set up authentication
        auth = requests.auth.HTTPBasicAuth(DATAFORSEO_USERNAME, DATAFORSEO_PASSWORD)
        
        # Prepare payload
        payload = [
            {
                "keywords": batch_keywords,
                "language_code": "en",
                "location_code": 2840  # USA
            }
        ]
        
        headers = {
            "Content-Type": "application/json"
        }
        
        try:
            # Make API request
            response = requests.post(endpoint_url, auth=auth, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            print(data)
            
            # Process the results
            if "tasks" in data:
                for task in data["tasks"]:
                    if "result" in task and isinstance(task["result"], list):
                        for result_item in task["result"]:
                            try:
                                keyword = result_item.get("keyword", "")
                                
                                # Get search volume - directly from API if available
                                search_volume = result_item.get("search_volume")
                                
                                # If no search volume, try to calculate from monthly data
                                if search_volume is None and result_item.get("monthly_searches"):
                                    try:
                                        monthly_data = result_item["monthly_searches"]
                                        valid_volumes = [m.get("search_volume") for m in monthly_data if m.get("search_volume") is not None]
                                        if valid_volumes:
                                            search_volume = sum(valid_volumes) / len(valid_volumes)
                                    except Exception as e:
                                        print(f"Error processing monthly volumes: {e}")
                                
                                # Skip keywords with no search volume - they're not useful
                                if search_volume is None or search_volume == 0:
                                    print(f"Skipping keyword '{keyword}' due to zero/null search volume")
                                    continue
                                    
                                # Get competition index
                                competition_index = result_item.get("competition_index")
                                if competition_index is None:
                                    # Try to map from competition string if available
                                    competition_str = result_item.get("competition", "").upper()
                                    if competition_str == "HIGH":
                                        competition_index = 80
                                    elif competition_str == "MEDIUM":
                                        competition_index = 50
                                    else:  # "LOW" or empty
                                        competition_index = 20
                                
                                # Map competition to human-readable format
                                competition_level = map_competition(competition_index)
                                
                                # Calculate estimated revenue
                                revenue = approximate_revenue(search_volume, competition_index)
                                
                                # Store results with proper types
                                results[keyword] = [
                                    int(float(search_volume)), 
                                    competition_level, 
                                    revenue
                                ]
                            except Exception as e:
                                print(f"Error processing result for keyword '{keyword}': {e}")
                                results[keyword] = DUMMY_DATA
        
        except Exception as e:
            print(f"Error with DataForSEO API: {e}")
            # Add dummy data for keywords in this batch
            for keyword in batch_keywords:
                if keyword not in results:
                    results[keyword] = DUMMY_DATA
    
    # Ensure all requested keywords have results
    for keyword in keywords_list:
        if keyword not in results:
            results[keyword] = DUMMY_DATA
    
    return results

def map_competition(competition_value):
    """Map competition value (0-100) to human-readable format."""
    try:
        # Convert to float for comparison
        value = float(competition_value)
        
        if value < 20:
        return "Very Low"
        elif value < 40:
        return "Low"
        elif value < 60:
        return "Moderate"
        elif value < 80:
        return "High"
    else:
        return "Very High"
    except (ValueError, TypeError):
        return DUMMY_DATA[1]

# Example usage
if __name__ == "__main__":
    # Sample keywords for testing
    test_keywords = [
      "karma growth"
    ]
    metrics = get_google_metrics(test_keywords)
    print(f"Metrics for test keywords: {metrics}")
