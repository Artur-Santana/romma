/**
 * Unit tests for src/lib/fluxo.js
 * Covers: buildFluxoWindow, aggregateFluxo (D-02, D-03, D-04, D-05)
 * Run: node --test src/lib/fluxo.test.mjs
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { buildFluxoWindow, aggregateFluxo } from './fluxo.js'

// ── buildFluxoWindow ──────────────────────────────────────────────────────────

describe('buildFluxoWindow', () => {
  test('returns exactly 6 entries', () => {
    const result = buildFluxoWindow('2026-06-15')
    assert.equal(result.length, 6)
  })

  test('window keys span today-3 to today+2 for 2026-06-15', () => {
    const result = buildFluxoWindow('2026-06-15')
    const keys = result.map(m => m.key)
    assert.deepEqual(keys, ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'])
  })

  test('labels use Portuguese short month abbreviations', () => {
    const result = buildFluxoWindow('2026-06-15')
    const labels = result.map(m => m.mes)
    assert.deepEqual(labels, ['mar', 'abr', 'mai', 'jun', 'jul', 'ago'])
  })

  test('year rollover backward: 2026-02-10 first key is 2025-11', () => {
    const result = buildFluxoWindow('2026-02-10')
    assert.equal(result[0].key, '2025-11')
    assert.equal(result[0].mes, 'nov')
  })

  test('year rollover backward: 2026-02-10 last key is 2026-04', () => {
    const result = buildFluxoWindow('2026-02-10')
    assert.equal(result[5].key, '2026-04')
  })

  test('year rollover forward: 2026-12-31 last key is 2027-02', () => {
    const result = buildFluxoWindow('2026-12-31')
    assert.equal(result[5].key, '2027-02')
    assert.equal(result[5].mes, 'fev')
  })

  test('year rollover forward: 2026-12-31 first key is 2026-09', () => {
    const result = buildFluxoWindow('2026-12-31')
    assert.equal(result[0].key, '2026-09')
  })

  test('each entry has mes and key properties', () => {
    const result = buildFluxoWindow('2026-06-15')
    for (const entry of result) {
      assert.ok('mes' in entry, 'missing mes')
      assert.ok('key' in entry, 'missing key')
    }
  })
})

// ── aggregateFluxo ────────────────────────────────────────────────────────────

describe('aggregateFluxo', () => {
  // Helper: build minimal fixtures
  const TODAY = '2026-06-15'

  // Window for TODAY: 2026-03 to 2026-08
  const unidades = [
    { id: 'u1', valor_mensal: 1000 },
    { id: 'u2', valor_mensal: 2000 },
  ]
  const contratos = [
    { id: 'c1', unidade_id: 'u1' },
    { id: 'c2', unidade_id: 'u2' },
  ]

  test('empty parcelas array yields 6 entries all recebido:0, previsto:0, peak:false', () => {
    const result = aggregateFluxo([], contratos, unidades, TODAY)
    assert.equal(result.length, 6)
    for (const entry of result) {
      assert.equal(entry.recebido, 0)
      assert.equal(entry.previsto, 0)
      assert.equal(entry.peak, false)
    }
  })

  test('each result entry has mes, key, recebido, previsto, peak', () => {
    const result = aggregateFluxo([], contratos, unidades, TODAY)
    for (const entry of result) {
      assert.ok('mes' in entry)
      assert.ok('key' in entry)
      assert.ok('recebido' in entry)
      assert.ok('previsto' in entry)
      assert.ok('peak' in entry)
    }
  })

  test('paga parcela bucketed by data_pagamento month into recebido', () => {
    const parcelas = [
      { id: 'p1', contrato_id: 'c1', data_vencimento: '2026-05-07', data_pagamento: '2026-05-10', status: 'paga' },
    ]
    const result = aggregateFluxo(parcelas, contratos, unidades, TODAY)
    const mai = result.find(m => m.key === '2026-05')
    assert.ok(mai.recebido > 0, 'recebido should be > 0 for may')
  })

  test('recebido uses data_pagamento month, not data_vencimento month', () => {
    // Parcel due in March, paid in April — should appear in April recebido, not March
    const parcelas = [
      { id: 'p1', contrato_id: 'c1', data_vencimento: '2026-03-07', data_pagamento: '2026-04-02', status: 'paga' },
    ]
    const result = aggregateFluxo(parcelas, contratos, unidades, TODAY)
    const mar = result.find(m => m.key === '2026-03')
    const abr = result.find(m => m.key === '2026-04')
    assert.equal(mar.recebido, 0, 'march recebido should be 0 (paid in april)')
    assert.ok(abr.recebido > 0, 'april recebido should be > 0')
  })

  test('recebido value derived from unidade.valor_mensal via contrato.unidade_id', () => {
    // c1 → u1 → valor_mensal 1000; c2 → u2 → valor_mensal 2000
    // Both paga in June
    const parcelas = [
      { id: 'p1', contrato_id: 'c1', data_vencimento: '2026-06-07', data_pagamento: '2026-06-10', status: 'paga' },
      { id: 'p2', contrato_id: 'c2', data_vencimento: '2026-06-07', data_pagamento: '2026-06-15', status: 'paga' },
    ]
    const result = aggregateFluxo(parcelas, contratos, unidades, TODAY)
    const jun = result.find(m => m.key === '2026-06')
    // Both contribute: 1000 + 2000 = 3000, normalized to 100% (max month)
    assert.equal(jun.recebido, 100, 'june should be 100 (peak month)')
  })

  test('previsto buckets ALL parcelas by data_vencimento regardless of status', () => {
    const parcelas = [
      { id: 'p1', contrato_id: 'c1', data_vencimento: '2026-07-07', data_pagamento: null, status: 'futura' },
      { id: 'p2', contrato_id: 'c2', data_vencimento: '2026-07-07', data_pagamento: null, status: 'pendente' },
      { id: 'p3', contrato_id: 'c1', data_vencimento: '2026-07-14', data_pagamento: null, status: 'vencida' },
    ]
    const result = aggregateFluxo(parcelas, contratos, unidades, TODAY)
    const jul = result.find(m => m.key === '2026-07')
    assert.ok(jul.previsto > 0, 'previsto should accumulate all statuses')
  })

  test('non-paga parcela does NOT contribute to recebido', () => {
    const parcelas = [
      { id: 'p1', contrato_id: 'c1', data_vencimento: '2026-06-07', data_pagamento: null, status: 'pendente' },
    ]
    const result = aggregateFluxo(parcelas, contratos, unidades, TODAY)
    const jun = result.find(m => m.key === '2026-06')
    assert.equal(jun.recebido, 0)
  })

  test('recebido and previsto are integers 0-100', () => {
    const parcelas = [
      { id: 'p1', contrato_id: 'c1', data_vencimento: '2026-05-07', data_pagamento: '2026-05-10', status: 'paga' },
      { id: 'p2', contrato_id: 'c2', data_vencimento: '2026-06-07', data_pagamento: null, status: 'pendente' },
    ]
    const result = aggregateFluxo(parcelas, contratos, unidades, TODAY)
    for (const entry of result) {
      assert.ok(Number.isInteger(entry.recebido), `recebido ${entry.recebido} must be integer`)
      assert.ok(Number.isInteger(entry.previsto), `previsto ${entry.previsto} must be integer`)
      assert.ok(entry.recebido >= 0 && entry.recebido <= 100, `recebido out of range: ${entry.recebido}`)
      assert.ok(entry.previsto >= 0 && entry.previsto <= 100, `previsto out of range: ${entry.previsto}`)
    }
  })

  test('peak=true on the single month with highest recebido', () => {
    // May gets 1000 (c1), June gets 2000 (c2) — June should be peak
    const parcelas = [
      { id: 'p1', contrato_id: 'c1', data_vencimento: '2026-05-07', data_pagamento: '2026-05-10', status: 'paga' },
      { id: 'p2', contrato_id: 'c2', data_vencimento: '2026-06-07', data_pagamento: '2026-06-10', status: 'paga' },
    ]
    const result = aggregateFluxo(parcelas, contratos, unidades, TODAY)
    const peakMonths = result.filter(m => m.peak)
    assert.equal(peakMonths.length, 1, 'exactly one month should be peak')
    assert.equal(peakMonths[0].key, '2026-06', 'peak should be june (highest recebido)')
  })

  test('no month has peak=true when no paga parcelas exist', () => {
    const parcelas = [
      { id: 'p1', contrato_id: 'c1', data_vencimento: '2026-06-07', data_pagamento: null, status: 'pendente' },
    ]
    const result = aggregateFluxo(parcelas, contratos, unidades, TODAY)
    const peakMonths = result.filter(m => m.peak)
    assert.equal(peakMonths.length, 0, 'no peak when peakRecebido is 0')
  })

  test('parcelas outside window are ignored', () => {
    const parcelas = [
      // Way outside the 2026-03..2026-08 window
      { id: 'p1', contrato_id: 'c1', data_vencimento: '2025-01-07', data_pagamento: '2025-01-10', status: 'paga' },
      { id: 'p2', contrato_id: 'c2', data_vencimento: '2027-06-07', data_pagamento: null, status: 'futura' },
    ]
    const result = aggregateFluxo(parcelas, contratos, unidades, TODAY)
    for (const entry of result) {
      assert.equal(entry.recebido, 0, `no recebido for ${entry.key}`)
      assert.equal(entry.previsto, 0, `no previsto for ${entry.key}`)
    }
  })

  test('parcela with unknown contrato_id contributes 0 valor (graceful degradation)', () => {
    const parcelas = [
      { id: 'p1', contrato_id: 'unknown', data_vencimento: '2026-06-07', data_pagamento: '2026-06-10', status: 'paga' },
    ]
    // Should not throw; recebido/previsto for june will be 0 (valor_mensal ?? 0)
    const result = aggregateFluxo(parcelas, contratos, unidades, TODAY)
    const jun = result.find(m => m.key === '2026-06')
    assert.equal(jun.recebido, 0)
  })
})
