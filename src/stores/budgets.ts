import {create} from 'zustand'
import { immer } from 'zustand/middleware/immer';
import {type CudSpending} from "@src/facade.ts";
import type {Budget, DelSpending, Spending} from "@src/models/models.ts";
import { BudgetSpendingsStore } from '@src/stores/budgetSpendings'

export type BudgetWithSpent = Budget & {
  amountSpent: number
}

export type BudgetsWithSpentById = {
  [budgetId: number]: BudgetWithSpent
}

type BudgetsStore = CudSpending & {
  budgets: BudgetsWithSpentById
}

export const useBudgetsWithSpentCreator= immer<BudgetsStore>(
  (set) => {
    const initBudgets: BudgetsWithSpentById = {}

    const budgets = BudgetSpendingsStore.getBudgets()

    for (const b of budgets) {
      const sps = BudgetSpendingsStore.spendingsByBudgetId(b.id)

      const amountSpent = sps.reduce((sum, sp) => sum + sp.amount, 0)

      initBudgets[b.id] = {
        ...b,
        amountSpent: amountSpent,
      }
    }

    return {
      budgets: initBudgets,
      createSpending(bid: number, newSp: Spending) {
        set(state => {
          state.budgets[bid].amountSpent += newSp.amount
        })
      },
      updateSpending(bid: number, upd: Spending) {
        set(state => {
          state.budgets[bid].amountSpent += (upd.amount - upd.prev!.amount)
        })
      },
      deleteSpending(bid: number, del: DelSpending) {
        set(state => {
          state.budgets[bid].amountSpent -= del.prev!.amount
        })
      },
    }
  }
)

export const useBudgetsWithSpent = create<BudgetsStore>()(useBudgetsWithSpentCreator)
