import { connect } from "puppeteer-real-browser";

async function getScraper({ headless = false } = {}) {
  try {
    const response = await connect({
      args: ["--start-maximized"],
      turnstile: true,
      headless,
      customConfig: {},
      connectOption: {
        defaultViewport: null,
      },
      plugins: [],
    });

    process.on("SIGINT", async () => {
      await response.browser.close();
    });

    return {
      browser: response.browser,
      page: response.page,
    };
  } catch (error) {
    throw error;
  }
}

export { getScraper };
