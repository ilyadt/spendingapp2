
import { describe, expect, test } from 'vitest'
import {type Budget, type SpendingRow, spendingFormValidator, genVersion} from '@src/models/models'
import {fromMajorUnits} from "@src/helpers/money.ts";

test('genVersion', () => {
  expect(genVersion(null)).toMatch(/^v1-[0-9a-zA-Z]{7}$/)

  expect(genVersion('randomString')).toMatch( /^[0-9a-zA-Z]{7}$/)

  expect(genVersion('v1-3829f')).toMatch(/^v2-[0-9a-zA-Z]{7}$/i)
  expect(genVersion('v1-3829f89')).toMatch(/^v2-[0-9a-zA-Z]{7}$/i)

  expect(genVersion('notaversion')).not.toEqual(genVersion('notaversion'))
})

describe('spendingFormValidator', () => {
  const makeBudget = () => ({ id: 1, currency: "RUB"} as Budget)

  function makeFormData(data: Record<string, string>): FormData {
    const fd = new FormData()

    for (const [k, v] of Object.entries(data)) {
      fd.set(k, v)
    }

    return fd
  }

  test.each([
    [
      {}, {}, { chooseBudget: true, chooseDate: false },
      true,
    ],
    [ // wrong budget
      {budgetId: '2'}, { 1: makeBudget() }, { chooseBudget: true, chooseDate: false },
      true,
    ],
    [
      { budgetId: '1' }, { 1: makeBudget() }, { chooseBudget: true, chooseDate: false },
      false,
    ],
    [
      { budgetId: '1', date: '2026-04-29' }, { 1: makeBudget() }, { chooseBudget: false, chooseDate: false },
      true,
    ],
    [
      { budgetId: '1' }, { 1: makeBudget() }, { chooseBudget: false, chooseDate: true },
      true,
    ],
    [
      { description: 'some val' }, { 1: makeBudget() }, { chooseBudget: false, chooseDate: true },
      false,
    ],
    [
      { amount: '33' }, {}, { chooseBudget: true, chooseDate: false },
      false,
    ]
  ])(
    'isEmpty',
    (fd, budgets, cfg, isEmpty) => {
      const validator = spendingFormValidator(
        makeFormData(fd),
        budgets,
        cfg,
      )

      expect(validator.isEmpty()).toBe(isEmpty)
    },
  )

  test('validates missing budget', () => {
    const form1 = spendingFormValidator(
      makeFormData({amount: '10', description: 'coffee', budgetId: ''}),
      {},
      {chooseBudget: true, chooseDate: false},
    )

    expect(form1.validate()).toBe('не выбран бюджет')

    const form2 = spendingFormValidator(
      makeFormData({amount: '10', description: 'coffee', budgetId: '2'}),
      {},
      {chooseBudget: true, chooseDate: false},
    )

    expect(form2.validate()).toBe('не выбран бюджет')
  })

  test('validates empty amount', () => {
    const budget = makeBudget()

    const form = spendingFormValidator(
      makeFormData({amount: '', description: 'coffee', budgetId: '1', date: '2026-04-29'}),
      {1: budget},
      {chooseBudget: false, chooseDate: false},
    )

    expect(form.validate()).toBe('пустая сумма')
  })

  test('validates empty description', () => {
    const budget = makeBudget()

    const form = spendingFormValidator(
      makeFormData({amount: '10', description: '', budgetId: '1', date: '2026-04-29'}),
      {1: budget},
      {chooseBudget: false, chooseDate: false},
    )

    expect(form.validate()).toBe('пустое описание')
  })

  test('validates empty date', () => {
    const budget = makeBudget()

    const form = spendingFormValidator(
      makeFormData({amount: '10', description: 'som', budgetId: '1'}),
      {1: budget},
      {chooseBudget: false, chooseDate: false},
    )

    expect(form.validate()).toBe('не выбрана дата')
  })

  test('returns null validation for valid form', () => {
    const budget = makeBudget()

    const form = spendingFormValidator(
      makeFormData({amount: '123.45', description: 'coffee', budgetId: '1', date: '2026-04-29'}),
      {1: budget},
      {chooseBudget: false, chooseDate: false},
    )

    expect(form.validate()).toBe(null)
  })

  test('isEqual', () => {
    const budget = makeBudget()

    const amount = fromMajorUnits(123.45, budget.currency)

    const form = spendingFormValidator(
      makeFormData({amount: '123.45', description: 'coffee', budgetId: '1', date: '2026-04-29'}),
      {1: budget},
      {chooseBudget: false, chooseDate: false},
    )

    expect(form.isEqual({amount, description: 'coffee', budgetId: 1, date: new Date('2026-04-29')} as SpendingRow)).toBe(true)
    expect(form.isEqual({amount, description: 'coffee', budgetId: 1, date: new Date('2026-04-30')} as SpendingRow)).toBe(false)
    expect(form.isEqual({amount: 123, description: 'coffee', budgetId: 1, date: new Date('2026-04-29')} as SpendingRow)).toBe(false)
    expect(form.isEqual({amount, description: 'coffee', budgetId: 2, date: new Date('2026-04-29')} as SpendingRow)).toBe(false)
    expect(form.isEqual({amount, description: 'tea',    budgetId: 1, date: new Date('2026-04-29')} as SpendingRow)).toBe(false)
  })
})
