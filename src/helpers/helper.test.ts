import {expect, test} from 'vitest'
import {colorFromReceiptId, genReceiptId, randomSoftRGB, receiptTotals} from "@src/helpers/helper.ts";
import type {SpendingRow} from "@src/models/viewmodels.ts";

test('randomSoftRGB', () => {
  const res = randomSoftRGB()

  expect(res).gt(0)
  expect(res).lt(0xff_ff_ff) // less than 3 bytes
})

test('colorFromReceiptId', () => {
  const colorX = 7543

  expect(colorFromReceiptId(colorX)).toBe(colorX)

  const receiptId = 0x10_20_30_40_50_60
  const color = 0x40_50_60

  expect(colorFromReceiptId(receiptId)).toBe(color)
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