module.exports = {
  testDir: './tests',
  timeout: 90000,
  expect: { timeout: 15000 },
  use: {
    baseURL: process.env.PMP_TEST_BASE_URL || 'https://scaixeir75.github.io/manutencao/',
    headless: true,
    trace: 'retain-on-failure'
  },
  reporter: [['list']]
};
