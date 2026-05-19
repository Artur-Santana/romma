/**
 * Preenche o formulário de login e submete.
 * O caller deve chamar page.waitForURL() com o destino esperado após esta função.
 */
export async function login(page, { email, password }) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
}
