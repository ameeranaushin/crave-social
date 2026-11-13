import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

await mkdir('qa/scroll', { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const issues = [];
page.on('pageerror', error => issues.push(String(error)));
page.on('response', response => { if (response.status() >= 400) issues.push(`${response.status()} ${response.url()}`); });
const readTransforms = selector => page.locator(selector).evaluateAll(elements => elements.map(el => getComputedStyle(el).transform));
async function open(waitForIntro = true) {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.classList.contains('gallery-motion-ready') && document.querySelector('.hero-canvas').dataset.scene);
  if (waitForIntro) await page.waitForFunction(() => getComputedStyle(document.querySelector('.loader')).display === 'none');
}
async function position(selector, progress = 0) {
  await page.locator(selector).evaluate((el, progress) => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + Math.max(0, el.offsetHeight - innerHeight) * progress, behavior: 'instant' }), progress);
  await page.waitForTimeout(220);
  // Browser scroll events and dialog focus restoration can land on different frames.
  // Observe actual scroll progress before checking that the resulting pose stays still.
  await page.waitForFunction(() => ScrollTrigger.getAll().filter(t => t.vars.scrub === true && t.end > t.start).every(t => Math.abs(t.progress - Math.max(0, Math.min(1, (scrollY - t.start) / (t.end - t.start)))) < .005), null, { timeout: 3000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function holdStill(selector) {
  const before = await readTransforms(selector);
  await page.waitForTimeout(650);
  assert.deepEqual(await readTransforms(selector), before, `${selector} must remain still without scrolling`);
}
try {
  await open(false);
  assert.equal(await page.locator('.duet-caption,.duet-corner,.haunted-card-caption,.media-caption,.film-number,.theme-index,.theme-arrow,.button-arrow').count(), 0);
  assert.equal(await page.evaluate(() => document.body.textContent.includes('↗')), false, 'Outward share-like arrow ornaments are removed');
  const startCount = await page.locator('.loader-count').innerText();
  await page.waitForTimeout(400);
  assert.notEqual(await page.locator('.loader-count').innerText(), startCount, 'The opening advances automatically without scrolling');
  assert.equal(await page.evaluate(() => scrollY), 0);
  await page.screenshot({ path: 'qa/scroll/intro-midway.png' });
  await page.waitForTimeout(1000);
  assert.ok(Math.abs(await page.locator('.loader-photo-stage').evaluate(el => gsap.getProperty(el, 'y'))) < 20, 'The reference photo rises into the center automatically');
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.loader')).display === 'none');
  assert.equal(await page.evaluate(() => scrollY), 0);
  assert.equal(await page.locator('.hero-canvas').getAttribute('data-scene'), 'ready');
  await page.screenshot({ path: 'qa/scroll/desktop-hero.png' });
  const heroBefore = await page.locator('.hero-canvas').screenshot();
  await page.waitForTimeout(650);
  assert.deepEqual(await page.locator('.hero-canvas').screenshot(), heroBefore, 'Hero artwork does not animate while idle');
  await position('.hero-experience', .8);
  assert.equal(await page.locator('.statement .char').evaluateAll(els => els.every(el => Number(getComputedStyle(el).opacity) > .99)), true);

  await position('.duet-sequence', 0);
  const duetStart = await readTransforms('.duet-slide');
  await holdStill('.duet-slide');
  await position('.duet-sequence', .55);
  assert.notDeepEqual(await readTransforms('.duet-slide'), duetStart);
  await holdStill('.duet-slide');
  await page.screenshot({ path: 'qa/scroll/desktop-bling.png' });
  await position('.duet-sequence', 0);
  assert.deepEqual(await readTransforms('.duet-slide'), duetStart, 'Reverse scroll restores the first pair');
  await page.locator('#bling .event-head [data-gallery]').click();
  await page.locator('.gallery-next').click();
  assert.match(await page.locator('.lightbox-caption').textContent(), /Something sweet/);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog[open]') && !document.body.classList.contains('modal-open'));

  await position('.haunted-sequence', 0);
  const stack = await readTransforms('.haunted-card');
  for (let stage = 1; stage <= 3; stage++) {
    await position('.haunted-sequence', stage / 3);
    const current = await readTransforms('.haunted-card');
    assert.notDeepEqual(current, stack);
    const arranged = await page.locator('.haunted-card').evaluateAll(cards => cards.map(card => card.dataset.arranged === 'true'));
    assert.deepEqual(arranged, Array.from({ length: 6 }, (_, index) => index < stage * 2), 'Each stage arranges exactly two additional cards');
    await holdStill('.haunted-card');
    await page.screenshot({ path: `qa/scroll/haunted-stage-${stage}.png` });
  }
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(250);
  assert.ok(await page.locator('.haunted-pin').evaluate(el => el.getBoundingClientRect().top < 0), 'The third stage releases the section');

  await position('.films', 0);
  const ringStart = await readTransforms('.film-slot:not(.film-ghost)');
  const fanPose = await page.locator('.film-slot:not(.film-ghost)').evaluateAll(slots => slots.map(slot => ({ top: slot.getBoundingClientRect().top, matrix: getComputedStyle(slot).transform })));
  assert.ok(fanPose[0].top > fanPose[2].top && fanPose[4].top > fanPose[2].top, 'Films keep the original semicircular fan');
  assert.ok(fanPose.every(pose => pose.matrix.startsWith('matrix(')), 'The fan uses flat card rotations without the discarded depth-ring layout');
  for (const progress of [.25, .5, .75, 1]) {
    await position('.films', progress);
    assert.ok(Math.abs(Number(await page.locator('.films').getAttribute('data-rotation')) - progress * 360) < .6);
    await holdStill('.film-slot');
  }
  assert.deepEqual(await readTransforms('.film-slot:not(.film-ghost)'), ringStart, 'One complete turn returns to the original arrangement');
  await position('.films', .35);
  await page.waitForFunction(() => [...document.querySelectorAll('.film-card video')].some(v => v.readyState >= 2 && Math.abs(Number(v.closest('.film-slot').dataset.offset)) <= 1));
  await page.waitForTimeout(200);
  assert.equal(await page.locator('.film-card video').evaluateAll(videos => videos.every(video => video.paused)), true);
  const framesBefore = await page.locator('.film-card video').evaluateAll(videos => videos.map(video => video.currentTime));
  await page.waitForTimeout(650);
  assert.deepEqual(await page.locator('.film-card video').evaluateAll(videos => videos.map(video => video.currentTime)), framesBefore);
  await position('.films', .55);
  assert.notDeepEqual(await page.locator('.film-card video').evaluateAll(videos => videos.map(video => video.currentTime)), framesBefore, 'Video frames follow scrolling');
  await page.screenshot({ path: 'qa/scroll/desktop-reels.png' });
  await position('.films', 0);
  await page.locator('[data-film="3"]').click();
  await page.waitForFunction(() => document.querySelector('.lightbox-video').readyState >= 2);
  assert.ok(await page.locator('.lightbox-video').evaluate(video => video.duration > 0 && !video.paused));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog[open]') && !document.body.classList.contains('modal-open'));
  await position('.films', 1);
  await page.mouse.wheel(0, 1000);
  await page.waitForTimeout(250);
  assert.ok(await page.locator('.programme').evaluate(el => el.getBoundingClientRect().top < innerHeight), 'The next section follows the completed revolution');

  await position('.worlds-sequence', .55);
  await holdStill('.theme-card');
  await position('.worlds-sequence', 1);
  await page.screenshot({ path: 'qa/scroll/desktop-worlds.png' });
  await page.locator('[data-theme="dark"]').click();
  assert.match(await page.locator('textarea[name="message"]').inputValue(), /dark side/);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog[open]') && !document.body.classList.contains('modal-open'));
  await position('.people');
  await holdStill('.people-banner-copy,.people-community-card,.tangerine-garden');
  assert.equal(await page.locator('.tangerine-garden').evaluate(img => img.complete && img.naturalWidth > 0), true);
  await page.screenshot({ path: 'qa/scroll/desktop-people.png' });
  await position('.contact', 1);
  await page.screenshot({ path: 'qa/scroll/desktop-chapter.png' });
  assert.equal(await page.locator('.chapter-stamp').count(), 3);
  await page.locator('.stamp-brand [data-enquiry]').click();
  await page.locator('input[name="name"]').fill('Scroll QA');
  await page.locator('input[name="email"]').fill('qa@example.com');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#enquiry-form button[type="submit"]').click();
  assert.equal((await downloadPromise).suggestedFilename(), 'crave-social-enquiry.txt');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog[open]') && !document.body.classList.contains('modal-open'));

  await page.evaluate(() => { const t = ScrollTrigger.getById('footer-scroll'); scrollTo({ top: t.start + (t.end - t.start) * .45, behavior: 'instant' }); });
  await page.waitForTimeout(180);
  const midway = await readTransforms('.footer-letters .char');
  assert.equal(midway.length, 11, 'Only the actual footer wordmark is animated');
  assert.ok(new Set(midway).size > 2, 'Footer letters enter individually');
  const letterOffsets = await page.locator('.footer-letters .char').evaluateAll(letters => letters.map(el => gsap.getProperty(el, 'yPercent')));
  assert.ok(letterOffsets.every((value, i) => !i || value >= letterOffsets[i - 1] - .01), 'Footer letters rise in reading order');
  await holdStill('.footer-letters .char');
  await page.screenshot({ path: 'qa/scroll/footer-midway.png' });
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(180);
  assert.equal(await page.locator('.footer-letters .char').evaluateAll(letters => letters.every(el => Number(getComputedStyle(el).opacity) > .99 && Math.abs(gsap.getProperty(el, 'yPercent')) < .01)), true);
  await page.screenshot({ path: 'qa/scroll/desktop-footer.png' });

  await page.locator('.replay-intro').click();
  await page.waitForTimeout(180);
  assert.ok(await page.evaluate(() => scrollY < 2));
  assert.equal(await page.locator('.loader').isVisible(), true);
  await page.locator('.loader-skip').click();
  await page.waitForTimeout(180);
  assert.equal(await page.locator('.loader').isVisible(), false);
  await position('.programme');
  await page.locator('#tab-bling').click();
  assert.equal(await page.locator('#tab-bling').getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#tab-haunted').getAttribute('aria-expanded'), 'true');
  await page.locator('#tab-bloom').click();
  await page.waitForTimeout(900);
  await page.locator('#panel-bloom [data-enquiry]').click();
  assert.equal(await page.locator('#enquiry-dialog').isVisible(), true);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog[open]') && !document.body.classList.contains('modal-open'));

  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await open();
    for (const [name, selector, progress] of [['haunted', '.haunted-sequence', 1], ['reels', '.films', .2], ['worlds', '.worlds-sequence', 1], ['people', '.people', 0], ['chapter', '.contact', .5], ['footer', '.footer', 1]]) {
      await position(selector, progress);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal overflow at ${width}, ${name}`);
      if (width !== 360) await page.screenshot({ path: `qa/scroll/${name}-${width}.png` });
    }
    if (width === 390) {
      await page.locator('.menu-toggle').scrollIntoViewIfNeeded();
      await page.locator('.menu-toggle').click();
      assert.equal(await page.locator('#mobile-menu').isVisible(), true);
      await page.locator('#mobile-menu a[href="#invitation"]').click();
      assert.equal(await page.locator('#mobile-menu').isVisible(), false);
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open();
  assert.equal(await page.locator('.loader').isVisible(), false);
  assert.equal(await page.locator('.haunted-card').first().evaluate(el => getComputedStyle(el).position), 'relative');
  assert.equal(await page.locator('.film-card video').evaluateAll(videos => videos.every(video => video.paused)), true);
  await page.locator('.motion-toggle').scrollIntoViewIfNeeded();
  await page.locator('.motion-toggle').click();
  await page.locator('.motion-toggle').click();
  assert.equal(await page.locator('.haunted-card').first().evaluate(el => getComputedStyle(el).position), 'relative');
  assert.equal(await page.evaluate(() => ScrollTrigger.getAll().length), 0, 'Motion cleanup leaves no pinned timelines');
  const fallbackContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const fallback = await fallbackContext.newPage();
  await fallback.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  assert.equal(await fallback.locator('.loader').isVisible(), false);
  assert.equal(await fallback.locator('.haunted-card').first().evaluate(el => getComputedStyle(el).position), 'relative');
  assert.equal(await fallback.locator('.theme-card').count(), 3);
  await fallbackContext.close();
  const missing = await page.locator('img[src]').evaluateAll(images => images.filter(img => img.complete && !img.naturalWidth).map(img => img.src));
  assert.deepEqual(missing, []);
  assert.deepEqual(issues, []);
  await writeFile('qa/scroll/results.json', JSON.stringify({ passed: true, issues, viewports: [1440, 768, 390, 360], checks: ['No picture tags or share-like arrows', 'Editorial photo loader and full foreground hero artwork', 'Idle galleries remain still', 'Reversible opposing slides', 'Lifted photo stack, paired stages and counter-moving columns', 'One full cycle within the original semicircular fan', 'Scroll-scrubbed video frames', 'Full video playback', 'Feature cards and themes', 'Tangerine community banner', 'Three postage stamps', 'Enquiry draft download', 'Letter-by-letter footer', 'Mobile navigation', 'Reduced motion and lifecycle cleanup'] }, null, 2));
  console.log('PASS: editorial photo loader, three Haunted stages, full-cycle semicircular reels and responsive interactions.');
} finally { await browser.close(); }
