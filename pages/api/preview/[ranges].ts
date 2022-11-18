import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

const chromium = require('chrome-aws-lambda');

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

  await chromium.font('/Times%20New%20Roman.ttf');
  const browser = await chromium.puppeteer.launch(
    isProd
      ? {
          args: chromium.args,
          executablePath: await chromium.executablePath,
          headless: true,
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
  if (!endpoint) {
    endpoint = `https://${process.env.VERCEL_URL}`;
  }

  const renderURL = `${endpoint}/_render/${ranges}`;
  console.log(renderURL);
  await page.goto(renderURL);

  await page.waitForFunction('!!window._scrolled', {
    timeout: 1000,
  });

  const result = await page.screenshot(
    {
      type: 'png',
      encoding: 'binary',
      captureBeyondViewport: false,
    },
    page
  );

  await browser.close();

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', `max-age=${MAX_AGE}, public`);
  res.setHeader('Cache-Control', `s-maxage=${MAX_AGE}`);
  res.send(result);
};

export default handler;
