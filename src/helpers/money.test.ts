import { describe, expect, it } from 'vitest'
import { fromMajorUnits } from './money'

describe('fromMajorUnits', () => {
  it('converts major units to minor units for USD', () => {
    expect(fromMajorUnits(12.34, 'RUB')).toBe(1234)
  })

  it('converts major units to minor units for BTC', () => {
    expect(fromMajorUnits(0.25, 'BTC')).toBe(25000000)
  })

  it('floors extra fraction digits', () => {
    expect(fromMajorUnits(12.349, 'RUB')).toBe(1234)
  })

  it('works with zero', () => {
    expect(fromMajorUnits(0, 'RUB')).toBe(0)
  })

  it('throws for invalid currency', () => {
    expect(() => {
      fromMajorUnits(10, 'INVALID' as never)
    }).toThrow('invalid currency: INVALID')
  })
})
