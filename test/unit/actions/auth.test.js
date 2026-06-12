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

  it('happy path — retorna status 200 com email e senha válidos', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    const result = await cadastrarProprietario({ email: 'a@b.com', senha: 'pass123' })
    expect(result).toEqual({ status: 200 })
  })

  it('erro de validação — email ou senha ausentes retorna 400', async () => {
    const result = await cadastrarProprietario({ email: '', senha: '' })
    expect(result.status).toBe(400)
    expect(result.erroMessage).toBeTruthy()
  })

  it('erro do Supabase — signUp retorna error repassa status e erroMessage', async () => {
    mockSignUp.mockResolvedValue({ error: { status: 422, message: 'Email rate limit exceeded' } })
    const result = await cadastrarProprietario({ email: 'a@b.com', senha: 'pass123' })
    expect(result.status).toBe(422)
    expect(result.erroMessage).toBe('Email rate limit exceeded')
  })
})
