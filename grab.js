// Usage:
//   node grab.js --at 1,5.5,12 [outDir]      -> preview stills of the demo timeline
//   node grab.js --all outDir [from] [to]     -> every frame (30 fps) as JPEG, skipping existing ones
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const [, , mode, a, b, c] = process.argv;
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME || '/usr/bin/google-chrome',
    headless: true,
    protocolTimeout: 600000,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
      '--force-device-scale-factor=1', '--font-render-hinting=none'],
  });
  const page = await browser.newPage();
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.type(), m.text().slice(0, 400)); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.setViewport({ width: 1920, height: 1080 });
  const t0 = Date.now();
  await page.goto(`http://127.0.0.1:${process.env.PORT || 8766}/index.html?demo&local`, { waitUntil: 'load' });
  await page.waitForFunction('window.ready === true', { timeout: 300000 });
  console.log('ready in', Date.now() - t0, 'ms');
  const info = await page.evaluate(() => window.demoInfo);
  let times, outDir, names;
  if (mode === '--at') {
    times = a.split(',').map(Number); outDir = b || 'stills';
    names = times.map((t) => `t${t.toFixed(2)}.jpg`);
  } else {
    outDir = a;
    const from = Number(b || 0), to = Number(c || Math.round(info.duration * info.fps));
    times = []; names = [];
    for (let i = from; i < to; i++) {
      const name = `f${String(i).padStart(4, '0')}.jpg`;
      if (fs.existsSync(path.join(outDir, name))) continue;
      times.push(i / info.fps); names.push(name);
    }
  }
  fs.mkdirSync(outDir, { recursive: true });
  for (let i = 0; i < times.length; i++) {
    const s = Date.now();
    await page.evaluate((t) => window.renderAt(t), times[i]);
    const tmp = path.join(outDir, names[i] + '.tmp');
    await page.screenshot({ path: tmp, type: 'jpeg', quality: 93 });
    fs.renameSync(tmp, path.join(outDir, names[i]));
    if (mode === '--at' || i % 30 === 0) console.log(names[i], Date.now() - s, 'ms');
  }
  await browser.close();
})();
