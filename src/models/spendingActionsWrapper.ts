import {
  type Budget,
  isNew,
  type Spending,
  type SpendingActions,
  type SpendingRow,
} from "@/models/models.ts";
import {genSpendingID, genVersion} from "@/helpers/helper.ts";

export interface SpendingData {
  budget: Budget,
  date: Date,
  amount: number,
  description: string,
  receiptId?: number,
  sort?: number,
}

export type WrappedSpendingActions = ReturnType<typeof createSpendingActionsWrapper>

export function createSpendingActionsWrapper(spActions: SpendingActions) {
  const wrapper = {
    createSpending(data: SpendingData, createdAt: Date): Spending {
      const sp: Spending = {
        id: genSpendingID(),
        version: genVersion(null),
        amount: data.amount,
        currency: data.budget.currency,
        description: data.description,
        updatedAt: createdAt,
        createdAt: createdAt,
        date: data.date,
        sort: data.sort ?? createdAt.getTime(),
        receiptGroupId: data.receiptId  ?? 0,
      }

      spActions.createSpending(data.budget.id, sp)

      return sp
    },

    updateSpending(old: SpendingRow, data: Partial<SpendingData>, updatedAt: Date): Spending {
      const amount = data.amount ? data.amount: old.amount
      const description = data.description ? data.description : old.description
      const receiptId = (data.receiptId != null) ? data.receiptId : old.receiptGroupId

      const sp: Spending = {
        id: old.id,
        version: genVersion(old.version),
        amount: amount,
        currency: old.currency,
        description: description,
        updatedAt: updatedAt,
        createdAt: old.createdAt,
        date: old.date,
        sort: old.sort,
        receiptGroupId: receiptId,
        prev: {
          version: old.version,
          amount: old.amount,
          currency: old.currency,
          description: old.description,
        }
      }

      spActions.updateSpending(old.budgetId, sp)

      return sp
    },

    saveSpendingChanges(oldRow: SpendingRow, data: SpendingData, now: Date): Spending {
      const isNewSp = isNew(oldRow)
      const budgetChanged = (oldRow.budgetId !== data.budget.id)

      if (!isNewSp && budgetChanged) {
        wrapper.deleteSpending(oldRow, now)
      }

      const spData: SpendingData = {
        sort: oldRow.sort ?? undefined,
        receiptId: oldRow.receiptGroupId ?? undefined,
        ...data,
      }

      return budgetChanged
        ? wrapper.createSpending(spData, now)
        : wrapper.updateSpending(oldRow, spData, now)
    },

    deleteSpending(oldRow: SpendingRow, deletedAt: Date) {
      spActions.deleteSpending(oldRow.budgetId, {
        id: oldRow.id,
        version: genVersion(oldRow.version),
        updatedAt: deletedAt,
        prev: {
          version: oldRow.version,
          amount: oldRow.amount,
          currency: oldRow.currency,
          description: oldRow.description,
        },
      })
    },
  }

  return wrapper
}
