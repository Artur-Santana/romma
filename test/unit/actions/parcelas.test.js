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

import { marcarParcelaComoPaga, confirmarPagamentoLocatario } from '@/actions/parcelas'

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

// Helper: 3-hop ownership for confirmarPagamentoLocatario (happy path)
// hops: parcela → contrato → locatario (usuario_id === mockUser.id)
function setupLocatarioOwnerSingles3() {
  // Hop 1: parcelas → contrato_id
  mockAdmin.single.mockResolvedValueOnce({ data: { contrato_id: 'c-id-1' }, error: null })
  // Hop 2: contratos → locatario_id
  mockAdmin.single.mockResolvedValueOnce({ data: { locatario_id: 'l-id-1' }, error: null })
  // Hop 3: locatarios → usuario_id (matches user)
  mockAdmin.single.mockResolvedValueOnce({ data: { usuario_id: mockUser.id }, error: null })
}

// Helper: 3-hop cross-tenant (locatario.usuario_id differs from authenticated user)
function setupLocatarioCrossTenantSingles3() {
  mockAdmin.single.mockResolvedValueOnce({ data: { contrato_id: 'c-id-other' }, error: null })
  mockAdmin.single.mockResolvedValueOnce({ data: { locatario_id: 'l-id-other' }, error: null })
  // usuario_id diferente do user autenticado
  mockAdmin.single.mockResolvedValueOnce({ data: { usuario_id: 'outro-usuario-uuid' }, error: null })
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

describe('confirmarPagamentoLocatario', () => {
  beforeEach(() => {
    resetAll()
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    // NOTE: mockIsProprietario NOT configured — Locatário guard does not call isProprietario
  })

  it('happy path — locatário dono, marca como paga (200)', async () => {
    setupLocatarioOwnerSingles3()
    setupUpdateThenable()
    const result = await confirmarPagamentoLocatario(validId)
    expect(result).toEqual({ status: 200 })
  })

  it('cross-tenant — usuario_id diferente → 404, update não executado', async () => {
    setupLocatarioCrossTenantSingles3()
    const result = await confirmarPagamentoLocatario(validId)
    expect(result).toEqual({ status: 404, erroMessage: 'Parcela não encontrada.' })
    expect(mockAdmin.update).not.toHaveBeenCalled()
  })

  it('não autenticado → 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await confirmarPagamentoLocatario(validId)
    expect(result.status).toBe(401)
  })

  it('UUID inválido → 400', async () => {
    const result = await confirmarPagamentoLocatario('not-a-uuid')
    expect(result).toEqual({ status: 400, erroMessage: 'ID inválido.' })
  })

  it('parcela inexistente (hop 1 null) → 404', async () => {
    mockAdmin.single.mockResolvedValueOnce({ data: null, error: null })
    const result = await confirmarPagamentoLocatario(validId)
    expect(result).toEqual({ status: 404, erroMessage: 'Parcela não encontrada.' })
  })

  it('parcela já paga — .in(status) filtra → update no-op, retorna 200', async () => {
    // O update usa .in('status', ['pendente','vencida']) — se parcela já paga, 0 rows afetadas
    // mas não há erro, então action retorna 200. Comportamento correto de no-op.
    setupLocatarioOwnerSingles3()
    setupUpdateThenable()
    const result = await confirmarPagamentoLocatario(validId)
    expect(result).toEqual({ status: 200 })
  })
})
