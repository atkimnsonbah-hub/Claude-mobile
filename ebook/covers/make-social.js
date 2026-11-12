// Render social-media versions of each cover: the cover centred on a matching background.
// Usage: node ebook/covers/make-social.js   (run after make-covers.js)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BOOKS = [
  { slug: 'why-you-cant-save-her', bg: '#0d0c0d', bg2: '#2a0f15', glow: 'rgba(224,40,63,.35)' },
  { slug: 'how-men-choose-a-wife', bg: '#1d0d16', bg2: '#45192f', glow: 'rgba(228,106,154,.34)' },
];
const SIZES = [
  { name: 'post-4x5', w: 1080, h: 1350, coverH: 1140 },
  { name: 'story-9x16', w: 1080, h: 1920, coverH: 1440 },
  { name: 'square', w: 1080, h: 1080, coverH: 940 },
];

const page = (b, s, img) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box}
  body{width:${s.w}px;height:${s.h}px;overflow:hidden;display:flex;align-items:center;justify-content:center;
    background:radial-gradient(ellipse 75% 60% at 50% 50%, ${b.bg2} 0%, ${b.bg} 75%)}
  .glow{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%, ${b.glow} 0%, transparent 55%)}
  .grain{position:absolute;inset:0;opacity:.16;mix-blend-mode:overlay}
  img{position:relative;height:${s.coverH}px;width:auto;border-radius:6px;
    box-shadow:0 30px 70px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.06)}
</style></head><body>
  <div class="glow"></div>
  <svg class="grain" width="${s.w}" height="${s.h}"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>
  <img src="${img}" alt="">
</body></html>`;

(async () => {
  const out = path.join(__dirname, 'social');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  for (const b of BOOKS) {
    const src = path.join(__dirname, `${b.slug}-cover.png`);
    const img = 'data:image/png;base64,' + fs.readFileSync(src).toString('base64');
    for (const s of SIZES) {
      const p = await browser.newPage({ viewport: { width: s.w, height: s.h } });
      await p.setContent(page(b, s, img), { waitUntil: 'load' });
      const file = path.join(out, `${b.slug}-${s.name}.jpg`);
      await p.screenshot({ path: file, type: 'jpeg', quality: 93 });
      await p.close();
      console.log('wrote', path.relative(path.dirname(__dirname), file));
    }
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
