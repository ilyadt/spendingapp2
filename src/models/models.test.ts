
import { describe, expect, test } from 'vitest'
import {type Budget, type SpendingRow, createSpendingFormValidator} from '@/models/models'
import {fromMajorUnits} from "@/helpers/money.ts";

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
      {}, {}, { selectBudget: true, selectDate: false },
      true,
    ],
    [ // wrong budget
      {budgetId: '2'}, { 1: makeBudget() }, { selectBudget: true, selectDate: false },
      true,
    ],
    [
      { budgetId: '1' }, { 1: makeBudget() }, { selectBudget: true, selectDate: false },
      false,
    ],
    [
      { budgetId: '1', date: '2026-04-29' }, { 1: makeBudget() }, { selectBudget: false, selectDate: false },
      true,
    ],
    [
      { budgetId: '1' }, { 1: makeBudget() }, { selectBudget: false, selectDate: true },
      true,
    ],
    [
      { description: 'some val' }, { 1: makeBudget() }, { selectBudget: false, selectDate: true },
      false,
    ],
    [
      { amount: '33' }, {}, { selectBudget: true, selectDate: false },
      false,
    ]
  ])(
    'isEmpty',
    (fd, budgets, cfg, isEmpty) => {
      const validator = createSpendingFormValidator(
        makeFormData(fd),
        budgets,
        cfg,
      )

      expect(validator.isEmpty()).toBe(isEmpty)
    },
  )

  test('validates missing budget', () => {
    const form1 = createSpendingFormValidator(
      makeFormData({amount: '10', description: 'coffee', budgetId: ''}),
      {},
      {selectBudget: true, selectDate: false},
    )

    expect(form1.validate()).toBe('не выбран бюджет')

    const form2 = createSpendingFormValidator(
      makeFormData({amount: '10', description: 'coffee', budgetId: '2'}),
      {},
      {selectBudget: true, selectDate: false},
    )

    expect(form2.validate()).toBe('не выбран бюджет')
  })

  test('validates empty amount', () => {
    const budget = makeBudget()

    const form = createSpendingFormValidator(
      makeFormData({amount: '', description: 'coffee', budgetId: '1', date: '2026-04-29'}),
      {1: budget},
      {selectBudget: false, selectDate: false},
    )

    expect(form.validate()).toBe('пустая сумма')
  })

  test('validates empty description', () => {
    const budget = makeBudget()

    const form = createSpendingFormValidator(
      makeFormData({amount: '10', description: '', budgetId: '1', date: '2026-04-29'}),
      {1: budget},
      {selectBudget: false, selectDate: false},
    )

    expect(form.validate()).toBe('пустое описание')
  })

  test('validates empty date', () => {
    const budget = makeBudget()

    const form = createSpendingFormValidator(
      makeFormData({amount: '10', description: 'som', budgetId: '1'}),
      {1: budget},
      {selectBudget: false, selectDate: false},
    )

    expect(form.validate()).toBe('не выбрана дата')
  })

  test('returns null validation for valid form', () => {
    const budget = makeBudget()

    const form = createSpendingFormValidator(
      makeFormData({amount: '123.45', description: 'coffee', budgetId: '1', date: '2026-04-29'}),
      {1: budget},
      {selectBudget: false, selectDate: false},
    )

    expect(form.validate()).toBe(null)
  })

  test('isEqual', () => {
    const budget = makeBudget()

    const amount = fromMajorUnits(123.45, budget.currency)

    const form = createSpendingFormValidator(
      makeFormData({amount: '123.45', description: 'coffee', budgetId: '1', date: '2026-04-29'}),
      {1: budget},
      {selectBudget: false, selectDate: false},
    )

    expect(form.isEqual({amount, description: 'coffee', budgetId: 1, date: new Date('2026-04-29')} as SpendingRow)).toBe(true)
    expect(form.isEqual({amount, description: 'coffee', budgetId: 1, date: new Date('2026-04-30')} as SpendingRow)).toBe(false)
    expect(form.isEqual({amount: 123, description: 'coffee', budgetId: 1, date: new Date('2026-04-29')} as SpendingRow)).toBe(false)
    expect(form.isEqual({amount, description: 'coffee', budgetId: 2, date: new Date('2026-04-29')} as SpendingRow)).toBe(false)
    expect(form.isEqual({amount, description: 'tea',    budgetId: 1, date: new Date('2026-04-29')} as SpendingRow)).toBe(false)
  })
})
