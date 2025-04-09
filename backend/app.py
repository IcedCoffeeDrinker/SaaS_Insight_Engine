from flask import Flask, jsonify, request, send_file
import json
import os
import stripe
from flask_cors import CORS
from dotenv import load_dotenv
import csv
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, JWTManager, get_jwt_identity
from flask_mail import Mail, Message
import secrets
from datetime import datetime, timedelta
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Load environment variables
load_dotenv()

app = Flask(__name__)

# --- Configuration ---
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY') # Ensure this is set!
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=15)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)

app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

# --- Initialize Extensions ---
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
mail = Mail(app)

# Initialize Limiter
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"], # Default limits for all routes
    storage_uri="memory://", # Use in-memory storage for simplicity, consider Redis for production
    strategy="fixed-window" # Choose a strategy (e.g., fixed-window, moving-window)
)

# Configure CORS - update for production
# For local development: http://localhost:3000
# For production: get from env var or default to Render URL

# Determine frontend URL based on environment
if os.getenv('FLASK_ENV') == 'development':
    frontend_url = 'http://localhost:3000'
else:
    # Use FRONTEND_URL from env var, defaulting to Render URL for production
    frontend_url = os.getenv('FRONTEND_URL', 'https://saas-insight-frontend.onrender.com')

print(f"INFO: Using frontend_url: {frontend_url}") # Add log to see which URL is used

additional_origins = os.getenv('ADDITIONAL_CORS_ORIGINS', '')
allowed_origins = [frontend_url, "http://localhost:3000"] # Always allow localhost:3000 for local dev even if FRONTEND_URL is set

# Add any additional origins if they exist
if additional_origins:
    for origin in additional_origins.split(','):
        origin = origin.strip()
        if origin and origin not in allowed_origins:
            allowed_origins.append(origin)

CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

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
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                # Ensure 'users' key exists and is a list
                if 'users' in data and isinstance(data['users'], list):
                    return data
                else:
                    print("Warning: users.json format incorrect. Reinitializing.")
                    return {"users": []}
        except json.JSONDecodeError:
            print("Error decoding users.json. Reinitializing.")
            return {"users": []}
    return {"users": []}

def save_users(users_data):
    file_path = os.path.join(DATA_DIR, 'users.json')
    with open(file_path, 'w') as f:
        json.dump(users_data, f, indent=4) # Use indent for readability

def find_user_by_email(email):
    users_data = load_users()
    for user in users_data.get('users', []):
        if user.get('email') == email:
            return user
    return None

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
    users_file_path = os.path.join(DATA_DIR, 'users.json')
    example_users_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'users.json.example')

    if not os.path.exists(users_file_path):
        if os.path.exists(example_users_path):
             # If example exists, copy and hash the example password if present
            try:
                with open(example_users_path, 'r') as f_example:
                    example_data = json.load(f_example)
                if 'users' in example_data and example_data['users']:
                     # Assume first user is the example, check for password
                     if 'password' in example_data['users'][0]:
                         plain_password = example_data['users'][0].pop('password')
                         hashed_password = bcrypt.generate_password_hash(plain_password).decode('utf-8')
                         example_data['users'][0]['password_hash'] = hashed_password
                         example_data['users'][0].setdefault('access', False) # Default access to false
                         example_data['users'][0]['created_at'] = datetime.utcnow().isoformat()
                     else:
                         # Add default structure if no password provided in example
                         example_data['users'][0].setdefault('password_hash', None)
                         example_data['users'][0].setdefault('access', False)
                         example_data['users'][0]['created_at'] = datetime.utcnow().isoformat()

                save_users(example_data)
                print("Initialized users.json from example.")
            except Exception as e:
                print(f"Error initializing users.json from example: {e}. Creating empty file.")
                save_users({"users": []})
        else:
            print("Creating empty users.json.")
            save_users({"users": []})

# Initialize data on startup
initialize_data_files()

# --- Authentication Routes ---

