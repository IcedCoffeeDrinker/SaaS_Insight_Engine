import os
from dotenv import load_dotenv
import praw
import time
from openai import OpenAI
import threading
import json
import google_ads_metrics

# Load environment variables from .env file
load_dotenv()

# Settings
COMMENTS_PER_OPENAI_REQUEST = 10
MIN_WORD_COUNT = 20
COMMENT_COOLDOWN = 30  # minimum seconds between fetching comments (per individual subreddit)
BATCH_SIZE_FOR_KEYWORD_ANALYSIS = 250  # number of ideas to generate metrics for at once (max 300)

# Initialize OpenAI API
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
client = OpenAI(api_key=OPENAI_API_KEY)

# Initialize Reddit API
REDDIT_CLIENT_ID = os.getenv('REDDIT_CLIENT_ID')
REDDIT_CLIENT_SECRET = os.getenv('REDDIT_CLIENT_SECRET')
REDDIT_USER_AGENT = os.getenv('REDDIT_USER_AGENT')

reddit = praw.Reddit(
    client_id=REDDIT_CLIENT_ID,
    client_secret=REDDIT_CLIENT_SECRET,
    user_agent=REDDIT_USER_AGENT
)

# List of subreddits to monitor
SUBREDDITS = ['SaaS', 'startups', 'Entrepreneur', 'technology', 'marketing', 'Productivity', 'techsupport']

# Global variables
comments = ''
comment_counter = 0
generation_cooldown = False
pending_ideas_for_keyword_analysis = []  # Store ideas awaiting keyword analysis
processing_lock = threading.Lock()  # Lock for thread synchronization
subreddit_cooldowns = {subreddit: 0 for subreddit in SUBREDDITS}  # Track last comment time per subreddit

def process_comment(comment):
    """Process a new Reddit comment and add it to the collection if it meets criteria."""
    global comments, comment_counter, generation_cooldown, subreddit_cooldowns
    
    # Check if the comment contains bot disclaimer - skip if it does
    if "i am a bot" in comment.body.lower():
        print(f"Ignored bot comment in r/{comment.subreddit}\n\n")
        return
    
    # Check if we need to respect the cooldown for this subreddit
    subreddit_name = str(comment.subreddit)
    current_time = time.time()
    with processing_lock:
        if current_time - subreddit_cooldowns.get(subreddit_name, 0) < COMMENT_COOLDOWN:
            # Skip this comment if we're still in cooldown period for this subreddit
            return
        
        # Update the cooldown timestamp for this subreddit
        subreddit_cooldowns[subreddit_name] = current_time
    
    comment_body = comment.body.strip()
    
    # Check if the comment meets the minimum word count
    if len(comment_body.split()) >= MIN_WORD_COUNT:
        # Wait if we're in generation cooldown
        while generation_cooldown:
            time.sleep(2)
        
        # Lock to prevent race conditions when modifying shared variables
        with processing_lock:
            # Don't proceed if another thread has triggered generation
            if generation_cooldown:
                return
                
            comments += comment_body + '\n\n'
            comment_counter += 1
            
            print(f"{comment_counter}# comment in r/{subreddit_name}:\n\n{comment_body}\n\n\n")
            
            if comment_counter >= COMMENTS_PER_OPENAI_REQUEST:
                comment_counter = 0
                # Set cooldown before releasing lock to prevent other threads from entering
                generation_cooldown = True
        
        # Only one thread will get here when the counter reaches the threshold
        if generation_cooldown:
            try:
                get_SaaS_ideas(comments)
            finally:
                # Reset state after generation
                with processing_lock:
                    generation_cooldown = False
                    comments = ''  # Clear the comments after processing
    else:
        print(f"Ignored comment in r/{subreddit_name} due to insufficient length.\n\n")

def fetch_new_comments():
    """Continuously fetch new comments from monitored subreddits."""
    print("Fetching new comments...\n\n")
    
    def monitor_subreddit(subreddit):
        """Monitor a specific subreddit for new comments."""
        subreddit_instance = reddit.subreddit(subreddit)
        print(f'Now monitoring {subreddit}')
        try:
            for comment in subreddit_instance.stream.comments(skip_existing=True):
                # Process directly instead of creating a new thread for each comment
                # This prevents thread explosion
                process_comment(comment)
        except Exception as e:
            print(f"Error fetching comments from r/{subreddit}: {e}")
            time.sleep(5)  # Wait before retrying to avoid rapid failure

    # Create a thread for each subreddit
    threads = []
    for subreddit in SUBREDDITS:
        thread = threading.Thread(target=monitor_subreddit, args=(subreddit,))
        thread.daemon = True  # Make threads daemon so they exit when main thread exits
        thread.start()
        threads.append(thread)
    
    # Keep the main thread alive
    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        print("Stopping comment monitoring...")

