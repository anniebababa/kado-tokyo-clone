/**
 * audit-vehicle.js
 * Measure the vehicle section (車種介紹) on kadotokyo.com
 * Outputs screenshots + docs/vehicle-section-audit.md
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const REFERENCE_URL = 'https://kadotokyo.com/';
const SHOTS_DIR = path.join(__dirname, 'screenshots');
const DOCS_DIR = path.join(__dirname, 'docs');

if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

const VIEWPORTS = [
  { name: '1530x900',  width: 1530, height: 900 },
  { name: '1366x768',  width: 1366, height: 768 },
  { name: '390x844',   width: 390,  height: 844 },
];

async function measureSection(page) {
  return await page.evaluate(() => {
    // Find the fleet/vehicle section — try multiple selectors
    const section =
      document.querySelector('#fleet') ||
      document.querySelector('[data-section*="fleet"]') ||
      [...document.querySelectorAll('section')].find(s =>
        s.innerText.includes('車種介紹') || s.innerText.includes('Alphard') || s.innerText.includes('Hiace')
      );

    if (!section) return { error: 'section not found' };

    const sectionRect = section.getBoundingClientRect();

    // Container (first child with max-width or a wrapper div)
    const container = section.querySelector('[class*="inner"]') ||
                      section.querySelector('[class*="container"]') ||
                      section.querySelector('[class*="wrap"]') ||
                      section.children[0];
    const containerRect = container ? container.getBoundingClientRect() : null;

    // Title element
    const titleEl = [...section.querySelectorAll('h1,h2,h3')].find(el =>
      el.innerText.includes('車種介紹')
    );
    const titleRect = titleEl ? titleEl.getBoundingClientRect() : null;

    // Intro paragraph
    const introEl = [...section.querySelectorAll('p')].find(el =>
      el.innerText.includes('小家庭') || el.innerText.includes('包車選擇')
    );
    const introRect = introEl ? introEl.getBoundingClientRect() : null;

    // Cards
    const cards = section.querySelectorAll('[class*="card"], [class*="item"]');
    const cardData = [...cards].slice(0, 4).map(c => {
      const r = c.getBoundingClientRect();
      const cs = window.getComputedStyle(c);
      return {
        className: c.className,
        x: Math.round(r.x),
        y: Math.round(r.y),
        width: Math.round(r.width),
        height: Math.round(r.height),
        borderRadius: cs.borderRadius,
        background: cs.backgroundColor,
      };
    });

    // Images inside section
    const imgs = section.querySelectorAll('img');
    const imgData = [...imgs].map(img => ({
      src: img.src,
      alt: img.alt,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      displayWidth: Math.round(img.getBoundingClientRect().width),
      displayHeight: Math.round(img.getBoundingClientRect().height),
    }));

    // Buttons
    const btns = section.querySelectorAll('a, button');
    const btnData = [...btns].filter(b => b.innerText.includes('了解') || b.innerText.includes('more') || b.innerText.includes('More')).map(b => {
      const r = b.getBoundingClientRect();
      const cs = window.getComputedStyle(b);
      return {
        text: b.innerText.trim(),
        x: Math.round(r.x),
        y: Math.round(r.y),
        width: Math.round(r.width),
        height: Math.round(r.height),
        clipPath: cs.clipPath,
        background: cs.backgroundColor,
        color: cs.color,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
      };
    });

    // Description boxes (pink)
    const descBoxes = [...section.querySelectorAll('div, p')].filter(el => {
      const bg = window.getComputedStyle(el).backgroundColor;
      // pink-ish
      return bg && (bg.includes('247') || bg.includes('248') || bg.includes('pink') || bg.includes('216')) && !bg.includes('0, 0, 0, 0');
    });
    const descData = descBoxes.slice(0, 4).map(el => {
      const r = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      return {
        className: el.className,
        x: Math.round(r.x), y: Math.round(r.y),
        width: Math.round(r.width), height: Math.round(r.height),
        background: cs.backgroundColor,
        padding: cs.padding,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        color: cs.color,
      };
    });

    // Title computed styles
    let titleStyles = null;
    if (titleEl) {
      const cs = window.getComputedStyle(titleEl);
      titleStyles = {
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        color: cs.color,
        textAlign: cs.textAlign,
      };
    }

    // Intro computed styles
    let introStyles = null;
    if (introEl) {
      const cs = window.getComputedStyle(introEl);
      introStyles = {
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        color: cs.color,
        maxWidth: cs.maxWidth,
        textAlign: cs.textAlign,
      };
    }

    // Section bg
    const sectionCs = window.getComputedStyle(section);

    // Car name headings
    const carNames = [...section.querySelectorAll('h1,h2,h3,h4')].filter(el =>
      el.innerText.includes('Alphard') || el.innerText.includes('Hiace') || el.innerText.includes('阿爾法') || el.innerText.includes('海獅')
    );
    const carNameData = carNames.map(el => {
      const r = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      return {
        text: el.innerText.trim(),
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        color: cs.color,
        fontFamily: cs.fontFamily,
        x: Math.round(r.x), y: Math.round(r.y),
        width: Math.round(r.width), height: Math.round(r.height),
      };
    });

    // Image area (white bg areas inside cards)
    const imgAreas = [...section.querySelectorAll('div')].filter(el => {
      const bg = window.getComputedStyle(el).backgroundColor;
      const r = el.getBoundingClientRect();
      return bg === 'rgb(255, 255, 255)' && r.width > 200 && r.height > 100 && r.height < 500;
    }).slice(0, 4).map(el => {
      const r = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      return {
        className: el.className,
        x: Math.round(r.x), y: Math.round(r.y),
        width: Math.round(r.width), height: Math.round(r.height),
        padding: cs.padding,
      };
    });

    // Wave / pseudo elements — check if section has clip-path or border-radius
    const waveInfo = {
      sectionClipPath: sectionCs.clipPath,
      sectionBorderRadius: sectionCs.borderRadius,
      sectionBackground: sectionCs.backgroundColor,
      sectionPaddingTop: sectionCs.paddingTop,
      sectionPaddingBottom: sectionCs.paddingBottom,
    };

    // Look for SVG wave children
    const svgs = section.querySelectorAll('svg');
    const svgData = [...svgs].map(svg => ({
      width: svg.getAttribute('width') || svg.getBoundingClientRect().width,
      height: svg.getAttribute('height') || svg.getBoundingClientRect().height,
      viewBox: svg.getAttribute('viewBox'),
      pathD: svg.querySelector('path') ? svg.querySelector('path').getAttribute('d') : null,
    }));

    return {
      sectionRect: {
        x: Math.round(sectionRect.x), y: Math.round(sectionRect.y),
        width: Math.round(sectionRect.width), height: Math.round(sectionRect.height),
      },
      containerRect: containerRect ? {
        x: Math.round(containerRect.x), y: Math.round(containerRect.y),
        width: Math.round(containerRect.width), height: Math.round(containerRect.height),
      } : null,
      titleRect: titleRect ? {
        x: Math.round(titleRect.x), y: Math.round(titleRect.y),
        width: Math.round(titleRect.width), height: Math.round(titleRect.height),
      } : null,
      introRect: introRect ? {
        x: Math.round(introRect.x), y: Math.round(introRect.y),
        width: Math.round(introRect.width), height: Math.round(introRect.height),
      } : null,
      titleStyles,
      introStyles,
      cardData,
      carNameData,
      imgData,
      imgAreas,
      descData,
      btnData,
      waveInfo,
      svgData,
    };
  });
}

async function getFullSectionHTML(page) {
  return await page.evaluate(() => {
    const section =
      document.querySelector('#fleet') ||
      [...document.querySelectorAll('section')].find(s =>
        s.innerText.includes('車種介紹') || s.innerText.includes('Alphard')
      );
    return section ? section.outerHTML.substring(0, 8000) : 'not found';
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = {};

  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.name} ===`);
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });

    await page.goto(REFERENCE_URL, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(3000);

    // Full page screenshot
    const fullShot = path.join(SHOTS_DIR, `ref-full-${vp.name}.png`);
    await page.screenshot({ path: fullShot, fullPage: true });
    console.log(`Full screenshot: ${fullShot}`);

    // Scroll to fleet section and screenshot it
    await page.evaluate(() => {
      const section =
        document.querySelector('#fleet') ||
        [...document.querySelectorAll('section')].find(s =>
          s.innerText.includes('車種介紹') || s.innerText.includes('Alphard')
        );
      if (section) section.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await page.waitForTimeout(1000);

    // Section-only screenshot via clip
    const sectionBounds = await page.evaluate(() => {
      const section =
        document.querySelector('#fleet') ||
        [...document.querySelectorAll('section')].find(s =>
          s.innerText.includes('車種介紹') || s.innerText.includes('Alphard')
        );
      if (!section) return null;
      const r = section.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
    });

    if (sectionBounds && sectionBounds.height > 0) {
      // Take a screenshot with the section visible
      await page.evaluate(() => {
        const section =
          document.querySelector('#fleet') ||
          [...document.querySelectorAll('section')].find(s =>
            s.innerText.includes('車種介紹') || s.innerText.includes('Alphard')
          );
        if (section) section.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
      await page.waitForTimeout(800);

      const sectionShot = path.join(SHOTS_DIR, `ref-vehicle-${vp.name}.png`);
      await page.screenshot({
        path: sectionShot,
        clip: {
          x: 0,
          y: Math.max(0, sectionBounds.y),
          width: vp.width,
          height: Math.min(sectionBounds.height, 1400),
        },
      });
      console.log(`Section screenshot: ${sectionShot}`);
    }

    // Measure
    const metrics = await measureSection(page);
    results[vp.name] = metrics;
    console.log('Metrics:', JSON.stringify(metrics, null, 2));

    await page.close();
  }

  // Also grab HTML structure at 1530
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1530, height: 900 });
    await page.goto(REFERENCE_URL, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2000);
    const html = await getFullSectionHTML(page);
    results.sectionHTML = html;
    await page.close();
  }

  await browser.close();

  // Write audit markdown
  const r1530 = results['1530x900'] || {};
  const r390 = results['390x844'] || {};

  const md = `# Vehicle Section Audit — kadotokyo.com
Generated: ${new Date().toISOString()}

## 1530 × 900 Measurements

### Section Bounding Box
\`\`\`json
${JSON.stringify(r1530.sectionRect, null, 2)}
\`\`\`

### Container
\`\`\`json
${JSON.stringify(r1530.containerRect, null, 2)}
\`\`\`

### Title (車種介紹) Rect
\`\`\`json
${JSON.stringify(r1530.titleRect, null, 2)}
\`\`\`

### Title Computed Styles
\`\`\`json
${JSON.stringify(r1530.titleStyles, null, 2)}
\`\`\`

### Intro Text Rect
\`\`\`json
${JSON.stringify(r1530.introRect, null, 2)}
\`\`\`

### Intro Text Styles
\`\`\`json
${JSON.stringify(r1530.introStyles, null, 2)}
\`\`\`

### Car Name Headings
\`\`\`json
${JSON.stringify(r1530.carNameData, null, 2)}
\`\`\`

### Cards
\`\`\`json
${JSON.stringify(r1530.cardData, null, 2)}
\`\`\`

### Image Areas (white bg)
\`\`\`json
${JSON.stringify(r1530.imgAreas, null, 2)}
\`\`\`

### Images
\`\`\`json
${JSON.stringify(r1530.imgData, null, 2)}
\`\`\`

### Pink Desc Boxes
\`\`\`json
${JSON.stringify(r1530.descData, null, 2)}
\`\`\`

### Buttons
\`\`\`json
${JSON.stringify(r1530.btnData, null, 2)}
\`\`\`

### Wave / Background Info
\`\`\`json
${JSON.stringify(r1530.waveInfo, null, 2)}
\`\`\`

### SVG Elements
\`\`\`json
${JSON.stringify(r1530.svgData, null, 2)}
\`\`\`

---

## 390 × 844 Measurements

### Section Bounding Box
\`\`\`json
${JSON.stringify(r390.sectionRect, null, 2)}
\`\`\`

### Cards (mobile)
\`\`\`json
${JSON.stringify(r390.cardData, null, 2)}
\`\`\`

---

## Section HTML (first 8000 chars)
\`\`\`html
${results.sectionHTML || 'not captured'}
\`\`\`
`;

  fs.writeFileSync(path.join(DOCS_DIR, 'vehicle-section-audit.md'), md);
  console.log('\nAudit written to docs/vehicle-section-audit.md');
  console.log('Screenshots saved to ./screenshots/');
})();
