const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

function loadLocalEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] == null) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
}

function diagnosticsPath(name) {
  const reportDir = path.join(__dirname, 'reports');
  fs.mkdirSync(reportDir, { recursive: true });
  return path.join(reportDir, name);
}

async function collectLoginDiagnostics(page, events) {
  const selectorState = {};
  for (const selector of ['#loginEmail', '#loginPass', '#loginBtn', '#loginErr', '#planAiInput']) {
    selectorState[selector] = {
      count: await page.locator(selector).count().catch(() => -1),
      visible: await page.locator(selector).first().isVisible().catch(() => false)
    };
  }
  return {
    url: page.url(),
    title: await page.title().catch(() => ''),
    selectors: selectorState,
    loginErr: await page.locator('#loginErr').innerText().catch(() => ''),
    consoleErrors: events.consoleErrors,
    pageErrors: events.pageErrors,
    requestFailures: events.requestFailures,
    responseErrors: events.responseErrors,
    credentialsShape: events.credentialsShape
  };
}

async function askAi(page, prompt) {
  if (await page.locator('#loginScreen').isVisible().catch(() => false)) {
    throw new Error('O ecrã de login está visível antes de perguntar à IA.');
  }
  const input = page.locator('#planAiInput');
  await input.fill(prompt);
  await page.locator('#planAiGenerateBtn').click();
  const response = page.locator('#planAiResponse, #planAiSuggestion').first();
  await expect.poll(async () => (await response.textContent().catch(() => '')).trim(), { timeout: 15000 }).not.toMatch(/A resposta aparecerá aqui|^\s*$/);
  return (await response.textContent()).trim();
}

async function askAiWithHistoryRetry(page, prompt, options = {}) {
  const first = await askAi(page, prompt);
  if (!options.retryOnInsufficient || !/Informação insuficiente/i.test(first)) {
    return { response: first, retry: false };
  }
  await page.waitForTimeout(options.retryDelayMs || 2500);
  const second = await askAi(page, prompt);
  return { response: second, retry: true, firstResponse: first };
}

async function login(page) {
  const events = { consoleErrors: [], pageErrors: [], requestFailures: [], responseErrors: [], credentialsShape: {} };
  page.on('console', msg => {
    if (msg.type() === 'error') events.consoleErrors.push(msg.text().slice(0, 500));
  });
  page.on('pageerror', err => events.pageErrors.push(String(err.message || err).slice(0, 500)));
  page.on('requestfailed', req => {
    const url = req.url();
    if (/firebase|googleapis|github|manutencao|identitytoolkit/i.test(url)) {
      events.requestFailures.push({ url, method: req.method(), failure: req.failure()?.errorText || '' });
    }
  });
  page.on('response', async res => {
    const url = res.url();
    if (res.status() < 400 || !/firebase|googleapis|identitytoolkit/i.test(url)) return;
    let message = '';
    try {
      const body = await res.json();
      message = String(body?.error?.message || '').slice(0, 200);
    } catch (_) {}
    events.responseErrors.push({ url, status: res.status(), message });
  });

  loadLocalEnv();
  const email = process.env.PMP_TEST_EMAIL;
  const password = process.env.PMP_TEST_PASSWORD;
  if (!email || !password) test.skip(true, 'Definir PMP_TEST_EMAIL e PMP_TEST_PASSWORD em .env.local');
  events.credentialsShape = {
    emailLength: email.length,
    passwordLength: password.length,
    emailHasOuterWhitespace: email !== email.trim(),
    passwordHasOuterWhitespace: password !== password.trim()
  };

  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const aiInput = page.locator('#planAiInput');
  const loginScreen = page.locator('#loginScreen');
  const loginEmail = page.locator('#loginEmail');
  const loginPass = page.locator('#loginPass');
  const loginBtn = page.locator('#loginBtn');

  const firstState = await Promise.race([
    aiInput.waitFor({ state: 'visible', timeout: 30000 }).then(() => 'app').catch(() => null),
    loginEmail.waitFor({ state: 'visible', timeout: 30000 }).then(() => 'login').catch(() => null)
  ]);

  if (firstState === 'app') await page.waitForTimeout(1500);
  const needsLogin = await loginScreen.isVisible().catch(() => false);
  if (firstState === 'app' && !needsLogin) {
    await page.waitForTimeout(2500);
    return;
  }
  if (needsLogin) {
    await loginEmail.waitFor({ state: 'visible', timeout: 10000 });
  } else if (firstState !== 'login') {
    fs.writeFileSync(diagnosticsPath('ai-login-diagnostics.json'), JSON.stringify(await collectLoginDiagnostics(page, events), null, 2));
    await page.screenshot({ path: diagnosticsPath('app-not-ready.png'), fullPage: true }).catch(() => {});
    throw new Error('A app não apresentou nem o painel IA nem o formulário de login.');
  }

  await loginEmail.fill(email);
  await loginPass.fill(password);
  await loginBtn.click();
  try {
    await expect.poll(async () => {
      if (!(await loginScreen.isVisible().catch(() => false))) return 'ok';
      const err = await page.locator('#loginErr').innerText().catch(() => '');
      return err.trim() || 'login visível';
    }, { message: 'Login falhou ou o ecrã de login não desapareceu.', timeout: 30000 }).toBe('ok');
  } catch (error) {
    await loginPass.fill('').catch(() => {});
    fs.writeFileSync(diagnosticsPath('ai-login-diagnostics.json'), JSON.stringify(await collectLoginDiagnostics(page, events), null, 2));
    await page.screenshot({ path: diagnosticsPath('login-failed.png'), fullPage: true }).catch(() => {});
    throw error;
  }
  await page.waitForTimeout(2500);
  await expect(aiInput, 'A app não carregou o painel IA após o login.').toBeVisible({ timeout: 30000 });
}

