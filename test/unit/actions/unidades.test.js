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

import { editarUnidade, deletarUnidade } from '@/actions/unidades'

const validId = '00000000-0000-0000-0000-000000000001'
const validForm = { nome: 'Sala Teste', area_m2: 50, valor_mensal: 1000, status: 'disponivel' }

describe('editarUnidade', () => {
  beforeEach(() => {
    resetAll()
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockIsProprietario.mockResolvedValue(true)
  })

  it('happy path — dono da unidade, atualiza com sucesso', async () => {
    // Step 1: unidades fetch → returns edificio_id
    mockAdmin.single.mockResolvedValueOnce({ data: { edificio_id: 'e-id-1' }, error: null })
    // Step 2: edificios ownership fetch → returns row (owner match)
    mockAdmin.single.mockResolvedValueOnce({ data: { id: 'e-id-1' }, error: null })
    // Step 3: update thenable → { error: null }
    const thenMock = vi.fn()
    mockAdmin.then = thenMock
    thenMock.mockImplementationOnce((resolve) =>
      Promise.resolve({ error: null }).then(resolve)
    )

    const result = await editarUnidade(validId, validForm)
    expect(result).toEqual({ status: 200 })
  })

  it('cross-tenant — edificios ownership retorna nulo → 404, update não executado', async () => {
    // Step 1: unidades fetch → returns edificio_id
    mockAdmin.single.mockResolvedValueOnce({ data: { edificio_id: 'e-id-other' }, error: null })
    // Step 2: edificios ownership fetch → no row (cross-tenant)
    mockAdmin.single.mockResolvedValueOnce({ data: null, error: null })

    const result = await editarUnidade(validId, validForm)
    expect(result).toEqual({ status: 404, erroMessage: 'Unidade não encontrada.' })
    // update must not have been called after cross-tenant detection
    expect(mockAdmin.update).not.toHaveBeenCalled()
  })

  it('erro de validação — UUID inválido retorna 400', async () => {
    const result = await editarUnidade('not-a-uuid', validForm)
    expect(result).toEqual({ status: 400, erroMessage: 'ID inválido.' })
  })

  it('guard de autorização — não autenticado retorna 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await editarUnidade(validId, validForm)
    expect(result.status).toBe(401)
  })

  it('D-08 — cross-tenant: proprietario_id do usuário é usado no filtro do edificios ownership check', async () => {
    // Step 1: unidades fetch → returns edificio_id
    mockAdmin.single.mockResolvedValueOnce({ data: { edificio_id: 'e-id-1' }, error: null })
    // Step 2: edificios ownership fetch → returns row (owner match)
    mockAdmin.single.mockResolvedValueOnce({ data: { id: 'e-id-1' }, error: null })
    // Step 3: update thenable → { error: null }
    const thenMock = vi.fn()
    mockAdmin.then = thenMock
    thenMock.mockImplementationOnce((resolve) =>
      Promise.resolve({ error: null }).then(resolve)
    )

    await editarUnidade(validId, validForm)

    // D-08: assert the ownership filter was applied with the authenticated user's id
    expect(mockAdmin.eq).toHaveBeenCalledWith('proprietario_id', mockUser.id)
  })
})

describe('deletarUnidade', () => {
  beforeEach(() => {
    resetAll()
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockIsProprietario.mockResolvedValue(true)
  })

  it('happy path — dono da unidade, deleta com sucesso', async () => {
    // Step 1: unidades fetch → returns edificio_id
    mockAdmin.single.mockResolvedValueOnce({ data: { edificio_id: 'e-id-1' }, error: null })
    // Step 2: edificios ownership fetch → returns row (owner match)
    mockAdmin.single.mockResolvedValueOnce({ data: { id: 'e-id-1' }, error: null })
    // Step 3: delete thenable → { error: null }
    const thenMock = vi.fn()
    mockAdmin.then = thenMock
    thenMock.mockImplementationOnce((resolve) =>
      Promise.resolve({ error: null }).then(resolve)
    )

    const result = await deletarUnidade(validId)
    expect(result).toEqual({ status: 200 })
  })

  it('cross-tenant — edificios ownership retorna nulo → 404, delete não executado', async () => {
    // Step 1: unidades fetch → returns edificio_id
    mockAdmin.single.mockResolvedValueOnce({ data: { edificio_id: 'e-id-other' }, error: null })
    // Step 2: edificios ownership fetch → no row (cross-tenant)
    mockAdmin.single.mockResolvedValueOnce({ data: null, error: null })

    const result = await deletarUnidade(validId)
    expect(result).toEqual({ status: 404, erroMessage: 'Unidade não encontrada.' })
    expect(mockAdmin.delete).not.toHaveBeenCalled()
  })

  it('erro de validação — UUID inválido retorna 400', async () => {
    const result = await deletarUnidade('not-a-uuid')
    expect(result).toEqual({ status: 400, erroMessage: 'ID inválido.' })
  })

  it('guard de autorização — não autenticado retorna 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await deletarUnidade(validId)
    expect(result.status).toBe(401)
  })

  it('D-08 — cross-tenant: proprietario_id do usuário é usado no filtro do edificios ownership check', async () => {
    // Step 1: unidades fetch → returns edificio_id
    mockAdmin.single.mockResolvedValueOnce({ data: { edificio_id: 'e-id-1' }, error: null })
    // Step 2: edificios ownership fetch → returns row (owner match)
    mockAdmin.single.mockResolvedValueOnce({ data: { id: 'e-id-1' }, error: null })
    // Step 3: delete thenable → { error: null }
    const thenMock = vi.fn()
    mockAdmin.then = thenMock
    thenMock.mockImplementationOnce((resolve) =>
      Promise.resolve({ error: null }).then(resolve)
    )

    await deletarUnidade(validId)

    // D-08: assert the ownership filter was applied with the authenticated user's id
    expect(mockAdmin.eq).toHaveBeenCalledWith('proprietario_id', mockUser.id)
  })
})
