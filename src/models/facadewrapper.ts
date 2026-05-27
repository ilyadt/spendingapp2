import {
  type Budget,
  genSpendingID,
  genVersion,
  isNew,
  type Spending,
  type SpendingRow,
} from "@src/models/models.ts";
import {Facade} from "@src/facade.ts";

export interface SpendingData {
  budget: Budget,
  amount: number,
  description: string,
  receiptId?: number,
  sort?: number,
}

export function createSpending(date: Date, data: SpendingData, createdAt: Date): Spending {
  const sp: Spending = {
    id: genSpendingID(),
    version: genVersion(null),
    amount: data.amount,
    currency: data.budget.currency,
    description: data.description,
    updatedAt: createdAt,
    createdAt: createdAt,
    date: date,
    sort: data.sort ?? createdAt.getTime(),
    receiptGroupId: data.receiptId  ?? 0,
  }

  Facade.createSpending(data.budget.id, sp)

  return sp
}

export function updateSpending(old: SpendingRow, data: Partial<SpendingData>, updatedAt: Date): Spending {
  const amount = data.amount ? data.amount: old.amount
  const description = data.description ? data.description : old.description
  const receiptId = (data.receiptId != null) ? data.receiptId : old.receiptGroupId

  const sp = {
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

  Facade.updateSpending(old.budgetId, sp)

  return sp
}

export function saveSpendingChanges(date: Date, oldRow: SpendingRow, data: SpendingData, now: Date): Spending {
  const isNewSp = isNew(oldRow)
  const budgetChanged = (oldRow.budgetId !== data.budget.id)

  if (!isNewSp && budgetChanged) {
    deleteSpending(oldRow, now)
  }

  const spData: SpendingData = {
    sort: oldRow.sort ?? undefined,
    receiptId: oldRow.receiptGroupId ?? undefined,
    ...data,
  }

  return budgetChanged
    ? createSpending(date, spData, now)
    : updateSpending(oldRow, spData, now)
}

export function deleteSpending(oldRow: SpendingRow, deletedAt: Date) {
  Facade.deleteSpending(oldRow.budgetId, {
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
}