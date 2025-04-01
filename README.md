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

## Deployment

This project is ready for deployment on Render:

1. Push your code to GitHub
2. Connect your repository to Render using the `render.yaml` Blueprint
3. Set up environment variables in the Render dashboard
4. Deploy both backend and frontend services

For detailed deployment instructions, see `doc/render_deployment.md`.

## API Rate Limits

- DataForSEO: 15,000 API operations per day in free tier
- Reddit API: 100 QPM per OAuth client ID
- OpenAI API: Varies by model and plan

## License

This project is licensed under the ISC License.
