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

// Mock @/lib/supabaseJWT to prevent module-load "supabaseUrl is required" error.
// supabaseJWT is only used by gerarParcelas (not under test), but contratos.js imports
// it at module top-level so we must stub the module to allow the import to succeed.
vi.mock('@/lib/supabaseJWT', () => ({
  default: { functions: { invoke: vi.fn() } },
}))

import { criarContrato, editarContrato, cancelarContrato, encerrarContrato } from '@/actions/contratos'

const validId = '00000000-0000-0000-0000-000000000001'

// Helper: set up ownership pre-check for happy path (3 singles + N thenable mutations)
// singles: contrato → unidade_id, unidade → edificio_id, edificio → row
function setupOwnerSingles() {
  mockAdmin.single.mockResolvedValueOnce({ data: { unidade_id: 'u-id-1' }, error: null })
  mockAdmin.single.mockResolvedValueOnce({ data: { edificio_id: 'e-id-1' }, error: null })
  mockAdmin.single.mockResolvedValueOnce({ data: { id: 'e-id-1' }, error: null })
}

// Helper: set up ownership pre-check for cross-tenant path (edificios fetch returns null)
function setupCrossTenantSingles() {
  mockAdmin.single.mockResolvedValueOnce({ data: { unidade_id: 'u-id-other' }, error: null })
  mockAdmin.single.mockResolvedValueOnce({ data: { edificio_id: 'e-id-other' }, error: null })
  mockAdmin.single.mockResolvedValueOnce({ data: null, error: null })
}

// Helper: set up thenable chain for cancelar/encerrar mutations
// cancelar/encerrar: update contratos + update unidades + delete parcelas (3 thenable awaits)
function setupMutationThenables() {
  const thenMock = vi.fn()
  mockAdmin.then = thenMock
  thenMock
    .mockImplementationOnce((resolve) => Promise.resolve({ error: null }).then(resolve)) // update contrato
    .mockImplementationOnce((resolve) => Promise.resolve({ error: null }).then(resolve)) // update unidade
    .mockImplementationOnce((resolve) => Promise.resolve({ error: null }).then(resolve)) // delete parcelas
}

describe('cancelarContrato', () => {
  beforeEach(() => {
    resetAll()
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockIsProprietario.mockResolvedValue(true)
  })

  it('happy path — dono do contrato, cancela com sucesso', async () => {
    setupOwnerSingles()
    setupMutationThenables()

    const result = await cancelarContrato(validId)
    expect(result).toEqual({ status: 200 })
  })

  it('cross-tenant — edificios ownership retorna nulo → 404, update contrato não executado', async () => {
    setupCrossTenantSingles()

    const result = await cancelarContrato(validId)
    expect(result).toEqual({ status: 404, erroMessage: 'Contrato não encontrado.' })
    expect(mockAdmin.update).not.toHaveBeenCalled()
  })

  it('erro de validação — UUID inválido retorna 400', async () => {
    const result = await cancelarContrato('not-a-uuid')
    expect(result).toEqual({ status: 400, erroMessage: 'ID inválido.' })
  })

  it('guard de autorização — não autenticado retorna 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await cancelarContrato(validId)
    expect(result.status).toBe(401)
  })

  it('D-08 — proprietario_id do usuário é usado no filtro do edificios ownership check', async () => {
    setupOwnerSingles()
    setupMutationThenables()

    await cancelarContrato(validId)

    // D-08: assert the ownership filter was applied with the authenticated user's id
    expect(mockAdmin.eq).toHaveBeenCalledWith('proprietario_id', mockUser.id)
  })
})

describe('encerrarContrato', () => {
  beforeEach(() => {
    resetAll()
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockIsProprietario.mockResolvedValue(true)
  })

  it('happy path — dono do contrato, encerra com sucesso', async () => {
    setupOwnerSingles()
    setupMutationThenables()

    const result = await encerrarContrato(validId)
    expect(result).toEqual({ status: 200 })
  })

  it('cross-tenant — edificios ownership retorna nulo → 404, update contrato não executado', async () => {
    setupCrossTenantSingles()

    const result = await encerrarContrato(validId)
    expect(result).toEqual({ status: 404, erroMessage: 'Contrato não encontrado.' })
    expect(mockAdmin.update).not.toHaveBeenCalled()
  })

  it('erro de validação — UUID inválido retorna 400', async () => {
    const result = await encerrarContrato('not-a-uuid')
    expect(result).toEqual({ status: 400, erroMessage: 'ID inválido.' })
  })

  it('guard de autorização — não autenticado retorna 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await encerrarContrato(validId)
    expect(result.status).toBe(401)
  })

  it('D-08 — proprietario_id do usuário é usado no filtro do edificios ownership check', async () => {
    setupOwnerSingles()
    setupMutationThenables()

    await encerrarContrato(validId)

    // D-08: assert the ownership filter was applied with the authenticated user's id
    expect(mockAdmin.eq).toHaveBeenCalledWith('proprietario_id', mockUser.id)
  })
})

const validUnidadeId = '00000000-0000-0000-0000-000000000002'
const validLocatarioId = '00000000-0000-0000-0000-000000000003'
const validCriarContratoForm = {
  unidade_id: validUnidadeId,
  locatario_id: validLocatarioId,
  data_inicio: '2026-01-01',
  data_fim: '2026-12-31',
  status: 'ativo',
  observacoes: 'Observação de teste',
}

