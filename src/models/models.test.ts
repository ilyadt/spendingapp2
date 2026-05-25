
import { describe, expect, test } from 'vitest'
import {type Budget, createSpendingEditForm, genVersion, receiptTotals} from '@src/models/models'
import type { SpendingRowOld } from '@src/models/view'
import type {SpendingRow} from "@src/models/viewmodels.ts";
import {fromMajorUnits} from "@src/helpers/money.ts";

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
    const rows: Partial<SpendingRowOld>[] = [
      { receiptGroupId: 0, amountFull: 100 },
      { receiptGroupId: 0, amountFull: 200 },
    ]

    expect(receiptTotals(rows as SpendingRowOld[])).toEqual([0, 0])
  })

  test('sums amounts per receipt group and assigns to last row index', () => {
    const rows: Partial<SpendingRowOld>[] = [
      { receiptGroupId: 1, amountFull: 10 }, // index 0
      { receiptGroupId: 1, amountFull: 15 }, // index 1
      { receiptGroupId: 2, amountFull: 7 },  // index 2
      { receiptGroupId: 1, amountFull: 5 },  // index 3 (last for group 1)
      { receiptGroupId: 0, amountFull: 5 },
    ]

    expect(receiptTotals(rows as SpendingRowOld[])).toEqual([
      0,  // group 1 not finished yet
      0,
      7,  // group 2 ends at index 2
      30, // group 1 total: 10 + 15 + 5
      0,  // empty receipt
    ])
  })

  test('handles interleaved receipt groups correctly', () => {
    const rows: Partial<SpendingRowOld>[] = [
      { receiptGroupId: 1, amountFull: 10 }, // 0
      { receiptGroupId: 2, amountFull: 5 },  // 1
      { receiptGroupId: 1, amountFull: 20 }, // 2
      { receiptGroupId: 2, amountFull: 15 }, // 3
    ]

    expect(receiptTotals(rows as SpendingRowOld[])).toEqual([
      0,
      0,
      30, // group 1 ends here
      20, // group 2 ends here
    ])
  })
})

describe('createSpendingEditForm', () => {
  const makeBudget = () => ({ id: 1, currency: "RUB"} as Budget)

  function makeFormData(data: Record<string, string>): FormData {
    const fd = new FormData()

    for (const [k, v] of Object.entries(data)) {
      fd.set(k, v)
    }

    return fd
  }

  test('returns parsed form data', () => {
    const budget = makeBudget()

    const form = createSpendingEditForm(
      makeFormData({amount: '123.45', description: 'coffee', budgetId: '1'}),
      {1: budget},
    )

    expect(form.data()).toEqual({budget, amount: 12345, description: 'coffee'})
  })

  test('is empty when all fields are empty', () => {
    const form = createSpendingEditForm(makeFormData({}), {})

    expect(form.isEmpty()).toBe(true)
  })

  test('is not empty when description exists', () => {
    const form = createSpendingEditForm(
      makeFormData({amount: '', description: 'coffee', budgetId: ''}),
      {},
    )

    expect(form.isEmpty()).toBe(false)
  })

  test('validates missing budget', () => {
    const form1 = createSpendingEditForm(
      makeFormData({amount: '10', description: 'coffee', budgetId: ''}),
      {},
    )

    expect(form1.validate()).toBe('не выбран бюджет')

    const form2 = createSpendingEditForm(
      makeFormData({amount: '10', description: 'coffee', budgetId: '2'}),
      {},
    )

    expect(form2.validate()).toBe('не выбран бюджет')
  })

  test('validates empty amount', () => {
    const budget = makeBudget()

    const form = createSpendingEditForm(
      makeFormData({amount: '', description: 'coffee', budgetId: '1'}),
      {1: budget},
    )

    expect(form.validate()).toBe('пустая сумма')
  })

  test('validates empty description', () => {
    const budget = makeBudget()

    const form = createSpendingEditForm(
      makeFormData({amount: '10', description: '', budgetId: '1'}),
      {1: budget},
    )

    expect(form.validate()).toBe('пустое описание')
  })

  test('returns null validation for valid form', () => {
    const budget = makeBudget()

    const form = createSpendingEditForm(
      makeFormData({amount: '123.45', description: 'coffee', budgetId: '1'}),
      {1: budget},
    )

    expect(form.validate()).toBe(null)
  })

  test('isEqual', () => {
    const budget = makeBudget()

    const amount = fromMajorUnits(123.45, budget.currency)

    const form = createSpendingEditForm(
      makeFormData({amount: '123.45', description: 'coffee', budgetId: '1'}),
      {1: budget},
    )

    expect(form.isEqual({amount, description: 'coffee', budgetId: 1} as SpendingRow)).toBe(true)
    expect(form.isEqual({amount: 123, description: 'coffee', budgetId: 1} as SpendingRow)).toBe(false)
    expect(form.isEqual({amount, description: 'coffee', budgetId: 2} as SpendingRow)).toBe(false)
    expect(form.isEqual({amount, description: 'tea',    budgetId: 1} as SpendingRow)).toBe(false)
  })
})