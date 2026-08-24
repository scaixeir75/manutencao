const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { authStatePathFor, authProfileDirFor } = require('./auth-state');

const APP_URL = process.env.PMP_TEST_BASE_URL || 'https://scaixeir75.github.io/manutencao/';
const AUTH_FILE = authStatePathFor(APP_URL);
const AUTH_DIR = path.dirname(AUTH_FILE);
const AUTH_PROFILE_DIR = authProfileDirFor(APP_URL);

async function main() {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const context = await chromium.launchPersistentContext(AUTH_PROFILE_DIR, { headless: false });
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
    profileDir: AUTH_PROFILE_DIR,
    storageState: snapshot
  }, null, 2));

  console.log(`AUTH_STATE_SAVED=${AUTH_FILE}`);
  await context.close();
}

main().catch(error => {
  console.error(`AUTH_MANUAL_SETUP_FAILED=${error?.message || error}`);
  process.exit(1);
});
