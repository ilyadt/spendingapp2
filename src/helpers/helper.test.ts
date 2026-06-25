import {expect, test} from 'vitest'
import {
  budgetsSortFn,
  colorFromReceiptId,
  genReceiptId,
  genVersion,
  randomSoftRGB,
  receiptTotals
} from "@/helpers/helper.ts";
import type {Budget, SpendingRow} from "@/models/models.ts";

test('genVersion', () => {
  expect(genVersion(null)).toMatch(/^v1-[0-9a-zA-Z]{7}$/)

  expect(genVersion('randomString')).toMatch( /^[0-9a-zA-Z]{7}$/)

  expect(genVersion('v1-3829f')).toMatch(/^v2-[0-9a-zA-Z]{7}$/i)
  expect(genVersion('v1-3829f89')).toMatch(/^v2-[0-9a-zA-Z]{7}$/i)

  expect(genVersion('notaversion')).not.toEqual(genVersion('notaversion'))
})

test('randomSoftRGB', () => {
  const res = randomSoftRGB()

  expect(res).gt(0)
  expect(res).lt(0xff_ff_ff) // less than 3 bytes
})

test('colorFromReceiptId', () => {
  expect(colorFromReceiptId(0)).toBe(null)
  expect(colorFromReceiptId(undefined)).toBe(null)

  const colorX = 7543

  expect(colorFromReceiptId(colorX)).toBe('#1d77')

  const receiptId = 0x10_20_30_40_50_60

  expect(colorFromReceiptId(receiptId)).toBe('#405060')
})

test('genReceiptId', () => {
  const date = new Date('2026-05-25T00:00:00Z')

  const rId = genReceiptId(date)

  const daysFromRid = Number(BigInt(rId) >> 24n)

  expect(daysFromRid).toBe(9642)

  const color = rId & 0xffffff
  expect(color).toBeGreaterThanOrEqual(0)
  expect(color).toBeLessThanOrEqual(0xffffff)

  const rId2 = genReceiptId(date)
  expect(rId2).not.toBe(rId)
})


test('receiptTotals', () => {
  expect(receiptTotals([])).toEqual({})

  const rows: Partial<SpendingRow>[] = [
    { receiptGroupId: 0, amount: 100 },
    { receiptGroupId: 0, amount: 200 },
  ]
  expect(receiptTotals(rows as SpendingRow[])).toEqual({})


  const rows2: Partial<SpendingRow>[] = [
    { rowId: 100, receiptGroupId: 1, amount: 10 },
    { rowId: 200, receiptGroupId: 1, amount: 15 },
    { rowId: 300, receiptGroupId: 2, amount: 7 },
    { rowId: 400, receiptGroupId: 1, amount: 5 },
    { rowId: 500, receiptGroupId: 0, amount: 5 },
  ]

  expect(receiptTotals(rows2 as SpendingRow[])).toEqual({
    400: 30,
    300: 7,
  })

  const rows3: Partial<SpendingRow>[] = [
    { rowId: 100, receiptGroupId: 1, amount: 10 },
    { rowId: 200, receiptGroupId: 2, amount: 5 },
    { rowId: 300, receiptGroupId: 1, amount: 20 },
    { rowId: 400, receiptGroupId: 2, amount: 15 },
  ]

  expect(receiptTotals(rows3 as SpendingRow[])).toEqual({
    300: 30,
    400: 20,
  })
})

test('budgetsSortFn', () => {
  const a: Budget = { id: 1, sort: 1 } as Budget
  const b: Budget = { id: 2, sort: 2 } as Budget
  const c: Budget = { id: 3, sort: 1 } as Budget
  const d: Budget = { id: 4, sort: 3 } as Budget
  const e: Budget = { id: 5, sort: 1 } as Budget

  const arr1 = [a,b,c]

  expect(arr1.sort(budgetsSortFn)).toEqual([a,c,b])

  const arr2 = [c,b,a]
  expect(arr2.sort(budgetsSortFn)).toEqual([a,c,b])

  const arr3 = [a,b,c,d,e]
  expect(arr3.sort(budgetsSortFn)).toEqual([a,c,e,b,d])
})
