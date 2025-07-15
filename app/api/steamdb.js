import { getScraper } from "../infrastructure/scraper.js";
import { setTimeout } from "node:timers/promises";

export async function getAppInfo(id) {
  const { page } = await getScraper();

  try {
    console.log(`[getAppInfo] Fetching app info for ID: ${id}`);

    const url = `https://steamdb.info/app/${id}`;
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await setTimeout(3000);

    let name = null;

    await page.waitForSelector('h1[itemprop="name"]', { timeout: 30000 });

    name = await page.$eval('h1[itemprop="name"]', (el) =>
      el.textContent.trim()
    );

    if (!name) {
      throw new Error(
        `[getAppInfo] Could not find app name on the page for ID: ${id}.`
      );
    }

    return {
      id: id.toString(),
      name: name,
    };
  } catch (error) {
    console.error(
      `[getAppInfo] Error fetching app info for ID: ${id}`,
      error.message
    );
    throw error;
  } finally {
    await page.close();
  }
}

export async function getFollowersCountFromNow({
  id,
  daysFromNowIncludingToday = 7,
} = {}) {
  const { page } = await getScraper();

  try {
    console.log(
      `[getFollowersCountFromNow] Fetching followers data for ID: ${id} (last ${daysFromNowIncludingToday} days)`
    );

    const url = `https://steamdb.info/api/GetGraphFollowers/?appid=${id}`;
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await setTimeout(2000);

    const jsonData = await page.evaluate(() => {
      try {
        return JSON.parse(document.body.textContent);
      } catch (error) {
        throw new Error(
          `[getFollowersCountFromNow] Failed to parse JSON response for ID: ${id}`
        );
      }
    });

    if (!jsonData.success) {
      throw new Error(
        `[getFollowersCountFromNow] API returned success: false for app ID: ${id}`
      );
    }

    if (!jsonData.data || !jsonData.data.values) {
      throw new Error(
        `[getFollowersCountFromNow] No followers data found for app ID: ${id}`
      );
    }

    const { start, step, values } = jsonData.data;

    const startTimestampSeconds = start;
    const stepSeconds = step;

    const dataPoints = values.map((count, index) => ({
      timestampSeconds: startTimestampSeconds + index * stepSeconds,
      count: count,
    }));

    const reversedData = dataPoints.reverse();

    let recentData = reversedData.slice(0, daysFromNowIncludingToday);

    const now = new Date();
    const nowSeconds = Math.floor(now.getTime() / 1000);
    const oneDayInSeconds = 24 * 60 * 60;

    const mostRecentTimestamp =
      recentData.length > 0 ? recentData[0].timestampSeconds : 0;
    const timeDiffFromToday = nowSeconds - mostRecentTimestamp;

    if (timeDiffFromToday > oneDayInSeconds) {
      const today = new Date(now);
      today.setUTCHours(0, 0, 0, 0);
      const todayTimestampSeconds = Math.floor(today.getTime() / 1000);

      recentData.unshift({
        timestampSeconds: todayTimestampSeconds,
        count: null,
      });

      recentData = recentData.slice(0, daysFromNowIncludingToday);
    }

    return recentData;
  } catch (error) {
    console.error(
      `[getFollowersCountFromNow] Error fetching followers data for ID ${id}:`,
      error.message
    );
    throw error;
  } finally {
    await page.close();
  }
}
