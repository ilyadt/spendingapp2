import {expect, test} from 'vitest'
import {type Currency, formatAmount, fromMajorUnits, toMajorUnits, totals} from './money'

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

  expect(toMajorUnits(0, 'INVALID' as Currency)).toBe(0)

  expect(() => {toMajorUnits(10, 'INVALID' as never)}).toThrow('invalid currency: INVALID')
})

test('formatAmount', () => {
  expect(formatAmount(100_99, 'EUR')).toBe('100.99 EUR')
  expect(formatAmount(10_000_00, 'RUB')).toBe('10000 RUB')
})

test('totals', () => {
  expect(totals([])).toEqual([]);
  expect(totals([{ amount: 0, currency: 'RUB' }])).toEqual([]);

  expect(totals([
    { amount: 100_00, currency: 'USD'},
    { amount: 50_00, currency: 'EUR'},
    { amount: 200_00, currency: 'USD'},
    { amount: 30_50, currency: 'EUR'},
    { amount: 100_00, currency: 'RUB'},
  ])).toEqual(['100 RUB', '80.5 EUR', '300 USD']);

  expect(totals([
    { amount: 10_00, currency: 'USD'},
    { amount: 20_00, currency: 'USD'},
    { amount: 30_00, currency: 'USD'},
    { amount: 40_00, currency: 'USD'},
  ])).toEqual(['100 USD']);

  expect(totals([
    { amount: 99_99, currency: 'EUR'},
    { amount: 100_00, currency: 'EUR'},
  ])).toEqual(['199.99 EUR']);
});
