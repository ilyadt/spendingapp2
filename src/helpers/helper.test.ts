import {expect, test} from 'vitest'
import {colorFromReceiptId, randomSoftRGB} from "@src/helpers/helper.ts";

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