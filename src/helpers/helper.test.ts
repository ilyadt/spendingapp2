import {expect, test} from 'vitest'
import {randomSoftRGB} from "@src/helpers/helper.ts";

test('randomSoftRGB', () => {
  const res = randomSoftRGB()

  expect(res).gt(0)
  expect(res).lt(0xff_ff_ff) // less than 3 bytes
})