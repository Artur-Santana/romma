import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createSupabaseMock } from '../../helpers/supabaseMock.js'

// vi.hoisted ensures all vars are assigned before vi.mock factories run (Pitfall 1)
const { mockUser, mockIsProprietario, mockGetUser, mockAdmin, configureResult, resetAll } =
  vi.hoisted(() => {
    const { createSupabaseMock } = require('../../helpers/supabaseMock.js')
    const { mockAdmin, configureResult, resetAll } = createSupabaseMock()
    return {
      mockUser: { id: 'proprietario-uuid-1234-5678-abcd' },
      mockIsProprietario: vi.fn(),
      mockGetUser: vi.fn(),
      mockAdmin,
      configureResult,
      resetAll,
    }
  })

vi.mock('@/lib/supabase-server', () => ({
  createServer: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}))

vi.mock('@/lib/auth', () => ({
  isProprietario: mockIsProprietario,
}))

vi.mock('@/lib/supabaseAdmin', () => ({ default: mockAdmin }))

import { revogarConvite } from '@/actions/locatarios'

describe('revogarConvite', () => {
  const validId = '00000000-0000-0000-0000-000000000001'

  beforeEach(() => {
    resetAll()
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockIsProprietario.mockResolvedValue(true)
  })

  it('happy path — revoga convite pendente sem contratos ativos', async () => {
    // .single() → locatario fetch returns pendente locatario
    mockAdmin.single.mockResolvedValueOnce({
      data: { usuario_id: 'u-auth-id', status_convite: 'pendente' },
      error: null,
    })
    // thenable: first call → contratos count query → { count: 0, error: null }
    // thenable: second call → delete query → { error: null }
    const thenMock = vi.fn()
    mockAdmin.then = thenMock
    thenMock
      .mockImplementationOnce((resolve) =>
        Promise.resolve({ count: 0, error: null }).then(resolve)
      )
      .mockImplementationOnce((resolve) =>
        Promise.resolve({ error: null }).then(resolve)
      )
    // auth.admin.deleteUser resolves without error
    mockAdmin.auth.admin.deleteUser.mockResolvedValueOnce({ error: null })

    const result = await revogarConvite(validId)
    expect(result).toEqual({ status: 200 })
  })

  it('erro de validação — UUID inválido retorna 400', async () => {
    const result = await revogarConvite('not-a-uuid')
    expect(result).toEqual({ status: 400, erroMessage: 'ID inválido.' })
  })

  it('guard de autorização — não autenticado retorna 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await revogarConvite(validId)
    expect(result.status).toBe(401)
  })

  it('D-08 — filtra select e delete por proprietario_id do usuário autenticado', async () => {
    // Setup identical to happy path so execution reaches the .eq('proprietario_id') calls
    mockAdmin.single.mockResolvedValueOnce({
      data: { usuario_id: 'u-auth-id', status_convite: 'pendente' },
      error: null,
    })
    const thenMock = vi.fn()
    mockAdmin.then = thenMock
    thenMock
      .mockImplementationOnce((resolve) =>
        Promise.resolve({ count: 0, error: null }).then(resolve)
      )
      .mockImplementationOnce((resolve) =>
        Promise.resolve({ error: null }).then(resolve)
      )
    mockAdmin.auth.admin.deleteUser.mockResolvedValueOnce({ error: null })

    await revogarConvite(validId)

    // D-08: assert that proprietario_id filter was applied (regression guard for Phase 11 fix)
    expect(mockAdmin.eq).toHaveBeenCalledWith('proprietario_id', mockUser.id)
  })
})
