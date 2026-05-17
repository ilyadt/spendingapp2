import { Uploader } from '@src/api'
import type { DelSpending, Spending } from '@src/models/models'
import { BudgetSpendingsStore } from '@src/stores/budgetSpendings'
import { useBudgetsWithSpent } from "@src/stores/budgets.ts";

class FacadeImpl {
  constructor(
    private readonly composite: CudSpending,
    private readonly storage = BudgetSpendingsStore,
  ) {}

  spendingsByBudgetId(bid: number): Spending[] {
    return this.storage.spendingsByBudgetId(bid)
  }

  createSpending(bid: number, newSp: Spending): void {
    this.composite.createSpending(bid, newSp)
  }

  updateSpending(bid: number, upd: Spending): void {
    this.composite.updateSpending(bid, upd)
  }

  deleteSpending(bid: number, del: DelSpending): void {
    this.composite.deleteSpending(bid, del)
  }
}

export interface CudSpending {
  createSpending(bid: number, newSp: Spending): void
  updateSpending(bid: number, upd: Spending): void
  deleteSpending(bid: number, del: DelSpending): void
}

function createComposite(subjects: CudSpending[]): CudSpending {
  return {
    createSpending(bid, newSp) {
      subjects.forEach(s => s.createSpending(bid, newSp))
    },
    updateSpending(bid, upd) {
      subjects.forEach(s => s.updateSpending(bid, upd))
    },
    deleteSpending(bid, del) {
      subjects.forEach(s => s.deleteSpending(bid, del))
    },
  }
}

const budgetsWithSpentFacade: CudSpending = {
  createSpending(bid: number, newSp: Spending): void {
    useBudgetsWithSpent.getState().createSpending(bid, newSp)
  },
  deleteSpending(bid: number, del: DelSpending): void {
    useBudgetsWithSpent.getState().deleteSpending(bid, del)
  },
  updateSpending(bid: number, upd: Spending): void {
    useBudgetsWithSpent.getState().updateSpending(bid, upd)
  },
}

export const Composite = createComposite([BudgetSpendingsStore, Uploader, budgetsWithSpentFacade])

export const Facade = new FacadeImpl(Composite, BudgetSpendingsStore)
