import os
from dotenv import load_dotenv
import praw
import time
from openai import OpenAI
import threading
import json

# settings
COMMENTS_PER_OPENAI_REQUEST = 10
MIN_WORD_COUNT = 20
COMMENT_COOLDOWN = 15 # minimum seconds between fetching comments (per individual subreddit)

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI API
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
client = OpenAI(
    api_key=OPENAI_API_KEY  # This is the default and can be omitted
)

# Access Reddit client ID and secret
REDDIT_CLIENT_ID = os.getenv('REDDIT_CLIENT_ID')
REDDIT_CLIENT_SECRET = os.getenv('REDDIT_CLIENT_SECRET')
REDDIT_USER_AGENT = os.getenv('REDDIT_USER_AGENT')

# Initialize PRAW with your credentials
reddit = praw.Reddit(
    client_id=REDDIT_CLIENT_ID,
    client_secret=REDDIT_CLIENT_SECRET,
    user_agent=REDDIT_USER_AGENT
)

# List of subreddits to monitor
subreddits = ['SaaS', 'startups', 'Entrepreneur', 'technology', 'marketing', 'Productivity', 'techsupport']

# Function to process a new comment
comments = ''
comment_counter = 0
generation_cooldown = False

def process_comment(comment):
    global comments, comment_counter, generation_cooldown
    comment_body = comment.body.strip()
    
    # Check if the comment meets the minimum word count
    if len(comment_body.split()) >= MIN_WORD_COUNT:
        while generation_cooldown:
            sleep(2)
        comments += comment_body + '\n\n'
        comment_counter += 1

        print(f"{comment_counter}# comment in r/{comment.subreddit}:\n\n{comment_body}\n\n\n")

        if comment_counter >= COMMENTS_PER_OPENAI_REQUEST:
            comment_counter = 0
            generation_cooldown = True
            get_SaaS_ideas(comments)
            generation_cooldown = False
    else:
        print(f"Ignored comment in r/{comment.subreddit} due to insufficient length.\n\n")

    time.sleep(COMMENT_COOLDOWN)  # avoid hitting rate limits (please)

# Function to continuously fetch new comments
def fetch_new_comments():
    print("Fetching new comments...\n\n")
    
    def monitor_subreddit(subreddit):
        subreddit_instance = reddit.subreddit(subreddit)
        print(f'Now monitoring {subreddit}')
        try:
            for comment in subreddit_instance.stream.comments(skip_existing=True):
                threading.Thread(target=process_comment, args=(comment,)).start()
        except Exception as e:
            print(f"Error fetching comments from r/{subreddit}: {e}")
            time.sleep(5)  # Wait before retrying to avoid rapid failure

    # Create a thread for each subreddit
    threads = []
    for subreddit in subreddits:
        thread = threading.Thread(target=monitor_subreddit, args=(subreddit,))
        thread.start()
        threads.append(thread)

def get_SaaS_ideas(comments):
    new_ideas = gpt_request(comments)
    append_to_ideas_file(new_ideas)
    print("New ideas created and appended to file\n\n")

def gpt_request(comments):
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": """You are an AI specialized in generating thoughtful 
            and creative SaaS product ideas based on provided reddit posts. When you receive a set 
            of reddit posts, analyze the feedback, challenges, and ideas presented, and generate a 
            JSON array of product ideas. Each product idea must be an object with exactly two keys: 
            'product_title' and 'description'.\n\n- 'product_title': A concise, descriptive title for 
            a SaaS product that addresses a specific need or insight from the reddit posts.\n- 'description': 
            A brief yet detailed explanation of the product, outlining its purpose, target audience, and 
            how it solves the identified problem.\n\nEnsure that your output is strictly valid JSON with 
            no additional text, markdown formatting, or commentary. If you are unsure or cannot derive any 
            product ideas, output an empty JSON array (i.e., []).\n\nFocus on creativity and depth in your ideas, 
            closely aligning them with the themes and content of the provided reddit posts."""},
            {
                "role": "user",
                "content": comments
            }
        ]
    )
    
    response = completion.choices[0].message.content  
    try: 
        return json.loads(response)  # Assuming the response is valid JSON
    except:
        print(f'GPT provided an invalid json:\n{response}\n\n')
        get_SaaS_ideas(comments) # give GPT a new attempt


def append_to_ideas_file(new_ideas):
    # Load existing ideas from the file
    try:
        with open('../data/SaaS_ideas.json', 'r') as f:
            existing_ideas = json.load(f)
    except FileNotFoundError:
        existing_ideas = []  # If the file doesn't exist, start with an empty list

    # Append new ideas to the existing list
    existing_ideas.extend(new_ideas)

    # Save the updated list back to the file
    with open('../data/SaaS_ideas.json', 'w') as f: 
        json.dump(existing_ideas, f, indent=4)  # Save with pretty formatting

# Run the scraper
if __name__ == "__main__":
    try:
        fetch_new_comments()
    except KeyboardInterrupt:
        print("\nScraper stopped.")



