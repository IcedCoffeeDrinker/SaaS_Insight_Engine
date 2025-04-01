# Deploying to Render

This guide explains how to deploy the SaaS Insight Engine to Render's cloud platform.

## Prerequisites

1. A [Render account](https://render.com)
2. Your code pushed to a GitHub repository
3. API keys for required services (Stripe, OpenAI, etc.)
4. Starter plan subscription ($7/month per service)

## Deployment Process

The project includes a `render.yaml` file that defines both the backend and frontend services, making deployment straightforward using Render's Blueprint feature.

### 1. Connect Your Repository

1. Log in to your Render dashboard
2. Click the "New" button and select "Blueprint"
3. Connect your GitHub account if not already connected
4. Select the repository containing your SaaS Insight Engine code
5. Render will detect the `render.yaml` file and configure the services

### 2. Configure Environment Variables

The `render.yaml` file includes placeholders for all required environment variables. During the deployment process, Render will prompt you to provide values for the following variables marked with `sync: false`:

#### For the backend service (saas-insight-engine-backend):

- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret
- `REDDIT_CLIENT_ID` - Your Reddit API client ID
- `REDDIT_CLIENT_SECRET` - Your Reddit API client secret
- `REDDIT_USER_AGENT` - Your Reddit API user agent
- `OPENAI_API_KEY` - Your OpenAI API key
- `DATAFORSEO_USERNAME` - Your DataForSEO username
- `DATAFORSEO_PASSWORD` - Your DataForSEO password

#### For the frontend service (saas-insight-engine-frontend):

- `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `REACT_APP_API_URL` - Your backend service URL

### 3. Deploy Your Services

1. Select the "Starter" plan for both services
2. Render will automatically deploy your services based on the configuration in `render.yaml`
3. Monitor the build progress in the Render dashboard

### 4. Verify the Deployment

Once both services are deployed:

1. Visit your frontend URL (e.g., https://saas-insight-engine-frontend.onrender.com)
2. Test the functionality to ensure everything is working correctly
3. Check the logs for any errors if you encounter issues

## Production Considerations

### Starter Plan Benefits

The Starter plan ($7/month per service) provides:
- Always-on services (no sleep after inactivity)
- Increased CPU and memory resources
- Better performance for your users
- More reliable data processing

### Data Storage

With the Starter plan:
1. Create a persistent disk for the backend service to store:
   - User data
   - Generated SaaS ideas
   - CSV files
2. Configure automatic backups
3. Monitor disk usage

#### Important: SaaS Ideas Data

The `data/SaaS_ideas.json` file in the repository is a placeholder. For production:
1. Create a new `SaaS_ideas.json` file in the production environment
2. Initialize it with your initial dataset
3. The file will be automatically backed up with the persistent disk
4. New ideas will be added through the Reddit pipeline

### Monitoring and Maintenance

1. Set up logging and monitoring:
   - Enable Render's built-in logging
   - Monitor API rate limits
   - Track error rates and performance metrics

2. Regular maintenance tasks:
   - Update dependencies regularly
   - Monitor API usage and costs
   - Backup data regularly
   - Review and optimize performance

### Security Considerations

1. Enable HTTPS for all services
2. Set up proper CORS configuration
3. Implement rate limiting
4. Monitor for suspicious activity
5. Keep all dependencies updated

## Troubleshooting

### Common Issues

1. **CORS Errors**: If you see CORS errors, verify that your backend CORS configuration includes your frontend URL.

2. **Environment Variables**: Double-check all environment variables are correctly set in the Render dashboard.

3. **Build Errors**: 
   - Check build logs for specific errors
   - Ensure all dependencies are correctly specified in requirements.txt and package.json

4. **API Connection Issues**: Verify that your frontend is correctly configured to access the backend API URL.

### Getting Help

If you continue to have issues, refer to:

- Render's [documentation](https://render.com/docs)
- Project issues in the GitHub repository
- Render's support team 