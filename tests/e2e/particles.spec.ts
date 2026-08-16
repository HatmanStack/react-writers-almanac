import { test, expect, type Page } from '@playwright/test';
import { setupApiMocks } from './utils/apiMocks';
import { NavigationHelpers } from './utils/helpers';
import { MOCK_AUTHOR_NAME, MOCK_DATE, MOCK_POEM_TITLE } from './fixtures/mockData';

/**
 * The particle background reacts to the pointer, but only where the pointer
 * actually reaches its canvas.
 *
 * The canvas is `fixed … z-0`, so a *positioned* ancestor anywhere in the page
 * paints its entire box above the canvas — including the empty band either side
 * of a centred card, which reads as background but is not. The author page
 * regressed exactly that way: its root was `relative z-20`, so every drag
 * beside the card landed on that wrapper and the particles never saw it.
 *
 * jsdom cannot answer this. It has no layout and no hit testing, so
 * `elementFromPoint` there is meaningless — only a real browser can say what is
 * under a given pixel, which is why this lives in the e2e suite.
 */

const CARD = 'section[aria-label="Main content"] [class*="bg-app-container"]';

/**
 * Probe the background band beside the content card.
 *
 * Measuring and hit-testing happen together inside the page: a bounding box
 * read out here and a pixel sent back would be two views of a layout that may
 * have moved between them.
 *
 * @returns What sits at the probed pixel, prefixed PARTICLES or BLOCKED
 */
async function besideTheCard(page: Page): Promise<string> {
  // The particle layer is lazy-loaded. Probing before its canvas mounts finds
  // whatever sits under the gap it has not filled yet and calls it BLOCKED, so
  // the wait is what makes the answer mean anything.
  await page.locator('#tsparticles canvas').waitFor({ state: 'attached' });
  await page.waitForFunction(selector => !!document.querySelector(selector), CARD);

  return page.evaluate(selector => {
    const card = document.querySelector(selector)!.getBoundingClientRect();

    // Midway between the viewport edge and the card: visibly background, and
    // level with the card so the probe is beside it, not above or below.
    const x = Math.round(card.left / 2);
    const y = Math.round(card.top + Math.min(60, card.height / 2));
    if (card.left < 10) return `NO BAND beside card at left=${card.left}`;

    const el = document.elementFromPoint(x, y);
    if (!el) return `null at (${x}, ${y})`;

    const onCanvas = el.tagName === 'CANVAS' || el.closest('#tsparticles') !== null;
    const cls = typeof el.className === 'string' ? el.className : '';
    return `${onCanvas ? 'PARTICLES' : 'BLOCKED'} at (${x}, ${y}): <${el.tagName.toLowerCase()} class="${cls.slice(0, 70)}">`;
  }, CARD);
}

test.describe('Particle background', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('takes the pointer beside the author card', async ({ page }) => {
    await new NavigationHelpers(page).goToAuthor(MOCK_AUTHOR_NAME);

    expect(await besideTheCard(page)).toContain('PARTICLES');
  });

  // The two pages the author page should have matched all along.
  test('takes the pointer beside the broadcast cards', async ({ page }) => {
    await new NavigationHelpers(page).goToDate(MOCK_DATE);

    expect(await besideTheCard(page)).toContain('PARTICLES');
  });

  test('takes the pointer beside the poem-title card', async ({ page }) => {
    await new NavigationHelpers(page).goToPoemTitle(MOCK_POEM_TITLE);

    expect(await besideTheCard(page)).toContain('PARTICLES');
  });

  test('takes the pointer beside the not-found card', async ({ page }) => {
    await page.goto('/definitely/not/a/route');

    expect(await besideTheCard(page)).toContain('PARTICLES');
  });

  /*
   * The same stacking rule read the other way. A card that is *not* lifted is
   * painted behind the canvas, whose background is opaque — so it vanishes.
   * The poem-title heading did exactly that: its `z-10` sat on a section that
   * was neither positioned nor a flex item, so it never applied, and the page
   * rendered its date buttons with no title above them.
   */
  test('keeps content above the canvas rather than behind it', async ({ page }) => {
    await new NavigationHelpers(page).goToPoemTitle(MOCK_POEM_TITLE);
    await page.locator('#tsparticles canvas').waitFor({ state: 'attached' });

    const heading = page.getByRole('heading', { name: MOCK_POEM_TITLE });
    await expect(heading).toBeVisible();

    // `toBeVisible` only checks layout and CSS visibility, and a card behind an
    // opaque canvas passes that. Hit testing is what proves it is on top.
    const onTop = await page.evaluate(title => {
      const match = [...document.querySelectorAll('h2')].find(h => h.textContent === title);
      const r = match!.getBoundingClientRect();
      const el = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + 5));
      return el?.tagName !== 'CANVAS' && el?.closest('#tsparticles') === null;
    }, MOCK_POEM_TITLE);

    expect(onTop, 'the poem-title heading should not be behind the canvas').toBe(true);
  });

  test('leaves the pointer to the card itself', async ({ page }) => {
    await new NavigationHelpers(page).goToAuthor(MOCK_AUTHOR_NAME);
    await page.locator('#tsparticles canvas').waitFor({ state: 'attached' });
    await page.waitForFunction(selector => !!document.querySelector(selector), CARD);

    // Unblocking the background must not punch a hole through the content.
    const onCard = await page.evaluate(selector => {
      const card = document.querySelector(selector)!.getBoundingClientRect();
      const el = document.elementFromPoint(
        Math.round(card.left + card.width / 2),
        Math.round(card.top + 40)
      );
      return el?.closest('#tsparticles') === null && el?.tagName !== 'CANVAS';
    }, CARD);

    expect(onCard, 'the card should still receive the pointer').toBe(true);
  });
});
