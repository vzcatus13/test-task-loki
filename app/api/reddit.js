import { clear } from "node:console";
import { setTimeout } from "node:timers/promises";

export async function getRedditMentionsByDay({
  query,
  daysFromNowIncludingToday = 7,
} = {}) {
  console.log(
    `[getRedditMentionsByDay] Starting aggregation for query: "${query}" (${daysFromNowIncludingToday} days)`
  );

  const now = new Date();
  const todayUTC = new Date(now);
  todayUTC.setUTCHours(0, 0, 0, 0);

  const startDateUTC = new Date(todayUTC);
  startDateUTC.setUTCDate(
    startDateUTC.getUTCDate() - (daysFromNowIncludingToday - 1)
  );

  const endTimestamp = Math.floor(todayUTC.getTime() / 1000) + 24 * 60 * 60; // End of today
  const startTimestamp = Math.floor(startDateUTC.getTime() / 1000); // Start of first day

  console.log(
    `[getRedditMentionsByDay] Date range: ${startDateUTC.toISOString()} to ${todayUTC.toISOString()}`
  );

  const dailyAggregation = {};
  for (let i = 0; i < daysFromNowIncludingToday; i++) {
    const dateKey = (startTimestamp + i * 24 * 60 * 60).toString();
    dailyAggregation[dateKey] = 0;
  }

  let timeElapsedFromStart = 0;

  const intervalId = setInterval(() => {
    timeElapsedFromStart += 5000;
    console.log(
      `[getRedditMentionsByDay] Running for ${
        timeElapsedFromStart / 1000
      } seconds`
    );
  }, 5000);

  await fetchRedditPostsRecursive({
    query,
    after: null,
    startTimestamp,
    endTimestamp,
    dailyAggregation,
  }).finally(() => {
    clearInterval(intervalId);
  });

  const result = Object.entries(dailyAggregation).map(
    ([timestampSeconds, count]) => ({
      timestampSeconds,
      count,
    })
  );

  result.sort((a, b) => b.timestampSeconds - a.timestampSeconds);

  return result;
}

async function fetchRedditPostsRecursive({
  query,
  after,
  startTimestamp,
  endTimestamp,
  dailyAggregation,
}) {
  // Add delay to avoid rate-limiting
  await setTimeout(1000);

  try {
    const encodedQuery = encodeURIComponent(query);
    let url = `https://www.reddit.com/search.json?q=${encodedQuery}&limit=100&sort=new`;

    if (after) {
      url += `&after=${after}`;
    }

    // Use fetch with User-Agent header
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Node.js Reddit Scraper 1.0.0 (Game Mention Aggregator: test-task/loki@github.com)",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(
        `[fetchRedditPostsRecursive] HTTP ${response.status}: ${response.statusText}`
      );
    }

    const jsonData = await response.json();

    if (!jsonData.data || !jsonData.data.children) {
      return;
    }

    const posts = jsonData.data.children;
    let shouldContinue = false;
    let processedCount = 0;

    for (const post of posts) {
      if (post.kind === "t3" && post.data) {
        const postTimestamp = post.data.created_utc;

        if (postTimestamp >= startTimestamp && postTimestamp < endTimestamp) {
          const date = new Date(postTimestamp * 1000);
          date.setUTCHours(0, 0, 0, 0);
          const dateKey = Math.floor(date.getTime() / 1000).toString();

          if (dailyAggregation.hasOwnProperty(dateKey)) {
            dailyAggregation[dateKey]++;
            processedCount++;
          }

          shouldContinue = true;
        } else if (postTimestamp < startTimestamp) {
          console.log(
            `[fetchRedditPostsRecursive] Reached posts older than date range, stopping`
          );
          shouldContinue = false;
          break;
        }
      }
    }

    if (shouldContinue && jsonData.data.after) {
      await fetchRedditPostsRecursive({
        query,
        after: jsonData.data.after, // Use the after cursor for pagination
        startTimestamp,
        endTimestamp,
        dailyAggregation,
      });
    }
  } catch (error) {
    console.error(
      `[fetchRedditPostsRecursive] Error fetching Reddit data:`,
      error.message
    );
    throw error;
  }
}
