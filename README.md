# SaaS Insight Engine

A data-driven platform that helps entrepreneurs identify profitable SaaS opportunities by analyzing market demand, competition levels, and revenue potential.

## Features

- 💡 **SaaS Opportunity Database**: Curated list of validated SaaS ideas
- 📊 **Market Metrics**: Monthly search volumes and competition analysis via DataForSEO
- 💰 **Revenue Estimates**: Projected monthly revenue potential
- 🔄 **Regular Updates**: Fresh opportunities added continuously from Reddit discussions

## Tech Stack

### Backend
- Python 3.11+
- Flask
- Stripe Payment Integration
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
3. Set up your environment variables in `.env`:
   ```
   # Backend .env
   OPENAI_API_KEY=your_openai_key
   REDDIT_CLIENT_ID=your_reddit_client_id
   REDDIT_CLIENT_SECRET=your_reddit_client_secret
   REDDIT_USER_AGENT=your_user_agent
   DATAFORSEO_USERNAME=your_dataforseo_username
   DATAFORSEO_PASSWORD=your_dataforseo_password
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

   # Frontend .env
   REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   REACT_APP_API_URL=your_api_url  # Optional, defaults to http://localhost:5000
   ```

## Local Development

See `doc/run_local_workflow.txt` for detailed setup and running instructions.

## Deployment on Render

This project is configured for immediate deployment on Render using its Blueprint feature:

### One-Click Deployment

1. Fork this repository to your GitHub account
2. Log in to [Render](https://render.com)
3. Click "New" and select "Blueprint"
4. Connect your GitHub account and select this repository
5. Render will automatically detect the `render.yaml` configuration
6. Fill in the required environment variables:
   - `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` for payments
   - `OPENAI_API_KEY` for AI processing
   - `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, and `REDDIT_USER_AGENT` for Reddit integration
   - `DATAFORSEO_USERNAME` and `DATAFORSEO_PASSWORD` for keyword metrics

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
3. Verify data folders are properly initialized
4. The backend will automatically copy initial data files to the persistent disk

### Monitoring and Maintenance

- Set up Render alerts for performance and uptime monitoring
- Regularly back up the persistent disk data
- Check API usage to stay within rate limits

For more detailed deployment information, see `doc/render_deployment.md`.

## API Rate Limits

- DataForSEO: 15,000 API operations per day in free tier
- Reddit API: 100 QPM per OAuth client ID
- OpenAI API: Varies by model and plan

## License

This project is licensed under the ISC License.
