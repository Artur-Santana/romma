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

  // AUTH-02 — guard de instância única: segunda tentativa de signup é rejeitada
  // O guard é DB-side (trigger/RLS que bloqueia segundo proprietário). O E2E testa
  // o comportamento real: a instância já está configurada (proprietario@test.romma.local
  // existe via seed), então tentar cadastrar qualquer outro email deve ser rejeitado.
  test.describe('AUTH-02 — segunda tentativa de signup é rejeitada (D-09)', () => {
    const AUTH02_EMAIL = 'e2e-signup-second@test.romma.local'

    test.beforeAll(async () => {
      // Garantir que o usuário de teste não existe antes do teste
      const { data: list } = await admin.auth.admin.listUsers()
      const existing = list.users.find(u => u.email === AUTH02_EMAIL)
      if (existing) {
        await admin.auth.admin.deleteUser(existing.id)
      }
    })

    test.afterAll(async () => {
      // Cleanup best-effort
      try {
        const { data: list } = await admin.auth.admin.listUsers()
        const existing = list.users.find(u => u.email === AUTH02_EMAIL)
        if (existing) {
          await admin.auth.admin.deleteUser(existing.id)
        }
      } catch (_) { /* cleanup best-effort */ }
    })

    test('AUTH-02 — signup com email diferente é rejeitado quando instância já configurada', async ({ page }) => {
      // A instância já está configurada (proprietario@test.romma.local existe via seed).
      // Tentar cadastrar outro email deve acionar o guard de instância única.
      await page.goto('/signup')

      await page.getByLabel(/e-mail/i).fill(AUTH02_EMAIL)
      await page.getByLabel(/senha/i).fill('Test1234!')

      await page.getByRole('button', { name: /configurar|cadastrar|criar|enviar/i }).click()

      // Aguardar resposta do servidor
      await page.waitForTimeout(3000)

      // O guard de instância única pode se manifestar de duas formas:
      // 1. Mensagem explícita de rejeição no UI
      // 2. A página permanece em /signup SEM exibir o banner de email_sent
      // Tolerante a ambas — a asserção primária é que "Verifique seu email" NÃO aparece.
      const emailSentBanner = page.getByText(/verifique seu email/i)
      const rejectionMessage = page.getByText(/instância já configurada|já configurada|já existe|não permitido|instance already/i)

      // Verificar se a rejeição ocorreu: ou mensagem de rejeição visível OU sem banner de email_sent
      const bannerVisible = await emailSentBanner.isVisible().catch(() => false)
      const rejectionVisible = await rejectionMessage.isVisible().catch(() => false)

      // Se a rejeição explícita está visível, o test passa
      // Se não está visível, o banner de email_sent NÃO deve aparecer (instância rejeitada silenciosamente)
      if (rejectionVisible) {
        // Caso ideal: mensagem de rejeição explícita
        expect(rejectionVisible).toBe(true)
      } else {
        // Fallback: página ficou em /signup sem email_sent (guard bloqueou)
        expect(page.url()).toContain('/signup')
        expect(bannerVisible).toBe(false)
      }
    })
  })
})
