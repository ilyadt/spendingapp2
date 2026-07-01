import { describe, expect, it } from "vitest"
import {createSpendingsStore, type SpendingsByBudget} from "./spendings"
import type {Spending} from "@/models/models.ts";

const spsByIds: SpendingsByBudget = {
  1: [
    { id: "a", amount: 100_00, currency: "RUB" } as Spending,
    { id: "b", amount: 200_00, currency: "RUB" } as Spending,
  ],
  3: [
    { id: "c", amount: 300_00, currency: "RUB" } as Spending,
  ],
}

describe("createSpendingsStore", () => {
  it('handles empty correct', () => {
    expect(createSpendingsStore({}).spendingsByBudgetId(999)).toEqual([])
  })

  it("spendingsByBudgetId", () => {
    const store = createSpendingsStore(spsByIds)

    expect(store.spendingsByBudgetId(1)).toEqual([
      { id: "a", amount: 100_00, currency: "RUB" } as Spending,
      { id: "b", amount: 200_00, currency: "RUB" } as Spending,
    ])

    expect(store.spendingsByBudgetId(2)).toEqual([])

    expect(store.spendingsByBudgetId(3)).toEqual([
      { id: "c", amount: 300_00, currency: "RUB" } as Spending,
    ])
  })

  it("creates a spending", () => {
    const store = createSpendingsStore(spsByIds)

    store.createSpending(3, { id: "d", amount: 400_00, currency: "RUB" } as Spending)

    expect(store.spendingsByBudgetId(3)).toEqual([
      {id: "c", amount: 300_00, currency: "RUB" } as Spending,
      {id: "d", amount: 400_00, currency: "RUB" } as Spending,
    ])

    store.createSpending(4, { id: "e", amount: 500_00, currency: "RUB" } as Spending)

    expect(store.spendingsByBudgetId(4)).toEqual([
      { id: "e", amount: 500_00, currency: "RUB" } as Spending,
    ])
  })

  it("updates a spending", () => {
    const store = createSpendingsStore(spsByIds)

    store.updateSpending(1, { id: "a", amount: 250_00, currency: "RUB" } as Spending)

    // does nothing
    store.updateSpending(1, { id: "xxx", amount: 250_00, currency: "RUB" } as Spending)

    expect(store.spendingsByBudgetId(1)).toEqual([
      { id: "a", amount: 250_00, currency: "RUB" } as Spending,
      { id: "b", amount: 200_00, currency: "RUB" } as Spending,
    ])
  })

  it("deletes a spending", () => {
    const store = createSpendingsStore(spsByIds)

    store.deleteSpending(1, { id: "a" } as Spending)

    // does nothing
    store.deleteSpending(1, { id: "xxx" } as Spending)
    store.deleteSpending(99, { id: "xxx" } as Spending)

    expect(store.spendingsByBudgetId(1)).toEqual([
      { id: "b", amount: 200_00, currency: "RUB" } as Spending,
    ])

  })
})
