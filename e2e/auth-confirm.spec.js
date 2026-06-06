import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.test' })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

test.describe('Auth confirm — Route Handler /auth/confirm', () => {
  test('2.1 — GET /auth/confirm sem parâmetros redireciona para /login com error=invite_invalid', async ({ page }) => {
    await page.goto('/auth/confirm')
    await page.waitForURL(url => url.href.includes('/login') && url.href.includes('error=invite_invalid'), { timeout: 10_000 })
    expect(page.url()).toContain('/login')
    expect(page.url()).toContain('error=invite_invalid')
  })

  test('2.2 — GET /auth/confirm com token inválido redireciona para /login com error=invite_invalid', async ({ page }) => {
    await page.goto('/auth/confirm?token_hash=invalido&type=invite')
    await page.waitForURL(url => url.href.includes('/login') && url.href.includes('error=invite_invalid'), { timeout: 10_000 })
    expect(page.url()).toContain('/login')
    expect(page.url()).toContain('error=invite_invalid')
  })
})

// BUG-03 — status_convite deve virar 'aceito' após aceite de convite
test.describe('BUG-03 — status_convite atualizado após aceite de convite', () => {
  let inviteUserId, inviteLocatarioId
  const inviteEmail = 'e2e-bug03-invite@test.romma.local'

  test.beforeAll(async () => {
    // Limpar usuário anterior se existir
    const { data: list } = await admin.auth.admin.listUsers()
    const existing = list.users.find(u => u.email === inviteEmail)
    if (existing) {
      inviteUserId = existing.id
      // Limpar locatarios vinculados
      const { data: stale } = await admin.from('locatarios').select('id').eq('usuario_id', inviteUserId)
      if (stale?.length) {
        const ids = stale.map(l => l.id)
        const { data: cExist } = await admin.from('contratos').select('id').in('locatario_id', ids)
        if (cExist?.length) {
          await admin.from('parcelas').delete().in('contrato_id', cExist.map(c => c.id))
          await admin.from('contratos').delete().in('id', cExist.map(c => c.id))
        }
        await admin.from('locatarios').delete().in('id', ids)
      }
      await admin.auth.admin.deleteUser(inviteUserId)
    }

    // Criar usuário de invite (NÃO confirmar email — precisa aceitar convite)
    const { data: inviteData, error: inviteError } = await admin.auth.admin.createUser({
      email: inviteEmail,
      password: 'Test1234!',
      email_confirm: false,
    })
    if (inviteError) throw inviteError
    inviteUserId = inviteData.user.id

    // Criar linha locatarios com status_convite='pendente'
    const { data: loc, error: errL } = await admin.from('locatarios').insert({
      usuario_id: inviteUserId,
      nome_razao_social: 'E2E-Locatário BUG03',
      tipo: 'pf',
      documento: '11122233344',
      email: inviteEmail,
      telefone: '11555555555',
      status_convite: 'pendente',
    }).select().single()
    if (errL) throw errL
    inviteLocatarioId = loc.id
  })

  test.afterAll(async () => {
    if (inviteLocatarioId) {
      try { await admin.from('locatarios').delete().eq('id', inviteLocatarioId) } catch (_) {}
    }
    if (inviteUserId) {
      try { await admin.auth.admin.deleteUser(inviteUserId) } catch (_) {}
    }
  })

  test('BUG-03 — status_convite vira "aceito" após verifyOtp com token real de invite', async ({ page }) => {
    // Verificar que status_convite começa como 'pendente'
    const { data: before } = await admin.from('locatarios').select('status_convite').eq('id', inviteLocatarioId).single()
    expect(before.status_convite).toBe('pendente')

    // Gerar token de invite real via admin API
    let hashedToken
    try {
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'invite',
        email: inviteEmail,
      })
      if (linkError) throw linkError
      hashedToken = linkData?.properties?.hashed_token
      if (!hashedToken) throw new Error('generateLink não retornou hashed_token')
    } catch (err) {
      // Se generateLink não estiver disponível ou falhar, registrar falha explícita
      // NÃO mascarar com teste trivial que passa
      throw new Error(
        `BUG-03: generateLink falhou — verificação manual necessária. ` +
        `Confirmar manualmente que /auth/confirm atualiza status_convite para 'aceito'. ` +
        `Erro original: ${err.message}`
      )
    }

    // Navegar para /auth/confirm com token real
    await page.goto(`/auth/confirm?token_hash=${hashedToken}&type=invite`)

    // Deve redirecionar para o portal do locatário após aceite bem-sucedido
    await page.waitForURL(url => !url.href.includes('/auth/confirm'), { timeout: 15_000 })

    // Consultar status_convite via admin após o redirect
    const { data: after } = await admin.from('locatarios').select('status_convite').eq('id', inviteLocatarioId).single()

    // Este assert estará RED no código atual (route.js não faz o UPDATE)
    // Passará após o fix BUG-03
    expect(after.status_convite).toBe('aceito')
  })
})
