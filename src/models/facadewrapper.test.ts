import {it, expect, vi, afterEach } from 'vitest'
import type {Budget, DelSpending, Spending, SpendingRow} from "@src/models/models.ts"
import {saveSpendingChanges} from "./facadewrapper.ts";
import * as models from '@src/models/models'
import {Facade} from "@src/facade.ts";

vi.mock("@src/facade.ts", () => ({
  Facade: {
    createSpending: vi.fn(),
    updateSpending: vi.fn(),
    deleteSpending: vi.fn(),
  },
}))

afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

it('newSpending', () => {
  vi.spyOn(models, 'genSpendingID').mockReturnValue('sp1')
  vi.spyOn(models, 'genVersion').mockReturnValue('v1')

  const date = new Date('2026-05-26')
  const createdAt = '2026-05-26T12:32:00'

  const result = saveSpendingChanges(
    date,
    {rowId: 666} as SpendingRow, // empty old spending
    {
      budget: { id: 1, currency: 'RUB' } as Budget,
      amount: 100_00,
      description: 'moi',
    },
    new Date(createdAt),
  )

  const expRes: Spending = {
    id: "sp1",
    version: "v1",
    date: date,
    sort: (new Date('2026-05-26T12:32:00')).getTime(),
    amount: 10000,
    currency: "RUB",
    description: "moi",
    createdAt: new Date(createdAt),
    updatedAt: new Date(createdAt),
    receiptGroupId: 0,
  }

  expect(result).toEqual(expRes)

  expect(Facade.createSpending).toHaveBeenCalledWith(1, expRes)

  expect(Facade.deleteSpending).not.toHaveBeenCalled()
  expect(Facade.updateSpending).not.toHaveBeenCalled()
})

it('updateSpending', () => {
  vi.spyOn(models, 'genVersion').mockReturnValue('v2')

  const date = new Date('2026-05-26')
  const updatedAt = new Date('2026-05-26T12:34:00')

  const result = saveSpendingChanges(
    date,
    {
      rowId: 999,
      budgetId: 1,
      id: "sp1",
      version: "v1",
      date: date,
      sort: (new Date('2026-05-26T12:32:00')).getTime(),
      amount: 100_00,
      currency: "RUB",
      description: "moi",
      createdAt: new Date('2026-05-26T12:32:00'),
      updatedAt: updatedAt,
      receiptGroupId: 0
    },
    {
      budget: { id: 1, currency: 'RUB' } as Budget,
      amount: 130_00,
      description: 'tee',
    },
    updatedAt,
  )

  const expRes: Spending = {
    id: "sp1",
    version: "v2",
    date: date,
    sort: (new Date('2026-05-26T12:32:00')).getTime(),
    amount: 130_00,
    currency: "RUB",
    description: "tee",
    createdAt: new Date('2026-05-26T12:32:00'),
    updatedAt: updatedAt,
    receiptGroupId: 0,
    prev: {
      version: "v1",
      amount: 100_00,
      currency: "RUB",
      description: "moi",
    }
  }

  expect(result).toEqual(expRes)

  expect(Facade.updateSpending).toHaveBeenCalledWith(1, expRes)

  expect(Facade.deleteSpending).not.toHaveBeenCalled()
  expect(Facade.createSpending).not.toHaveBeenCalled()
})

it('updateSpendingWithBudget', () => {
  vi.spyOn(models, 'genSpendingID').mockReturnValue('sp2')
  vi.spyOn(models, 'genVersion')
    .mockImplementation((prev) => {
      switch (prev) {
        case null: return 'v1'
        case 'v2': return 'v3'
        default: throw new Error(`unexpected version: ${prev}`)
      }
    })

  const date = new Date('2026-05-26')
  const updatedAt = new Date('2026-05-26T12:36:00')

  const result = saveSpendingChanges(
    date,
    {
      rowId: 777,
      budgetId: 1,
      id: "sp1",
      version: "v2",
      date: date,
      sort: (new Date('2026-05-26T12:32:00')).getTime(),
      amount: 130_00,
      currency: "RUB",
      description: "tee",
      createdAt: new Date('2026-05-26T12:32:00'),
      updatedAt: new Date('2026-05-26T12:34:00'),
      receiptGroupId: 0,
    },
    {
      budget: { id: 2, currency: 'RUB' } as Budget,
      amount: 130_00,
      description: 'ice cream',
    },
    updatedAt,
  )

  const expRes: Spending = {
    id: "sp2",
    version: "v1",
    date: date,
    sort: (new Date('2026-05-26T12:32:00')).getTime(),
    amount: 130_00,
    currency: "RUB",
    description: "ice cream",
    createdAt: new Date('2026-05-26T12:36:00'),
    updatedAt: updatedAt,
    receiptGroupId: 0,
  }

  expect(result).toEqual(expRes)

  expect(Facade.deleteSpending).toHaveBeenCalledWith(1, {
    id: "sp1",
    version: "v3",
    updatedAt: updatedAt,
    prev: {
      version: "v2",
      amount: 130_00,
      currency: "RUB",
      description: "tee"
    },
  } satisfies DelSpending)

  expect(Facade.createSpending).toHaveBeenCalledWith(2, expRes)
  expect(Facade.updateSpending).not.toHaveBeenCalled()
})