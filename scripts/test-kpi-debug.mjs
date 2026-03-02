import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('URL after load:', page.url());
  
  // Check if auth page
  const hasEmailInput = await page.locator('input[type="email"]').isVisible({ timeout: 3000 }).catch(() => false);
  console.log('Has email input:', hasEmailInput);

  if (hasEmailInput) {
    await page.fill('input[type="email"]', 'vinicius@ionixtech.com.br');
    await page.fill('input[type="password"]', 'Compas2025!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    console.log('URL after login:', page.url());
  }

  // Navigate to /kpis
  await page.goto('http://localhost:8080/kpis', { waitUntil: 'networkidle', timeout: 15000 });
  console.log('URL at /kpis:', page.url());
  
  // Debug page content
  const bodyText = await page.locator('body').innerText().catch(() => 'COULD NOT GET TEXT');
  console.log('Page text (first 1000 chars):', bodyText.substring(0, 1000));
  
  await page.screenshot({ path: 'scripts/debug-kpi-page.png' });
  console.log('Screenshot saved.');

  await page.waitForTimeout(3000);
  await browser.close();
}

run();
