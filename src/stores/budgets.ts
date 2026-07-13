import {createStore, type StateCreator} from 'zustand'
import { immer } from 'zustand/middleware/immer';
import type {Budget, DelSpending, Spending, SpendingActions} from "@/models/models.ts";

export type BudgetWithSpent = Budget & {
  amountSpent: number
}

export type BudgetsWithSpentById = {
  [budgetId: number]: BudgetWithSpent
}

export type BudgetsStore = {
  budgets: BudgetsWithSpentById
  createSpending(bid: number, newSp: Spending): void
  updateSpending(bid: number, upd: Spending): void
  deleteSpending(bid: number, del: DelSpending): void
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

// Checks Interface
const _: SpendingActions = createBudgetsWithSpentStore({}).getState();
void _
