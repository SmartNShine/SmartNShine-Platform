import puppeteer from "puppeteer";
import {existsSync} from "fs";
import path from "path";

const isRunningInDocker = () =>
  Boolean(process.env.RUNNING_IN_DOCKER) || existsSync("/.dockerenv");

const ensurePuppeteerCacheDir = () => {
  if (process.env.PUPPETEER_CACHE_DIR) return process.env.PUPPETEER_CACHE_DIR;

  // Keep Chromium inside the app tree so Azure zip deploys include it.
  const cacheDir = path.join(process.cwd(), ".cache", "puppeteer");
  process.env.PUPPETEER_CACHE_DIR = cacheDir;
  return cacheDir;
};

const normalizeClientBaseUrl = (baseUrl) => {
  const configuredUrl =
    process.env.PDF_RENDER_BASE_URL ||
    process.env.CLIENT_URL ||
    process.env.CLIENT_ORIGIN ||
    baseUrl ||
    "http://localhost:5173";
  const trimmedUrl = configuredUrl.replace(/\/$/, "");

  if (isRunningInDocker()) {
    return trimmedUrl.replace(
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i,
      "http://host.docker.internal$2"
    );
  }

  return trimmedUrl;
};

const getRemoteBrowserEndpoint = () =>
  process.env.BROWSER_WS_ENDPOINT ||
  (process.env.BROWSERLESS_TOKEN
    ? `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`
    : null);

const getSystemChromePath = () => {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  if (
    process.platform === "darwin" &&
    existsSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
  ) {
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  }

  if (process.platform === "win32") {
    return [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    ].find((candidate) => existsSync(candidate));
  }

  if (process.platform === "linux") {
    return [
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/snap/bin/chromium",
    ].find((candidate) => existsSync(candidate));
  }

  return null;
};

const getProductionLaunchArgs = (extraArgs = []) => [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--font-render-hinting=none",
  "--hide-scrollbars",
  ...extraArgs,
];

const launchWithSparticuzChromium = async () => {
  const {default: chromium} = await import("@sparticuz/chromium");
  const executablePath = await chromium.executablePath();

  console.info("[pdf-export] launching @sparticuz/chromium fallback");
  return puppeteer.launch({
    args: getProductionLaunchArgs(chromium.args || []),
    defaultViewport: chromium.defaultViewport || {
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    },
    executablePath,
    headless: chromium.headless ?? true,
  });
};

const launchLocalBrowser = async () => {
  ensurePuppeteerCacheDir();

  const launchOptions = {
    headless: true,
    args: getProductionLaunchArgs(),
  };

  const systemChrome = getSystemChromePath();
  if (systemChrome) {
    launchOptions.executablePath = systemChrome;
    console.info("[pdf-export] using system Chrome/Chromium:", systemChrome);
    return puppeteer.launch(launchOptions);
  }

  // Prefer packaged Chromium for Azure/App Service Linux where system Chrome is absent.
  if (process.platform === "linux") {
    try {
      return await launchWithSparticuzChromium();
    } catch (error) {
      console.warn(
        "[pdf-export] @sparticuz/chromium unavailable, falling back to puppeteer chrome:",
        error.message
      );
    }
  }

  console.info(
    "[pdf-export] launching puppeteer bundled Chrome (cache:",
    process.env.PUPPETEER_CACHE_DIR,
    ")"
  );
  return puppeteer.launch(launchOptions);
};

export const renderResumePdf = async (token, baseUrl) => {
  let browser;
  const wsEndpoint = getRemoteBrowserEndpoint();

  try {
    if (wsEndpoint) {
      console.info(
        "[pdf-export] connecting to remote browser at",
        wsEndpoint.split("?")[0]
      );
      browser = await puppeteer.connect({
        browserWSEndpoint: wsEndpoint,
      });
    } else {
      browser = await launchLocalBrowser();
    }
  } catch (error) {
    const hint =
      "Resume PDF needs Chrome. On Azure, set BROWSERLESS_TOKEN / BROWSER_WS_ENDPOINT, or redeploy with Chromium packaged via @sparticuz/chromium / PUPPETEER_CACHE_DIR.";
    console.error("[pdf-export] failed to start browser", {
      message: error.message,
      cacheDir: process.env.PUPPETEER_CACHE_DIR || null,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
      hasBrowserless: Boolean(process.env.BROWSERLESS_TOKEN),
      hasBrowserWs: Boolean(process.env.BROWSER_WS_ENDPOINT),
    });
    const wrapped = new Error(`${hint} (${error.message})`);
    wrapped.cause = error;
    throw wrapped;
  }

  try {
    const page = await browser.newPage();
    await page.setViewport({width: 794, height: 1123, deviceScaleFactor: 1});

    const renderUrl = `${normalizeClientBaseUrl(baseUrl)}/pdf-render/${token}`;
    const pageLogs = [];
    const failedRequests = [];

    console.info("[pdf-export] opening render page", {
      renderUrl,
      requestBaseUrl: baseUrl || null,
      configuredBaseUrl:
        process.env.PDF_RENDER_BASE_URL ||
        process.env.CLIENT_URL ||
        process.env.CLIENT_ORIGIN ||
        null,
      runningInDocker: isRunningInDocker(),
    });

    page.on("console", (message) => {
      pageLogs.push(`${message.type()}: ${message.text()}`.slice(0, 500));
    });
    page.on("requestfailed", (request) => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure()?.errorText || "unknown",
      });
    });

    await page.goto(renderUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    try {
      await page.waitForSelector("#pdf-render-ready", {timeout: 30000});
    } catch (error) {
      const bodyText = await page.evaluate(() => document.body?.innerText || "");
      console.error("[pdf-export] render page did not become ready", {
        renderUrl,
        bodyText: bodyText.slice(0, 1000),
        pageLogs,
        failedRequests,
      });
      throw error;
    }

    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              })
          )
      );
    });

    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {top: "0", right: "0", bottom: "0", left: "0"},
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfBytes);
  } finally {
    await browser.close();
  }
};