const make = category => (prompt, validate, criteria = [], options = {}) => ({ category, prompt, validate, criteria, ...options });

test('IA regressão histórica apenas leitura', async ({ page }) => {
  await login(page);
  const report = [];
  const base = make('regressao-base');
  const negative = make('regressao-palavra-completa');
  const ficha = make('ficha');
  const count = make('contagens');
  const period = make('periodos');
  const ranking = make('ranking-recorrencia');

  const cases = [
    base('Problema para identificar', text => expect(text).toContain('Informação insuficiente'), ['insufficient']),
    base('sal', text => { expect(text).not.toContain('Informação insuficiente'); expect(text.toLowerCase()).toContain('sal'); expect(text.toLowerCase()).not.toContain('sala'); }, ['whole-word', 'sal-not-sala']),
    base('Quantas vezes coloquei sal', text => { expect(text).toMatch(/\d/); expect(text.toLowerCase()).not.toContain('sala'); }, ['count', 'sal-not-sala']),
    base('Quando foi a última vez que coloquei sal?', text => { expect(text).toMatch(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/); expect(text.toLowerCase()).toContain('sal'); expect(text).not.toContain('Informação insuficiente'); }, ['last-record', 'whole-word']),
    base('Quando foi a última manutenção da Ficha 20?', text => { expect(text).toContain('Ficha 20'); expect(text).toMatch(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|registo/i); }, ['last-ficha-record'], { retryOnInsufficient: true }),
    base('Que intervenções houve na Ficha 29?', text => { expect(text).toContain('Ficha 29'); expect(text).not.toMatch(/^\s*$/); }, ['ficha-history']),
    base('Que fichas tiveram mais anomalias este mês?', text => { expect(text).toMatch(/Ficha|Informação insuficiente|registo/i); expect(text).not.toContain('Pendentes:'); }, ['ranking', 'period', 'not-pending-branch']),
    base('Quais são os equipamentos com mais recorrência?', text => { expect(text).toMatch(/Ficha|registo|Informação insuficiente/i); }, ['recurrence-ranking']),
    base('corte de água', text => { expect(text.toLowerCase()).toMatch(/corte|interrup|falta/); expect(text.toLowerCase()).not.toContain('corte da relva'); expect(text.toLowerCase()).not.toContain('iluminação'); expect(text.toLowerCase()).not.toContain('luminária'); }, ['related-search', 'water-not-lawn']),
    base('Autoclismo', text => { expect(text).toMatch(/Ficha 29|Instalações Sanitárias/); expect(text).toMatch(/registos relacionados|Ocorrência recente|recorrência|histórico/i); }, ['technical-relation', 'history']),
    base('A ficha 20 tem anomalias pendentes?', text => { expect(text).toMatch(/0|não existem|nao existem/i); expect(text).not.toMatch(/Pendentes:\s*Ficha 20/i); }, ['pending-anomalies', 'ficha-scope']),
    base('Quantas anomalias pendentes existem?', text => { expect(text.toLowerCase()).toContain('anomalia'); expect(text.toLowerCase()).toContain('pendente'); expect(text).not.toMatch(/Pendentes:\s*$/); }, ['pending-anomalies', 'no-empty-title']),
    negative('verificar', text => expect(text).toContain('Informação insuficiente'), ['generic-insufficient']),
    negative('problema', text => { expect(text).not.toMatch(/Ficha provável|Usar ficha sugerida/i); expect(text).toMatch(/Informação insuficiente|Confirmação humana necessária/i); }, ['generic-cautious']),
    negative('sala', text => { expect(text.toLowerCase()).not.toContain('descalcificador'); expect(text.toLowerCase()).not.toContain('colocação de sal'); }, ['sala-not-sal']),
    negative('corte da relva', text => { expect(text.toLowerCase()).not.toMatch(/interrup.*água|corte de água|falta de água/); }, ['lawn-not-water-cut']),
    negative('Ficha 999', text => expect(text).toMatch(/Informação insuficiente|inexist|sem registos|0 registo/i), ['unknown-ficha']),
    negative('equipamento inexistente', text => expect(text).toMatch(/Informação insuficiente|sem registos|0 registo/i), ['unknown-equipment']),
    negative('avaria no helicóptero', text => expect(text).toMatch(/Informação insuficiente|sem registos|0 registo/i), ['unknown-technical-topic']),
    ficha('Histórico da Ficha 20', text => { expect(text).toContain('Ficha 20'); expect(text).toMatch(/registo|Ocorrências recentes/i); }, ['ficha20-history']),
    ficha('Último registo da Ficha 20', text => { expect(text).toContain('Ficha 20'); expect(text).toMatch(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/); }, ['ficha20-last']),
    ficha('Que intervenções houve na Ficha 20?', text => { expect(text).toContain('Ficha 20'); expect(text).toMatch(/registo|Ocorrências recentes/i); }, ['ficha20-interventions']),
    ficha('Histórico da Ficha 29', text => { expect(text).toContain('Ficha 29'); expect(text).toMatch(/registo|Ocorrências recentes/i); }, ['ficha29-history']),
    ficha('Última intervenção no autoclismo', text => { expect(text.toLowerCase()).toContain('autoclismo'); expect(text).toMatch(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/); }, ['autoclismo-last']),
    count('Quantos registos tem a Ficha 20?', text => { expect(text).toContain('Ficha 20'); expect(text).toMatch(/\d/); }, ['ficha-count']),
    count('Quantas vezes houve autoclismo?', text => { expect(text).not.toContain('Informação insuficiente'); expect(text).toMatch(/\d/); }, ['term-count']),
    count('Quantas anomalias houve este mês?', text => { expect(text).toMatch(/anomalia|registo|Informação insuficiente/i); expect(text).not.toContain('Pendentes:'); }, ['anomaly-count-period', 'not-pending-branch']),
    period('Que registos houve esta semana?', text => expect(text).toMatch(/registo|Ficha|Informação insuficiente/i), ['this-week']),
    period('Que anomalias houve este mês?', text => { expect(text).toMatch(/anomalia|Ficha|Informação insuficiente/i); expect(text).not.toContain('Pendentes:'); }, ['this-month-anomalies', 'not-pending-branch']),
    period('Que fichas tiveram mais registos este mês?', text => expect(text).toMatch(/Ficha|registo|Informação insuficiente/i), ['this-month-ranking']),
    period('Últimos 7 dias', text => expect(text).toMatch(/registo|Ficha|Informação insuficiente/i), ['last-7-days']),
    period('Últimos 30 dias', text => expect(text).toMatch(/registo|Ficha|Informação insuficiente/i), ['last-30-days']),
    ranking('Mostra problemas repetidos por ficha', text => expect(text).toMatch(/Ficha|registo|Informação insuficiente/i), ['repeated-by-ficha']),
    ranking('Que fichas tiveram mais anomalias?', text => expect(text).toMatch(/Ficha|anomalia|Informação insuficiente/i), ['anomaly-ranking']),
    ranking('Quais são as fichas mais críticas?', text => expect(text).toMatch(/Ficha|anomalia|registo|Informação insuficiente/i), ['critical-fichas']),
    ranking('Que fichas tiveram mais registos?', text => expect(text).toMatch(/Ficha|registo|Informação insuficiente/i), ['record-ranking'])
  ];

  for (const item of cases) {
    const entry = { mode: 'headed', category: item.category, prompt: item.prompt, criteria: item.criteria, status: 'FAIL', passed: false, response: '', error: '', retry: false };
    try {
      const result = await askAiWithHistoryRetry(page, item.prompt, { retryOnInsufficient: item.retryOnInsufficient });
      entry.response = result.response;
      entry.retry = result.retry;
      if (result.firstResponse) entry.firstResponse = result.firstResponse;
      item.validate(entry.response);
      entry.status = result.retry ? 'FAIL_HIDRATACAO' : 'PASS';
      entry.passed = true;
    } catch (error) {
      entry.status = item.retryOnInsufficient && /Informação insuficiente/i.test(entry.response) ? 'FAIL_FUNCIONAL' : 'FAIL';
      entry.error = String(error?.message || error);
    }
    report.push(entry);
  }

  const probes = [];
  for (const prompt of ['Último registo da Ficha 20', 'Histórico da Ficha 20', 'Que intervenções houve na Ficha 20?']) {
    const entry = { mode: 'headed', category: 'diagnostic', prompt, response: '', error: '' };
    try {
      entry.response = await askAi(page, prompt);
    } catch (error) {
      entry.error = String(error?.message || error);
    }
    probes.push(entry);
  }

  const reportDir = path.join(__dirname, 'reports');
  fs.mkdirSync(reportDir, { recursive: true });
  const failed = report.filter(item => !item.passed);
  fs.writeFileSync(path.join(reportDir, 'ai-regression-report.json'), JSON.stringify({
    createdAt: new Date().toISOString(),
    mode: 'headed',
    total: report.length,
    pass: report.length - failed.length,
    fail: failed.length,
    cases: report,
    probes
  }, null, 2));
  expect(failed, `${failed.length} prompt(s) falharam; ver tests/reports/ai-regression-report.json`).toEqual([]);
});
