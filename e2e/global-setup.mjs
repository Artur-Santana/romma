import { seed } from './seed.mjs'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

const STATE_FILE = resolve('.e2e-state.json')

export default async function globalSetup() {
  const state = await seed()
  writeFileSync(STATE_FILE, JSON.stringify(state), 'utf-8')
}
