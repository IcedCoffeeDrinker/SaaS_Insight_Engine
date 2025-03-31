# SaaS Insight Engine

A data-driven platform that helps entrepreneurs identify profitable SaaS opportunities by analyzing market demand, competition levels, and revenue potential.

## Features

- 💡 **SaaS Opportunity Database**: Curated list of validated SaaS ideas
- 📊 **Market Metrics**: Monthly search volumes and competition analysis
- 💰 **Revenue Estimates**: Projected monthly revenue potential
- 🔄 **Regular Updates**: Fresh opportunities added continuously

## Tech Stack

### Backend
- Python 3.11+
- Flask
- Stripe Payment Integration

### Frontend
- React 18
- Tailwind CSS
- Stripe.js

## Getting Started

1. Clone the repository
2. Follow setup instructions in `doc/run_local_workflow.txt`
3. Set up your Stripe API keys in `.env` (also create a `.env` file under `frontend/` with the public key)

## Local Development

See `doc/run_local_workflow.txt` for detailed setup and running instructions.

## Deployment

This project is ready for deployment on Render:

1. Push your code to GitHub
2. Connect your repository to Render using the `render.yaml` Blueprint
3. Set up environment variables in the Render dashboard
4. Deploy both backend and frontend services

For detailed deployment instructions, see `doc/render_deployment.md`.

## License

This project is licensed under the ISC License.
