import {expect, test} from 'vitest'
import {formatAmount, fromMajorUnits, toMajorUnits} from './money'

test('fromMajorUnits', () => {
  expect(fromMajorUnits(12.34, 'RUB')).toBe(1234)
  expect(fromMajorUnits(0.25, 'BTC')).toBe(25000000)
  expect(fromMajorUnits(12.349, 'RUB')).toBe(1234)
  expect(fromMajorUnits(0, 'RUB')).toBe(0)

  expect(() => {fromMajorUnits(10, 'INVALID' as never)}).toThrow('invalid currency: INVALID')
})

test('toMajorUnits', () => {
  expect(toMajorUnits(100_00, 'RUB')).toBe(100)
  expect(toMajorUnits(100_99, 'RUB')).toBe(100.99)
  expect(toMajorUnits(2, 'BTC')).toBe(0.00000002)

  expect(() => {toMajorUnits(10, 'INVALID' as never)}).toThrow('invalid currency: INVALID')
})

test('formatAmount', () => {
  expect(formatAmount(100_99, 'EUR')).toBe('100.99 EUR')
  expect(formatAmount(10_000_00, 'RUB')).toBe('10000 RUB')
})
