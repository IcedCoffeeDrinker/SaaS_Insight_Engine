# SaaS Insight Engine

A data-driven platform that helps entrepreneurs identify profitable SaaS opportunities by analyzing market demand, competition levels, and revenue potential.

## Features

- 💡 **SaaS Opportunity Database**: Curated list of validated SaaS ideas
- 📊 **Market Metrics**: Monthly search volumes and competition analysis via DataForSEO
- 💰 **Revenue Estimates**: Projected monthly revenue potential
- 🔄 **Regular Updates**: Fresh opportunities added continuously from Reddit discussions
- 🔐 **Secure Authentication**: User registration/login with password hashing (bcrypt) and JWT.
- ✉️ **Password Reset**: Secure password recovery via email (using Flask-Mail).
- 💳 **Secure Payments**: Stripe integration with webhook verification to grant access.
- ⏳ **Rate Limiting**: Basic protection against brute-force attacks on auth endpoints.

## Tech Stack

### Backend
- Python 3.11+
- Flask
- Flask-Bcrypt (Password Hashing)
- Flask-JWT-Extended (Authentication Tokens)
- Flask-Mail (Password Reset Emails)
- Flask-Limiter (Rate Limiting)
- Stripe Payment Integration (with Webhooks)
- DataForSEO API (for keyword metrics)
- OpenAI API (for idea generation)
- Reddit API (for data collection)

### Frontend
- React 18
- Tailwind CSS
- Stripe.js

## Getting Started

1. Clone the repository
2. Follow setup instructions in `doc/run_local_workflow.txt`
3. Set up your environment variables in `.env` (copy from `.env.example`):
   ```
   # Backend .env
   FLASK_APP=app.py
   FLASK_ENV=development

   # --- API Keys ---
   OPENAI_API_KEY=your_openai_key
   REDDIT_CLIENT_ID=your_reddit_client_id
   REDDIT_CLIENT_SECRET=your_reddit_client_secret
   REDDIT_USER_AGENT=your_user_agent
   DATAFORSEO_USERNAME=your_dataforseo_username
   DATAFORSEO_PASSWORD=your_dataforseo_password

   # --- Stripe ---
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key # Also needed in frontend/.env
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_signing_secret # Get from Stripe Dashboard

   # --- Authentication & Security ---
   JWT_SECRET_KEY=your_secure_random_32_byte_hex_key # Generate with: openssl rand -hex 32

   # --- Email (for Password Reset - e.g., Gmail) ---
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USE_TLS=True
   MAIL_USERNAME=your_email@gmail.com
   MAIL_PASSWORD=your_gmail_app_password # Use an App Password if 2FA is enabled
   MAIL_DEFAULT_SENDER=your_email@gmail.com

   # Frontend .env (in frontend/ folder)
   REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   REACT_APP_API_URL=your_api_url  # Optional for local, defaults to http://localhost:5000
   ```

## Local Development

See `doc/run_local_workflow.txt` for detailed setup and running instructions. Ensure your `.env` file is populated with the necessary keys, including the new ones for JWT, Mail, and Stripe Webhook.

## Deployment on Render

This project is configured for immediate deployment on Render using its Blueprint feature:

### One-Click Deployment

1. Fork this repository to your GitHub account
2. Log in to [Render](https://render.com)
3. Click "New" and select "Blueprint"
4. Connect your GitHub account and select this repository
5. Render will automatically detect the `render.yaml` configuration
6. Fill in the required environment variables (`sync: false` in `render.yaml`):
   - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
   - OpenAI: `OPENAI_API_KEY`
   - Reddit: `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT`
   - DataForSEO: `DATAFORSEO_USERNAME`, `DATAFORSEO_PASSWORD`
   - Auth: `JWT_SECRET_KEY`
   - Mail: `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USE_TLS`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_DEFAULT_SENDER`

### Deployment Architecture

The `render.yaml` file configures two services:

1. **Backend** (`saas-insight-engine-backend`):
   - Python Flask API
   - Persistent disk (1GB) for data storage
   - Starter plan for always-on availability

2. **Frontend** (`saas-insight-engine-frontend`):
   - Static site hosting
   - Built with React and Tailwind
   - Optimized for performance

### First-Time Setup After Deployment

After the first deployment:

1. Access the backend service in Render dashboard
2. Enter the shell environment
3. Verify data folders (e.g., `/data`) are properly initialized. The backend automatically copies initial data files to the persistent disk if they don't exist.
4. **Configure Stripe Webhook**: Go to your Stripe Dashboard -> Developers -> Webhooks. Add an endpoint pointing to `YOUR_BACKEND_URL/api/webhook` (e.g., `https://saas-insight-engine-backend.onrender.com/api/webhook`). Select the event `payment_intent.succeeded`. Copy the generated Webhook Signing Secret and add it as the `STRIPE_WEBHOOK_SECRET` environment variable in Render.

### Monitoring and Maintenance

- Set up Render alerts for performance and uptime monitoring
- Regularly back up the persistent disk data
- Check API usage to stay within rate limits

For more detailed deployment information, see `doc/render_deployment.md`.

## Security

- **Authentication**: Uses Flask-JWT-Extended for stateless API authentication.
- **Password Hashing**: Uses Flask-Bcrypt to securely hash user passwords.
- **Payment Verification**: Uses Stripe webhooks with signature verification to confirm payments server-side.
- **Rate Limiting**: Implemented on sensitive endpoints using Flask-Limiter to mitigate brute-force attacks.
- **CSRF Protection**: Not explicitly added yet, but JWT helps mitigate some CSRF vectors if used correctly (e.g., not storing tokens in cookies accessible by JS).
- **HTTPS**: Render automatically provides HTTPS.

## API Rate Limits

- DataForSEO: 15,000 API operations per day in free tier
- Reddit API: 100 QPM per OAuth client ID
- OpenAI API: Varies by model and plan

## License

This project is licensed under the ISC License.