@app.route('/api/login', methods=['POST'])
@limiter.limit("20 per hour; 5 per minute")
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = find_user_by_email(email)

    if user and user.get('password_hash') and bcrypt.check_password_hash(user['password_hash'], password):
        # Update last login time
        users_data = load_users()
        for u in users_data['users']:
            if u['email'] == email:
                u['last_login'] = datetime.utcnow().isoformat()
                break
        save_users(users_data)

        access_token = create_access_token(identity=email)
        refresh_token = create_refresh_token(identity=email)
        return jsonify(access_token=access_token, refresh_token=refresh_token), 200
    else:
        return jsonify({"message": "Invalid email or password"}), 401

@app.route('/api/refresh', methods=['POST'])
@jwt_required(refresh=True)
@limiter.limit("100 per hour")
def refresh():
    current_user = get_jwt_identity()
    access_token = create_access_token(identity=current_user)
    return jsonify(access_token=access_token), 200

# --- Payment & Access Flow ---

@app.route('/api/prepare-payment', methods=['POST', 'OPTIONS'])
@limiter.limit("10 per hour; 3 per minute")
def prepare_payment():
    # Handle OPTIONS preflight request (Flask-CORS should also do this, but being explicit)
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    # Check if user already exists
    if find_user_by_email(email):
        # Important: Prevent creating duplicate users if they try to pay again
        # Option 1: Let them login via "Restore Access"
        return jsonify({"message": "Email already registered. Please use 'Restore Access' to login."}), 409
        # Option 2: Allow payment again but just update access (handled by webhook anyway) - Simpler?
        # For now, let's stick to Option 1 to avoid confusion.

    # Hash password and create the user record (inactive until payment)
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = {
        "email": email,
        "password_hash": hashed_password,
        "access": False, # Access granted upon successful payment verification via webhook
        "created_at": datetime.utcnow().isoformat(),
        "last_login": None
    }
    users_data = load_users()
    users_data['users'].append(new_user)
    save_users(users_data)
    print(f"User {email} pre-registered pending payment.")

    # Now create the Stripe Payment Intent
    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=3000,  # $30.00
            currency='usd',
            metadata={'user_email': email} # Crucial for webhook
        )
        print(f"Payment intent {payment_intent.id} created for {email}")
        return jsonify({
            'clientSecret': payment_intent.client_secret
        })
    except Exception as e:
        # If payment intent fails, we should ideally roll back user creation
        # or handle this state more robustly. For simplicity, just log error.
        print(f"Error creating payment intent for {email}: {str(e)}")
        # Attempt to remove the pre-registered user on error
        try:
            users_data_rollback = load_users()
            users_data_rollback['users'] = [u for u in users_data_rollback['users'] if u['email'] != email]
            save_users(users_data_rollback)
            print(f"Rolled back user creation for {email} due to Stripe error.")
        except Exception as rb_e:
             print(f"Error rolling back user creation for {email}: {rb_e}")
        
        return jsonify({
            'error': f"Could not initiate payment: {str(e)}"
        }), 500

@app.route('/api/verify-access', methods=['POST'])
@jwt_required()
def verify_access():
    # This endpoint now verifies the JWT token is valid and the user has access
    current_user_email = get_jwt_identity()
    print(f"VERIFY_ACCESS: Checking access for JWT identity: {current_user_email}") # Log identity
    user = find_user_by_email(current_user_email)

    if user:
        user_access = user.get('access', False)
        print(f"VERIFY_ACCESS: User '{current_user_email}' found. Access status from users.json: {user_access}") # Log user found and access status
        if user_access:
            print(f"VERIFY_ACCESS: Returning hasAccess: True for {current_user_email}")
            return jsonify({"hasAccess": True})
        else:
            print(f"VERIFY_ACCESS: Returning hasAccess: False for {current_user_email} (access flag is false)")
            return jsonify({"hasAccess": False})
    else:
        # User might be authenticated (valid JWT) but somehow not in users.json (shouldn't happen ideally)
        print(f"VERIFY_ACCESS: ERROR - User '{current_user_email}' with valid JWT not found in users.json. Returning hasAccess: False")
        return jsonify({"hasAccess": False})

# --- Other API Routes ---

# Health check endpoint for Render
@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy"})

