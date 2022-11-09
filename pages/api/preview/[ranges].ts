import type { NextApiRequest, NextApiResponse } from 'next';

const chromium = require('chrome-aws-lambda');

const devOptions = {
  args: [],
  executablePath:
    process.platform === 'win32'
      ? 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
      : process.platform === 'linux'
      ? '/usr/bin/google-chrome'
      : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
};

type SelectionData = {
  value: string;
};

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<SelectionData>
) => {
  const { ranges } = req.query;
  if (!ranges) {
    return res.status(200).json({ value: '' });
  }

  // Uncomment for dev
  // const browser = await chromium.puppeteer.launch(devOptions);
  // Uncomment for prod
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: true,
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 640,
    height: 480,
    deviceScaleFactor: 1,
  });
  await page.goto(
    `https://zanzibar-annotated-git-set-features-authzed.vercel.app/#${ranges}`
  );
  // const result = await page.title();
  const result = await page.screenshot(
    {
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 640,
        height: 480,
      },
      encoding: 'base64',
    },
    page
  );

  await browser.close();

  res.status(200).json({ value: result });
};

export default handler;
