const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

export default function Test(props) {
  console.log(props);
  return <div>{props.pageTitle}</div>;
}

export async function getServerSideProps(context) {
  const options =
    process.env.IS_PROD === '1'
      ? {
          args: chromium.args,
          executablePath: await chromium.executablePath,
          headless: true,
        }
      : {
          args: [],
          executablePath:
            process.platform === 'win32'
              ? 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
              : process.platform === 'linux'
              ? '/usr/bin/google-chrome'
              : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          headless: true,
        };

  const browser = await puppeteer.launch(options);

  const page = await browser.newPage();
  await page.goto('https://authzed.com');
  const pageTitle = await page.title();
  await browser.close();

  return {
    props: { pageTitle }, // will be passed to the page component as props
  };
}
