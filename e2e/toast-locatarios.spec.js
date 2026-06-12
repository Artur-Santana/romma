/**
 * ANIM-03 — Toast: Locatários (split from toast-feedback.spec.js — D-10)
 *
 * Asserts that sonner toast.success() appears after locatário actions:
 *   - "Acesso revogado"
 *
 * Requires: locatario fixture — fresh per test (created inline per original pattern)
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { login } from './helpers.js'
import { PROPRIETARIO } from './fixtures.js'

config({ path: '.env.test' })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

test.describe('ANIM-03 — Toast Locatários', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  // ─── Toast: Revogar acesso ─────────────────────────────────────────────────────

  test('ANIM-03.4 — toast "Acesso revogado" após revogar locatário', async ({ page }) => {
    // Locatário DEDICADO sem contrato: revogarConvite retorna 400 se houver contratos
    // vinculados (qualquer status). Criamos um fresh pendente sem contrato para revogar.
    const { data: prop } = await admin.from('proprietarios').select('usuario_id').limit(1).single()
    const revEmail = 'e2e-toastl-revogar@test.romma.local'
    const { data: list } = await admin.auth.admin.listUsers()
    const existingRev = list.users.find(u => u.email === revEmail)
    let revUserId
    if (existingRev) {
      revUserId = existingRev.id
    } else {
      const { data } = await admin.auth.admin.createUser({ email: revEmail, password: 'Test1234!', email_confirm: true })
      revUserId = data.user.id
    }
    await admin.from('locatarios').delete().eq('usuario_id', revUserId)
    await admin.from('locatarios').insert({
      usuario_id: revUserId,
      proprietario_id: prop.usuario_id,
      nome_razao_social: 'E2E-ToastL Revogar',
      tipo: 'pf',
      documento: '99988877700',
      email: revEmail,
      telefone: '11222222200',
      status_convite: 'pendente',
    })

    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 15_000 })
    await page.goto('/dashboard/locatarios')
    await page.waitForURL('**/dashboard/locatarios', { timeout: 10_000 })

    const row = page.getByText('E2E-ToastL Revogar').locator('../..')
    await expect(row).toBeVisible({ timeout: 10_000 })
    await row.getByRole('button', { name: 'REVOGAR' }).click()

    // ANIM-03: toast.success("Acesso revogado") wired no LocatariosDesktop
    await expect(page.getByText('Acesso revogado')).toBeVisible({ timeout: 10_000 })

    // Cleanup — revogarConvite já deletou se sucesso; best-effort caso falhe
    try {
      await admin.from('locatarios').delete().eq('usuario_id', revUserId)
      await admin.auth.admin.deleteUser(revUserId)
    } catch { /* cleanup best-effort */ }
  })
})