// Helper: set up 2-hop ownership pre-check for criarContrato (unidade→edificio)
function setupOwnerSinglesCriar() {
  // Hop 1: unidades fetch → returns edificio_id
  mockAdmin.single.mockResolvedValueOnce({ data: { edificio_id: 'e-id-1' }, error: null })
  // Hop 2: edificios ownership fetch → returns row (owner match)
  mockAdmin.single.mockResolvedValueOnce({ data: { id: 'e-id-1' }, error: null })
}

// Helper: set up 2-hop cross-tenant for criarContrato (edificios fetch returns null)
function setupCrossTenantSinglesCriar() {
  // Hop 1: unidades fetch → returns edificio_id
  mockAdmin.single.mockResolvedValueOnce({ data: { edificio_id: 'e-id-other' }, error: null })
  // Hop 2: edificios ownership fetch → no row (cross-tenant)
  mockAdmin.single.mockResolvedValueOnce({ data: null, error: null })
}

// Helper: set up thenable chain for criarContrato mutations
// criarContrato: insert contratos (returns row via single) + update unidades status
function setupCriarContratoMutations(contratoId) {
  // insert().select().single() resolves via single(), not thenable
  mockAdmin.single.mockResolvedValueOnce({ data: { id: contratoId }, error: null })
  // update unidades status → thenable
  const thenMock = vi.fn()
  mockAdmin.then = thenMock
  thenMock.mockImplementationOnce((resolve) =>
    Promise.resolve({ error: null }).then(resolve)
  )
}

describe('criarContrato', () => {
  beforeEach(() => {
    resetAll()
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockIsProprietario.mockResolvedValue(true)
  })

  it('happy path — dono da unidade, cria contrato com sucesso', async () => {
    setupOwnerSinglesCriar()
    setupCriarContratoMutations('novo-contrato-id-1234')

    const result = await criarContrato(validCriarContratoForm)
    expect(result).toEqual({ status: 200, data: { id: 'novo-contrato-id-1234' } })
  })

  it('cross-tenant — edificios ownership retorna nulo → 404, insert não executado', async () => {
    setupCrossTenantSinglesCriar()

    const result = await criarContrato(validCriarContratoForm)
    expect(result).toEqual({ status: 404, erroMessage: 'Unidade não encontrada.' })
    expect(mockAdmin.insert).not.toHaveBeenCalled()
  })

  it('erro de validação — unidade_id UUID inválido retorna 400', async () => {
    const result = await criarContrato({ ...validCriarContratoForm, unidade_id: 'not-a-uuid' })
    expect(result).toEqual({ status: 400, erroMessage: 'Unidade inválida.' })
  })

  it('guard de autorização — não autenticado retorna 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await criarContrato(validCriarContratoForm)
    expect(result.status).toBe(401)
  })

  it('D-08 — proprietario_id do usuário é usado no filtro do edificios ownership check', async () => {
    setupOwnerSinglesCriar()
    setupCriarContratoMutations('novo-contrato-id-5678')

    await criarContrato(validCriarContratoForm)

    // D-08: assert the ownership filter was applied with the authenticated user's id
    expect(mockAdmin.eq).toHaveBeenCalledWith('proprietario_id', mockUser.id)
  })
})

const validEditarContratoForm = {
  data_inicio: '2026-02-01',
  data_fim: '2026-11-30',
  status: 'ativo',
  observacoes: 'Observação atualizada',
}

describe('editarContrato', () => {
  beforeEach(() => {
    resetAll()
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockIsProprietario.mockResolvedValue(true)
  })

  it('happy path — dono do contrato, edita com sucesso', async () => {
    setupOwnerSingles()
    // update thenable → { error: null }
    const thenMock = vi.fn()
    mockAdmin.then = thenMock
    thenMock.mockImplementationOnce((resolve) =>
      Promise.resolve({ error: null }).then(resolve)
    )

    const result = await editarContrato(validId, validEditarContratoForm)
    expect(result).toEqual({ status: 200 })
  })

  it('cross-tenant — edificios ownership retorna nulo → 404, update não executado', async () => {
    setupCrossTenantSingles()

    const result = await editarContrato(validId, validEditarContratoForm)
    expect(result).toEqual({ status: 404, erroMessage: 'Contrato não encontrado.' })
    expect(mockAdmin.update).not.toHaveBeenCalled()
  })

  it('erro de validação — UUID inválido retorna 400', async () => {
    const result = await editarContrato('not-a-uuid', validEditarContratoForm)
    expect(result).toEqual({ status: 400, erroMessage: 'ID inválido.' })
  })

  it('guard de autorização — não autenticado retorna 401', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await editarContrato(validId, validEditarContratoForm)
    expect(result.status).toBe(401)
  })

  it('D-08 — proprietario_id do usuário é usado no filtro do edificios ownership check', async () => {
    setupOwnerSingles()
    // update thenable → { error: null }
    const thenMock = vi.fn()
    mockAdmin.then = thenMock
    thenMock.mockImplementationOnce((resolve) =>
      Promise.resolve({ error: null }).then(resolve)
    )

    await editarContrato(validId, validEditarContratoForm)

    // D-08: assert the ownership filter was applied with the authenticated user's id
    expect(mockAdmin.eq).toHaveBeenCalledWith('proprietario_id', mockUser.id)
  })
})