# Routes
@app.route('/api/preview-data')
@jwt_required(optional=True)  # Moved decorator here, allows request even without JWT
def get_preview_data():
    has_access = False
    jwt_identity = None
    try:
        # Check for a valid JWT and get the identity
        jwt_identity = get_jwt_identity()
        if jwt_identity:
            user = find_user_by_email(jwt_identity)
            if user and user.get('access', False):
                has_access = True
                print(f"PREVIEW_DATA: Access TRUE for user {jwt_identity}")
            else:
                print(f"PREVIEW_DATA: Access FALSE for user {jwt_identity}")
        else:
            print("PREVIEW_DATA: No JWT identity found, access FALSE")

    except Exception as e:
         # Handle potential errors during JWT processing if needed, default to no access
         print(f"PREVIEW_DATA: Error during JWT check: {e}, access FALSE")
         has_access = False

    # Determine which file to load
    if has_access:
        file_path = os.path.join(DATA_DIR, 'csv', 'SaaS_Niche_opportunities.csv')
        print("PREVIEW_DATA: Loading full data file.")
    else:
        # Load the smaller example/preview file if no access
        file_path = os.path.join(DATA_DIR, 'csv', 'SaaS_Niche_opportunities_Example.csv')
        print("PREVIEW_DATA: Loading preview (example) data file.")

    # Get the total count of ideas from the full SaaS_ideas.json file
    total_ideas_count = 0
    try:
        ideas_file_path = os.path.join(DATA_DIR, 'SaaS_ideas.json')
        if os.path.exists(ideas_file_path):
            with open(ideas_file_path, 'r') as ideas_file:
                ideas_data = json.load(ideas_file)
                total_ideas_count = len(ideas_data)
    except Exception as e:
        print(f"Error counting ideas from SaaS_ideas.json: {e}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            csv_reader = csv.DictReader(f)
            data = list(csv_reader)
            # Return both the data and the count
            return jsonify({
                "data": data,
                "totalIdeasCount": total_ideas_count
            })
    except FileNotFoundError:
        print(f"PREVIEW_DATA: Error - Data file not found at {file_path}")
        # Return empty list or specific error if preview file missing?
        # If the *main* file is missing, maybe a 500 is better.
        if not has_access and not os.path.exists(file_path):
            print("PREVIEW_DATA: Preview file missing, returning empty list.")
            return jsonify({"data": [], "totalIdeasCount": total_ideas_count}) # Return empty for missing preview
        else:
             return jsonify({"error": "Data file not found"}), 404
    except Exception as e:
        print(f"Error reading data from {file_path}: {e}")
        return jsonify({"error": "Could not read data"}), 500

@app.route('/api/saas-ideas')
@jwt_required() # Protect this endpoint
def get_saas_ideas():
    # Verify access based on JWT
    current_user_email = get_jwt_identity()
    user = find_user_by_email(current_user_email)

    if not user or not user.get('access', False):
        print(f"SAAS_IDEAS: Access denied for user {current_user_email}")
        return jsonify({"message": "Access required"}), 403 # Forbidden

    print(f"SAAS_IDEAS: Access granted for user {current_user_email}")
    file_path = os.path.join(DATA_DIR, 'SaaS_ideas.json')
    try:
        with open(file_path, 'r') as f:
            saas_ideas = json.load(f)
        return jsonify(saas_ideas)
    except FileNotFoundError:
        print(f"SAAS_IDEAS: Error - Ideas file not found at {file_path}")
        return jsonify({"error": "Ideas data file not found"}), 404
    except Exception as e:
        print(f"Error reading ideas data from {file_path}: {e}")
        return jsonify({"error": "Could not read ideas data"}), 500

# --- Password Reset ---
def send_password_reset_email(user_email, token):
    reset_url = f"{frontend_url}/reset-password?token={token}" # Adjust URL as needed
    msg = Message("Password Reset Request",
                  recipients=[user_email])
    msg.body = f"To reset your password, visit the following link: {reset_url}\n\nIf you did not make this request, simply ignore this email."
    try:
        mail.send(msg)
        print(f"Password reset email sent to {user_email}")
        return True
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        return False

@app.route('/api/forgot-password', methods=['POST'])
@limiter.limit("5 per hour") # Limit forgot password requests
def forgot_password():
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({"message": "Email is required"}), 400

    user = find_user_by_email(email)
    if not user:
        # Don't reveal if the user exists or not for security
        return jsonify({"message": "If an account with that email exists, a password reset link has been sent."}), 200

    # Generate reset token
    reset_token = secrets.token_hex(16)
    expiry_time = datetime.utcnow() + timedelta(hours=1) # Token valid for 1 hour

    # Store token and expiry in user data
    users_data = load_users()
    for u in users_data['users']:
        if u['email'] == email:
            u['reset_token'] = reset_token
            u['reset_token_expiry'] = expiry_time.isoformat()
            break
    save_users(users_data)

    # Send email
    if send_password_reset_email(email, reset_token):
        return jsonify({"message": "If an account with that email exists, a password reset link has been sent."}), 200
    else:
        return jsonify({"message": "Failed to send password reset email."}), 500

@app.route('/api/reset-password', methods=['POST'])
@limiter.limit("5 per hour") # Limit password reset submissions
def reset_password():
    data = request.json
    token = data.get('token')
    new_password = data.get('password')

    if not token or not new_password:
        return jsonify({"message": "Token and new password are required"}), 400

    users_data = load_users()
    user_found = None
    user_index = -1

    # Find user by token and check expiry
    for i, u in enumerate(users_data['users']):
        if u.get('reset_token') == token:
            expiry_str = u.get('reset_token_expiry')
            if expiry_str:
                try:
                    expiry_dt = datetime.fromisoformat(expiry_str)
                    if datetime.utcnow() < expiry_dt:
                        user_found = u
                        user_index = i
                        break
                    else:
                        return jsonify({"message": "Password reset token has expired."}), 400
                except ValueError:
                     return jsonify({"message": "Invalid token expiry format."}), 500
            break # Found token, exit loop

    if not user_found:
        return jsonify({"message": "Invalid or expired password reset token."}), 400

    # Update password
    hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    users_data['users'][user_index]['password_hash'] = hashed_password
    # Clear reset token fields
    users_data['users'][user_index].pop('reset_token', None)
    users_data['users'][user_index].pop('reset_token_expiry', None)

    save_users(users_data)

    return jsonify({"message": "Password has been reset successfully."}), 200

# --- Stripe Webhook ---
@app.route('/api/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

    if not endpoint_secret:
        print("Error: Stripe webhook secret not configured.")
        return jsonify(error="Webhook secret not configured"), 500

    event = None

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
        print(f"Received Stripe event: {event['type']}")
    except ValueError as e:
        # Invalid payload
        print(f"Webhook Error: Invalid payload: {e}")
        return jsonify(error=str(e)), 400
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        print(f"Webhook Error: Invalid signature: {e}")
        return jsonify(error=str(e)), 400

    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        user_email = payment_intent.get('metadata', {}).get('user_email')

        if user_email:
            print(f"Webhook: Attempting to grant access to user: {user_email}")
            users_data = load_users()
            user_updated = False
            user_found = False
            for user in users_data.get('users', []):
                if user.get('email') == user_email:
                    user_found = True
                    if not user.get('access'):
                        user['access'] = True
                        user_updated = True
                        print(f"Webhook: Access granted successfully to {user_email}")
                    else:
                        print(f"Webhook: User {user_email} already has access.")
                    break
            
            if user_updated:
                save_users(users_data)
            elif not user_found:
                 # This case should ideally not happen with the new flow
                 print(f"Webhook ERROR: User {user_email} NOT found in database for successful payment intent {payment_intent['id']}.")
        else:
            print(f"Webhook Error: user_email not found in PaymentIntent metadata for {payment_intent['id']}.")
    else:
        print(f"Webhook: Unhandled event type {event['type']}")

    return jsonify(success=True), 200

# Helper for CORS preflight responses (might be needed if explicitly handling OPTIONS)
def _build_cors_preflight_response():
    response = jsonify(success=True)
    # Allow the actual request method (POST)
    response.headers.add("Access-Control-Allow-Methods", "POST")
    # Allow necessary headers
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    # Allow credentials if needed (though likely not for preflight)
    # response.headers.add("Access-Control-Allow-Credentials", "true")
    return response

if __name__ == '__main__':
    app.run(debug=True)
