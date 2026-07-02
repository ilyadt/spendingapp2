import type { DelSpending, Spending } from '@/models/models'

export interface SpendingActions {
  createSpending(bid: number, newSp: Spending): void
  updateSpending(bid: number, upd: Spending): void
  deleteSpending(bid: number, del: DelSpending): void
}

export function composeSpActions(subjects: SpendingActions[]): SpendingActions {
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
