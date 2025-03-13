import os
from dotenv import load_dotenv
from google.ads.googleads.client import GoogleAdsClient

# Load environment variables from .env file
load_dotenv()

# Use the local credentials file directly
CREDENTIALS_FILE_PATH = os.path.join(os.path.dirname(__file__), 'google_ads_credentials.json')

# Initialize Google Ads API client with service account file
client = GoogleAdsClient.load_from_dict({
    'developer_token': os.getenv('GOOGLE_ADS_DEVELOPER_TOKEN'),
    'login_customer_id': os.getenv('GOOGLE_ADS_CUSTOMER_ID'),  # Get from .env
    'use_proto_plus': True,
    'json_key_file_path': CREDENTIALS_FILE_PATH
})

def approximate_revenue(average_searches, competition, CR=0.01, B=50, alpha=1.0, k=1000, beta=0.2):
    '''
    Parameters:
        average_searches: Average monthly keyword searches (S).
        competition: Market competition on a scale from 0 (low) to 100 (high).
        CR: Conversion rate from a searcher to a paying customer (default 0.01, i.e., 1%).
        B: Baseline price per customer in dollars (default $50).
        alpha: Demand sensitivity factor (default 1.0).
        k: Saturation constant for demand (default 1000).
        beta: Competition sensitivity factor (default 0.2).
    '''
    # Calculate the number of paying customers
    paying_customers = average_searches * CR
    
    # Calculate the adaptive price per customer
    price = B * (1 + alpha * (average_searches / (average_searches + k))) * (1 - beta * (competition / 100))
    
    # Calculate the total estimated monthly revenue
    revenue = paying_customers * price
    return revenue

def get_google_metrics(keywords):
    return [20000, "Low", 40000] # for testing, since I don't have a real API key
    googleads_service = client.get_service("GoogleAdsService")
    keyword_plan_idea_service = client.get_service("KeywordPlanIdeaService")

    # Initialize variables to store total metrics
    total_avg_searches = 0
    total_competition = 0
    keyword_count = 0

    for keyword in keywords:
        request = client.get_type("GenerateKeywordHistoricalMetricsRequest")
        request.customer_id = os.getenv('GOOGLE_ADS_CUSTOMER_ID')  # Get from .env
        request.keywords.append(keyword)

        # Set geographic and language targeting
        request.geo_target_constants.append(
            googleads_service.geo_target_constant_path("2840")  # USA
        )
        request.language = googleads_service.language_constant_path("1000")  # English
        request.keyword_plan_network = client.enums.KeywordPlanNetworkEnum.GOOGLE_SEARCH

        # Make the API request
        response = keyword_plan_idea_service.generate_keyword_historical_metrics(request=request)

        for result in response.results:
            metrics = result.keyword_metrics
            avg_searches = metrics.avg_monthly_searches
            competition_value = metrics.competition

            # Update totals for averaging
            total_avg_searches += avg_searches
            total_competition += competition_value
            keyword_count += 1

    # Calculate averages
    avg_searches = total_avg_searches / keyword_count if keyword_count > 0 else 0
    avg_competition = total_competition / keyword_count if keyword_count > 0 else 0

    # Map competition value to a human-readable format
    competition_level = map_competition(avg_competition)
    revenue = approximate_revenue(avg_searches, avg_competition)

    return [avg_searches, competition_level, revenue]  # Return a list of results

def map_competition(competition_value):
    """Map competition value (0-100) to human-readable format."""
    if competition_value < 20:
        return "Very Low"
    elif competition_value < 40:
        return "Low"
    elif competition_value < 60:
        return "Moderate"
    elif competition_value < 80:
        return "High"
    else:
        return "Very High"

# Example usage
if __name__ == "__main__":
    # Sample keywords for testing
    test_keywords = ["saas marketing", "subscription business", "cloud software"]
    try:
        metrics = get_google_metrics(test_keywords)
        print(f"Average metrics for test keywords: {metrics}")
    except Exception as e:
        print(f"Error getting metrics: {e}")
