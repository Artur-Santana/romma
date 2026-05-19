import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.test', override: true })

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  globalSetup: './e2e/global-setup.js',

  webServer: {
    // Vars explícitas no comando garantem override de .env.local no build do Next.js
    command: `NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL} NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY} npm run build && NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL} NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY} SUPABASE_JWT=${process.env.SUPABASE_JWT} SUPABASE_ROLE_KEY=${process.env.SUPABASE_ROLE_KEY} SITE_URL=${process.env.SITE_URL} npm run start`,
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
