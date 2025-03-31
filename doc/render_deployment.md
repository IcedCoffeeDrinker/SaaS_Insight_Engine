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

After your services are created, you'll need to add your secret environment variables:

#### For the backend service (saas-insight-api):

Go to the service settings and add these environment variables:

- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `REDDIT_CLIENT_ID` - Your Reddit API client ID
- `REDDIT_CLIENT_SECRET` - Your Reddit API client secret
- `REDDIT_USER_AGENT` - Your Reddit API user agent
- `OPENAI_API_KEY` - Your OpenAI API key
- `DATAFORSEO_USERNAME` - Your DataForSEO username
- `DATAFORSEO_PASSWORD` - Your DataForSEO password
- `FRONTEND_URL` - URL of your frontend service (e.g., https://saas-insight-frontend.onrender.com)

#### For the frontend service (saas-insight-frontend):

The frontend service should have these environment variables:

- `REACT_APP_API_URL` - URL of your backend service (e.g., https://saas-insight-api.onrender.com)
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key

### 3. Deploy Your Services

Render will automatically deploy your services based on the configuration in `render.yaml`. You can monitor the build progress in the Render dashboard.

### 4. Verify the Deployment

Once both services are deployed:

1. Visit your frontend URL (e.g., https://saas-insight-frontend.onrender.com)
2. Test the functionality to ensure everything is working correctly
3. Check the logs for any errors if you encounter issues

## File Storage Considerations

Render's free tier doesn't include persistent storage between deployments. For production use, consider these options:

### Option 1: Using Render Disk

Upgrade to a paid plan to access persistent disk storage.

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