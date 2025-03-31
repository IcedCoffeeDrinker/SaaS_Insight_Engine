# Deploying to Render

This guide explains how to deploy the SaaS Insight Engine to Render's cloud platform.

## Prerequisites

1. A [Render account](https://render.com)
2. Your code pushed to a GitHub repository
3. API keys for required services (Stripe, OpenAI, etc.)

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

#### For the backend service (saas-insight-api):

- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `REDDIT_CLIENT_ID` - Your Reddit API client ID
- `REDDIT_CLIENT_SECRET` - Your Reddit API client secret
- `REDDIT_USER_AGENT` - Your Reddit API user agent
- `OPENAI_API_KEY` - Your OpenAI API key
- `DATAFORSEO_USERNAME` - Your DataForSEO username
- `DATAFORSEO_PASSWORD` - Your DataForSEO password

The `FRONTEND_URL` will be automatically set to your frontend service's URL.

#### For the frontend service (saas-insight-frontend):

- `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key

The `REACT_APP_API_URL` will be automatically set to your backend service's URL.

### 3. Deploy Your Services

Render will automatically deploy your services based on the configuration in `render.yaml`. You can monitor the build progress in the Render dashboard.

### 4. Verify the Deployment

Once both services are deployed:

1. Visit your frontend URL (e.g., https://saas-insight-frontend.onrender.com)
2. Test the functionality to ensure everything is working correctly
3. Check the logs for any errors if you encounter issues

## Plan Considerations

### Free Tier Limitations

The free tier of Render will work for:
- Initial deployment and testing
- Demonstration purposes
- Low traffic situations

However, be aware of these limitations:
1. **No persistent disk storage** - files written to disk (like your JSON data and user files) don't persist between deployments
2. **Limited compute resources** - may result in slower performance
3. **Sleep after inactivity** - your service will spin down after periods of inactivity (15 minutes)

### Recommendations for Production

For a production deployment, consider upgrading to:
- **Starter Plan ($7/month per service)**: Includes always-on services, more CPU/memory
- **Pro Plan ($15/month per service)**: Includes persistent disk storage and more resources

## File Storage Considerations

Render's free tier doesn't include persistent storage between deployments. For production use, consider these options:

### Option 1: Using Render Disk (Requires Pro Plan)

Upgrade to the Pro plan to access persistent disk storage.

### Option 2: Cloud Storage Integration

Modify the application to store data in a cloud storage service:

1. **For user data**: Store user information in a database like MongoDB Atlas
2. **For JSON files**: Store data in cloud storage (AWS S3, Google Cloud Storage)

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