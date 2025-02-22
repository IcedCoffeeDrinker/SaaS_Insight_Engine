# Concept #1

A website that provides a regularly self-updating csv-file that lists

1. SaaS niche
2. Monthly keyword searches 
3. Evaluation of competition
4. Approximated revenue

something like this: https://nichetools.net

# Concept #2

A website that analyzes Reddit posts and identifies pain-points and requests for products. A pipeline format is used to provide the user with the most recent trends sourced from a selection of subreddits. Each pipeline module provides a csv file that can be filtered for keywords, relevance, and newness.

Borrowing from [bigideasdb.com](https://bigideasdb.com) the structure might look something like:

1. AI identifies pain points in discussions
2. AI analyzes user frustrations
3. AI spots market gaps
4. AI generates SaaS solutions

# Merging both concepts

Through scraping both old and new Reddit posts, a larger database of pain-points should accumulate. This set of SaaS products can be used for Concept #1 with the stream of newest topics at the top. Concept #2 would cater to customers that have a desire for going more in-depth while Concept #1 would work as a hook for lazy customers, providing them with a constant stream of new SaaS ideas. 

# How this will be built

## Stack

- Frontend: React
- Backend: Flask (Python3)

## APIs

- Reddit API (Free tier)
    - limitations: 100 QPM per OAuth client id
- Painpoint identification: OpenAI GPT-4 Mini
- Identifying SaaS opportunities: OpenAI GPT-4 (Mini for MVP)
- Keyword frequency analytics: Google Ads API
    - 15,000 API operations per day in free tier

[source](https://openai.com/api/pricing/)