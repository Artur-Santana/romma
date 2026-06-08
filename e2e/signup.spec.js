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

/**
 * Remove o usuário de teste de auth.users (se existir).
 * NÃO toca nos usuários PROPRIETARIO/LOCATARIO de seed.
 */
async function removeTestUser() {
  const { data: list } = await admin.auth.admin.listUsers()
  const existing = list.users.find(u => u.email === TEST_EMAIL)
  if (existing) {
    await admin.auth.admin.deleteUser(existing.id)
  }
}

test.describe('Phase 10 — Signup Proprietário', () => {
  test.describe.configure({ mode: 'serial' })

  // -----------------------------------------------------------------
  // AUTH-01 — happy-path: instância limpa → estado email_sent
  // -----------------------------------------------------------------
  test.describe('AUTH-01 — happy-path: email_sent', () => {
    // Rows de proprietarios capturadas antes do delete (para restore)
    let savedProprietarios = []

    test.beforeAll(async () => {
      // 1. Garantir que o usuário de teste não existe
      await removeTestUser()

      // 2. Salvar todas as rows existentes em proprietarios (geralmente 1: o seed)
      const { data: rows, error } = await admin.from('proprietarios').select('*')
      if (error) throw error
      savedProprietarios = rows ?? []

      // 3. Limpar a tabela proprietarios para garantir instância limpa
      if (savedProprietarios.length > 0) {
        const ids = savedProprietarios.map(r => r.id)
        await admin.from('proprietarios').delete().in('id', ids)
      }
    })

    test.afterAll(async () => {
      // Restaurar as rows de proprietarios exatamente como estavam
      if (savedProprietarios.length > 0) {
        await admin.from('proprietarios').upsert(savedProprietarios, { onConflict: 'usuario_id' })
      }

      // Remover usuário de teste criado pelo signup (se email confirmação criou entry)
      await removeTestUser()
    })

    test('AUTH-01 — signup com instância limpa exibe estado email_sent', async ({ page }) => {
      await page.goto('/signup')

      // Preencher formulário
      await page.getByLabel(/e-mail/i).fill(TEST_EMAIL)
      await page.getByLabel(/senha/i).fill(TEST_PASSWORD)

      // Submeter
      await page.getByRole('button', { name: /configurar|cadastrar|criar|enviar/i }).click()

      // D-05: Sem redirect — URL permanece em /signup
      await page.waitForTimeout(2000)
      expect(page.url()).toContain('/signup')

      // Estado email_sent: botão ou banner com "VERIFIQUE SEU EMAIL"
      await expect(
        page.getByText(/verifique seu email/i)
      ).toBeVisible({ timeout: 10_000 })
    })
  })

  // -----------------------------------------------------------------
  // AUTH-02 — guard: instância já configurada → banner locked (409)
  // -----------------------------------------------------------------
  test.describe('AUTH-02 — guard: instância já configurada (locked)', () => {
    // usuario_id do proprietário de seed (obtido via auth.users pelo email do fixture)
    let seedProprietarioId = null
    let insertedRowId = null

    test.beforeAll(async () => {
      // Verificar se já existe uma row em proprietarios — se sim, o guard já funciona.
      // Se não existir, inserir uma row usando o usuario_id do proprietário de seed.
      const { data: existing } = await admin.from('proprietarios').select('id, usuario_id')
      if (existing && existing.length > 0) {
        // instância já configurada — não precisamos inserir
        insertedRowId = null
        return
      }

      // Buscar usuario_id do proprietário de seed
      const { data: list } = await admin.auth.admin.listUsers()
      const seedUser = list.users.find(u => u.email === 'proprietario@test.romma.local')
      if (!seedUser) throw new Error('Usuário de seed proprietario@test.romma.local não encontrado')
      seedProprietarioId = seedUser.id

      // Inserir row em proprietarios para simular instância configurada
      const { data: row, error } = await admin
        .from('proprietarios')
        .insert({ usuario_id: seedProprietarioId })
        .select()
        .single()
      if (error) throw error
      insertedRowId = row.id
    })

    test.afterAll(async () => {
      // Remover apenas a row que inserimos (se inserimos)
      if (insertedRowId) {
        await admin.from('proprietarios').delete().eq('id', insertedRowId)
      }
    })

    test('AUTH-02 — guard exibe banner INSTANCIA_BLOQUEADA quando instância já configurada', async ({ page }) => {
      await page.goto('/signup')

      // Banner terminal: "INSTANCIA_BLOQUEADA · 409"
      await expect(
        page.getByText(/INSTANCIA_BLOQUEADA.*409|instância.*bloqueada/i)
      ).toBeVisible({ timeout: 10_000 })

      // Mensagem do body
      await expect(
        page.getByText(/Esta instância já possui um Proprietário configurado\./i)
      ).toBeVisible({ timeout: 10_000 })

      // Link "Ir para login →"
      const loginLink = page.getByRole('link', { name: /ir para login/i })
      await expect(loginLink).toBeVisible({ timeout: 10_000 })
      await expect(loginLink).toHaveAttribute('href', '/login')
    })
  })
})
