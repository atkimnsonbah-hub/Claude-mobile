// Render the ebook covers as 1600x2560 PNG + JPG (standard ebook cover size).
// Usage: node ebook/covers/make-covers.js
const { chromium } = require('playwright');
const path = require('path');

const crown = (c) => `
<svg viewBox="0 0 120 80" width="150" height="100" aria-hidden="true">
  <path d="M10 66 L18 22 L42 46 L60 12 L78 46 L102 22 L110 66 Z" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>
  <line x1="12" y1="74" x2="108" y2="74" stroke="${c}" stroke-width="4" stroke-linecap="round"/>
  <circle cx="18" cy="18" r="5" fill="${c}"/><circle cx="60" cy="8" r="5" fill="${c}"/><circle cx="102" cy="18" r="5" fill="${c}"/>
</svg>`;

// Book One motif: a heart cracked down the middle, halves drifting apart.
const brokenHeart = (c) => `
<svg viewBox="0 0 400 360" width="760" height="684" aria-hidden="true">
  <defs><filter id="glow"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <g fill="none" stroke="${c}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" filter="url(#glow)">
    <g transform="translate(-14,6) rotate(-6 200 200)">
      <path d="M196 330 C120 270 40 210 40 130 C40 80 80 44 126 44 C158 44 184 62 196 88 L176 132 L206 168 L180 214 L210 252 L196 330 Z"/>
    </g>
    <g transform="translate(14,-4) rotate(6 200 200)">
      <path d="M204 330 C280 270 360 210 360 130 C360 80 320 44 274 44 C242 44 216 62 204 88 L184 132 L214 168 L188 214 L218 252 L204 330 Z"/>
    </g>
  </g>
  <g fill="${c}" opacity=".85">
    <path d="M196 270 l8 14 l-12 4 z"/><path d="M214 300 l10 8 l-12 6 z"/><path d="M188 312 l6 12 l-10 2 z"/>
  </g>
</svg>`;

// Book Two motif: an engagement ring with a diamond and sparkles.
const ring = (c) => `
<svg viewBox="0 0 400 400" width="720" height="720" aria-hidden="true">
  <defs><filter id="glow"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <g fill="none" stroke="${c}" stroke-linejoin="round" stroke-linecap="round" filter="url(#glow)">
    <ellipse cx="200" cy="262" rx="112" ry="104" stroke-width="10"/>
    <ellipse cx="200" cy="262" rx="94" ry="86" stroke-width="3" opacity=".55"/>
    <path d="M166 160 L184 132 L216 132 L234 160 L200 204 Z" stroke-width="5"/>
    <path d="M166 160 L234 160 M184 132 L192 160 L200 204 L208 160 L216 132" stroke-width="3"/>
    <path d="M178 160 L200 174 L222 160" stroke-width="2.5" opacity=".7"/>
  </g>
  <g fill="${c}">
    <path d="M300 92 l6 18 l18 6 l-18 6 l-6 18 l-6 -18 l-18 -6 l18 -6 z"/>
    <path d="M96 128 l4 12 l12 4 l-12 4 l-4 12 l-4 -12 l-12 -4 l12 -4 z" opacity=".8"/>
    <path d="M318 196 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3 z" opacity=".7"/>
  </g>
</svg>`;

const BOOKS = [
  {
    slug: 'why-you-cant-save-her',
    series: 'Book One',
    lines: ['Why You', "Can't Save", 'Her'],
    sub: 'A King&rsquo;s guide to escaping the savior trap, before it costs you years you can&rsquo;t get back.',
    bg: '#0d0c0d', bg2: '#1c0d10', accent: '#e0283f', glow: 'rgba(224,40,63,.42)', ink: '#f3efe8', soft: '#bdb6aa',
    motif: brokenHeart,
  },
  {
    slug: 'how-men-choose-a-wife',
    series: 'Book Two &middot; For Her',
    lines: ['How Men', 'Choose a', 'Wife'],
    sub: 'A straight-talk guide for women<br>who want more than attention.',
    bg: '#1d0d16', bg2: '#3a1729', accent: '#e46a9a', glow: 'rgba(228,106,154,.40)', ink: '#f7eef1', soft: '#d9bfcb',
    motif: ring,
  },
];

const page = (b) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Source+Serif+4:ital,opsz,wght@1,8..60,400&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{width:1600px;height:2560px;overflow:hidden;background:${b.bg};color:${b.ink};font-family:"Source Serif 4",Georgia,serif}
  .c{position:relative;width:100%;height:100%;padding:150px 130px 140px;display:flex;flex-direction:column;
     background:radial-gradient(ellipse 90% 55% at 50% 40%, ${b.bg2} 0%, ${b.bg} 70%)}
  .grain{position:absolute;inset:0;opacity:.18;mix-blend-mode:overlay}
  .glow{position:absolute;left:50%;top:880px;width:1300px;height:1300px;transform:translate(-50%,-50%);
     background:radial-gradient(circle, ${b.glow} 0%, transparent 62%)}
  .frame{position:absolute;inset:60px;border:2px solid ${b.accent};opacity:.35}
  .top{position:relative;text-align:center}
  .top .presents{font-family:Oswald,Arial,sans-serif;letter-spacing:.42em;text-transform:uppercase;font-size:40px;color:${b.soft};margin-top:22px}
  .top .series{font-family:Oswald,Arial,sans-serif;letter-spacing:.32em;text-transform:uppercase;font-size:30px;color:${b.accent};margin-top:14px}
  .motif{position:relative;display:flex;justify-content:center;margin-top:60px;height:700px;align-items:center}
  h1{position:relative;font-family:Oswald,Arial,sans-serif;font-weight:700;text-transform:uppercase;text-align:center;
     font-size:250px;line-height:.92;letter-spacing:-.005em;margin-top:70px}
  h1 span{display:block}
  h1 span:nth-child(2){color:${b.accent}}
  .sub{position:relative;text-align:center;font-style:italic;font-size:56px;line-height:1.35;color:${b.soft};max-width:1180px;margin:56px auto 0}
  .bottom{position:relative;margin-top:auto;text-align:center}
  .rule{width:180px;height:4px;background:${b.accent};margin:0 auto 44px}
  .by{font-family:Oswald,Arial,sans-serif;text-transform:uppercase;letter-spacing:.22em;font-size:64px}
  .tag{font-family:Oswald,Arial,sans-serif;text-transform:uppercase;letter-spacing:.5em;font-size:30px;color:${b.accent};margin-top:16px}
</style></head><body><div class="c">
  <svg class="grain" width="1600" height="2560"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>
  <div class="glow"></div><div class="frame"></div>
  <div class="top">${crown(b.accent)}<div class="presents">King's Wisdom Presents</div><div class="series">${b.series}</div></div>
  <div class="motif">${b.motif(b.accent)}</div>
  <h1>${b.lines.map((l) => `<span>${l}</span>`).join('')}</h1>
  <p class="sub">${b.sub}</p>
  <div class="bottom"><div class="rule"></div><div class="by">By King's Wisdom</div><div class="tag">Stay Dangerous</div></div>
</div></body></html>`;

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1600, height: 2560 } });
  for (const b of BOOKS) {
    await p.setContent(page(b), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const base = path.join(__dirname, `${b.slug}-cover`);
    await p.screenshot({ path: `${base}.png` });
    await p.screenshot({ path: `${base}.jpg`, type: 'jpeg', quality: 92 });
    console.log('wrote', path.basename(base) + '.png/.jpg');
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
