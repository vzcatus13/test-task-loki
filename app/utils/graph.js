import { Canvas } from "skia-canvas";
import { Chart, registerables } from "chart.js";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { dirname } from "path";
import { formatTimestampToDDMMYYYY } from "./date.js";

// Register Chart.js components
Chart.register(...registerables);

export async function generateChart({ followersData, redditData, gameName }) {
  console.log("[generateChart] Creating chart visualization...");

  const width = 1200;
  const height = 600;
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const chartData = prepareChartData(followersData, redditData);

  const configuration = {
    type: "bubble",
    data: {
      datasets: [
        {
          label: "Steam Followers vs Reddit Mentions",
          data: chartData,
          backgroundColor: "#1100ff60",
          borderColor: "#1100ff",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: false,
      animation: false,
      backgroundColor: "#ffffff",
      plugins: {
        title: {
          display: true,
          text: `${gameName} - Followers vs Reddit Mentions`,
          color: "#000000",
          font: {
            size: 18,
            weight: "bold",
          },
          padding: 20,
        },
        legend: {
          display: true,
          position: "top",
          labels: {
            color: "#000000",
          },
        },
      },
      scales: {
        x: {
          type: "category",
          title: {
            display: true,
            text: "Date (dd/mm/yyyy)",
            color: "#000000",
            font: {
              size: 14,
              weight: "bold",
            },
          },
          grid: {
            display: true,
            color: "rgba(0,0,0,0.1)",
          },
          ticks: {
            color: "#000000",
          },
        },
        y: {
          title: {
            display: true,
            text: "Steam Followers",
            color: "#000000",
            font: {
              size: 14,
              weight: "bold",
            },
          },
          grid: {
            display: true,
            color: "rgba(0,0,0,0.1)",
          },
          ticks: {
            color: "#000000",
            callback: function (value) {
              return typeof value === "number" ? value.toLocaleString() : "N/A";
            },
          },
        },
      },
      layout: {
        padding: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20,
        },
      },
    },
  };

  try {
    const chart = new Chart(ctx, configuration);

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomString}.png`;
    const outputPath = join(process.cwd(), "output", "graphs", filename);

    const buffer = await canvas.toBuffer("png");
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, buffer);

    chart.destroy();

    console.log(`[generateChart] Chart saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error("[generateChart] Error generating chart:", error);
    throw error;
  }
}

function prepareChartData(followersData, redditData) {
  const dataPoints = [];

  const map = new Map();
  redditData.forEach((item) => {
    const key = formatTimestampToDDMMYYYY(item.timestampSeconds);
    map.set(key, item.count);
  });

  followersData.forEach((item) => {
    const key = formatTimestampToDDMMYYYY(item.timestampSeconds);
    const redditCount = map.get(key) || 0;

    const followerCount = item.count !== null ? item.count : 0;
    const bubbleRadius = Math.max(redditCount * 0.5, 3);

    dataPoints.push({
      x: key, // Date as string in dd/mm/yyyy format
      y: followerCount, // Followers count (number or 0 for N/A)
      r: bubbleRadius, // Bubble radius based on mentions
    });
  });

  dataPoints.sort((a, b) => {
    return (
      new Date(a.x.split("/").reverse().join("/")).getTime() -
      new Date(b.x.split("/").reverse().join("/")).getTime()
    );
  });

  return dataPoints;
}
