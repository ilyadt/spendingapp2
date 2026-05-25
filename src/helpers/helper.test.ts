import {expect, test} from 'vitest'
import {colorFromReceiptId, genReceiptId, randomSoftRGB} from "@src/helpers/helper.ts";

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
