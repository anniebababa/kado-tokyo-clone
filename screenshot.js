const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const REFERENCE_URL = 'https://kadotokyo.com/';
const LOCAL_URL = 'file:///Users/uiuxcafe/kado-tokyo-clone/index.html';
const SHOTS_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });

const viewports = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1280', width: 1280, height: 800 },
  { name: '768',  width: 768,  height: 1024 },
  { name: '390',  width: 390,  height: 844 },
];

(async () => {
  const browser = await chromium.launch();

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });

    // Reference
    console.log(`[reference] ${vp.name}px ...`);
    await page.goto(REFERENCE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(SHOTS_DIR, `reference-${vp.name}.png`),
      fullPage: true,
    });

    // Local
    console.log(`[local]     ${vp.name}px ...`);
    await page.goto(LOCAL_URL, { waitUntil: 'networkidle', timeout: 20000 });
    // Force all reveal elements visible for screenshot
    await page.addStyleTag({ content: '.js .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }' });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SHOTS_DIR, `local-${vp.name}.png`),
      fullPage: true,
    });

    await page.close();
  }

  await browser.close();
  console.log('Done. Screenshots saved to ./screenshots/');
})();
