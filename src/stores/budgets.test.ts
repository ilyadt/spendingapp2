import {beforeEach, describe, expect, test, vi} from 'vitest'
import {
  type BudgetsWithSpentById,
  initBudgetsWithSpendings,
  useBudgetsWithSpent,
  createBudgetsWithSpentCreator
} from "@/stores/budgets.ts";
import type {ApiSpending, Spending, SpendingPrev} from "@/models/models.ts";
import {BudgetSpendingsStore} from "@/stores/budgetSpendings.ts";
import {create} from "zustand";

describe('dynamic_budgets', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('empty', () => {
    expect({}).toEqual(useBudgetsWithSpent.getState().budgets)
  })

  test('with budgets and spendings', () => {
    BudgetSpendingsStore.storeBudgetsFromRemote([
      {
        id: 1,
        alias: "b1",
        name: "for love",
        sort: 11,
        money: {
          amount: 10_000_00,
          fraction: 2,
          currency: "RUB"
        },
        dateFrom: "2026-04-20",
        dateTo: "2026-04-30",
        params: {}
      },
      {
        id: 2,
        alias: "b2",
        name: "for pleasure",
        description: 'барчикс',
        sort: 22,
        money: {
          amount: 2000_00,
          fraction: 2,
          currency: "RUB"
        },
        dateFrom: "2026-04-01",
        dateTo: "2026-04-22",
        params: {
          perDate: true,
        }
      },
    ])

    BudgetSpendingsStore.storeSpendingsFromRemote(1, [
      makeApiSpending({id: 'sp1', money: {amount:  500_00, fraction: 2, currency: "RUB"}}),
      makeApiSpending({id: 'sp2', money: {amount: 1000_00, fraction: 2, currency: "RUB"}}),
    ])

    const dynamicBudgetsStore = create(createBudgetsWithSpentCreator(initBudgetsWithSpendings()))

    const listener = vi.fn()

    dynamicBudgetsStore.subscribe(listener)

    expect(dynamicBudgetsStore.getState().budgets).toEqual({
      1: {
        id: 1,
        alias: "b1",
        name: "for love",
        sort: 11,
        amount: 10_000_00,
        currency: 'RUB',
        dateFrom: new Date('2026-04-20'),
        dateTo: new Date("2026-04-30"),
        params: {},
        amountSpent: 1500_00,
      },
      2: {
        id: 2,
        alias: "b2",
        name: "for pleasure",
        description: 'барчикс',
        sort: 22,
        amount: 2_000_00,
        currency: 'RUB',
        dateFrom: new Date('2026-04-01'),
        dateTo: new Date("2026-04-22"),
        params: {
          perDate: true,
        },
        amountSpent: 0,
      },
    } satisfies BudgetsWithSpentById)

    // create
    dynamicBudgetsStore.getState().createSpending(1, makeSpending({id: 'sp3', amount: 100_00}))
    expect(listener).toHaveBeenCalledOnce()

    dynamicBudgetsStore.getState().createSpending(2, makeSpending({id: 'sp3', amount: 200_00}))
    expect(listener).toHaveBeenCalledTimes(2)

    expect(dynamicBudgetsStore.getState().budgets[1].amountSpent).toEqual(1600_00)
    expect(dynamicBudgetsStore.getState().budgets[2].amountSpent).toEqual(200_00)

    // update
    dynamicBudgetsStore.getState().updateSpending(2,
      makeSpending({id: 'sp3', amount: 300_00, prev: makeSpendingPrev({amount: 200_00})}),
    )
    expect(listener).toHaveBeenCalledTimes(3)
    expect(dynamicBudgetsStore.getState().budgets[2].amountSpent).toEqual(300_00)

    // delete
    dynamicBudgetsStore.getState().deleteSpending(1,
      makeSpending({id: 'sp2', prev: makeSpendingPrev({amount: 1000_00})})
    )
    expect(listener).toHaveBeenCalledTimes(4)
    expect(dynamicBudgetsStore.getState().budgets[1].amountSpent).toEqual(600_00)
  })
})


function makeApiSpending(sp: Partial<ApiSpending>): ApiSpending {
  return {
    id: sp.id ?? '',
    date: sp.date ?? '',
    sort: sp.sort ?? 0,
    money: sp.money ?? {amount: 0, fraction: 0, currency: ''},
    description: sp.description ?? '',
    createdAt: sp.createdAt ?? '',
    updatedAt: sp.updatedAt ?? '',
    version: sp.version ?? '',
    versions: sp.versions ?? [],
  }
}

function makeSpending(sp: Partial<Spending>): Spending {
  return {
    id: sp.id ?? '',
    version: sp.version ?? '',
    prev: sp.prev ?? undefined,
    date: sp.date ?? new Date(0),
    sort: sp.sort ?? 0,
    amount: sp.amount ?? 0,
    currency: sp.currency ?? 'RUB',
    description: sp.description ?? '',
    createdAt: sp.createdAt ?? new Date(0),
    updatedAt: sp.updatedAt ?? new Date(0),
    receiptGroupId: sp.receiptGroupId ?? 0,
  }
}

function makeSpendingPrev(prev: Partial<SpendingPrev>): SpendingPrev {
  return {
    amount: prev.amount ?? 0,
    currency: prev.currency ?? '' as never,
    description: prev.description ?? '',
    version: prev.version ?? '',
  }
}