def add_keyword_stats(new_ideas):
    """
    Add keyword statistics to each idea.
    
    Parameters:
        new_ideas: List of SaaS idea dictionaries
        
    Returns:
        Updated list with metrics added to each idea
    """
    global pending_ideas_for_keyword_analysis
    
    # Process the keywords format (convert string to list if needed)
    for idea in new_ideas:
        if 'keywords' in idea and isinstance(idea['keywords'], str):
            # Convert comma-separated string to list
            keywords_str = idea['keywords']
            # Split by comma and strip whitespace
            keywords_list = [keyword.strip() for keyword in keywords_str.split(',')]
            # Update the idea with the list of keywords
            idea['keywords'] = keywords_list
        
        # Initialize metrics as None
        idea['avg_monthly_searches'] = None
        idea['competition_level'] = None
        idea['revenue'] = None
    
    # Add to pending ideas list
    pending_ideas_for_keyword_analysis.extend(new_ideas)
    
    # Process in batches when we reach the threshold
    if len(pending_ideas_for_keyword_analysis) >= BATCH_SIZE_FOR_KEYWORD_ANALYSIS:
        process_keyword_batch()
    
    return new_ideas

def process_keyword_batch():
    """
    Process a batch of ideas for keyword analysis.
    Gets metrics for all keywords and updates the ideas in the file.
    """
    global pending_ideas_for_keyword_analysis
    
    if not pending_ideas_for_keyword_analysis:
        return
        
    print(f"Processing keyword metrics for {len(pending_ideas_for_keyword_analysis)} ideas...")
    
    # Extract all keywords from pending ideas - don't remove duplicates
    all_keywords = []
    for idea in pending_ideas_for_keyword_analysis:
        all_keywords.extend(idea.get('keywords', []))
    
    # Get metrics for all keywords at once
    try:
        keyword_metrics = google_ads_metrics.get_google_metrics(all_keywords)
        
        # Update each idea by averaging metrics across all its keywords
        for idea in pending_ideas_for_keyword_analysis:
            if 'keywords' in idea and idea['keywords']:
                # Track metrics across all keywords for this idea
                search_volumes = []
                competition_levels_numeric = []
                revenues = []
                
                # Collect metrics for each keyword
                for keyword in idea['keywords']:
                    if keyword in keyword_metrics:
                        metrics = keyword_metrics[keyword]
                        search_volumes.append(metrics[0])  # avg_monthly_searches
                        
                        # Convert competition level to numeric for averaging
                        comp_level = metrics[1]
                        if comp_level == "Very Low":
                            competition_levels_numeric.append(10)
                        elif comp_level == "Low":
                            competition_levels_numeric.append(30)
                        elif comp_level == "Moderate":
                            competition_levels_numeric.append(50)
                        elif comp_level == "High":
                            competition_levels_numeric.append(70)
                        elif comp_level == "Very High":
                            competition_levels_numeric.append(90)
                        else:  # N/A or other
                            competition_levels_numeric.append(0)
                            
                        revenues.append(metrics[2])  # revenue
                
                # Calculate averages if we have data
                if search_volumes:
                    idea['avg_monthly_searches'] = sum(search_volumes) # don't average, just sum
                    
                    # Convert average competition index back to string level
                    if competition_levels_numeric:
                        avg_comp_index = sum(competition_levels_numeric) / len(competition_levels_numeric)
                        idea['competition_level'] = google_ads_metrics.map_competition(avg_comp_index)
                    
                    if revenues:
                        idea['revenue'] = int(sum(revenues) / len(revenues))
        
        # Update the ideas in the file
        update_ideas_file(pending_ideas_for_keyword_analysis)
        
        # Clear the pending list
        pending_ideas_for_keyword_analysis = []
        print("Keyword metrics processing complete.")
    except Exception as e:
        print(f"Error processing keyword metrics: {e}")

def get_SaaS_ideas(comments):
    """Generate SaaS ideas from collected comments."""
    print("Generating SaaS ideas from comments...")
    new_ideas = add_keyword_stats(gpt_request(comments))
    append_to_ideas_file(new_ideas)
    print("New ideas created and appended to file\n\n")

