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

- **Stripe:**
  - `STRIPE_SECRET_KEY` - Your Stripe secret key
  - `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret (Get this after creating the webhook endpoint in Stripe Dashboard)
- **Reddit API:**
  - `REDDIT_CLIENT_ID` - Your Reddit API client ID
  - `REDDIT_CLIENT_SECRET` - Your Reddit API client secret
  - `REDDIT_USER_AGENT` - Your Reddit API user agent
- **OpenAI API:**
  - `OPENAI_API_KEY` - Your OpenAI API key
- **DataForSEO:**
  - `DATAFORSEO_USERNAME` - Your DataForSEO username
  - `DATAFORSEO_PASSWORD` - Your DataForSEO password
- **Authentication & Security:**
  - `JWT_SECRET_KEY` - Secure random string for signing JWTs (e.g., generate with `openssl rand -hex 32`)
- **Email (for Password Reset):**
  - `MAIL_SERVER` - e.g., `smtp.gmail.com`
  - `MAIL_PORT` - e.g., `587`
  - `MAIL_USE_TLS` - `True` or `False`
  - `MAIL_USERNAME` - Your email address
  - `MAIL_PASSWORD` - Your email password or App Password (recommended for Gmail with 2FA)
  - `MAIL_DEFAULT_SENDER` - The email address displayed as the sender

#### For the frontend service (saas-insight-engine-frontend):

- `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `REACT_APP_API_URL` - This should be automatically set by Render to your backend service URL (e.g., `https://saas-insight-engine-backend.onrender.com`)

### 3. Deploy Your Services

1. Select the "Starter" plan for both services
2. Render will automatically deploy your services based on the configuration in `render.yaml`
3. Monitor the build progress in the Render dashboard

### 4. Verify the Deployment

Once both services are deployed:

1. Visit your frontend URL (e.g., https://saas-insight-engine-frontend.onrender.com)
2. **Configure Stripe Webhook**: Go to your Stripe Dashboard -> Developers -> Webhooks. Add an endpoint pointing to `YOUR_BACKEND_URL/api/webhook` (e.g., `https://saas-insight-engine-backend.onrender.com/api/webhook`). Select the event `payment_intent.succeeded`. Copy the generated Webhook Signing Secret and add it as the `STRIPE_WEBHOOK_SECRET` environment variable in Render for the backend service.
3. Test user registration and login.
4. Test the payment process.
5. Verify that access is granted *after* the payment is successfully processed (check the data table or access-restricted features).
6. Test password reset functionality.
7. Check the logs for any errors if you encounter issues.

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

1. Enable HTTPS for all services (handled by Render)
2. Set up proper CORS configuration (handled in `app.py` and `render.yaml`)
3. Implement rate limiting (handled by Flask-Limiter in `app.py`)
4. Use strong secrets for `JWT_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
5. Use App Passwords for `MAIL_PASSWORD` if using Gmail with 2FA.
6. Monitor for suspicious activity (check logs).
7. Keep all dependencies updated.

## Troubleshooting

### Common Issues

1.  **CORS Errors**: Verify backend `FRONTEND_URL` and `ADDITIONAL_CORS_ORIGINS` env vars in Render match your frontend URL(s).
2.  **Environment Variables**: Double-check all required environment variables (`STRIPE_*`, `JWT_SECRET_KEY`, `MAIL_*`, etc.) are correctly set in the Render dashboard for the backend service, and `REACT_APP_STRIPE_PUBLISHABLE_KEY` for the frontend.
3.  **Build Errors**: Check build logs. Ensure `backend/requirements.txt` and `frontend/package.json` are correct.
4.  **API Connection Issues**: Ensure frontend `REACT_APP_API_URL` points to the correct backend URL.
5.  **Authentication Issues**: Check `JWT_SECRET_KEY` is set. Ensure frontend sends `Authorization: Bearer <token>` header. Check backend logs for JWT errors.
6.  **Payment Issues**: Verify Stripe keys (`_SECRET_KEY`, `_PUBLISHABLE_KEY`) are correct. Check Stripe dashboard logs. Ensure `STRIPE_WEBHOOK_SECRET` matches the one in Stripe dashboard and Render env vars. Ensure the webhook endpoint is correctly configured in Stripe and points to the live backend URL + `/api/webhook`.
7.  **Password Reset Email Issues**: Check `MAIL_*` environment variables. Ensure the email provider allows SMTP access. Check sender email's spam folder.

### Getting Help

If you continue to have issues, refer to:

- Render's [documentation](https://render.com/docs)
- Project issues in the GitHub repository
- Render's support team 