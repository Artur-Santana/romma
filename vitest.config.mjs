import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['test/unit/**/*.test.js'],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // 'server-only' throws outside RSC. Redirect to empty stub so tests can
      // import server-only modules (like supabaseAdmin) without crashing.
      'server-only': path.resolve(__dirname, 'test/helpers/server-only-stub.js'),
    },
  },
})
