import { test, expect } from '@playwright/test'

// =============================================================================
// LP-01 — Hero CTA "VER UNIDADES"
// RED agora: botão diz "VER PROJETOS" (não "VER UNIDADES")
// =============================================================================
test.describe('LP-01 — Hero CTA "VER UNIDADES"', () => {
  test('LP-01 — clicar "VER UNIDADES" navega para /unidades', async ({ page }) => {
    await page.goto('/')
    const cta = page.getByRole('link', { name: /VER UNIDADES/i })
    await expect(cta).toBeVisible({ timeout: 10_000 })
    await cta.click()
    await page.waitForURL('**/unidades', { timeout: 10_000 })
    expect(page.url()).toContain('/unidades')
  })
})

// =============================================================================
// LP-02 — Hero CTA principal "ACESSAR DASHBOARD"
// RED agora: é <button> "INICIE GRATUITAMENTE" sem href (não é link)
// =============================================================================
test.describe('LP-02 — Hero CTA principal "ACESSAR DASHBOARD"', () => {
  test('LP-02 — "ACESSAR DASHBOARD" existe como link e navega para /login', async ({ page }) => {
    await page.goto('/')
    const cta = page.getByRole('link', { name: /ACESSAR DASHBOARD/i })
    await expect(cta).toBeVisible({ timeout: 10_000 })
    await cta.click()
    await page.waitForURL('**/login', { timeout: 10_000 })
    expect(page.url()).toContain('/login')
  })
})

// =============================================================================
// LP-03 — CTAs do Header e SISTEMA.04 apontam para /login
// RED agora:
//   - "ACESSE ANALITYCS" é <button> sem href (deve ser link "ACESSAR PAINEL")
//   - "COMEÇAR AGORA" são <button> sem href (devem ser links para /login)
// =============================================================================
test.describe('LP-03 — CTAs do Header e SISTEMA.04 apontam para /login', () => {
  test('LP-03 — link "ACESSAR PAINEL" existe e aponta para /login', async ({ page }) => {
    await page.goto('/')
    const painelLink = page.getByRole('link', { name: /ACESSAR PAINEL/i })
    await expect(painelLink).toBeVisible({ timeout: 10_000 })
    const href = await painelLink.getAttribute('href')
    expect(href).toBe('/login')
  })

  test('LP-03 — primeiro "COMEÇAR AGORA" do Header é link com href="/login"', async ({ page }) => {
    await page.goto('/')
    const comecarAgora = page.getByRole('link', { name: /COMEÇAR AGORA/i }).first()
    await expect(comecarAgora).toBeVisible({ timeout: 10_000 })
    const href = await comecarAgora.getAttribute('href')
    expect(href).toBe('/login')
  })
})

// =============================================================================
// PUB-01 — Card exibe "Consulte o Proprietário" quando valor_visivel=false
//          e badge "Disponível" quando unidade disponível
// =============================================================================
test.describe('PUB-01 — Card valor_visivel e badge Disponível', () => {
  test('PUB-01 — "Consulte o Proprietário" exibido via mock valor_visivel=false', async ({ page }) => {
    // Mock: intercept Supabase REST — retornar unidade disponível com valor_visivel=false
    await page.route('**/rest/v1/unidades**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '00000000-0000-0000-0000-000000000001',
            nome: 'Sala Mock',
            area_m2: 25,
            valor_mensal: 1000,
            valor_visivel: false,
            status: 'disponivel',
            edificio_id: '00000000-0000-0000-0000-000000000002',
          },
        ]),
      })
    )
    await page.goto('/unidades')
    await expect(page.getByText('Consulte o Proprietário')).toBeVisible({ timeout: 10_000 })
  })

  test('PUB-01 — badge "Disponível" visível para unidade disponível (seed real)', async ({ page }) => {
    // Usa seed real que tem 1 unidade disponível ("E2E-Sala Disponivel")
    await page.goto('/unidades')
    await expect(page.getByText(/Disponível/i).first()).toBeVisible({ timeout: 10_000 })
  })
})

// =============================================================================
// PUB-02 — Empty state "Nenhuma unidade disponível"
// Usa mock page.route para forçar lista vazia — independente do estado do banco
// =============================================================================
test.describe('PUB-02 — Empty state quando zero unidades disponíveis', () => {
  test('PUB-02 — exibe "Nenhuma unidade disponível" com mock []', async ({ page }) => {
    await page.route('**/rest/v1/unidades**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    )
    await page.goto('/unidades')
    await expect(page.getByText('Nenhuma unidade disponível')).toBeVisible({ timeout: 10_000 })
  })
})

// =============================================================================
// PUB-03 — Tap targets ≥44px em viewport 375px + sem overflow horizontal
// RED agora: tab buttons (py-2 ≈ 30px) e sheet ✕ (32×32px) abaixo de 44px
// =============================================================================
test.describe('PUB-03 — Tap targets e overflow em 375px', () => {
  test('PUB-03 — sem overflow horizontal em 375px', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } })
    const page = await context.newPage()
    await page.goto('/unidades')

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(hasOverflow).toBe(false)
    await context.close()
  })

  test('PUB-03 — tab button "Todos" tem tap target ≥44px', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } })
    const page = await context.newPage()
    await page.goto('/unidades')

    // Aguardar o tab "Todos" aparecer (dados carregados)
    const tabBtn = page.locator('button').filter({ hasText: /^Todos/ })
    await expect(tabBtn).toBeVisible({ timeout: 10_000 })

    const height = await tabBtn.evaluate(el => el.getBoundingClientRect().height)
    expect(height).toBeGreaterThanOrEqual(44)
    await context.close()
  })

  test('PUB-03 — link "← Voltar" tem tap target ≥44px', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } })
    const page = await context.newPage()
    await page.goto('/unidades')

    const voltarLink = page.getByRole('link', { name: /Voltar/i })
    await expect(voltarLink).toBeVisible({ timeout: 10_000 })

    const height = await voltarLink.evaluate(el => el.getBoundingClientRect().height)
    expect(height).toBeGreaterThanOrEqual(44)
    await context.close()
  })

  test('PUB-03 — botão ✕ do sheet tem tap target ≥44px (height e width)', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } })
    const page = await context.newPage()
    await page.goto('/unidades')

    // Verificar se há cards renderizados (seed pode estar vazio em CI)
    const cards = page.locator('button').filter({ hasText: /m²/i })
    const cardCount = await cards.count()
    if (cardCount === 0) {
      // Seed vazio em CI — skip condicional para não dar falso negativo
      test.skip()
      await context.close()
      return
    }

    // Clicar no primeiro card para abrir o UnidadeDetailSheet
    await cards.first().click()

    // Aguardar o botão ✕ aparecer no sheet
    const closeBtn = page.getByRole('button', { name: '✕' })
    await expect(closeBtn).toBeVisible({ timeout: 10_000 })

    const rect = await closeBtn.evaluate(el => {
      const r = el.getBoundingClientRect()
      return { height: r.height, width: r.width }
    })
    expect(rect.height).toBeGreaterThanOrEqual(44)
    expect(rect.width).toBeGreaterThanOrEqual(44)
    await context.close()
  })
})
