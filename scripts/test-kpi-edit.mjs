/**
 * Playwright test: Verify KPI edit mode resets when switching between KPIs.
 */
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8080';
const EMAIL = 'vinicius@ionixtech.com.br';
const PASSWORD = 'Compas2025!';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {
    // ---- Step 1 & 2: Log in ----
    console.log('[1/8] Navigating to auth page...');
    await page.goto(BASE_URL + '/auth', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('[2/8] Logging in...');
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    // Wait for redirect away from auth
    await page.waitForURL((url) => !url.toString().includes('/auth'), { timeout: 15000 });
    console.log('       Logged in. URL:', page.url());

    // ---- Step 3: Navigate to KPIs page ----
    console.log('[3/8] Navigating to KPIs page...');
    await page.goto(BASE_URL + '/kpis', { waitUntil: 'networkidle', timeout: 15000 });
    console.log('       URL:', page.url());

    // Wait for the page heading
    await page.waitForSelector('text=Indicadores', { timeout: 10000 });
    console.log('       KPIs page loaded.');

    // Wait for data to load
    await page.waitForTimeout(3000);

    // Find clickable KPI rows
    let rows = page.locator('tr.cursor-pointer');
    let rowCount = await rows.count();
    console.log('       Found ' + rowCount + ' clickable KPI rows in default tab.');

    if (rowCount < 2) {
      // Click through tabs to find one with 2+ rows
      const tabTriggers = page.locator('[role="tablist"] button, [role="tablist"] [role="tab"]');
      const tabCount = await tabTriggers.count();
      console.log('       Checking ' + tabCount + ' tabs...');
      for (let i = 0; i < tabCount; i++) {
        await tabTriggers.nth(i).click();
        await page.waitForTimeout(1500);
        rowCount = await rows.count();
        const tabText = (await tabTriggers.nth(i).textContent() || '').trim();
        console.log('       Tab "' + tabText + '": ' + rowCount + ' rows');
        if (rowCount >= 2) break;
      }
    }

    if (rowCount < 2) {
      throw new Error('Need at least 2 KPI rows, found ' + rowCount);
    }

    // ---- Step 4: Open first KPI ----
    console.log('[4/8] Opening first KPI...');
    const firstText = (await rows.nth(0).locator('td').first().textContent() || '').trim();
    const secondText = (await rows.nth(1).locator('td').first().textContent() || '').trim();
    console.log('       First: "' + firstText + '"');
    console.log('       Second: "' + secondText + '"');

    await rows.nth(0).click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await page.waitForTimeout(1500);
    console.log('       Dialog opened.');

    // ---- Step 5: Enter edit mode ----
    console.log('[5/8] Entering edit mode...');
    // Try title="Editar" first, then fallback
    let editBtn = page.locator('[role="dialog"] button[title="Editar"]');
    if (!(await editBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
      // Try finding by the pencil icon class
      editBtn = page.locator('[role="dialog"] button:has(svg)').filter({ hasText: '' }).nth(0);
      // Actually let's just look for any small ghost button with an SVG near the dialog header
      const allBtns = page.locator('[role="dialog"] button');
      const btnCount = await allBtns.count();
      console.log('       Dialog has ' + btnCount + ' buttons. Looking for edit...');
      for (let i = 0; i < btnCount; i++) {
        const title = await allBtns.nth(i).getAttribute('title');
        const text = (await allBtns.nth(i).textContent() || '').trim();
        console.log('         btn[' + i + '] title="' + title + '" text="' + text + '"');
      }
      throw new Error('Could not find edit button');
    }
    await editBtn.click();

    const saveBtn = page.locator('[role="dialog"] button:has-text("Salvar")');
    await saveBtn.waitFor({ timeout: 3000 });
    console.log('       Edit mode active.');

    // ---- Step 6: Close without saving ----
    console.log('[6/8] Closing dialog (Escape)...');
    await page.keyboard.press('Escape');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
    console.log('       Dialog closed.');
    await page.waitForTimeout(500);

    // ---- Step 7: Open second KPI ----
    console.log('[7/8] Opening second KPI...');
    await rows.nth(1).click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await page.waitForTimeout(1500);
    console.log('       Second dialog opened.');

    // ---- Step 8: Verify READ mode ----
    console.log('[8/8] Checking mode...');

    const editBtnVisible = await page.locator('[role="dialog"] button[title="Editar"]')
      .isVisible({ timeout: 3000 }).catch(() => false);
    const saveBtnVisible = await page.locator('[role="dialog"] button:has-text("Salvar")')
      .isVisible().catch(() => false);
    const cancelBtnVisible = await page.locator('[role="dialog"] button:has-text("Cancelar")')
      .isVisible().catch(() => false);

    console.log('');
    console.log('  --- Results ---');
    console.log('  Edit (pencil) button visible: ' + editBtnVisible);
    console.log('  Save button visible:          ' + saveBtnVisible);
    console.log('  Cancel button visible:        ' + cancelBtnVisible);
    console.log('');

    if (!saveBtnVisible && !cancelBtnVisible) {
      console.log('  PASS: Second KPI opened in READ mode. Bug fix confirmed working.');
    } else {
      console.log('  FAIL: Second KPI opened in EDIT mode. Bug is still present!');
      process.exitCode = 1;
    }

  } catch (err) {
    console.error('ERROR:', err.message);
    await page.screenshot({ path: 'scripts/test-kpi-error.png' }).catch(() => {});
    console.log('       Screenshot saved to scripts/test-kpi-error.png');
    process.exitCode = 1;
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

run();
