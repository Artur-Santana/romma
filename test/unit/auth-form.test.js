// test/unit/auth-form.test.js
// RED phase — tests written before implementation
// Plan: 18-02 (Phase 18, Wave 0 unit-test requirement)
// Covers: maskPhone, soDigitos, validarSenha, validarCadastro

import { describe, it, expect } from "vitest"
import { maskPhone, soDigitos, validarSenha, validarCadastro } from "@/lib/auth-form"

const SENHA_MSG =
  "A senha deve ter no mínimo 6 caracteres, 1 letra maiúscula e 1 número."

// ---------------------------------------------------------------------------
// maskPhone
// ---------------------------------------------------------------------------
describe("maskPhone", () => {
  it("formats partial DDD (2 digits) without closing paren", () => {
    expect(maskPhone("11")).toBe("(11")
  })

  it("formats 10-digit number (landline format)", () => {
    expect(maskPhone("1199998888")).toBe("(11) 9999-8888")
  })

  it("formats 11-digit number (mobile format)", () => {
    expect(maskPhone("11999998888")).toBe("(11) 99999-8888")
  })

  it("caps at 11 digits (ignores extra digits)", () => {
    expect(maskPhone("119999988887777")).toBe("(11) 99999-8888")
  })

  it("strips non-digit characters before masking", () => {
    expect(maskPhone("(11) 99999-8888")).toBe("(11) 99999-8888")
  })

  it("does not produce a dangling trailing hyphen for partial input", () => {
    const result = maskPhone("1199999")
    expect(result.endsWith("-")).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// soDigitos
// ---------------------------------------------------------------------------
describe("soDigitos", () => {
  it("strips all non-digit characters", () => {
    expect(soDigitos("(11) 99999-8888")).toBe("11999998888")
  })

  it("returns only digits from mixed input", () => {
    expect(soDigitos("abc123def")).toBe("123")
  })

  it("returns empty string for no digits", () => {
    expect(soDigitos("abc")).toBe("")
  })
})

// ---------------------------------------------------------------------------
// validarSenha
// ---------------------------------------------------------------------------
describe("validarSenha", () => {
  it("returns null for a valid password (≥6 chars, uppercase, number)", () => {
    expect(validarSenha("Abc123")).toBeNull()
  })

  it("returns policy message for password shorter than 6 chars", () => {
    expect(validarSenha("Ab1")).toBe(SENHA_MSG)
  })

  it("returns policy message for password with no uppercase letter", () => {
    expect(validarSenha("abcdef1")).toBe(SENHA_MSG)
  })

  it("returns policy message for password with no number", () => {
    expect(validarSenha("Abcdefg")).toBe(SENHA_MSG)
  })

  it("returns the same single message string regardless of which rule fails", () => {
    // All failures → identical message (no per-rule variation)
    const m1 = validarSenha("Ab1")        // too short
    const m2 = validarSenha("abcdef1")    // no uppercase
    const m3 = validarSenha("Abcdefg")    // no number
    expect(m1).toBe(m2)
    expect(m2).toBe(m3)
  })
})

// ---------------------------------------------------------------------------
// validarCadastro
// ---------------------------------------------------------------------------
describe("validarCadastro", () => {
  const validForm = {
    nome: "A",
    sobrenome: "B",
    email: "a@b.co",
    telefone: "(11) 99999-8888",
    senha: "Abc123",
    confirmarSenha: "Abc123",
  }

  it("returns null when all fields are valid", () => {
    expect(validarCadastro(validForm)).toBeNull()
  })

  it("returns nome/sobrenome message when nome is missing", () => {
    expect(validarCadastro({ ...validForm, nome: "" })).toBe(
      "Informe nome e sobrenome."
    )
  })

  it("returns nome/sobrenome message when sobrenome is missing", () => {
    expect(validarCadastro({ ...validForm, sobrenome: "" })).toBe(
      "Informe nome e sobrenome."
    )
  })

  it("returns email message for invalid email", () => {
    expect(validarCadastro({ ...validForm, email: "notvalid" })).toBe(
      "Informe um e-mail válido."
    )
  })

  it("returns telefone message for phone with fewer than 10 digits", () => {
    expect(validarCadastro({ ...validForm, telefone: "(11) 999-8" })).toBe(
      "Informe um telefone válido (com DDD)."
    )
  })

  it("returns password policy message for weak password", () => {
    expect(validarCadastro({ ...validForm, senha: "abc", confirmarSenha: "abc" })).toBe(
      SENHA_MSG
    )
  })

  it("returns senhas não coincidem message when passwords differ", () => {
    expect(
      validarCadastro({ ...validForm, senha: "Abc123", confirmarSenha: "Abc456" })
    ).toBe("As senhas não coincidem.")
  })

  it("checks phone rule BEFORE password rule (ordering assertion)", () => {
    // Form fails both phone AND password — must return the phone message
    const result = validarCadastro({
      ...validForm,
      telefone: "999",       // < 10 digits
      senha: "abc",          // weak password
      confirmarSenha: "abc",
    })
    expect(result).toBe("Informe um telefone válido (com DDD).")
  })
})
