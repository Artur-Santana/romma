import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.test' })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const TEST_EMAIL = 'e2e-signup-p10@test.romma.local'
const TEST_PASSWORD = 'Test1234!'

async function removeTestUser() {
  const { data: list } = await admin.auth.admin.listUsers()
  const existing = list.users.find(u => u.email === TEST_EMAIL)
  if (existing) {
    await admin.auth.admin.deleteUser(existing.id)
  }
}

test.describe('Phase 10 — Signup Proprietário', () => {
  test.describe.configure({ mode: 'serial' })

  // AUTH-01 — happy-path: qualquer usuário pode se cadastrar → estado email_sent
  test.describe('AUTH-01 — happy-path: email_sent', () => {
    test.beforeAll(async () => {
      await removeTestUser()
    })

    test.afterAll(async () => {
      try {
        await removeTestUser()
      } catch (_) {
        // cleanup best-effort
      }
    })

    test('AUTH-01 — signup exibe estado email_sent após submit válido', async ({ page }) => {
      await page.goto('/signup')

      await page.getByLabel(/e-mail/i).fill(TEST_EMAIL)
      await page.getByLabel(/senha/i).fill(TEST_PASSWORD)

      await page.getByRole('button', { name: /configurar|cadastrar|criar|enviar/i }).click()

      // D-05: Sem redirect — URL permanece em /signup
      await page.waitForTimeout(2000)
      expect(page.url()).toContain('/signup')

      // Estado email_sent: banner "VERIFIQUE SEU EMAIL"
      await expect(
        page.getByText(/verifique seu email/i)
      ).toBeVisible({ timeout: 10_000 })
    })
  })
})
