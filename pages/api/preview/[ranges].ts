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
  try {
    return await realHandler(req, res);
  } catch (e) {
    res.status(500).json({
      debugError: e instanceof Error ? e.stack ?? e.message : String(e),
    });
    return res;
  }
};

const realHandler = async (req: NextApiRequest, res: NextApiResponse) => {
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
  const executablePath = isProd
    ? await chromium.executablePath()
    : undefined;
  await chromium.font(fontPath);
  const browser = await puppeteer.launch(
    isProd
      ? {
          // `headless: 'shell'` (not `true`) is required: `true` makes
          // puppeteer-core add `--headless=new`, which the chrome-headless-shell
          // binary @sparticuz/chromium ships does not support and silently
          // fails to paint under, producing blank screenshots.
          args: puppeteer.defaultArgs({
            args: chromium.args,
            headless: 'shell',
          }),
          executablePath,
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
    const anchorEl = sel?.anchorNode?.parentElement ?? null;
    const anchorStyle = anchorEl ? getComputedStyle(anchorEl) : null;
    let ancestorInfo: string[] = [];
    let el: Element | null = anchorEl;
    let depth = 0;
    while (el && depth < 8) {
      const cs = getComputedStyle(el);
      ancestorInfo.push(
        `${el.tagName}${el.id ? '#' + el.id : ''}.${el.className || ''} vis=${
          cs.visibility
        } disp=${cs.display} op=${cs.opacity} color=${cs.color}`
      );
      el = el.parentElement;
      depth++;
    }
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
      selAnchorTag: anchorEl?.tagName,
      anchorVisibility: anchorStyle?.visibility,
      anchorColor: anchorStyle?.color,
      ancestorInfo,
      anchorOffsetTop: anchorEl
        ? anchorEl.getBoundingClientRect().top + window.scrollY
        : -1,
    };
  });

  const rescroll = await page.evaluate(() => {
    const sel = document.getSelection();
    const el = sel?.anchorNode?.parentElement ?? null;
    el?.scrollIntoView({ block: 'center', behavior: 'auto' });
    return {
      scrollYAfterManualRescroll: window.scrollY,
      elRectTopAfter: el ? el.getBoundingClientRect().top : null,
    };
  });

  const result = await page.screenshot({
    type: 'png',
    encoding: 'binary',
    captureBeyondViewport: false,
  });

  await browser.close();

  if (req.query.debugJson) {
    res.status(200).json({
      diag,
      rescroll,
      consoleMessages: consoleMessages.slice(0, 20),
    });
    return res;
  }

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store');
  res.send(result);
};

export default handler;
