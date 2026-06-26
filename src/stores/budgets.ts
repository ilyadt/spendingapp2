import {createStore} from 'zustand'
import { immer } from 'zustand/middleware/immer';
import {type CudSpending} from "@/facade.ts";
import type {Budget, DelSpending, Spending} from "@/models/models.ts";
import { BudgetSpendingsStore } from '@/stores/budgetSpendings'

export type BudgetWithSpent = Budget & {
  amountSpent: number
}

export type BudgetsWithSpentById = {
  [budgetId: number]: BudgetWithSpent
}

export type BudgetsStore = CudSpending & {
  budgets: BudgetsWithSpentById
}

type BudgetsWithSpendings = Budget & {
  spendings: Spending[]
}

export const createBudgetsWithSpentCreator= (budgets: BudgetsWithSpendings[]) => (
  immer<BudgetsStore>(
    (set) => {
      const initBudgets: BudgetsWithSpentById = {}

      for (const b of budgets) {
        const { spendings, ...budget } = b

        const amountSpent = spendings.reduce(
          (sum, sp) => sum + sp.amount,
          0,
        )

        initBudgets[b.id] = {
          ...budget,
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
)

export const initBudgetsWithSpendings = () =>
  BudgetSpendingsStore.getBudgets()
  .map(b => ({
    ...b,
    spendings: BudgetSpendingsStore.spendingsByBudgetId(b.id),
  }))

export const budgetsWithSpentStore = createStore<BudgetsStore>()(createBudgetsWithSpentCreator(initBudgetsWithSpendings()))

