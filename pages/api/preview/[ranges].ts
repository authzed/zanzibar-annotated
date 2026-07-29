import chromium from '@sparticuz/chromium';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import puppeteer from 'puppeteer-core';

const sharedOptions = {};

// Orignally from https://mediajams.dev/post/automate-social-images-next-puppeteer
const devOptions = {
  args: [],
  executablePath:
    process.platform === 'win32'
      ? 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
      : process.platform === 'linux'
      ? '/usr/bin/google-chrome'
      : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  ...sharedOptions,
};

const isProd = process.env.NODE_ENV === 'production';

const MAX_AGE = 31536000;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ranges } = req.query;
  if (!ranges?.includes(':')) {
    const filePath = path.resolve('.', 'assets/empty.png');
    const imageBuffer = fs.readFileSync(filePath);
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);
    return res;
  }

  // Using an open source Times New Roman alternative
  // Linking to a hosted version to avoid adding to the serverless function build size
  // TODO: Switch to a file hosted in the zanzibar-annotated repo when the repo is public
  const fontPath =
    'https://cdn.jsdelivr.net/gh/samkim/Linux-Libertine/LinLibertine_R.ttf';
  await chromium.font(fontPath);
  const browser = await puppeteer.launch(
    isProd
      ? {
          // `headless: 'shell'` (not `true`) is required: `true` makes
          // puppeteer-core add `--headless=new`, which the chrome-headless-shell
          // binary @sparticuz/chromium ships does not support and silently
          // fails to paint under, producing blank screenshots.
          args: puppeteer.defaultArgs({ args: chromium.args, headless: 'shell' }),
          executablePath: await chromium.executablePath(),
          headless: 'shell',
          ...sharedOptions,
        }
      : devOptions
  );

  const page = await browser.newPage();
  await page.setViewport({
    width: 428,
    height: 225,
    deviceScaleFactor: 1,
  });

  let endpoint = process.env.PREVIEW_ENDPOINT;
  if (!endpoint && process.env.VERCEL_URL) {
    endpoint = `https://${process.env.VERCEL_URL}`;
  }
  // Local dev fallback: neither PREVIEW_ENDPOINT nor VERCEL_URL is set
  // (VERCEL_URL is only populated by Vercel's own deployment infrastructure).
  if (!endpoint) {
    endpoint = 'http://localhost:3000';
  }

  const renderURL = `${endpoint}/_render/${ranges}`;
  console.log(renderURL);
  const consoleMessages: string[] = [];
  page.on('console', (msg) => consoleMessages.push(msg.text()));
  page.on('pageerror', (err) => consoleMessages.push(`pageerror: ${err}`));
  await page.goto(renderURL);

  await page.waitForFunction('!!window._scrolled', {
    timeout: 1000,
  });

  const diag = await page.evaluate(() => {
    const body = document.body;
    const rect = body.getBoundingClientRect();
    const sel = document.getSelection();
    return {
      bodyText: (body.innerText ?? '').slice(0, 200),
      bodyHTMLLength: body.innerHTML?.length ?? -1,
      scrollY: window.scrollY,
      bodyRect: { width: rect.width, height: rect.height },
      bodyBg: getComputedStyle(body).backgroundColor,
      fontsReady: document.fonts.status,
      hasFocus: document.hasFocus(),
      selRangeCount: sel?.rangeCount ?? -1,
      selIsCollapsed: sel?.isCollapsed,
      selAnchorTag: sel?.anchorNode?.parentElement?.tagName,
    };
  });

  const result = await page.screenshot({
    type: 'png',
    encoding: 'binary',
    captureBeyondViewport: false,
    fullPage: true,
  });

  await browser.close();

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Debug-Diag', JSON.stringify(diag));
  res.setHeader(
    'X-Debug-Console',
    JSON.stringify(consoleMessages.slice(0, 20))
  );
  res.send(result);
};

export default handler;
