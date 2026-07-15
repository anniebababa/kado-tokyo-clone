const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SERVICE_URL = 'https://kadotokyo.com/service';
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

    console.log(`[service-reference] ${vp.name}px ...`);
    await page.goto(SERVICE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: path.join(SHOTS_DIR, `service-reference-${vp.name}.png`),
      fullPage: true,
    });
    console.log(`  saved service-reference-${vp.name}.png`);

    await page.close();
  }

  // Also grab DOM structure for analysis
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(SERVICE_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  const analysis = await page.evaluate(() => {
    const sections = [];
    // Get all major sections
    const els = document.querySelectorAll('section, header, footer, [class*="hero"], [class*="section"], [class*="container"]');
    els.forEach(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      sections.push({
        tag: el.tagName,
        class: el.className.substring(0, 80),
        id: el.id,
        text: el.innerText ? el.innerText.substring(0, 100).replace(/\n/g, ' ') : '',
        bgColor: style.backgroundColor,
        bgImage: style.backgroundImage.substring(0, 120),
        height: Math.round(el.scrollHeight),
      });
    });
    return sections;
  });

  // Get all images on the page
  const images = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src,
      alt: img.alt,
      width: img.naturalWidth,
      height: img.naturalHeight,
      class: img.className,
    }));
  });

  // Get all background images
  const bgImages = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('*').forEach(el => {
      const bg = window.getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none' && bg.includes('url(')) {
        results.push({
          tag: el.tagName,
          class: el.className.substring(0, 60),
          bg: bg.substring(0, 200),
        });
      }
    });
    return results.slice(0, 50);
  });

  // Get all links (buttons/CTAs)
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]')).map(a => ({
      href: a.href,
      text: a.innerText.trim().substring(0, 60),
    }));
  });

  fs.writeFileSync(
    path.join(__dirname, 'docs', 'service-page-audit-raw.json'),
    JSON.stringify({ sections: analysis.slice(0, 40), images, bgImages, links }, null, 2)
  );

  // Also get full page HTML structure
  const pageTitle = await page.title();
  const bodyHTML = await page.evaluate(() => {
    // Remove scripts
    document.querySelectorAll('script').forEach(s => s.remove());
    return document.body.innerHTML.substring(0, 50000);
  });
  fs.writeFileSync(path.join(__dirname, 'docs', 'service-page-html.txt'), bodyHTML);

  console.log('Analysis saved.');
  await page.close();
  await browser.close();
  console.log('Done.');
})();
