/**
 * Playwright config para validação Nyquist — permite reuseExistingServer.
 * Usado apenas para rodar testes de validação de gaps contra servidor já iniciado.
 * NÃO substituir playwright.config.js (este é o config de CI/CD).
 */
import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.test', override: true })

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  globalSetup: './e2e/global-setup.mjs',
  globalTeardown: './e2e/global-teardown.mjs',

  webServer: {
    // Porta 3001 para não conflitar com o servidor de desenvolvimento na 3000
    command: `NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL} NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY} npm run build && NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL} NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY} SUPABASE_JWT=${process.env.SUPABASE_JWT} SUPABASE_ROLE_KEY=${process.env.SUPABASE_ROLE_KEY} SITE_URL=http://localhost:3001 npm run start -- --port 3001`,
    url: 'http://localhost:3001',
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
