import { defineConfig } from '@playwright/test'

// Smoke tests against a deployed URL: BASE_URL=https://<sub>.dr4w.io API_URL=<execute-api url>
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 2,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: process.env.BASE_URL ?? 'http://localhost:5173' },
})
