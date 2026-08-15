const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const APP_URL = process.env.PMP_TEST_BASE_URL || 'https://scaixeir75.github.io/manutencao/';
const AUTH_DIR = path.join(__dirname, '..', '.auth');
const AUTH_FILE = path.join(AUTH_DIR, 'pmp-auth.json');

async function main() {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Abrir app para autenticação manual...');
  console.log('Faz login manualmente na janela aberta. A sessão será guardada quando o painel IA estiver visível.');

  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  await page.locator('#planAiInput').waitFor({ state: 'visible', timeout: 0 });
  await page.waitForFunction(
    () => {
      const login = document.querySelector('#loginScreen');
      if (!login) return true;
      const style = window.getComputedStyle(login);
      return login.classList.contains('hidden') || style.display === 'none' || style.visibility === 'hidden';
    },
    null,
    { timeout: 0 }
  );
  const snapshot = await context.storageState();
  fs.writeFileSync(AUTH_FILE, JSON.stringify({
    createdAt: new Date().toISOString(),
    baseURL: APP_URL,
    storageState: snapshot
  }, null, 2));

  console.log(`AUTH_STATE_SAVED=${AUTH_FILE}`);
  await browser.close();
}

main().catch(error => {
  console.error(`AUTH_MANUAL_SETUP_FAILED=${error?.message || error}`);
  process.exit(1);
});
