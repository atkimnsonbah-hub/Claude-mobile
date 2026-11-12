// Print each built ebook HTML file to PDF with Chromium.
// Usage: node ebook/pdf.js <file.html> [...]
const { chromium } = require('playwright');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const file of process.argv.slice(2)) {
    const abs = path.resolve(file);
    await page.goto(pathToFileURL(abs).href, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const out = abs.replace(/\.html$/, '.pdf');
    await page.pdf({
      path: out,
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate:
        '<div style="width:100%;font-size:8px;color:#8a8478;text-align:center;font-family:Arial,sans-serif;">' +
        '<span class="pageNumber"></span></div>',
    });
    console.log('wrote', path.basename(out));
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
