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

// Note: parcelas.js does NOT import supabaseJWT, so no supabaseJWT stub needed here.

import { marcarParcelaComoPaga } from '@/actions/parcelas'

const validId = '00000000-0000-0000-0000-000000000001'

// Helper: set up 4-hop ownership pre-check for marcarParcelaComoPaga (happy path)
// hops: parcela → contrato → unidade → edificio (owner row)
function setupOwnerSingles4() {
  // Hop 1: parcelas fetch → returns contrato_id
  mockAdmin.single.mockResolvedValueOnce({ data: { contrato_id: 'c-id-1' }, error: null })
  // Hop 2: contratos fetch → returns unidade_id
  mockAdmin.single.mockResolvedValueOnce({ data: { unidade_id: 'u-id-1' }, error: null })
  // Hop 3: unidades fetch → returns edificio_id
  mockAdmin.single.mockResolvedValueOnce({ data: { edificio_id: 'e-id-1' }, error: null })
  // Hop 4: edificios ownership fetch → returns row (owner match)
  mockAdmin.single.mockResolvedValueOnce({ data: { id: 'e-id-1' }, error: null })
}

// Helper: set up 4-hop cross-tenant (edificios fetch returns null — not the owner)
function setupCrossTenantSingles4() {
  // Hop 1: parcelas fetch → returns contrato_id
  mockAdmin.single.mockResolvedValueOnce({ data: { contrato_id: 'c-id-other' }, error: null })
  // Hop 2: contratos fetch → returns unidade_id
  mockAdmin.single.mockResolvedValueOnce({ data: { unidade_id: 'u-id-other' }, error: null })
  // Hop 3: unidades fetch → returns edificio_id
  mockAdmin.single.mockResolvedValueOnce({ data: { edificio_id: 'e-id-other' }, error: null })
  // Hop 4: edificios ownership fetch → no row (cross-tenant)
  mockAdmin.single.mockResolvedValueOnce({ data: null, error: null })
}

// Helper: set up update thenable for marcarParcelaComoPaga
// chain: update().eq('id', id).in('status', [...]) — all return builder; then thenable resolves
function setupUpdateThenable() {
  const thenMock = vi.fn()
  mockAdmin.then = thenMock
  thenMock.mockImplementationOnce((resolve) =>
    Promise.resolve({ error: null }).then(resolve)
  )
}

describe('marcarParcelaComoPaga', () => {
  beforeEach(() => {
    resetAll()
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockIsProprietario.mockResolvedValue(true)
  })

  it('happy path — dono da parcela, marca como paga com sucesso', async () => {
    setupOwnerSingles4()
    setupUpdateThenable()

    const result = await marcarParcelaComoPaga(validId)
    expect(result).toEqual({ status: 200 })
  })

  it('cross-tenant — edificios ownership retorna nulo → 404, update não executado', async () => {
    setupCrossTenantSingles4()

    const result = await marcarParcelaComoPaga(validId)
    expect(result).toEqual({ status: 404, erroMessage: 'Parcela não encontrada.' })
    expect(mockAdmin.update).not.toHaveBeenCalled()
  })

  it('erro de validação — UUID inválido retorna 400', async () => {
    const result = await marcarParcelaComoPaga('not-a-uuid')
    expect(result).toEqual({ status: 400, erroMessage: 'ID inválido.' })
  })

  it('guard de autorização — não autenticado retorna 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await marcarParcelaComoPaga(validId)
    expect(result.status).toBe(401)
  })

  it('D-08 — proprietario_id do usuário é usado no filtro do edificios ownership check', async () => {
    setupOwnerSingles4()
    setupUpdateThenable()

    await marcarParcelaComoPaga(validId)

    // D-08: assert the ownership filter was applied with the authenticated user's id
    expect(mockAdmin.eq).toHaveBeenCalledWith('proprietario_id', mockUser.id)
  })
})
