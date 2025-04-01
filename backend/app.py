from flask import Flask, jsonify, request, send_file
import json
import os
import stripe
from flask_cors import CORS
from dotenv import load_dotenv
import csv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS - update for production
# For local development: http://localhost:3000
# For production: get from env var or default to Render URL
frontend_url = os.getenv('FRONTEND_URL', 'https://saas-insight-frontend.onrender.com')
CORS(app, resources={r"/api/*": {"origins": [frontend_url, "http://localhost:3000"]}})

# Configure Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# Define data directory - use persistent disk on Render if available
DATA_DIR = '/data' if os.path.exists('/data') else os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')

# Ensure data directories exist
os.makedirs(os.path.join(DATA_DIR, 'csv'), exist_ok=True)

# Helper functions
def load_users():
    file_path = os.path.join(DATA_DIR, 'users.json')
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            return json.load(f)
    return {"users": []}

def save_users(users):
    file_path = os.path.join(DATA_DIR, 'users.json')
    with open(file_path, 'w') as f:
        json.dump(users, f)

# Helper to copy files from repository to persistent storage on first run
def initialize_data_files():
    # Copy SaaS_ideas.json if it doesn't exist in persistent storage
    repo_ideas_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'SaaS_ideas.json')
    persistent_ideas_path = os.path.join(DATA_DIR, 'SaaS_ideas.json')
    
    if not os.path.exists(persistent_ideas_path) and os.path.exists(repo_ideas_path):
        with open(repo_ideas_path, 'r') as src, open(persistent_ideas_path, 'w') as dst:
            dst.write(src.read())
            
    # Copy CSV file if it doesn't exist
    repo_csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'csv', 'SaaS_Niche_opportunities.csv')
    persistent_csv_path = os.path.join(DATA_DIR, 'csv', 'SaaS_Niche_opportunities.csv')
    
    if not os.path.exists(persistent_csv_path) and os.path.exists(repo_csv_path):
        with open(repo_csv_path, 'r') as src, open(persistent_csv_path, 'w') as dst:
            dst.write(src.read())
            
    # Initialize users.json if needed
    if not os.path.exists(os.path.join(DATA_DIR, 'users.json')):
        with open(os.path.join(DATA_DIR, 'users.json'), 'w') as f:
            f.write('{"users": []}')

# Initialize data on startup
initialize_data_files()

# Health check endpoint for Render
@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy"})

# Routes
@app.route('/api/preview-data')
def get_preview_data():
    file_path = os.path.join(DATA_DIR, 'csv', 'SaaS_Niche_opportunities.csv')
    
    # Check if user has access
    email = request.args.get('email')
    has_access = False
    
    if email:
        users = load_users()
        has_access = email in [user['email'] for user in users['users']]
    
    with open(file_path, 'r') as f:
        csv_reader = csv.DictReader(f)
        data = list(csv_reader)
        
        # If user has access, return all data
        if has_access:
            return jsonify(data)
        # Otherwise return only preview data
        return jsonify(data[:8])  # Get first 8 entries

@app.route('/api/create-payment-intent', methods=['POST'])
def create_payment():
    try:
        print("Creating payment intent...")
        print(f"Using Stripe key: {stripe.api_key[:4]}...")  # Only print first 4 chars for security
        
        payment_intent = stripe.PaymentIntent.create(
            amount=3000,  # $30.00
            currency='usd'
        )
        
        print(f"Payment intent created: {payment_intent.id}")
        print(f"Client secret: {payment_intent.client_secret[:5]}...")  # Only log part of it
        
        return jsonify({
            'clientSecret': payment_intent.client_secret
        })
    except Exception as e:
        print(f"Error creating payment intent: {str(e)}")
        # Return the error details for debugging
        return jsonify({
            'error': str(e),
            'stripe_key_set': bool(stripe.api_key)
        }), 403

@app.route('/api/verify-access', methods=['POST'])
def verify_access():
    data = request.json
    email = data.get('email')
    users = load_users()
    
    if email in [user['email'] for user in users['users']]:
        return jsonify({"hasAccess": True})
    return jsonify({"hasAccess": False})

@app.route('/api/register-access', methods=['POST'])
def register_access():
    data = request.json
    email = data.get('email')
    
    users = load_users()
    if email not in [user['email'] for user in users['users']]:
        users['users'].append({
            "email": email,
            "access": True
        })
        save_users(users)
    
    return jsonify({"success": True})

@app.route('/api/saas-ideas')
def get_saas_ideas():
    file_path = os.path.join(DATA_DIR, 'SaaS_ideas.json')
    with open(file_path, 'r') as f:
        saas_ideas = json.load(f)
    return jsonify(saas_ideas)

if __name__ == '__main__':
    app.run(debug=True)
