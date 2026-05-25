import {
  type Budget,
  genSpendingID,
  genVersion,
  isNew,
  type Spending,
  type spendingEditFormData,
} from "@src/models/models.ts";
import {Facade} from "@src/facade.ts";

export type SpendingRow = Spending & {
  internalRowId: number
  budgetId: number
}

export interface SpendingData {
  amount: number,
  description: string,
  receiptId?: number,
}

export function createSpending(b: Budget, date: Date, fd: SpendingData, createdAt: Date): Spending {
  const sp: Spending = {
    id: genSpendingID(),
    version: genVersion(null),
    amount: fd.amount,
    currency: b.currency,
    description: fd.description,
    updatedAt: createdAt,
    createdAt: createdAt,
    date: date,
    sort: createdAt.getTime(),
    receiptGroupId: fd.receiptId ? fd.receiptId : 0,
  }

  Facade.createSpending(b.id, sp)

  return sp
}

export function updateSpending(old: SpendingRow, fd: Partial<SpendingData>, updatedAt: Date): Spending {
  const amount = fd.amount ? fd.amount: old.amount
  const description = fd.description ? fd.description : old.description
  const receiptId = (fd.receiptId != null) ? fd.receiptId : old.receiptGroupId

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

export function saveSpendingChanges(date: Date, oldRow: SpendingRow, fdata: spendingEditFormData, now: Date): Spending {
  const isNewSp = isNew(oldRow)
  const budgetChanged = (oldRow.budgetId !== fdata.budget!.id)

  if (!isNewSp && budgetChanged) {
    deleteSpending(oldRow, now)
  }

  return budgetChanged
    ? createSpending(fdata.budget!, date, fdata, now)
    : updateSpending(oldRow, fdata, now)
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