# Steam Followers Change & Reddit Scraper CLI (test-task-loki)

A Node.js CLI tool (prototype as test-task, so no TS :sad:) to fetch (for free) Steam followers change and Reddit mentions for a Steam game, visualize the data, and output a summary table and chart.

## Features

- Scrapes SteamDB for daily followers count (last N days), public Steam Web API doesn't give data on followers change in time (only current)
- Aggregates Reddit mentions for the game (last N days)
- Merges and displays the data in a table
- Generates a bubble chart visualization (PNG)

## Getting Started

### 0. Go to app directory

```bash
cd app
```

### 1. Install dependencies

```bash
npm install
```

### 2. Start the app

```bash
npm start
```

### 3. Follow the prompts

- Enter the Steam APP ID when prompted (e.g., `367520` for Hollow Knight)
- The app will fetch data, display a summary table, and generate a chart

### 4. Output

- Data summary table in the terminal
- Chart image saved to `output/graphs/` (PNG file)

#### Example Output

```
> loki-test-task@1.0.0 start
> node index.js

SteamDB & Reddit Scraper

Enter APP ID: 367520
Fetching information for app ID: 367520...
Fetching followers data for the last 7 days...
Please wait...

[getAppInfo] Fetching app info for ID: 367520
[getFollowersCountFromNow] Fetching followers data for ID: 367520 (last 7 days)
Fetching Reddit mentions for "Hollow Knight" for the last 7 days...
[getRedditMentionsByDay] Starting aggregation for query: "Hollow Knight" (7 days)
[getRedditMentionsByDay] Date range: 2025-00-00T00:00:00.000Z to 2025-00-00T00:00:00.000Z
[getRedditMentionsByDay] Running for 5 seconds

Results:

Name: Hollow Knight

Data Summary (Last 7 Days):
┌─────────┬──────────────┬─────────────────┬─────────────────┐
│ (index) │ Date         │ Followers Count │ Reddit Mentions │
├─────────┼──────────────┼─────────────────┼─────────────────┤
│ 0       │ '00/00/2025' │ '000,000'       │ '000'           │
│ 1       │ '00/00/2025' │ '000,000'       │ '000'           │
│ 2       │ '00/00/2025' │ '000,000'       │ '000'           │
│ 3       │ '00/00/2025' │ '000,000'       │ '000'           │
│ 4       │ '00/00/2025' │ '000,000'       │ '000'           │
│ 5       │ '00/00/2025' │ '000,000'       │ 'N/A'           │
│ 6       │ '00/00/2025' │ '000,000'       │ 'N/A'           │
└─────────┴──────────────┴─────────────────┴─────────────────┘

Generating visualization chart...
[generateChart] Creating chart visualization...
[generateChart] Chart saved to: ~\loki\app\output\graphs\0000000000-cxo80p.png
Chart saved to: ~\loki\app\output\graphs\0000000000-cxo80p.png

Done! Press any key to exit...
```

## Configuration

To change how many days of data are fetched, edit these variables in `app/cli/index.js`:

- `daysFromNowIncludingTodayFollowers` (Steam followers)
- `daysFromNowIncludingTodayReddit` (Reddit mentions)

## Limitations

- **SteamDB scraping:** SteamDB actively discourages scraping and may block or limit access. Data may be incomplete or unavailable if scraping is detected.
- **Reddit search:** Reddit (official API) does not support direct search by date. The API uses cursor-based pagination, which is limited by Reddit itself (return only up to 250 posts for search and up to 1000 posts for subreddit) and may not return desired results for large queries or ranges.
- **Rate limits:** Both SteamDB and Reddit may rate-limit or block requests if used excessively.

## Requirements

- Node.js v18 or newer

## Possible Improvements

If this project is extended beyond a prototype:

- Use headless mode and paid captcha solvers
- Fetch current posts/followers to create your own (in self-owned DB) metrics of change over time
- Modularize and structure code for partial runs

<!-- #archive-bot:2026:private:* -->
