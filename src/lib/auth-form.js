// src/lib/auth-form.js
// Pure form-logic utilities — no React, no Supabase, no 'use client', no 'server-only'.
// Shared by signup (Plan 03) and reset-password (Plan 04).

const SENHA_POLICY_MSG =
  "A senha deve ter no mínimo 6 caracteres, 1 letra maiúscula e 1 número."

/**
 * Masks a Brazilian phone number progressively.
 * Strips non-digits, caps at 11 digits, then applies:
 *   ≤2 digits  → "(dd"
 *   3–6 digits → "(dd) ddddd"
 *   7–10 digits → "(dd) dddd-dddd"  (10-digit landline format)
 *   11 digits  → "(dd) ddddd-dddd"  (11-digit mobile format)
 *
 * @param {string} value — raw or partially masked input
 * @returns {string} masked phone string
 */
export function maskPhone(value) {
  const d = String(value).replace(/\D/g, "").slice(0, 11)
  const n = d.length
  if (n === 0) return ""
  if (n <= 2) return `(${d}`
  if (n <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (n <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/**
 * Strips all non-digit characters from a string.
 * Useful for extracting raw digits from a masked phone number before storage.
 *
 * @param {string} value
 * @returns {string} digits only
 */
export function soDigitos(value) {
  return String(value).replace(/\D/g, "")
}

/**
 * Validates a password against the project policy:
 *   ≥6 characters, ≥1 uppercase letter, ≥1 number.
 *
 * Returns null when the password is valid, otherwise returns the single
 * combined policy message (same string regardless of which rule fails).
 *
 * @param {string} senha
 * @returns {string|null}
 */
export function validarSenha(senha) {
  if (
    senha.length < 6 ||
    !/[A-Z]/.test(senha) ||
    !/[0-9]/.test(senha)
  ) {
    return SENHA_POLICY_MSG
  }
  return null
}

/**
 * Validates the full signup form.
 * Returns null when all rules pass, otherwise returns the FIRST failing
 * message (in rule order: nome/sobrenome → email → telefone → senha → confirmarSenha).
 *
 * @param {{ nome: string, sobrenome: string, email: string, telefone: string, senha: string, confirmarSenha: string }} form
 * @returns {string|null}
 */
export function validarCadastro({ nome, sobrenome, email, telefone, senha, confirmarSenha }) {
  if (!nome || !nome.trim() || !sobrenome || !sobrenome.trim()) {
    return "Informe nome e sobrenome."
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return "Informe um e-mail válido."
  }

  if (soDigitos(telefone).length < 10) {
    return "Informe um telefone válido (com DDD)."
  }

  const senhaErro = validarSenha(senha)
  if (senhaErro) {
    return senhaErro
  }

  if (senha !== confirmarSenha) {
    return "As senhas não coincidem."
  }

  return null
}
