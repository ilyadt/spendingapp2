
import { describe, expect, test } from 'vitest'
import { genVersion, receiptTotals } from '@src/models/models'
import type { SpendingRow } from '@src/models/view'

test('genVersion', () => {
  expect(genVersion(null)).toMatch(/^v1-[0-9a-f]{5}$/)

  expect(genVersion('randomString')).toMatch( /^[0-9A-Za-z]{5}$/)

  expect(genVersion('v1-3829f')).toMatch(/^v2-[0-9a-f]{5}$/i)

  expect(genVersion('notaversion')).not.toEqual(genVersion('notaversion'))
})

describe('receiptTotals', () => {
  test('returns empty array for empty input', () => {
    expect(receiptTotals([])).toEqual([])
  })

  test('ignores rows with receiptGroupId = 0', () => {
    const rows: Partial<SpendingRow>[] = [
      { receiptGroupId: 0, amountFull: 100 },
      { receiptGroupId: 0, amountFull: 200 },
    ]

    expect(receiptTotals(rows as SpendingRow[])).toEqual([0, 0])
  })

  test('sums amounts per receipt group and assigns to last row index', () => {
    const rows: Partial<SpendingRow>[] = [
      { receiptGroupId: 1, amountFull: 10 }, // index 0
      { receiptGroupId: 1, amountFull: 15 }, // index 1
      { receiptGroupId: 2, amountFull: 7 },  // index 2
      { receiptGroupId: 1, amountFull: 5 },  // index 3 (last for group 1)
      { receiptGroupId: 0, amountFull: 5 },
    ]

    expect(receiptTotals(rows as SpendingRow[])).toEqual([
      0,  // group 1 not finished yet
      0,
      7,  // group 2 ends at index 2
      30, // group 1 total: 10 + 15 + 5
      0,  // empty receipt
    ])
  })

  test('handles interleaved receipt groups correctly', () => {
    const rows: Partial<SpendingRow>[] = [
      { receiptGroupId: 1, amountFull: 10 }, // 0
      { receiptGroupId: 2, amountFull: 5 },  // 1
      { receiptGroupId: 1, amountFull: 20 }, // 2
      { receiptGroupId: 2, amountFull: 15 }, // 3
    ]

    expect(receiptTotals(rows as SpendingRow[])).toEqual([
      0,
      0,
      30, // group 1 ends here
      20, // group 2 ends here
    ])
  })
})

