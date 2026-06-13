import { vi, describe, it, expect, beforeEach } from 'vitest'

// vi.hoisted ensures mockSignUp is assigned before the vi.mock factories run (Pitfall 1)
const { mockSignUp } = vi.hoisted(() => ({ mockSignUp: vi.fn() }))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { signUp: mockSignUp },
  })),
}))

import { cadastrarProprietario } from '@/actions/auth'

describe('cadastrarProprietario', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('happy path — retorna status 200 com todos os campos válidos', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    const result = await cadastrarProprietario({
      email: 'a@b.com',
      senha: 'pass123',
      nome: 'João',
      sobrenome: 'Silva',
      telefone: '11999999999',
    })
    expect(result).toEqual({ status: 200 })
  })

  it('happy path — signUp chamado com options.data contendo nome/sobrenome/telefone', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    await cadastrarProprietario({
      email: 'a@b.com',
      senha: 'pass123',
      nome: 'João',
      sobrenome: 'Silva',
      telefone: '11999999999',
    })
    const callArgs = mockSignUp.mock.calls[0][0]
    expect(callArgs.options.data).toEqual({
      nome: 'João',
      sobrenome: 'Silva',
      telefone: '11999999999',
    })
  })

  it('erro de validação — qualquer campo ausente retorna 400 com erroMessage (não errorMessage)', async () => {
    const result = await cadastrarProprietario({ email: '', senha: '', nome: '', sobrenome: '', telefone: '' })
    expect(result.status).toBe(400)
    expect(result.erroMessage).toBeTruthy()
    // Deve usar erroMessage (PT), não errorMessage
    expect(result).not.toHaveProperty('errorMessage')
  })

  it('erro de validação — email presente mas nome ausente retorna 400', async () => {
    const result = await cadastrarProprietario({ email: 'a@b.com', senha: 'pass123', nome: '', sobrenome: 'Silva', telefone: '11999999999' })
    expect(result.status).toBe(400)
    expect(result.erroMessage).toBeTruthy()
  })

  it('erro de validação — email presente mas sobrenome ausente retorna 400', async () => {
    const result = await cadastrarProprietario({ email: 'a@b.com', senha: 'pass123', nome: 'João', sobrenome: '', telefone: '11999999999' })
    expect(result.status).toBe(400)
    expect(result.erroMessage).toBeTruthy()
  })

  it('erro de validação — email presente mas telefone ausente retorna 400', async () => {
    const result = await cadastrarProprietario({ email: 'a@b.com', senha: 'pass123', nome: 'João', sobrenome: 'Silva', telefone: '' })
    expect(result.status).toBe(400)
    expect(result.erroMessage).toBeTruthy()
  })

  it('erro do Supabase — signUp retorna error repassa status e erroMessage', async () => {
    mockSignUp.mockResolvedValue({ error: { status: 422, message: 'Email rate limit exceeded' } })
    const result = await cadastrarProprietario({
      email: 'a@b.com',
      senha: 'pass123',
      nome: 'João',
      sobrenome: 'Silva',
      telefone: '11999999999',
    })
    expect(result.status).toBe(422)
    expect(result.erroMessage).toBe('Email rate limit exceeded')
  })
})
