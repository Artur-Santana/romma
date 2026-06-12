import { vi } from 'vitest'

/**
 * Creates a reusable chainable Supabase mock builder (D-05).
 *
 * Usage:
 *   const { mockAdmin, configureResult, resetAll } = createSupabaseMock()
 *   vi.mock('@/lib/supabaseAdmin', () => ({ default: mockAdmin }))
 *
 *   configureResult({ data: { id: '1' }, error: null })
 *   const result = await someAction(validId)
 *   expect(mockAdmin.from).toHaveBeenCalledWith('unidades')
 *   expect(mockAdmin.eq).toHaveBeenCalledWith('id', validId)
 *
 * The builder is thenable: `await mockAdmin.from('x').select('*').eq('id', '1')`
 * resolves to the configured { data, error } instead of returning the builder object.
 * This is required because Actions await the full chain inline, e.g.:
 *   const { error } = await supabaseAdmin.from('unidades').delete().eq('id', id)
 *
 * .single() is a terminal method that resolves immediately (not via thenable).
 *
 * resetAll() re-establishes all mockReturnValue wirings after vi.clearAllMocks()
 * because clearAllMocks wipes return values set by mockReturnValue — without
 * re-wiring, post-reset chains break.
 */
export function createSupabaseMock() {
  let _resolve = { data: null, error: null }

  const builder = {
    from: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    auth: {
      admin: {
        deleteUser: vi.fn(),
        inviteUserByEmail: vi.fn(),
      },
      signUp: vi.fn(),
    },
    // Thenable: makes `await builder.from(...).eq(...)` resolve with configured result.
    then(resolve) {
      return Promise.resolve(_resolve).then(resolve)
    },
  }

  // Wire chain methods to return builder (enables .from().select().eq() chaining)
  builder.from.mockReturnValue(builder)
  builder.select.mockReturnValue(builder)
  builder.insert.mockReturnValue(builder)
  builder.update.mockReturnValue(builder)
  builder.delete.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  // .single() is terminal — resolves immediately with configured result
  builder.single.mockImplementation(() => Promise.resolve(_resolve))

  function configureResult(result) {
    _resolve = result
    builder.single.mockImplementation(() => Promise.resolve(result))
  }

  function resetAll() {
    vi.clearAllMocks()
    _resolve = { data: null, error: null }
    // Re-establish mockReturnValue wirings cleared by vi.clearAllMocks()
    builder.from.mockReturnValue(builder)
    builder.select.mockReturnValue(builder)
    builder.insert.mockReturnValue(builder)
    builder.update.mockReturnValue(builder)
    builder.delete.mockReturnValue(builder)
    builder.eq.mockReturnValue(builder)
    builder.single.mockImplementation(() => Promise.resolve(_resolve))
  }

  return { mockAdmin: builder, configureResult, resetAll }
}