def gpt_request(comments):
    """
    Send comments to OpenAI API to generate SaaS ideas.
    
    Parameters:
        comments: String containing collected Reddit comments
        
    Returns:
        List of SaaS idea dictionaries
    """
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": """You are an AI specialized in generating thoughtful 
            and creative SaaS product ideas based on provided reddit posts. When you receive a set 
            of reddit posts, analyze the feedback, challenges, and ideas presented, and generate a 
            JSON array of product ideas. Each product idea must be an object with exactly three keys: 
            'product_title', 'description', and 'keywords'.\n\n- 'product_title': A concise, descriptive title for 
            a SaaS product that addresses a specific need or insight from the reddit posts.\n- 'description': 
            A brief yet detailed explanation of the product, outlining its purpose, target audience, and 
            how it solves the identified problem.\n- 'keywords': A list of three broad keywords that cover what the target 
            audience would search for.\n\nEnsure that your output is strictly valid JSON with 
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
        return []  # Return empty list instead of recursive call to avoid potential infinite recursion

def append_to_ideas_file(new_ideas):
    """
    Append new ideas to the SaaS_ideas.json file.
    
    Parameters:
        new_ideas: List of new SaaS idea dictionaries to append
    """
    if not new_ideas:
        print("No new ideas to append.")
        return
        
    # Determine the project root directory
    # If running from backend directory, go up one level
    if os.path.basename(os.getcwd()) == 'backend':
        base_dir = os.path.dirname(os.getcwd())  # Go up one level
    else:
        base_dir = os.getcwd()  # Assume we're already at the root
        
    file_path = os.path.join(base_dir, 'data', 'SaaS_ideas.json')
    
    try:
        # Create directories if they don't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Load existing ideas if file exists
        existing_ideas = []
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r') as f:
                    content = f.read().strip()
                    if content:  # Only parse if file is not empty
                        existing_ideas = json.loads(content)
                    else:
                        existing_ideas = []
            except json.JSONDecodeError:
                print(f"Error reading {file_path}. Starting with empty list.")
        
        # Combine existing and new ideas
        all_ideas = existing_ideas + new_ideas
        
        # Save all ideas back to file
        with open(file_path, 'w') as f:
            json.dump(all_ideas, f, indent=2)
        
        print(f"Added {len(new_ideas)} new ideas. Ideas pending for keyword metrics: {len(pending_ideas_for_keyword_analysis)}. Total: {len(all_ideas)}")
        print(f"File saved to: {file_path}")
    except Exception as e:
        print(f"Error saving to {file_path}: {e}")

def update_ideas_file(updated_ideas):
    """
    Update existing ideas in the SaaS_ideas.json file with new metrics.
    
    Parameters:
        updated_ideas: List of idea dictionaries with updated metrics
    """
    if not updated_ideas:
        return
    
    # Determine the project root directory
    # If running from backend directory, go up one level
    if os.path.basename(os.getcwd()) == 'backend':
        base_dir = os.path.dirname(os.getcwd())  # Go up one level
    else:
        base_dir = os.getcwd()  # Assume we're already at the root
        
    file_path = os.path.join(base_dir, 'data', 'SaaS_ideas.json')
    
    try:
        # Load existing ideas
        all_ideas = []
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r') as f:
                    content = f.read().strip()
                    if content:  # Only parse if file is not empty
                        all_ideas = json.loads(content)
                    else:
                        all_ideas = []
            except json.JSONDecodeError:
                print(f"Error reading {file_path}.")
                return
        
        # Create a dictionary for quick lookup of updated ideas by title
        updated_ideas_dict = {idea['product_title']: idea for idea in updated_ideas if 'product_title' in idea}
        
        # Update each idea with new metrics if available
        for idea in all_ideas:
            if 'product_title' in idea and idea['product_title'] in updated_ideas_dict:
                updated_idea = updated_ideas_dict[idea['product_title']]
                idea['avg_monthly_searches'] = updated_idea.get('avg_monthly_searches', idea.get('avg_monthly_searches'))
                idea['competition_level'] = updated_idea.get('competition_level', idea.get('competition_level'))
                idea['revenue'] = updated_idea.get('revenue', idea.get('revenue'))
        
        # Save updated ideas back to file
        with open(file_path, 'w') as f:
            json.dump(all_ideas, f, indent=2)
        
        print(f"Updated metrics for {len(updated_ideas)} ideas.")
        print(f"File updated at: {file_path}")
    except Exception as e:
        print(f"Error updating {file_path}: {e}")

def run_pipeline():
    """Run the complete Reddit pipeline."""
    fetch_new_comments()

if __name__ == "__main__":
    run_pipeline()



