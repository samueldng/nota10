const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  // 1. Login page
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot-login.png', fullPage: false });
  console.log('✅ Login page captured');

  // 2. Login as parent to see portal sidebar
  await page.fill('input[type="text"]', '0123');
  await page.fill('input[type="password"]', '123456');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Should be on /responsavel, redirect to /portal
  await page.goto('http://localhost:3000/portal');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot-portal.png', fullPage: false });
  console.log('✅ Portal page captured');

  // 3. Login as admin to see admin sidebar
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(1000);
  // Switch to admin tab
  const switchBtn = page.locator('button:has-text("Área do Professor")');
  if (await switchBtn.isVisible()) {
    await switchBtn.click();
    await page.waitForTimeout(500);
  }
  await page.fill('input[type="email"]', 'admin@nota10.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshot-admin.png', fullPage: false });
  console.log('✅ Admin page captured');

  await browser.close();
  console.log('Done!');
})();
