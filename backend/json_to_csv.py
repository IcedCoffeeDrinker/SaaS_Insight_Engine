import json
import csv
import os

def json_to_csv():
    """
    Convert SaaS ideas from JSON to CSV format.
    The CSV will have columns: SaaS Niche, Monthly Keyword Searches, Evaluation of Competition, Approximated Revenue
    """
    # Define file paths
    json_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'SaaS_ideas.json')
    csv_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'csv', 'SaaS_Niche_opportunities.csv')
    
    # Ensure the csv directory exists
    os.makedirs(os.path.dirname(csv_file_path), exist_ok=True)
    
    # Load JSON data
    with open(json_file_path, 'r') as json_file:
        saas_ideas = json.load(json_file)
    
    # Write to CSV
    with open(csv_file_path, 'w', newline='') as csv_file:
        csv_writer = csv.writer(csv_file)
        
        # Write header
        csv_writer.writerow(['SaaS Niche', 'Monthly Keyword Searches', 'Evaluation of Competition', 'Approximated Revenue'])
        
        # Write data rows
        for idea in saas_ideas:
            # Extract product title
            saas_niche = idea.get('product_title', 'Untitled Product')
            
            # Format monthly searches with commas
            monthly_searches = idea.get('avg_monthly_searches', 0)
            formatted_searches = f"{monthly_searches:,}" if monthly_searches else "0"
            
            # Get competition level
            competition = idea.get('competition_level', 'Unknown')
            
            # Format revenue as currency
            revenue = idea.get('revenue', 0)
            formatted_revenue = f"${revenue:,}/month" if revenue else "$0/month"
            
            # Write the row
            csv_writer.writerow([saas_niche, formatted_searches, competition, formatted_revenue])
    
    print(f"CSV file created successfully at: {csv_file_path}")
    return csv_file_path

if __name__ == "__main__":
    csv_path = json_to_csv()
    print(f"Converted JSON to CSV: {csv_path}")
