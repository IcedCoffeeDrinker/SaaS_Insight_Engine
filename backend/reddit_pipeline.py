import os
from dotenv import load_dotenv
import praw
import time

# Load environment variables from .env file
load_dotenv()

# Access Reddit client ID and secret
REDDIT_CLIENT_ID = os.getenv('REDDIT_CLIENT_ID')
REDDIT_CLIENT_SECRET = os.getenv('REDDIT_CLIENT_SECRET')

# Initialize PRAW with your credentials
reddit = praw.Reddit(
    client_id=REDDIT_CLIENT_ID,
    client_secret=REDDIT_CLIENT_SECRET,
    user_agent='I love iced coffee'
)

# List of subreddits to monitor
subreddits = ['SaaS', 'startups:', 'Entrepreneur', 'technology', 'marketing', 'Productivity', 'techsupport']

# Function to continuously fetch new comments
def fetch_new_comments():
    print("Fetching new comments...")
    for subreddit in subreddits:
        subreddit_instance = reddit.subreddit(subreddit)
        for comment in subreddit_instance.stream.comments(skip_existing=True):
            print(f"New comment in r/{subreddit}: {comment.body}")
            time.sleep(2)  # Sleep for 2 seconds between comments to avoid hitting rate limits

# Run the scraper
if __name__ == "__main__":
    try:
        fetch_new_comments()
    except KeyboardInterrupt:
        print("\nScraper stopped.")



