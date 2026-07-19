
import type {DelSpending, Spending} from "@/models/models.ts";

export type SpendingsByBudget = Record<number, Spending[]>

type SpendingsByBudgetBySpendingId = Record<number, Record<string, Spending>>

export type SpendingsStoreApi = ReturnType<typeof createSpendingsStore>

export const createSpendingsStore = (initSpendings: SpendingsByBudget) => {
  const state: SpendingsByBudgetBySpendingId = {}

  for (const [bid, spendings] of Object.entries(initSpendings)) {
    const budgetId = Number(bid)

    for (const s of spendings) {
      state[budgetId] ??= {}
      state[budgetId][s.id] = s
    }
  }

  return {
    createSpending(bid: number, newSp: Spending): void {
      const spendings = state[bid] ??= {}
      spendings[newSp.id] = newSp
    },
    deleteSpending(bid: number, del: DelSpending): void {
      const spendings = state[bid]
      if (!spendings) {
        return
      }

      delete spendings[del.id]
    },
    updateSpending(bid: number, upd: Spending): void {
      const spendings = state[bid]

      if (!spendings || !spendings[upd.id])  {
        return
      }

      spendings[upd.id] = upd
    },
    spendingsByBudgetId(bid: number): Spending[] {
      return Object.values(state[bid] ?? {})
    }
  }
}
