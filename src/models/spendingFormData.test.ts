import { describe, expect, test } from 'vitest'
import {type Budget, type SpendingRow} from '@/models/models'
import {fromMajorUnits} from "@/helpers/money.ts";
import {createSpendingFormData, isEqual, validate, isEmpty} from "./spendingFormData.ts";

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
      {}, {},
      true,
    ],
    [ // wrong budget
      {budgetId: '2'}, { 1: makeBudget() },
      true,
    ],
    [
      { budgetId: '1' }, { 1: makeBudget() },
      true, // for now, we are ignoring filled budgets
    ],
    [
      { budgetId: '1', date: '2026-04-29' }, { 1: makeBudget() },
      true,
    ],
    [
      { budgetId: '1' }, { 1: makeBudget() },
      true,
    ],
    [
      { description: 'some val' }, { 1: makeBudget() },
      false,
    ],
    [
      { amount: '33' }, {},
      false,
    ]
  ])(
    'isEmpty',
    (fd, budgets, isEmptyExp) => {
      const sfd = createSpendingFormData(
        makeFormData(fd),
        budgets
      )

      expect(isEmpty(sfd)).toBe(isEmptyExp)
    },
  )

  test('validates missing budget', () => {
    const fd1 = createSpendingFormData(
      makeFormData({amount: '10', description: 'coffee', budgetId: ''}),
      {},
    )

    expect(validate(fd1)).toBe('не выбран бюджет')

    const fd2 = createSpendingFormData(
      makeFormData({amount: '10', description: 'coffee', budgetId: '2'}),
      {},
    )

    expect(validate(fd2)).toBe('не выбран бюджет')
  })

  test('validates empty amount', () => {
    const budget = makeBudget()

    const fd = createSpendingFormData(
      makeFormData({amount: '', description: 'coffee', budgetId: '1', date: '2026-04-29'}),
      {1: budget},
    )

    expect(validate(fd)).toBe('пустая сумма')
  })

  test('validates empty description', () => {
    const budget = makeBudget()

    const fd = createSpendingFormData(
      makeFormData({amount: '10', description: '', budgetId: '1', date: '2026-04-29'}),
      {1: budget},
    )

    expect(validate(fd)).toBe('пустое описание')
  })

  test('validates empty date', () => {
    const budget = makeBudget()

    const fd = createSpendingFormData(
      makeFormData({amount: '10', description: 'som', budgetId: '1'}),
      {1: budget},
    )

    expect(validate(fd)).toBe('не выбрана дата')
  })

  test('returns null validation for valid form', () => {
    const budget = makeBudget()

    const fd = createSpendingFormData(
      makeFormData({amount: '123.45', description: 'coffee', budgetId: '1', date: '2026-04-29'}),
      {1: budget},
    )

    expect(validate(fd)).toBe(null)
  })

  test('isEqual', () => {
    const budget = makeBudget()

    const amount = fromMajorUnits(123.45, budget.currency)

    const fd = createSpendingFormData(
      makeFormData({amount: '123.45', description: 'coffee', budgetId: '1', date: '2026-04-29'}),
      {1: budget},
    )

    expect(isEqual(fd, {amount, description: 'coffee', budgetId: 1, date: new Date('2026-04-29')} as SpendingRow)).toBe(true)
    expect(isEqual(fd, {amount, description: 'coffee', budgetId: 1, date: new Date('2026-04-30')} as SpendingRow)).toBe(false)
    expect(isEqual(fd, {amount: 123, description: 'coffee', budgetId: 1, date: new Date('2026-04-29')} as SpendingRow)).toBe(false)
    expect(isEqual(fd, {amount, description: 'coffee', budgetId: 2, date: new Date('2026-04-29')} as SpendingRow)).toBe(false)
    expect(isEqual(fd, {amount, description: 'tea',    budgetId: 1, date: new Date('2026-04-29')} as SpendingRow)).toBe(false)
  })
})
