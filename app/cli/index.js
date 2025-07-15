import { Command } from "commander";
import { createInterface } from "readline";
import { getAppInfo, getFollowersCountFromNow } from "../api/steamdb.js";
import { getRedditMentionsByDay } from "../api/reddit.js";
import { generateChart } from "../utils/graph.js";
import { formatTimestampToDDMMYYYY } from "../utils/date.js";
import { setTimeout } from "node:timers/promises";

const program = new Command();

function createReadlineInterface() {
  return createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function promptForAppId() {
  return new Promise((resolve) => {
    const rl = createReadlineInterface();
    rl.question("Enter APP ID: ", (appId) => {
      rl.close();
      resolve(appId.trim());
    });
  });
}

async function runCLI() {
  try {
    console.log("SteamDB & Reddit Scraper\n");

    const appId = await promptForAppId();
    const isValidAppId = /^\d+$/.test(appId);

    if (!isValidAppId) {
      console.error("Invalid app ID format. Please enter a numeric ID");
      process.exit(1);
    }

    const daysFromNowIncludingTodayFollowers = 7; // Default to 7 days for followers count
    const daysFromNowIncludingTodayReddit = 7; // Default to 7 days for Reddit mentions

    console.log(`Fetching information for app ID: ${appId}...`);
    console.log(
      `Fetching followers data for the last ${daysFromNowIncludingTodayFollowers} days...`
    );
    console.log("Please wait...\n");

    const appInfo = await getAppInfo(appId);

    await setTimeout(3000);

    const followersData = await getFollowersCountFromNow({
      id: appId,
      daysFromNowIncludingToday: daysFromNowIncludingTodayFollowers,
    });

    console.log(
      `Fetching Reddit mentions for "${appInfo.name}" for the last ${daysFromNowIncludingTodayReddit} days...`
    );
    const redditMentions = await getRedditMentionsByDay({
      query: appInfo.name,
      daysFromNowIncludingToday: daysFromNowIncludingTodayReddit,
    });

    console.log("\nResults:\n");
    console.log(`Name: ${appInfo.name}`);

    const dateMap = new Map();

    followersData.forEach((item) => {
      const dateKey = formatTimestampToDDMMYYYY(item.timestampSeconds);
      dateMap.set(dateKey, {
        date: dateKey,
        followersCount:
          item.count !== null ? item.count.toLocaleString() : "N/A",
        redditMentions: "N/A",
      });
    });

    redditMentions.forEach((item) => {
      const dateKey = formatTimestampToDDMMYYYY(item.timestampSeconds);
      const existingEntry = dateMap.get(dateKey);
      if (existingEntry) {
        existingEntry.redditMentions =
          item.count > 0 ? item.count.toLocaleString() : "N/A";
      } else {
        dateMap.set(dateKey, {
          date: dateKey,
          followersCount: "N/A",
          redditMentions: item.count > 0 ? item.count.toLocaleString() : "N/A",
        });
      }
    });

    const mergedTableData = Array.from(dateMap.values())
      .map((item) => ({
        Date: item.date,
        "Followers Count": item.followersCount,
        "Reddit Mentions": item.redditMentions,
      }))
      .sort((a, b) => {
        // Sort by date (most recent first)
        const dateA = a.Date.split("/").reverse().join("-"); // Convert dd/mm/yyyy to yyyy-mm-dd
        const dateB = b.Date.split("/").reverse().join("-");
        return dateB.localeCompare(dateA);
      });

    console.log(
      `\nData Summary (Last ${Math.max(
        daysFromNowIncludingTodayFollowers,
        daysFromNowIncludingTodayReddit
      )} Days):`
    );
    console.table(mergedTableData);

    console.log("\nGenerating visualization chart...");
    try {
      const chartPath = await generateChart({
        followersData,
        redditData: redditMentions,
        gameName: appInfo.name,
      });
      console.log(`Chart saved to: ${chartPath}`);
    } catch (error) {
      console.error("Failed to generate chart:", error.message);
    }

    console.log("\nDone! Press any key to exit...");

    const rl = createReadlineInterface();
    rl.question("", () => {
      rl.close();
      process.exit(0);
    });
  } catch (error) {
    console.error("\nError:", error.message);
    console.log("\nPress any key to exit...");

    const rl = createReadlineInterface();
    rl.question("", () => {
      rl.close();
      process.exit(1);
    });
  }
}

program
  .name("steamdb-scraper")
  .description("CLI tool to scrape app information from SteamDB")
  .version("1.0.0")
  .action(runCLI);

export { program };
