import {createStore, type StateCreator} from 'zustand'
import { immer } from 'zustand/middleware/immer';
import type {Budget, DelSpending, Spending, SpendingActions} from "@/models/models.ts";

export type BudgetWithSpent = Budget & {
  amountSpent: number
}

export type BudgetsWithSpentById = {
  [budgetId: number]: BudgetWithSpent
}

export type BudgetsStore = SpendingActions & {
  budgets: BudgetsWithSpentById
}

export const budgetsWithSpentStateCreator = (initBudgets: BudgetsWithSpentById): StateCreator<BudgetsStore, [['zustand/immer', never]]> =>
  (set): BudgetsStore => ({
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
  })

export const createBudgetsWithSpentStore = (initBudgets: BudgetsWithSpentById) =>
  createStore<BudgetsStore>()(
    immer(
      budgetsWithSpentStateCreator(initBudgets)
    )
  )

