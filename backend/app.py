from flask import Flask, jsonify, request, send_file
import json
import os
import stripe
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# Helper functions
def load_users():
    if os.path.exists('data/users.json'):
        with open('data/users.json', 'r') as f:
            return json.load(f)
    return {"users": []}

def save_users(users):
    with open('data/users.json', 'w') as f:
        json.dump(users, f)

# Routes
@app.route('/api/preview-data')
def get_preview_data():
    with open('../data/SaaS_Niche_opportunities_Example.csv', 'r') as f:
        lines = f.readlines()
        header = lines[0].strip().split(',')
        preview_data = []
        for line in lines[1:9]:  # Get first 8 entries
            values = line.strip().split(',')
            preview_data.append(dict(zip(header, values)))
    return jsonify(preview_data)

@app.route('/api/create-payment-intent', methods=['POST'])
def create_payment():
    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=300,  # $3.00
            currency='usd'
        )
        return jsonify({
            'clientSecret': payment_intent.client_secret
        })
    except Exception as e:
        return jsonify(error=str(e)), 403

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

if __name__ == '__main__':
    app.run(debug=True)
