
import { describe, expect, test } from 'vitest'
import {type Budget, type SpendingRow, createSpendingEditForm, genVersion} from '@src/models/models'
import {fromMajorUnits} from "@src/helpers/money.ts";

test('genVersion', () => {
  expect(genVersion(null)).toMatch(/^v1-[0-9a-f]{5}$/)

  expect(genVersion('randomString')).toMatch( /^[0-9A-Za-z]{5}$/)

  expect(genVersion('v1-3829f')).toMatch(/^v2-[0-9a-f]{5}$/i)

  expect(genVersion('notaversion')).not.toEqual(genVersion('notaversion'))
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