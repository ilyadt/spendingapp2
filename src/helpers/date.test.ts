import {describe, it, expect, test} from 'vitest'
import {dateRangePlusItemSet, daysFrom2000UTC, daysLeft, percentPassed} from '@src/helpers/date'

describe('daysLeft', () => {
  it('returns 1 when today and deadline are on the same day', () => {
    const today = new Date('2026-04-30T00:00:00Z')
    const deadline = new Date('2026-04-30T00:00:00Z')

    expect(daysLeft(today, deadline)).toBe(1)
  })

  it('returns correct number of days when deadline is in the future', () => {
    const today = new Date('2026-04-30T10:00:00Z')
    const deadline = new Date('2026-05-03T02:00:00Z')

    expect(daysLeft(today, deadline)).toBe(4)
  })

  it('returns 2 when deadline is tomorrow (inclusive counting)', () => {
    const today = new Date('2026-04-30T23:59:59Z')
    const deadline = new Date('2026-05-01T00:00:00Z')

    expect(daysLeft(today, deadline)).toBe(2)
  })

  it('returns 0 when deadline is in the past', () => {
    const today = new Date('2026-04-30T10:00:00Z')
    const deadline = new Date('2026-04-29T23:59:59Z')

    expect(daysLeft(today, deadline)).toBe(0)
  })

  it('returns 0 when deadline is far in the past', () => {
    const today = new Date('2026-04-30T10:00:00Z')
    const deadline = new Date('2026-01-01T00:00:00Z')

    expect(daysLeft(today, deadline)).toBe(0)
  })
})

describe('percentPassed', () => {
  const range = {
    dateFrom: new Date('2026-05-01T00:00:00Z'),
    dateTo: new Date('2026-05-08T00:00:00Z'),
  }

  it('returns 0% on the first day', () => {
    const today = new Date('2026-05-01T12:00:00Z')
    expect(percentPassed(today, range)).toBe(0)
  })

  it('returns correct percentage in the middle', () => {
    const today = new Date('2026-05-03T00:00:00Z')
    expect(percentPassed(today, range)).toBe(25)
  })

  it('last day', () => {
    const today = new Date('2026-05-08T00:00:00Z')
    expect(percentPassed(today, range)).toBe(87) // floor(7/8)
  })

  it('returns 100% on the last day + 1', () => {
    const today = new Date('2026-05-09T00:00:00Z')
    expect(percentPassed(today, range)).toBe(100)
  })

  it('returns 100% on future dates', () => {
    const today = new Date('2026-06-09T00:00:00Z')
    expect(percentPassed(today, range)).toBe(100)
  })

  it('returns 0% if today is before range', () => {
    const today = new Date('2026-04-25T00:00:00Z')
    expect(percentPassed(today, range)).toBe(0)
  })

  it('handles single-day range', () => {
    const single = {
      dateFrom: new Date('2026-05-01T00:00:00Z'),
      dateTo: new Date('2026-05-01T00:00:00Z'),
    }

    const today = new Date('2026-05-01T12:00:00Z')
    expect(percentPassed(today, single)).toBe(0) // start of day → 0%
  })
})

describe('dateRangePlusItemSet', () => {
  const d = (v: string) => new Date(v)
  const s = (v: string[]) => new Set<string>(v)

  test.each([
    {
      in: {from: '2026-05-01', to: '2026-05-03', additional: []},
      out: ['2026-05-01', '2026-05-02', '2026-05-03'],
    },
    {
      in: {from: '2026-05-01', to: '2026-05-03', additional: ['2026-04-29', '2026-05-05']},
      out: ['2026-04-29', '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-05'],
    },
    {
      in: {from: '2026-05-01', to: '2026-05-03', additional: ['2026-05-01', '2026-05-02']},
      out: ['2026-05-01', '2026-05-02', '2026-05-03'],
    },
    {
      in: {from: '2026-05-03', to: '2026-05-01', additional: []},
      out: [],
    },
  ])('%#', ({ in: input, out }) => {
    expect(
      dateRangePlusItemSet(
        d(input.from),
        d(input.to),
        s(input.additional),
      )
    ).toEqual(out)
  })
})

test('daysFrom2000UTC', () => {
  expect(daysFrom2000UTC(new Date('2000-01-01'))).toEqual(1)
  expect(daysFrom2000UTC(new Date('2001-01-01'))).toEqual(367)
})
